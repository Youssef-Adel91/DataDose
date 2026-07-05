"""databricks_processing pre-check - Neo4j reachable and has real data."""
from neo4j import GraphDatabase

from common import get_neo4j_config


def verify_neo4j(**context) -> None:
    cfg = get_neo4j_config()
    driver = GraphDatabase.driver(cfg["uri"], auth=(cfg["user"], cfg["password"]))
    try:
        with driver.session() as session:
            row = session.run("RETURN 'Neo4j connected' AS msg, datetime() AS ts").single()
            print(row["msg"], "-", row["ts"])

            drug_count = session.run("MATCH (d:Drug) RETURN count(d) AS c").single()["c"]
            if drug_count == 0:
                raise RuntimeError("Neo4j graph has 0 Drug nodes - interaction lookups will always be empty.")
            print(f"Drug node count: {drug_count}")
    finally:
        driver.close()
