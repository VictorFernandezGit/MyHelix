# run a raw file through the pipeline locally and print the report json, nothing gets uploaded anywhere
import argparse
from pathlib import Path

from app.pipeline import analyze


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("file", type=Path)
    parser.add_argument("--out", type=Path)
    args = parser.parse_args()

    report, _ = analyze(args.file.read_bytes())
    report_json = report.model_dump_json(indent=2)

    print(report_json)
    if args.out:
        args.out.write_text(report_json)


if __name__ == "__main__":
    main()
