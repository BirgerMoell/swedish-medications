---
name: swedish-medications
description: Look up Swedish medication information from FASS (Farmaceutiska Specialiteter i Sverige). Use when users ask about medications, drugs, läkemedel, dosages, side effects (biverkningar), interactions, or need to understand prescriptions in Sweden. Covers all medications approved for use in Sweden.
---

# Swedish Medications Skill

Look up information about medications approved in Sweden using FASS (the official Swedish pharmaceutical database).

## Quick Start

Search for a medication:
```bash
node scripts/fass_lookup.js "paracetamol"
```

Or with Python:
```bash
python3 scripts/fass_lookup.py "paracetamol"
```

## Capabilities

- **Search medications** by name (brand or generic/substance)
- **Get detailed info**: dosage, side effects, interactions, contraindications
- **Swedish health context**: ATC codes, prescription status, regional recommendations

## Usage Patterns

### Basic Lookup
When a user asks "What is Alvedon?" or "Tell me about paracetamol":
1. Run the lookup script with the medication name
2. Present key info: what it's for, dosage, common side effects

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

## Important Notes

- This skill provides **information only**, not medical advice
- Always recommend consulting healthcare professionals for medical decisions
- Swedish medications may have different names than international equivalents
- Some medications require prescription (receptbelagt) in Sweden

## Data Sources

- **FASS.se** - Official Swedish pharmaceutical information
- **Läkemedelsverket** - Swedish Medical Products Agency
- **1177.se** - Swedish healthcare guide

## References

See `references/common-medications.md` for quick reference on frequently asked medications.
See `references/atc-codes.md` for understanding medication classification.
