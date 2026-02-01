# 🇸🇪 Swedish Medications

[![npm version](https://badge.fury.io/js/swedish-medications.svg)](https://www.npmjs.com/package/swedish-medications)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A medication lookup tool for Swedish pharmaceuticals (FASS database). Built as an **OpenClaw skill** for AI agents, but works great standalone too.

## Features

- 🔍 **Quick lookup** of common Swedish medications
- 💊 **Brand → substance** mapping (Alvedon → paracetamol)
- 📋 **Key info**: dosage, side effects, warnings, OTC status
- 🔗 **FASS links** for complete official information
- 🤖 **AI-agent ready** - works with OpenClaw, LangChain, etc.

## Installation

### For AI Agents (OpenClaw)

```bash
npm install -g swedish-medications
```

Then add to your OpenClaw skills:

```yaml
# ~/.openclaw/config.yaml
skills:
  - swedish-medications
```

### As a CLI Tool

```bash
npm install -g swedish-medications
fass-lookup paracetamol
```

### As a Library

```bash
npm install swedish-medications
```

```javascript
const { lookupMedication, findMedication } = require('swedish-medications');

// Full formatted output
console.log(lookupMedication('Alvedon'));

// Just the data
const med = findMedication('ibuprofen');
console.log(med.dose);  // "Adult: 200-400mg every 4-6h, max 1200mg/day (OTC)"
```

## Usage

### Command Line

```bash
# By substance name
fass-lookup paracetamol

# By brand name  
fass-lookup Alvedon

# Multi-word queries
fass-lookup "alvedon 500mg"
```

### Example Output

```markdown
## Swedish Medication Lookup: paracetamol

### Paracetamol (Alvedon, Panodil, Pamol)

**Use:** Pain relief, fever reduction
**Dosage:** Adult: 500-1000mg every 4-6h, max 4g/day
**OTC:** Yes (receptfritt)
**ATC Code:** N02BE01
**Warnings:** Avoid with liver disease, limit alcohol

### Full Information on FASS
🔗 https://fass.se/search?query=paracetamol

---
*This is informational only. Always consult healthcare professionals for medical advice.*
```

## For AI Agents

### OpenClaw Skill

This package works as an [OpenClaw](https://openclaw.ai) skill. When installed, your AI agent can:

1. Look up medications when users ask about them
2. Translate between Swedish brand names and substances
3. Provide dosage and safety information
4. Link to official FASS documentation

**Trigger phrases the agent recognizes:**
- "What is Alvedon?"
- "Tell me about paracetamol"
- "Can I take Ipren for headaches?"
- "What's the dosage for sertralin?"

### Using with Other Agents

The module exports clean functions you can wire into any agent framework:

```javascript
const { lookupMedication, findMedication, COMMON_MEDICATIONS } = require('swedish-medications');

// For tool/function calling
const medicationTool = {
  name: "swedish_medication_lookup",
  description: "Look up Swedish medication information by name",
  parameters: {
    query: { type: "string", description: "Medication name (brand or substance)" }
  },
  execute: (params) => lookupMedication(params.query)
};
```

## API Reference

### `lookupMedication(query: string): string`

Returns formatted markdown with medication info and FASS link.

### `findMedication(query: string): object | null`

Returns raw medication data object or null if not found.

```javascript
{
  name: "paracetamol",
  brands: ["Alvedon", "Panodil", "Pamol"],
  use: "Pain relief, fever reduction",
  dose: "Adult: 500-1000mg every 4-6h, max 4g/day",
  otc: true,
  warnings: "Avoid with liver disease, limit alcohol",
  atc: "N02BE01"
}
```

### `getFassUrl(query: string): string`

Returns the FASS.se search URL for a query.

### `COMMON_MEDICATIONS: object`

The raw medications database object.

## Supported Medications

The quick-lookup database includes common Swedish medications:

| Category | Examples |
|----------|----------|
| Pain/Fever | Paracetamol, Ibuprofen, Diclofenac |
| Allergies | Loratadin, Cetirizin |
| Stomach | Omeprazol |
| Mental Health | Sertralin |
| Diabetes | Metformin |
| Cholesterol | Atorvastatin |
| Antibiotics | Amoxicillin |

For medications not in the database, it generates a FASS search link.

## Testing

```bash
npm test
```

Runs 26 tests covering database integrity, lookup functions, and edge cases.

## Data Sources

- **[FASS.se](https://fass.se)** - Official Swedish pharmaceutical information
- **[Läkemedelsverket](https://lakemedelsverket.se)** - Swedish Medical Products Agency
- **[1177.se](https://1177.se)** - Swedish healthcare guide

## ⚠️ Disclaimer

This tool provides **information only**, not medical advice. Always:
- Follow prescribed dosages
- Consult healthcare professionals for medical decisions
- Check official sources (FASS.se) for complete information

## License

MIT © [Birger Moëll](https://github.com/birgermoell)

---

Made with 🇸🇪 for the Swedish healthcare community
