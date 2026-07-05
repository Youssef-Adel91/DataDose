#!/usr/bin/env python3
"""DataDose pharmacy simulator that streams synthetic prescriptions to Kafka."""

import argparse
import json
import os
import random
import ssl
import time
from datetime import datetime, UTC
from pathlib import Path
from typing import List, Optional

import pandas as pd

try:
    from kafka import KafkaProducer
    from kafka.errors import KafkaError
    KAFKA_AVAILABLE = True
except ImportError:
    KAFKA_AVAILABLE = False
    print("kafka-python not installed. Run: pip install kafka-python")


def get_env(name: str, default: str | None = None, required: bool = False) -> str:
    value = os.getenv(name)
    if value not in (None, ""):
        return value
    if default is not None:
        return default
    if required:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return ""


# Kafka connection details.
BOOTSTRAP_SERVERS = get_env(
    "KAFKA_BOOTSTRAP_SERVERS",
    "datadosekafka-901-datadosedepiproject001.l.aivencloud.com:15816",
)

# Kafka credentials.
SASL_USERNAME = get_env("KAFKA_USERNAME", required=True)
SASL_PASSWORD = get_env("KAFKA_PASSWORD", required=True)

SASL_MECHANISM = get_env("KAFKA_SASL_MECHANISM", "SCRAM-SHA-256")

# PEM certificate downloaded from Aiven.
CA_PEM = Path(get_env("KAFKA_CA_PEM_PATH", str(Path(__file__).resolve().parent / "certs" / "ca.pem")))

# Kafka topic.
TOPIC = get_env("KAFKA_TOPIC", "DataDose.in")

# Verified ingredient dataset.
DATASET_PATH = Path(get_env("DATASET_PATH", str(Path(__file__).resolve().parent / "output_FINAL.csv")))

# Simulation settings.
RATE_PER_SECOND = 1
NUM_PHARMACIES = 120
NUM_PATIENTS = 50000
MAX_CURRENT_MEDS = 5


# Data pools.

EGYPT_CITIES = [
    "Cairo", "Alexandria", "Giza", "Shubra El Kheima", "Port Said",
    "Suez", "Luxor", "Mansoura", "El Mahalla El Kubra", "Tanta",
    "Asyut", "Ismailia", "Fayyum", "Zagazig", "Aswan",
    "Damietta", "Damanhur", "Minya", "Beni Suef", "Qena",
    "Sohag", "Hurghada", "6th of October City", "Shibin El Kom", "Banha",
]

DOSE_VALUES = ["5", "10", "20", "25", "40", "50",
               "75", "80", "100", "125", "150", "200", "250", "500", "1000"]
DOSE_UNITS  = ["mg", "mcg", "g", "mg/ml", "IU", "%"]
DOSE_FORMS  = ["tablet", "capsule", "syrup", "injection",
               "cream", "drops", "inhaler", "patch", "suppository"]

# Terms excluded from the simulation pool.
SKIP_TERMS = {
    "vitamin b", "electrolytes", "minerals", "unknown", "antifoam m",
    "silicon", "complete", "omega", "cod liver oil", "almond oil",
    "tamanu oil", "amla extract", "bioperene", "herhal ext",
    "calcium bromolactobionate is not a known drug ingredient",
}


# Dataset loader.

def load_drug_pool(csv_path: Path) -> List[str]:
    """
    Load verified INNs from output_FINAL.csv.
    Expands combination products (A | B | C) into individual drug names.
    Only includes verified rows (ingredient_verified_flag = TRUE).
    """
    if not csv_path.exists():
        raise FileNotFoundError(
            f"\nDataset not found: {csv_path.absolute()}\n"
            f"Place output_FINAL.csv in the same folder as simulator.py\n"
        )

    print(f"Loading dataset: {csv_path.name}")
    drug_dataset = pd.read_csv(csv_path)

    ingredient_column = (
        "ingredient_corrected"
        if "ingredient_corrected" in drug_dataset.columns
        else "activeingredient_clean"
    )

    if "ingredient_verified_flag" in drug_dataset.columns:
        row_count_before_filter = len(drug_dataset)
        drug_dataset = drug_dataset[
            drug_dataset["ingredient_verified_flag"].astype(str).str.upper() == "TRUE"
        ]
        print(f"Verified rows: {len(drug_dataset):,} / {row_count_before_filter:,}")

    verified_drugs = set()
    for value in drug_dataset[ingredient_column].dropna().astype(str):
        ingredient_parts = [part.strip() for part in value.replace("|", "+").split("+")]
        for ingredient_part in ingredient_parts:
            normalized_part = ingredient_part.lower().strip()
            if (
                len(normalized_part) >= 3
                and not normalized_part.isdigit()
                and normalized_part not in SKIP_TERMS
                and "not a known" not in normalized_part
                and len(normalized_part) <= 60
            ):
                verified_drugs.add(normalized_part)

    drug_pool = sorted(verified_drugs)
    print(f"Unique drug INNs: {len(drug_pool):,}\n")
    return drug_pool


# Prescription generator.

class PrescriptionGenerator:
    """Generates realistic fake prescriptions from the drug pool."""

    def __init__(self, drugs: List[str]):
        self.drugs = drugs
        self._tx_id = random.randint(100_000, 999_999)
        self.pharmacy_ids = [f"PHX_{str(i).zfill(3)}" for i in range(1, NUM_PHARMACIES + 1)]
        self.pharmacy_city_by_id = {
            pharmacy_id: random.choice(EGYPT_CITIES)
            for pharmacy_id in self.pharmacy_ids
        }

    def next(self) -> dict:
        """Generate one prescription as a dict (serialized to JSON for Kafka)."""
        self._tx_id += 1
        new_drug = random.choice(self.drugs)
        other_drugs = [drug for drug in self.drugs if drug != new_drug]
        current_med_count = random.randint(0, MAX_CURRENT_MEDS)
        current_drugs = random.sample(other_drugs, min(current_med_count, len(other_drugs)))
        pharmacy_id = random.choice(self.pharmacy_ids)

        return {
            "transaction_id": self._tx_id,
            "patient_id": random.randint(1, NUM_PATIENTS),
            "pharmacy_id": pharmacy_id,
            "pharmacy_city": self.pharmacy_city_by_id[pharmacy_id],
            "new_drug": new_drug,
            "new_drug_dose": f"{random.choice(DOSE_VALUES)}{random.choice(DOSE_UNITS)}",
            "new_drug_form": random.choice(DOSE_FORMS),
            "current_drugs": current_drugs,
            "patient_age": random.randint(18, 85),
            "patient_gender": random.choice(["M", "F"]),
            "timestamp": datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%S"),
        }


# Aiven Kafka producer.

def build_producer() -> "KafkaProducer":
    """
    Connect to Aiven Kafka using SASL_SSL with username/password.

    FIX: kafka-python has a known bug where passing ssl_cafile= directly
    does not properly build the SSL context for SASL_SSL connections, causing
    a silent TLS handshake failure that surfaces as NoBrokersAvailable.
    Solution: build an ssl.SSLContext explicitly and pass it via ssl_context=.
    """
    if not KAFKA_AVAILABLE:
        raise ImportError("Run: pip install kafka-python")

    if not CA_PEM.exists():
        raise FileNotFoundError(
            f"\nca.pem not found: {CA_PEM.absolute()}\n"
            f"Download it from:\n"
            f"Aiven Dashboard -> Your Kafka Service -> Overview -> Download ca.pem\n"
            f"Save it to: {CA_PEM.absolute()}\n"
        )

    print("Connecting to Aiven Kafka ...")
    print(f"Bootstrap: {BOOTSTRAP_SERVERS}")
    print(f"Topic: {TOPIC}")
    print(f"Mechanism: {SASL_MECHANISM}")
    print(f"ca.pem: {CA_PEM}")

    ssl_context = ssl.create_default_context(cafile=str(CA_PEM))
    ssl_context.minimum_version = ssl.TLSVersion.TLSv1_2

    producer = KafkaProducer(
        bootstrap_servers=BOOTSTRAP_SERVERS,
        sasl_mechanism=SASL_MECHANISM,
        sasl_plain_username=SASL_USERNAME,
        sasl_plain_password=SASL_PASSWORD,
        security_protocol="SASL_SSL",
        ssl_context=ssl_context,
        api_version=(2, 8, 0),
        value_serializer=lambda value: json.dumps(value, ensure_ascii=False).encode("utf-8"),
        acks=1,
        retries=5,
        request_timeout_ms=30_000,
        linger_ms=10,
    )

    print("Connected to Aiven Kafka!\n")
    return producer


# Main simulation loop.

def run(rate: float, dry_run: bool, max_msgs: Optional[int]) -> None:

    print("DataDoseDepi Pharmacy Simulator v4.2")
    print(f"Mode: {'DRY RUN (console only)' if dry_run else 'LIVE -> Aiven Kafka'}")
    print(f"Topic: {TOPIC}")
    print(f"Rate: {rate} msg/sec")
    print(f"Dataset: {DATASET_PATH}")
    if max_msgs:
        print(f"Limit: {max_msgs:,} messages then stop")
    print()

    verified_drugs = load_drug_pool(DATASET_PATH)
    prescription_generator = PrescriptionGenerator(verified_drugs)

    producer = None
    if not dry_run:
        try:
            producer = build_producer()
        except Exception as e:
            print(f"\n{e}")
            print("To test without Kafka: python simulator.py --dry-run\n")
            return

    messages_sent = 0
    send_errors = 0
    start_time = time.time()
    interval = 1.0 / max(rate, 0.1)

    print("Streaming started. Press Ctrl+C to stop.\n")
    print(f"{'TX ID':<10}  {'Pharmacy':<10}  {'City':<22}  {'New Drug':<28}  Current Meds")
    print(f"{'-'*10}  {'-'*10}  {'-'*22}  {'-'*28}  {'-'*30}")

    try:
        while True:
            if max_msgs and messages_sent >= max_msgs:
                print(f"\nReached limit of {max_msgs:,} messages.")
                break

            loop_start = time.time()
            prescription_record = prescription_generator.next()

            if producer:
                try:
                    future = producer.send(TOPIC, value=prescription_record)
                    future.get(timeout=10)
                    messages_sent += 1
                except KafkaError as e:
                    send_errors += 1
                    print(f"Kafka send error: {e}")
                except Exception as e:
                    send_errors += 1
                    print(f"Unexpected error: {e}")
            else:
                messages_sent += 1

            current_meds_preview = ", ".join(prescription_record["current_drugs"][:3])
            if len(prescription_record["current_drugs"]) > 3:
                current_meds_preview += f" +{len(prescription_record['current_drugs']) - 3} more"
            current_meds_preview = current_meds_preview or "-"

            print(
                f"{prescription_record['transaction_id']:<10}  "
                f"{prescription_record['pharmacy_id']:<10}  "
                f"{prescription_record['pharmacy_city']:<22}  "
                f"{prescription_record['new_drug']:<28}  "
                f"{current_meds_preview}"
            )

            if messages_sent % 50 == 0 and messages_sent > 0:
                elapsed = time.time() - start_time
                print(
                    f"\n{messages_sent:,} sent  |  "
                    f"{send_errors} errors  |  "
                    f"{messages_sent / elapsed:.1f} msg/s  |  "
                    f"{elapsed:.0f}s elapsed\n"
                )

            sleep_seconds = interval - (time.time() - loop_start)
            if sleep_seconds > 0:
                time.sleep(sleep_seconds)

    except KeyboardInterrupt:
        print("\n\nStopped by user.")

    finally:
        if producer:
            producer.flush()
            producer.close()
        elapsed = time.time() - start_time
        print(f"\n{'-'*55}")
        print("SESSION SUMMARY")
        print(f"{'-'*55}")
        print(f"Messages sent: {messages_sent:,}")
        print(f"Errors: {send_errors}")
        print(f"Duration: {elapsed:.1f}s")
        if elapsed > 0:
            print(f"Avg rate: {messages_sent / elapsed:.2f} msg/s")
        print(f"Kafka topic: {TOPIC}")
        print(f"Endpoint: {BOOTSTRAP_SERVERS}")
        print(f"{'-'*55}\n")


# Entry point.

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="DataDoseDepi Pharmacy Simulator -> Aiven Kafka"
    )
    parser.add_argument(
        "--rate", "-r", type=float, default=RATE_PER_SECOND,
        help=f"Prescriptions per second (default: {RATE_PER_SECOND})"
    )
    parser.add_argument(
        "--max", "-m", type=int, default=None,
        help="Stop after N messages (default: run forever)"
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="Print messages to console only - no Kafka connection needed"
    )
    args = parser.parse_args()

    run(rate=args.rate, dry_run=args.dry_run, max_msgs=args.max)