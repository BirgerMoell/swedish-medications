---
name: swedish-medications
version: 2.0.0
description: Look up Swedish medication information from FASS (Farmaceutiska Specialiteter i Sverige). Use when users ask about medications, drugs, läkemedel, dosages, side effects (biverkningar), interactions, or need to understand prescriptions in Sweden. Covers all medications approved for use in Sweden.
homepage: https://birgermoell.github.io/swedish-medications
metadata: {"openclaw":{"emoji":"💊","category":"healthcare","requires":{"bins":["node"]}}}
---

# Swedish Medications Skill

Look up information about medications approved in Sweden using FASS (the official Swedish pharmaceutical database).

## Quick Start

CLI lookup:
```bash
fass-lookup paracetamol
fass-lookup Alvedon
fass-lookup "alvedon 500mg"
```

Codex app install (local):
```bash
# Clone the repo
git clone https://github.com/birgermoell/swedish-medications.git

# Copy into Codex skills directory
mkdir -p ~/.codex/skills
cp -R swedish-medications ~/.codex/skills/swedish-medications
```
Then restart the Codex app. The skill will appear as **Swedish Medications** in the skills list.

Notes:
- The Codex app reads `SKILL.md` and `agents/openai.yaml` from `~/.codex/skills/swedish-medications`.
- If you update the repo, re-copy the folder into `~/.codex/skills/` and restart Codex.

Node.js usage:
```javascript
const { lookupMedication, findMedication, searchMedications, getDatabaseStats } = require('swedish-medications');

// Formatted markdown output
console.log(lookupMedication('Alvedon'));

// Raw data
const med = findMedication('ibuprofen');
console.log(med.dose);  // "Adult: 200-400mg every 4-6h, max 1200mg/day (OTC)"

// Multi-result search
console.log(searchMedications('insulin', 5));

// Database stats
console.log(getDatabaseStats());
```

## Capabilities

- **Search medications** by name (brand or generic/substance)
- **Brand mapping**: Alvedon → paracetamol, Ipren → ibuprofen, Zoloft → sertralin
- **Multi-result search** for category queries ("show me insulin medications")
- **Key info**: dosage, side effects, warnings, OTC status, ATC codes
- **FASS links** for complete official information

## Usage Patterns

### Basic Lookup
When a user asks "What is Alvedon?" or "Tell me about paracetamol":
1. Run the lookup script with the medication name
2. Present key info: what it's for, dosage, common side effects
3. Include the FASS link for official information

### Interaction Check
When a user asks "Can I take X with Y?":
1. Look up both medications
2. Check the interactions section
3. Recommend consulting healthcare provider for complex cases

### Dosage Questions
When a user asks about dosing:
1. Look up the medication
2. Present standard adult dosage
3. Note: Always recommend following prescribed dosage or consulting pharmacist

### Category Search
When a user asks "What ADHD medications are available?" or "Search insulin medications":
1. Use multi-result search
2. Return a short list of matches
3. Offer to expand any item

## API Reference

### `lookupMedication(query: string): string`
Returns formatted markdown with medication info and FASS link.

### `findMedication(query: string): object | null`
Returns raw medication data object. Checks curated list first, then full database.

### `getFassUrl(query: string): string`
Returns the FASS.se search URL for a query.

### `searchMedications(query: string, limit?: number): array`
Returns multiple matching medications (new in v2.0).

### `getDatabaseStats(): object`
Returns `{ curated: 23, full: 9064, substances: 1353 }`.

## Important Notes

⚠️ **Medical Disclaimer:** This skill provides **information only**, not medical advice.
- Always recommend consulting healthcare professionals
- Swedish medications may have different names than international equivalents
- Check FASS.se for complete official information

## Data Sources

- **[FASS.se](https://fass.se)** - Official Swedish pharmaceutical information
- **[Läkemedelsverket](https://lakemedelsverket.se)** - Swedish Medical Products Agency
- **[1177.se](https://1177.se)** - Swedish healthcare guide
