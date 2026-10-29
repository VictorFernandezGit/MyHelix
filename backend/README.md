# MyHelix backend

fastapi service that runs the pipeline, ingest then normalize then panel lookup then report

## setup

```sh
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
cp .env.example .env    # fill in SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
```

the service role key skips row level security so it only goes in `backend/.env`, never in the frontend and never in git

## running

```sh
uvicorn app.main:app --reload    # localhost:8000/docs
pytest -q
```

tests dont need network or keys, the supabase stuff uses a fake client

## endpoints

- `POST /process/{upload_id}` what the frontend calls after uploading. checks your login and that you own the upload, then runs the pipeline in the background
- `POST /upload` older one, send a file and get the report back directly, nothing gets saved. handy for testing
- `GET /health`

## how a file gets processed

1. **ingest** `app/ingest/` parses the 23andme file (zip works too) and rejects anything broken
2. **normalize** `app/normalize/` drops no calls, maps old rsids to current ones and flips the strand if needed
3. **panel** `app/panel/` matches against the panel. each variant ends up as one of
   - `carried` has at least one copy of the allele the studies linked to the trait
   - `not_carried` doesnt
   - `no_call` its in the file but we couldnt read it
   - `not_on_chip` its not in the file at all
4. **report** `app/reporting/` groups everything by domain
5. `app/pipeline.py` saves it to supabase (`reports`, `report_findings`, `report_popular_markers`) then deletes the uploaded file

## building the panel

the panel lives in `data/panel/panel_v2.csv`. to rebuild it

```sh
python -m scripts.get_gwas_hits                          # gwas catalog -> data/processed/gwas_candidates.csv
python -m scripts.select_panel --chip path/to/23andme.txt  # picks the top on chip variants per domain
python -m scripts.import_panel                           # adds grch37 positions and alleles from ensembl
python -m scripts.publish_panel                          # pushes it to the supabase panel tables
```

- you need the gwas catalog associations file in `data/GWAS/` first (its big so its gitignored)
- `select_panel` overwrites the csv so always run `import_panel` right after
- if you change the panel bump `PANEL_VERSION` in `app/panel/panel.py` so old reports still point to the old one

popular markers (comt, bdnf etc) are in `data/panel/popular_markers.csv`. rerun `python -m scripts.check_popular_markers` when theres a newer catalog download

to try a file locally without supabase

```sh
python -m scripts.demo_report path/to/23andme.txt
```

## database

the tables live in our supabase project. new migrations go in `supabase/migrations/` and get applied with

```sh
supabase db push
```

## layout

| folder | what it does | owner |
|---|---|---|
| `app/ingest/` | parse and validate the 23andme file | victor |
| `app/normalize/` | rsid aliases and strand alignment | victor |
| `app/panel/` | panel loading, matching, evidence tiers, popular markers | victor, jonathan |
| `app/reporting/` | group findings by domain | neil |
| `app/pipeline.py` | runs one upload end to end and saves it | victor |
| `app/schemas/contracts.py` | the shapes passed between stages, change these through a pr | everyone |
| `scripts/` | panel building and local testing | victor |

only 23andme is supported right now
