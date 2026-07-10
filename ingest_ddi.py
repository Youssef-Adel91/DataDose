#!/usr/bin/env python3
"""
ingest_ddi.py -- DataDose Neo4j Drug-Drug Interactions ETL
==========================================================
Reads drug_drug_interactions.json and injects clinical DDI relationships 
into Neo4j.

Uses batching (UNWIND) and idempotent MERGE operations.
Relationships are created as undirected conceptually (a)-[:INTERACTS_WITH]-(b),
so bidirectional queries will easily match them.

Environment variables (reads from .env if available):
  NEO4J_URI       neo4j+s://xxxx.databases.neo4j.io
  NEO4J_USER      neo4j
  NEO4J_PASSWORD  <password>
"""

import os
import sys
import json
import time

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

try:
    from neo4j import GraphDatabase
except ImportError:
    print("FATAL: neo4j python package is required. Run: pip install neo4j")
    sys.exit(1)

JSON_FILE = "drug_drug_interactions.json"
BATCH_SIZE = 200

# The Cypher query uses MERGE on both drug nodes (matching by name safely).
# We then merge the relationship. In Neo4j, MERGE (a)-[r:INTERACTS_WITH]-(b)
# creates a single directed edge if none exists in either direction, and matches
# it if it exists in either direction, making it perfectly idempotent and symmetric.
CYPHER_BATCH_QUERY = """
UNWIND $batch AS row
// 1. Merge or Match Drug A
MERGE (a:Drug {name: row.drug_a})
ON CREATE SET a.name_lower = toLower(row.drug_a)

// 2. Merge or Match Drug B
MERGE (b:Drug {name: row.drug_b})
ON CREATE SET b.name_lower = toLower(row.drug_b)

// 3. Merge the Relationship (undirected merge creates one direction, matches either)
MERGE (a)-[r:INTERACTS_WITH]-(b)
SET r.severity = row.severity,
    r.mechanism = row.mechanism,
    r.clinical_advice = row.clinical_advice
"""

def main():
    uri = os.environ.get("NEO4J_URI")
    user = os.environ.get("NEO4J_USER")
    password = os.environ.get("NEO4J_PASSWORD")

    if not all([uri, user, password]):
        print("FATAL: Missing NEO4J_URI, NEO4J_USER, or NEO4J_PASSWORD environment variables.")
        sys.exit(1)

    if not os.path.exists(JSON_FILE):
        print(f"FATAL: Could not find {JSON_FILE}")
        sys.exit(1)

    print("============================================================")
    print("  DataDose -- Neo4j DDI Enrichment ETL")
    print("============================================================")
    print(f"  URI   : {uri}")
    print(f"  User  : {user}")
    print(f"  File  : {JSON_FILE}")
    print(f"  Batch : {BATCH_SIZE}")

    try:
        with open(JSON_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as e:
        print(f"FATAL: Failed to read JSON: {e}")
        sys.exit(1)

    total_records = len(data)
    print(f"\n[LOAD] Loaded {total_records} interaction records.")

    print("\n[ETL] Connecting to Neo4j...")
    driver = GraphDatabase.driver(uri, auth=(user, password))
    
    # We create an explicit index on Drug name if it doesn't exist to speed up MERGE
    with driver.session() as session:
        session.run("CREATE CONSTRAINT drug_name_unique IF NOT EXISTS FOR (d:Drug) REQUIRE d.name IS UNIQUE")
    print("[ETL] Constraints verified.")

    print("\n[ETL] Starting batch ingestion...")
    start_time = time.time()
    
    batches = [data[i : i + BATCH_SIZE] for i in range(0, len(data), BATCH_SIZE)]
    
    processed_count = 0
    with driver.session() as session:
        for idx, batch in enumerate(batches, 1):
            try:
                session.run(CYPHER_BATCH_QUERY, batch=batch)
                processed_count += len(batch)
                print(f"  -> Batch {idx}/{len(batches)}: Successfully processed {processed_count} interactions...")
            except Exception as e:
                print(f"  -> ERROR in Batch {idx}: {e}")
                sys.exit(1)

    elapsed = time.time() - start_time
    driver.close()
    
    print("\n============================================================")
    print(f"[DONE] Successfully ingested {processed_count} DDI relationships in {elapsed:.2f} seconds.")
    print("============================================================")

if __name__ == "__main__":
    main()
