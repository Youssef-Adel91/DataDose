"""Infra group - the ca.pem file (not a Connection - see common.py)."""
import os
import stat

from common import get_ca_pem_path


def verify_certificate(**context) -> None:
    ca_pem_path = get_ca_pem_path()

    mode = stat.S_IMODE(os.stat(ca_pem_path).st_mode)
    if mode & 0o077:
        print(f"WARNING: ca.pem permissions are {oct(mode)} - consider chmod 600.")

    with open(ca_pem_path, "r") as f:
        content = f.read()

    if "BEGIN CERTIFICATE" not in content or "END CERTIFICATE" not in content:
        raise ValueError(f"{ca_pem_path} does not look like a valid PEM certificate.")

    print(f"ca.pem valid at {ca_pem_path} ({len(content)} bytes).")
