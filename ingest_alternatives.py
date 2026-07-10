import os
import json
from neo4j import GraphDatabase
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Neo4j connection details
NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "")

def process_alternatives_batch(tx, batch):
    """
    Cypher query to merge original_drug, safe_alternative, and link them.
    Using UNWIND for batch efficiency.
    """
    query = """
    UNWIND $batch AS item
    WITH item WHERE item.original_drug IS NOT NULL AND item.safe_alternative IS NOT NULL
    
    // Ensure the original drug exists
    MERGE (d1:Drug {name: item.original_drug})
    
    // Ensure the alternative drug exists
    MERGE (d2:Drug {name: item.safe_alternative})
    
    // Create the safe alternative relationship
    MERGE (d1)-[r:HAS_SAFE_ALTERNATIVE]->(d2)
    SET r.reason = item.reasoning,
        r.evidence = item.evidence_source
    """
    tx.run(query, batch=batch)


def ingest_gold_standard_alternatives(file_path: str, batch_size: int = 100):
    """
    Reads the JSON file and ingests it into Neo4j in batches of `batch_size`.
    """
    print(f"Connecting to Neo4j at {NEO4J_URI}...")
    
    try:
        driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
        # Verify connectivity
        driver.verify_connectivity()
        print("Successfully connected to Neo4j.")
    except Exception as e:
        print(f"Error connecting to Neo4j: {e}")
        return

    # Load JSON Data
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"Error reading file {file_path}: {e}")
        driver.close()
        return
    
    total_items = len(data)
    print(f"Loaded {total_items} items from {file_path}. Starting ingestion...")

    processed_count = 0

    try:
        with driver.session() as session:
            # Process in batches
            for i in range(0, total_items, batch_size):
                batch = data[i:i + batch_size]
                
                # Execute batch transaction
                session.execute_write(process_alternatives_batch, batch)
                
                processed_count += len(batch)
                print(f"Successfully processed {processed_count} / {total_items} safe alternatives.")
                
        print("Ingestion complete!")

    except Exception as e:
        print(f"An error occurred during ingestion: {e}")
    finally:
        driver.close()
        print("Neo4j connection closed.")


if __name__ == "__main__":
    json_file_path = "gold_standard_alternatives_full.json"
    
    if not os.path.exists(json_file_path):
        print(f"Error: {json_file_path} not found in the current directory.")
    else:
        ingest_gold_standard_alternatives(json_file_path, batch_size=100)
