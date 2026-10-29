# MyHelix

upload your raw 23andme file and get a report on a small panel of cognition related variants, split into 4 domains

- memory and retention
- focus and cognition
- stress resiliency
- processing speed

every result links back to the published study it came from. this is educational only, no disease risk, no apoe, no supplement stuff

## how it works

1. you upload your 23andme file (.txt or .zip) on the upload page
2. the file goes to supabase storage and the backend gets told to process it
3. backend parses it, lines up the strand, matches it against the panel and saves the report
4. the raw file gets deleted right after, pass or fail
5. you get sent to the report page

## the panel

the panel comes from the gwas catalog, not from individual papers we picked by hand

- only genome wide significant hits (p < 5e-8) from studies with at least 10k people
- only variants that are actually on the 23andme chip, otherwise most of the report comes back not tested
- one variant per region so we dont count the same signal twice
- no A/T or C/G variants since you cant tell which strand those are on

### evidence tiers

- **strong** big study (50k+) that also had an independent replication sample
- **moderate** big study but no replication sample
- **limited** smaller study or weaker p value

we used to count number of papers for this but most of these papers reuse the same people (mostly uk biobank) so that was inflating things. replication is a better signal

### markers you may have heard of

genes like comt, bdnf, kibra show up in a lot of consumer dna reports. we show your genotype for those but we dont score them since large studies didnt back up the claims. each one links to the review paper and shows what the gwas catalog actually has for it

## repo layout

- `backend/` fastapi pipeline, panel scripts, tests. setup is in [backend/README.md](backend/README.md)
- `myhelix-nextjs/` the frontend (upload page, report pages)
- `supabase/` and `backend/supabase/` database migrations

## running it locally

you need both running

```sh
cd backend && .venv/bin/uvicorn app.main:app --reload    # localhost:8000
cd myhelix-nextjs && npm run dev                          # localhost:3000
```

then log in, upload a file and it takes you to `/report/test` when its done

## data rules

- never commit real genotype files or reports (theyre gitignored, keep it that way)
- uploaded files are deleted after processing
- same file + same panel version always gives the same report
- bad or incomplete files get an error, never a half report

## team

- victor fernandez, team lead and data pipeline
- jonathan reyes, interpretation and backend
- neil patel, frontend and report ux
