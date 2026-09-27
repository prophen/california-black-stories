#!/usr/bin/env python3
"""Convert normalized story records (from parse_notes.py) to Sanity NDJSON.

Each line is one Sanity document, ready for:
    sanity dataset import stories.ndjson production

Usage:
    python to_ndjson.py stories.json -o stories.ndjson
"""

import json
import re
import sys
from pathlib import Path


def slugify(text, prompt_number):
    slug = re.sub(r"[^a-z0-9]+", "-", (text or "").lower()).strip("-")[:80]
    return f"{prompt_number:03d}-{slug}" if prompt_number else slug


def to_story_doc(record):
    n = record.get("promptNumber")
    return {
        "_id": f"story-{n:03d}" if n else f"story-{slugify(record.get('title'), n)}",
        "_type": "story",
        "title": record.get("title", ""),
        "slug": {"_type": "slug", "current": slugify(record.get("title"), n)},
        "promptNumber": n,
        "pillar": record.get("pillar", ""),
        "postType": record.get("postType", ""),
        "publishStatus": record.get("publishStatus", "draft"),
        "subject": record.get("subject", ""),
        "location": record.get("location", ""),
        "era": record.get("era", ""),
        "caption": record.get("caption", ""),
        "hashtags": record.get("hashtags", []),
        "firstComment": record.get("firstComment", ""),
        "claims": [
            {
                "_type": "object",
                "_key": f"claim-{i}",
                "claim": c.get("claim", ""),
                "sources": c.get("sources", []),
                "verificationStatus": c.get("verificationStatus", ""),
            }
            for i, c in enumerate(record.get("claims", []))
        ],
        "sourceUrls": record.get("sourceUrls", []),
    }


def main():
    if len(sys.argv) < 2:
        print("Usage: python to_ndjson.py stories.json [-o stories.ndjson]", file=sys.stderr)
        sys.exit(1)
    in_path = Path(sys.argv[1])
    out_path = Path("stories.ndjson")
    if "-o" in sys.argv:
        out_path = Path(sys.argv[sys.argv.index("-o") + 1])

    records = json.loads(in_path.read_text(encoding="utf-8"))
    with out_path.open("w", encoding="utf-8") as f:
        for record in records:
            f.write(json.dumps(to_story_doc(record), ensure_ascii=False) + "\n")
    print(f"Wrote {len(records)} documents -> {out_path}")


if __name__ == "__main__":
    main()
