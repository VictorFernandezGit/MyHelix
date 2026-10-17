import json, time
from pathlib import Path
import requests

ENSEMBL = "https://grch37.rest.ensembl.org"
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
RAW = DATA_DIR / "raw"
RAW.mkdir(parents=True, exist_ok=True);

def fetch_ensembl(rsids):
    """Returns """
    results = {}
    for i in range(0, len(rsids), 50):
        chunk = rsids[i:i + 50]
        r = requests.post(
            f"{ENSEMBL}/variation/human",
            headers={"Content-Type": "application/json",
                     "Accept": "application/json"},
            json={"ids": chunk},
            timeout=60,
        )
        r.raise_for_status()
        results.update(r.json())
        time.sleep(1)
    (RAW / "ensembl_variations.json").write_text(json.dumps(results, indent=2))
    return results