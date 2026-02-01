---
name: swedish-medications
version: 1.0.1
description: Look up Swedish medication information from FASS. Search by brand name or substance, get dosage, warnings, OTC status.
homepage: https://birgermoell.github.io/swedish-medications
metadata: {"openclaw":{"emoji":"💊","category":"healthcare","requires":{"bins":["node"]}}}
---

# Swedish Medications Skill

Look up information about medications approved in Sweden using FASS (the official Swedish pharmaceutical database).

## Skill Files

| File | URL |
|------|-----|
| **SKILL.md** (this file) | `https://birgermoell.github.io/swedish-medications/skill.md` |
| **package.json** (metadata) | `https://birgermoell.github.io/swedish-medications/skill.json` |

**Install via npm (recommended):**
```bash
npm install -g swedish-medications
```

**Or install locally via curl:**
```bash
mkdir -p ~/.openclaw/skills/swedish-medications
curl -s https://birgermoell.github.io/swedish-medications/skill.md > ~/.openclaw/skills/swedish-medications/SKILL.md
curl -s https://birgermoell.github.io/swedish-medications/skill.json > ~/.openclaw/skills/swedish-medications/package.json
```

**Or just read from URLs directly!**

## Quick Start

### CLI Usage
```bash
fass-lookup paracetamol
fass-lookup Alvedon
fass-lookup --help
fass-lookup --list
```

### Node.js Usage
```javascript
const { lookupMedication, findMedication } = require('swedish-medications');

// Get formatted markdown
console.log(lookupMedication('Alvedon'));

// Get raw data
const med = findMedication('ibuprofen');
console.log(med.dose);  // "Adult: 200-400mg every 4-6h, max 1200mg/day (OTC)"
```

## Capabilities

- **Search medications** by name (brand or generic/substance)
- **Brand mapping**: Alvedon → paracetamol, Ipren → ibuprofen, Zoloft → sertralin
- **Key info**: dosage, side effects, warnings, OTC status, ATC codes
- **FASS links** for complete official information

## When to Use This Skill

Use when users ask about:
- Swedish medications by name ("What is Alvedon?")
- Dosage questions ("How much ibuprofen can I take?")
- OTC status ("Do I need a prescription for Losec?")
- Side effects or warnings
- Brand vs generic equivalents

## Available Medications (Quick Lookup)

| Substance | Brands | Use |
|-----------|--------|-----|
| Paracetamol | Alvedon, Panodil, Pamol | Pain, fever |
| Ibuprofen | Ipren, Ibumetin, Brufen | Pain, inflammation |
| Omeprazol | Losec | Acid reflux, ulcers |
| Sertralin | Zoloft | Depression, anxiety |
| Metformin | Glucophage | Type 2 diabetes |
| Atorvastatin | Lipitor | Cholesterol |
| Loratadin | Clarityn | Allergies |
| Cetirizin | Zyrtec | Allergies |
| Diklofenak | Voltaren | Pain, arthritis |
| Amoxicillin | Amimox | Bacterial infections |

For medications not in the quick-lookup, a FASS.se search link is provided.

## API Reference

### `lookupMedication(query: string): string`
Returns formatted markdown with medication info and FASS link.

### `findMedication(query: string): object | null`
Returns raw medication data object or null if not found.

### `getFassUrl(query: string): string`
Returns the FASS.se search URL for a query.

### `COMMON_MEDICATIONS: object`
The raw medications database object.

## Important Notes

⚠️ **Medical Disclaimer:** This skill provides **information only**, not medical advice.
- Always recommend consulting healthcare professionals
- Swedish medications may have different names than international equivalents
- Check FASS.se for complete official information

## Data Sources

- **[FASS.se](https://fass.se)** - Official Swedish pharmaceutical information
- **[Läkemedelsverket](https://lakemedelsverket.se)** - Swedish Medical Products Agency
- **[1177.se](https://1177.se)** - Swedish healthcare guide

## Links

- **npm:** https://www.npmjs.com/package/swedish-medications
- **GitHub:** https://github.com/birgermoell/swedish-medications
- **Landing page:** https://birgermoell.github.io/swedish-medications
