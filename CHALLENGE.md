# Ask California Black Stories: Sanity Challenge entry

> Moved into this repo from the original scaffold on 2026-09-27. Schemas now live in
> `studio/schemaTypes/`; ingest tooling in `ingest/`; parser samples in `samples/`.

Path One: Ship an Agent That Queries Real Content.
DEV challenge: https://dev.to/challenges/sanity-2026-09-16 (entries close Oct 4, 2026, 11:59 PM PDT)

## Concept

A chat agent that answers questions about Black history in California, grounded in
the California Black Stories research archive. Every answer cites its sources, and
when sources tell a story differently, the agent surfaces both side by side instead
of picking one. The agent only works because the content is structured: people,
places, events, and claims with sources, not keyword search.

## What is built so far

- `studio/schemaTypes/` : Sanity schema types (story, person, place, source),
  registered in `studio/schemaTypes/index.ts` and deployed to the Studio.
- `ingest/parse_notes.py` : parses the Obsidian vault notes (all three note formats
  found in the vault) into normalized story records. Tested on 4 sample notes.
- `ingest/to_ndjson.py` : converts normalized records to Sanity NDJSON for
  `sanity dataset import`.
- `samples/` : 4 sample notes used to develop and test the parser.

## Setup steps

1. Create a Sanity project at sanity.io/manage (free tier is fine).
2. Schemas are already in `studio/schemaTypes/` and registered. Deploy them with
   `npx sanity schema deploy` from `studio/`.
3. Pick the starter set: 15 to 20 published posts, spread across pillars.
   The vault index (`California Black Stories Index.md`) lists per-prompt status;
   prompts 005-018, 032-041, and 045-056 are marked published.
4. Export the chosen notes from Obsidian into one folder.
5. Run the ingest:
   `python ingest/parse_notes.py <notes_folder> -o stories.json`
   `python ingest/to_ndjson.py stories.json -o stories.ndjson`
   `sanity dataset import stories.ndjson production`
6. In the Sanity dashboard, create a Sanity Context knowledge base pointed at the
   content, and note the MCP endpoint. (Verify Sanity Context access first: it is
   required reading for the agent path, confirm it is available on your plan.)
7. Build the agent: Next.js chat UI + MCP client wired to the Sanity Context
   endpoint. System prompt: answer only from the knowledge base, cite every claim
   with its source URL, surface contradictions side by side.
8. Write the DEV submission post with the #sanitychallenge tag, include the Sanity
   project ID, and optionally embed an agent session transcript.

## Open questions

- Sanity Context availability on the free tier (verify before building).
- Agent framework choice: Next.js + MCP client (fits existing stack) is the default.
- Person/place references: the parser extracts subjects and locations as strings;
  curating them into person/place documents with story references is a manual
  pass for the starter set, and it is what makes structured questions answerable.

## Timeline (deadline Oct 4)

- Sep 18-20: Sanity project, schemas deployed, starter set picked, ingest run.
- Sep 21-27: knowledge base created, agent + chat UI built alongside internship.
- Sep 28-Oct 1: testing, grounding quality iteration.
- Oct 2-4: DEV writeup, submission.
