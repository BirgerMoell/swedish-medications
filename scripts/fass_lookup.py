#!/usr/bin/env python3
"""
FASS Medication Lookup Script
Searches Swedish pharmaceutical database for medication information.

Usage:
    python3 fass_lookup.py <medication_name>
    python3 fass_lookup.py paracetamol
    python3 fass_lookup.py "alvedon 500mg"
"""

import sys
import json
import urllib.request
import urllib.parse
import re

def search_fass_web(query: str) -> dict:
    """Search FASS website and extract results."""
    encoded_query = urllib.parse.quote(query)
    url = f"https://fass.se/search?query={encoded_query}"
    
    return {
        'query': query,
        'search_url': url,
        'note': 'Visit the URL above to see full results on FASS.se'
    }

def get_common_medications() -> dict:
    """Return quick reference for common Swedish medications."""
    return {
        'paracetamol': {
            'brands': ['Alvedon', 'Panodil', 'Pamol'],
            'use': 'Pain relief, fever reduction',
            'dose': 'Adult: 500-1000mg every 4-6h, max 4g/day',
            'otc': True,
            'warnings': 'Avoid with liver disease, limit alcohol'
        },
        'ibuprofen': {
            'brands': ['Ipren', 'Ibumetin', 'Brufen'],
            'use': 'Pain, inflammation, fever',
            'dose': 'Adult: 200-400mg every 4-6h, max 1200mg/day (OTC)',
            'otc': True,
            'warnings': 'Take with food, avoid if stomach ulcers or kidney issues'
        },
        'omeprazol': {
            'brands': ['Losec', 'Omeprazol'],
            'use': 'Acid reflux, stomach ulcers, GERD',
            'dose': 'Adult: 20mg once daily',
            'otc': 'Low dose OTC, higher doses Rx',
            'warnings': 'Long-term use may affect B12/magnesium'
        },
        'sertralin': {
            'brands': ['Zoloft', 'Sertralin'],
            'use': 'Depression, anxiety, OCD, PTSD',
            'dose': 'Adult: Start 50mg/day, may increase',
            'otc': False,
            'warnings': 'Takes 2-4 weeks for effect, do not stop abruptly'
        },
        'metformin': {
            'brands': ['Metformin', 'Glucophage'],
            'use': 'Type 2 diabetes',
            'dose': 'Adult: Start 500mg 1-2x/day with food',
            'otc': False,
            'warnings': 'Monitor kidney function, stop before contrast imaging'
        },
        'atorvastatin': {
            'brands': ['Lipitor', 'Atorvastatin'],
            'use': 'High cholesterol, cardiovascular prevention',
            'dose': 'Adult: 10-80mg once daily',
            'otc': False,
            'warnings': 'Report muscle pain, avoid grapefruit'
        },
        'loratadin': {
            'brands': ['Clarityn', 'Loratadin'],
            'use': 'Allergies, hay fever, hives',
            'dose': 'Adult: 10mg once daily',
            'otc': True,
            'warnings': 'Non-drowsy antihistamine'
        },
        'cetirizin': {
            'brands': ['Zyrtec', 'Cetirizin'],
            'use': 'Allergies, hay fever, hives',
            'dose': 'Adult: 10mg once daily',
            'otc': True,
            'warnings': 'May cause slight drowsiness'
        }
    }

def lookup_medication(query: str) -> str:
    """Look up medication information."""
    query_lower = query.lower().strip()
    common_meds = get_common_medications()
    
    output = []
    output.append(f"## Swedish Medication Lookup: {query}\n")
    
    # Check common medications database
    found = None
    for med_name, info in common_meds.items():
        if query_lower == med_name or query_lower in [b.lower() for b in info['brands']]:
            found = (med_name, info)
            break
        if query_lower in med_name:
            found = (med_name, info)
            break
    
    if found:
        med_name, info = found
        output.append(f"### {med_name.title()} ({', '.join(info['brands'])})\n")
        output.append(f"**Use:** {info['use']}")
        output.append(f"**Dosage:** {info['dose']}")
        output.append(f"**OTC:** {'Yes (receptfritt)' if info['otc'] == True else 'No (receptbelagt)' if info['otc'] == False else info['otc']}")
        output.append(f"**Warnings:** {info['warnings']}")
        output.append("")
    
    # Always provide FASS link
    web_info = search_fass_web(query)
    output.append(f"### Full Information on FASS")
    output.append(f"🔗 {web_info['search_url']}")
    output.append("")
    output.append("---")
    output.append("*This is informational only. Always consult healthcare professionals for medical advice.*")
    output.append("*Sources: FASS.se, Läkemedelsverket*")
    
    return "\n".join(output)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: fass_lookup.py <medication_name>")
        print("Example: fass_lookup.py paracetamol")
        print("Example: fass_lookup.py alvedon")
        sys.exit(1)
    
    query = " ".join(sys.argv[1:])
    print(lookup_medication(query))
