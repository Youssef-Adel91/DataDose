#!/usr/bin/env python3
"""
enrich_graph.py -- DataDose Neo4j Knowledge Graph Enrichment ETL
================================================================
Reads enriched_drugs.json (1,952 drug records produced by Claude) and
injects three new node types + two relationship types into Neo4j:

  (d:Drug) -[:CONTAINS_INGREDIENT]-> (i:Ingredient)
  (i:Ingredient) -[:BELONGS_TO_CLASS]-> (a:AllergyClass)

Records where ingredient or allergy_class is null are skipped via
Cypher CASE / FOREACH so nulls never create empty nodes.

Usage:
  python enrich_graph.py [--json enriched_drugs.json] [--batch 500] [--dry-run]

Environment (reads from .env in current directory or shell):
  NEO4J_URI       neo4j+s://xxxx.databases.neo4j.io
  NEO4J_USER      neo4j
  NEO4J_PASSWORD  <password>
"""

import argparse
import json
import os
import sys
import time
from pathlib import Path

# -- Try to load python-dotenv; skip gracefully if not installed --------------
try:
    from dotenv import load_dotenv
    load_dotenv()
    load_dotenv(dotenv_path=Path(__file__).parent / "backend" / ".env")
    load_dotenv(dotenv_path=Path(__file__).parent / ".env")
except ImportError:
    pass

from neo4j import GraphDatabase, exceptions as neo4j_exc

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
DEFAULT_JSON  = "enriched_drugs.json"
DEFAULT_BATCH = 500


# ---------------------------------------------------------------------------
# Cypher Queries
# ---------------------------------------------------------------------------

# 1. Idempotent schema setup
SETUP_QUERIES = [
    "CREATE CONSTRAINT drug_name_unique IF NOT EXISTS FOR (d:Drug) REQUIRE d.name IS UNIQUE",
    "CREATE CONSTRAINT ingredient_name_unique IF NOT EXISTS FOR (i:Ingredient) REQUIRE i.name IS UNIQUE",
    "CREATE CONSTRAINT allergyclass_name_unique IF NOT EXISTS FOR (a:AllergyClass) REQUIRE a.name IS UNIQUE",
    "CREATE INDEX ingredient_lower IF NOT EXISTS FOR (i:Ingredient) ON (i.name_lower)",
    "CREATE INDEX allergyclass_lower IF NOT EXISTS FOR (a:AllergyClass) ON (a.name_lower)",
]

# 2. Main batch upsert query
#
#    Logic per row:
#    - Always MERGE the Drug node by name_lower (case-insensitive lookup).
#    - FOREACH hack: CASE returns [1] when ingredient is non-null, [] otherwise.
#      This lets us conditionally MERGE nodes inside a write query without APOC.
#    - AllergyClass + BELONGS_TO_CLASS only created when BOTH ingredient AND
#      allergy_class are non-null, preserving full ontology integrity.
BATCH_UPSERT_QUERY = """
UNWIND $batch AS row

// Step 1: Upsert Drug node (always)
MERGE (d:Drug {name_lower: toLower(trim(row.drug))})
  ON CREATE SET d.name       = trim(row.drug),
                d.name_lower = toLower(trim(row.drug)),
                d.source     = 'enriched_drugs_etl'
  ON MATCH  SET d.source     = 'enriched_drugs_etl'

// Step 2: Conditionally create Ingredient node + CONTAINS_INGREDIENT edge
FOREACH (_ IN CASE WHEN row.ingredient IS NOT NULL THEN [1] ELSE [] END |
  MERGE (i:Ingredient {name_lower: toLower(trim(row.ingredient))})
    ON CREATE SET i.name       = trim(row.ingredient),
                  i.name_lower = toLower(trim(row.ingredient))
  MERGE (d)-[:CONTAINS_INGREDIENT]->(i)
)

// Step 3: Conditionally create AllergyClass + BELONGS_TO_CLASS edge
FOREACH (_ IN CASE WHEN row.ingredient IS NOT NULL AND row.allergy_class IS NOT NULL THEN [1] ELSE [] END |
  MERGE (i2:Ingredient {name_lower: toLower(trim(row.ingredient))})
  MERGE (a:AllergyClass {name_lower: toLower(trim(row.allergy_class))})
    ON CREATE SET a.name       = trim(row.allergy_class),
                  a.name_lower = toLower(trim(row.allergy_class))
  MERGE (i2)-[:BELONGS_TO_CLASS]->(a)
)
"""

# 3. Post-load verification
VERIFY_QUERY = """
MATCH (d:Drug)-[:CONTAINS_INGREDIENT]->(i:Ingredient)-[:BELONGS_TO_CLASS]->(a:AllergyClass)
RETURN count(*) AS full_paths,
       count(DISTINCT a.name) AS distinct_classes,
       count(DISTINCT i.name) AS distinct_ingredients,
       count(DISTINCT d.name) AS distinct_drugs
"""


# ---------------------------------------------------------------------------
# ETL Functions
# ---------------------------------------------------------------------------

def setup_schema(session) -> None:
    print("\n[SCHEMA] Creating constraints and indexes...")
    for q in SETUP_QUERIES:
        try:
            session.run(q)
            print(f"  OK   {q[:80]}...")
        except Exception as e:
            print(f"  SKIP (already exists): {e}")


def load_json(path: str) -> list:
    p = Path(path)
    if not p.exists():
        sys.exit(f"[ERROR] File not found: {p.resolve()}")
    with open(p, encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, list):
        sys.exit("[ERROR] JSON root must be an array.")
    print(f"\n[LOAD] Loaded {len(data):,} records from {p.resolve()}")
    return data


def analyze_data(data: list) -> None:
    total      = len(data)
    with_ing   = sum(1 for r in data if r.get("ingredient"))
    with_class = sum(1 for r in data if r.get("allergy_class"))
    with_both  = sum(1 for r in data if r.get("ingredient") and r.get("allergy_class"))
    null_both  = sum(1 for r in data if not r.get("ingredient") and not r.get("allergy_class"))
    classes    = sorted({r["allergy_class"] for r in data if r.get("allergy_class")})

    print(f"\n[ANALYSIS]")
    print(f"  Total records              : {total:,}")
    print(f"  With ingredient            : {with_ing:,}  ({with_ing/total*100:.1f}%)")
    print(f"  With allergy_class         : {with_class:,}  ({with_class/total*100:.1f}%)")
    print(f"  With BOTH (full path)      : {with_both:,}  -> Drug->Ingredient->AllergyClass paths")
    print(f"  Both null (drug node only) : {null_both:,}")
    print(f"  Distinct allergy classes   : {len(classes)}")
    print(f"  Top classes (sample)       : {', '.join(classes[:8])}")


def chunked(lst: list, size: int):
    for i in range(0, len(lst), size):
        yield lst[i : i + size]


def run_etl(session, data: list, batch_size: int, dry_run: bool) -> None:
    total_batches = (len(data) + batch_size - 1) // batch_size
    print(f"\n[ETL] Starting load -- {len(data):,} records | {total_batches} batch(es) | batch_size={batch_size}")

    if dry_run:
        print("[DRY-RUN] No writes performed. First 3 records preview:")
        print(json.dumps(data[:3], indent=2))
        return

    total_nodes = 0
    total_rels  = 0
    start_time  = time.time()

    for idx, batch in enumerate(chunked(data, batch_size), 1):
        t0 = time.time()
        try:
            result  = session.run(BATCH_UPSERT_QUERY, batch=batch)
            summary = result.consume()
            nc = summary.counters.nodes_created
            rc = summary.counters.relationships_created
            total_nodes += nc
            total_rels  += rc
            print(
                f"  Batch {idx:>3}/{total_batches} | "
                f"{len(batch):>4} records | "
                f"+{nc:>3} nodes | "
                f"+{rc:>3} rels | "
                f"{time.time()-t0:.2f}s"
            )
        except neo4j_exc.ClientError as e:
            print(f"  [ERROR] Batch {idx} ClientError: {e}")
            raise
        except Exception as e:
            print(f"  [ERROR] Batch {idx}: {e}")
            raise

    elapsed = time.time() - start_time
    print(f"\n[ETL] Done -- {total_nodes:,} nodes created | {total_rels:,} rels created | {elapsed:.1f}s total")


def verify(session) -> None:
    print("\n[VERIFY] Post-load graph count...")
    rec = session.run(VERIFY_QUERY).single()
    if rec:
        print(f"  Drug->Ingredient->AllergyClass paths : {rec['full_paths']:,}")
        print(f"  Distinct AllergyClass nodes          : {rec['distinct_classes']:,}")
        print(f"  Distinct Ingredient nodes            : {rec['distinct_ingredients']:,}")
        print(f"  Distinct Drug nodes (in paths)       : {rec['distinct_drugs']:,}")
    else:
        print("  [WARN] Verification returned no rows.")


# ---------------------------------------------------------------------------
# Entry Point
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Enrich DataDose Neo4j Knowledge Graph from enriched_drugs.json"
    )
    parser.add_argument("--json",    default=DEFAULT_JSON,  help="Path to JSON file")
    parser.add_argument("--batch",   default=DEFAULT_BATCH, type=int, help="Records per batch")
    parser.add_argument("--dry-run", action="store_true",   help="Preview without writing to Neo4j")
    args = parser.parse_args()

    uri      = os.getenv("NEO4J_URI",      "")
    user     = os.getenv("NEO4J_USER",     os.getenv("NEO4J_USERNAME", "neo4j"))
    password = os.getenv("NEO4J_PASSWORD", "")

    if not uri or not password:
        sys.exit(
            "[ERROR] Missing Neo4j credentials.\n"
            "  Set NEO4J_URI and NEO4J_PASSWORD as environment variables\n"
            "  or add them to backend/.env or the root .env file."
        )

    print("=" * 60)
    print("  DataDose -- Neo4j Graph Enrichment ETL")
    print("=" * 60)
    print(f"  URI      : {uri}")
    print(f"  User     : {user}")
    print(f"  JSON     : {args.json}")
    print(f"  Batch    : {args.batch}")
    print(f"  Dry-run  : {args.dry_run}")

    driver = GraphDatabase.driver(uri, auth=(user, password))
    try:
        driver.verify_connectivity()
        print("\n  [OK] Connected to Neo4j")
    except Exception as e:
        driver.close()
        sys.exit(f"[ERROR] Cannot connect to Neo4j: {e}")

    data = load_json(args.json)
    analyze_data(data)

    with driver.session() as session:
        if not args.dry_run:
            setup_schema(session)
        run_etl(session, data, args.batch, args.dry_run)
        if not args.dry_run:
            verify(session)

    driver.close()
    print("\n[DONE] Graph enrichment complete.")


if __name__ == "__main__":
    main()
