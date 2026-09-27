#!/usr/bin/env python3
"""Parse California Black Stories Obsidian notes into normalized story records.

Handles the note formats found in the vault:
  A. Archived: YAML frontmatter + "## Post details" + "## Research and fact check"
     (claims as "### Claim N" subsections, or "- claim" bullets with Source lines)
  B. Newer: plain header block (Status/Type/Subject/Location/Era/Pillar lines)
     + "## Fact Check" ("- claim" bullets with nested "- url" bullets)
  C. Review draft: "## Metadata" JSON + "## Facebook Caption" + "## Fact Check"
     + embedded package JSON (structured factCheck list when present)

Usage:
    python parse_notes.py <notes_dir> -o stories.json
"""

import json
import re
import sys
from pathlib import Path

URL_RE = re.compile(r"https?://[^\s)\]]+")
HASHTAG_RE = re.compile(r"#\w+")
FRONTMATTER_RE = re.compile(r"^---\s*\n(.*?)\n---\s*\n", re.S)
HEADER_KV_RE = re.compile(r"^(Status|Type|Subject|Location|Era|Pillar)\s*:\s*(.+?)\s*$")
POST_DETAIL_RE = re.compile(r"^-\s*\*\*(.+?)\*{0,2}:\s*(.+?)\s*$")
H3_CLAIM_RE = re.compile(r"^###\s+Claim\s+\d+", re.I)
FILENAME_RE = re.compile(r"Prompt[_\s]+0*(\d+)[_\s-]+(.*?)\.md$", re.I)


def clean_md(text):
    text = re.sub(r"\*\*(.+?)\*\*", r"\1", text)
    text = re.sub(r"\[([^\]]+?)\]\(https?://[^\s)]+\)", r"\1", text)
    return text.strip()


def strip_urls(text):
    return URL_RE.sub("", text).strip()


def dedupe(seq):
    seen, out = set(), []
    for item in seq:
        if item not in seen:
            seen.add(item)
            out.append(item)
    return out


def parse_frontmatter(text):
    m = FRONTMATTER_RE.match(text)
    if not m:
        return {}
    data = {}
    for line in m.group(1).splitlines():
        if ":" in line:
            key, _, value = line.partition(":")
            data[key.strip()] = value.strip().strip('"').strip("'")
    return data


def split_sections(lines):
    """Split markdown lines into (title, lines) for ## and ### headings."""
    sections = []
    title, buf = "preamble", []
    for line in lines:
        m = re.match(r"^(#{2,3})\s+(.+?)\s*$", line)
        if m:
            sections.append((title, buf))
            title, buf = m.group(2).strip(), []
        else:
            buf.append(line)
    sections.append((title, buf))
    return sections


def find_json_blocks(text):
    blocks = []
    for m in re.finditer(r"```json\s*\n(.*?)```", text, re.S):
        try:
            blocks.append(json.loads(m.group(1)))
        except json.JSONDecodeError:
            continue
    return blocks


def parse_claim_group(lines):
    """One claim: paragraph text plus '- url' bullets or 'Source:' lines."""
    text_parts, sources = [], []
    for line in lines:
        s = line.strip()
        if not s:
            continue
        urls = URL_RE.findall(s)
        if s.startswith("- "):
            rest = strip_urls(s[2:]).strip("- ").strip()
            if rest:
                text_parts.append(clean_md(rest))
            sources.extend(urls)
        elif s.lower().startswith("source:"):
            sources.extend(urls)
        else:
            rest = strip_urls(s)
            if rest:
                text_parts.append(clean_md(rest))
            sources.extend(urls)
    text = re.sub(r"\s+", " ", " ".join(text_parts)).strip()
    if not text and not sources:
        return None
    return {"claim": text, "sources": dedupe(sources), "verificationStatus": ""}


def parse_fact_check(lines):
    if any(H3_CLAIM_RE.match(line) for line in lines):
        claims, buf = [], []
        for line in lines:
            if H3_CLAIM_RE.match(line):
                if buf:
                    claim = parse_claim_group(buf)
                    if claim:
                        claims.append(claim)
                buf = []
            else:
                buf.append(line)
        if buf:
            claim = parse_claim_group(buf)
            if claim:
                claims.append(claim)
        return claims

    claims, current, section_sources = [], None, []
    for line in lines:
        s = line.strip()
        if not s:
            continue
        indented = line.startswith((" ", "\t"))
        if s.startswith("- ") and not indented:
            if current:
                claims.append(current)
            current = {
                "claim": clean_md(strip_urls(s[2:]).strip("- ").strip()),
                "sources": URL_RE.findall(s),
                "verificationStatus": "",
            }
        elif current and (s.startswith("- ") or s.lower().startswith("source:")):
            urls = URL_RE.findall(s)
            current["sources"].extend(urls)
            section_sources.extend(urls)
        elif current:
            rest = strip_urls(s)
            if rest:
                current["claim"] = (current["claim"] + " " + clean_md(rest)).strip()
            current["sources"].extend(URL_RE.findall(s))
    if current:
        claims.append(current)
    for claim in claims:
        claim["sources"] = dedupe(claim["sources"])
        if not claim["sources"]:
            claim["sources"] = dedupe(section_sources)
        claim["claim"] = re.sub(r"\s+", " ", claim["claim"]).strip()
    return [c for c in claims if c["claim"] or c["sources"]]


def normalize_status(raw):
    low = (raw or "").lower()
    if "publish" in low:
        return "published"
    if "schedul" in low:
        return "scheduled"
    if "ready_for_review" in low:
        return "ready_for_review"
    if "not recorded" in low:
        return "not recorded"
    return "draft"


def parse_file(path):
    text = path.read_text(encoding="utf-8", errors="replace")
    lines = text.splitlines()

    fm = parse_frontmatter(text)
    sections = split_sections(lines)
    by_title = {title.lower(): buf for title, buf in sections}
    preamble = by_title.get("preamble", [])

    record = {
        "promptNumber": None,
        "title": "",
        "pillar": "",
        "postType": "",
        "status": "",
        "publishStatus": "draft",
        "subject": "",
        "location": "",
        "era": "",
        "caption": "",
        "hashtags": [],
        "firstComment": "",
        "claims": [],
        "sourceUrls": [],
        "notePath": path.name,
    }

    m = FILENAME_RE.search(path.name)
    if m:
        record["promptNumber"] = int(m.group(1))
        record["title"] = m.group(2).strip()

    h1 = next((l for l in lines if l.startswith("# ")), "")
    if h1:
        h1_title = re.sub(r"^#\s*Prompt\s+\d+\s*[:\u2014\u2013-]\s*", "", h1).strip()
        h1_title = re.sub(r"^#\s*Prompt\s+\d+\s+of\s+\d+\s*[\u2014\u2013-]\s*", "", h1_title).strip()
        if h1_title:
            record["title"] = h1_title

    # Header key: value lines (formats B and C preambles)
    for line in preamble:
        hm = HEADER_KV_RE.match(line.strip())
        if hm:
            key = hm.group(1).lower()
            record[{"status": "status", "type": "postType", "subject": "subject",
                    "location": "location", "era": "era", "pillar": "pillar"}[key]] = hm.group(2)

    # "## Post details" bullets (format A)
    for line in by_title.get("post details", []):
        pm = POST_DETAIL_RE.match(line.strip())
        if pm:
            key = pm.group(1).strip().lower().rstrip("*")
            value = pm.group(2).strip().strip("*").strip().strip("`")
            mapping = {"prompt": None, "type": "postType", "status": "status",
                       "subject": "subject", "location": "location", "era": "era",
                       "pillar": "pillar"}
            if key in mapping and mapping[key]:
                record[mapping[key]] = value

    if fm.get("title"):
        record["title"] = fm["title"]
    if fm.get("status"):
        record["status"] = fm["status"]
    if not record["status"]:
        record["status"] = ""
    record["publishStatus"] = normalize_status(record["status"])

    # Embedded JSON packages: prefer structured factCheck lists and metadata
    for block in find_json_blocks(text):
        if not isinstance(block, dict):
            continue
        fc = block.get("factCheck")
        if isinstance(fc, list) and fc and isinstance(fc[0], dict):
            record["claims"] = [
                {"claim": clean_md(strip_urls(str(item.get("claim", "")))),
                 "sources": dedupe([s for s in item.get("sources", []) if isinstance(s, str)]),
                 "verificationStatus": str(item.get("status", ""))}
                for item in fc if isinstance(item, dict)
            ]
        for key, field in (("namedSubject", "subject"), ("location", "location"),
                           ("era", "era"), ("pillar", "pillar"), ("topic", "title")):
            if block.get(key) and not record[field]:
                record[field] = str(block[key]).strip()
        if isinstance(block.get("sources"), list):
            record["sourceUrls"].extend(s for s in block["sources"] if isinstance(s, str))
        meta = block.get("metadata") if isinstance(block.get("metadata"), dict) else None
        if meta:
            for key, field in (("namedSubject", "subject"), ("location", "location"),
                               ("era", "era"), ("pillar", "pillar")):
                if meta.get(key) and not record[field]:
                    record[field] = str(meta[key]).strip()

    # Markdown fact-check section (fallback when no structured JSON claims)
    if not record["claims"]:
        for title, buf in sections:
            if "fact check" in title.lower():
                record["claims"] = parse_fact_check(buf)
                break

    for title, buf in sections:
        low = title.lower()
        if low in ("caption", "facebook caption"):
            record["caption"] = clean_md("\n".join(buf).strip())
        elif low in ("first comment", "firstcomment"):
            record["firstComment"] = clean_md("\n".join(buf).strip())
        elif "hashtag" in low:
            record["hashtags"] = dedupe(HASHTAG_RE.findall("\n".join(buf)))
        elif low == "research sources":
            record["sourceUrls"].extend(URL_RE.findall("\n".join(buf)))

    for claim in record["claims"]:
        record["sourceUrls"].extend(claim["sources"])
    record["sourceUrls"] = dedupe(record["sourceUrls"])

    return record


def main():
    if len(sys.argv) < 2:
        print("Usage: python parse_notes.py <notes_dir> [-o stories.json]", file=sys.stderr)
        sys.exit(1)
    notes_dir = Path(sys.argv[1])
    out_path = Path("stories.json")
    if "-o" in sys.argv:
        out_path = Path(sys.argv[sys.argv.index("-o") + 1])

    records, errors = [], []
    for path in sorted(notes_dir.glob("*.md")):
        if path.name.lower().startswith("index"):
            continue
        try:
            records.append(parse_file(path))
        except Exception as exc:  # keep going, report at the end
            errors.append(f"{path.name}: {exc}")

    out_path.write_text(json.dumps(records, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Parsed {len(records)} notes -> {out_path}")
    print(f"With claims: {sum(1 for r in records if r['claims'])}")
    print(f"Published: {sum(1 for r in records if r['publishStatus'] == 'published')}")
    for err in errors:
        print(f"ERROR {err}", file=sys.stderr)


if __name__ == "__main__":
    main()
