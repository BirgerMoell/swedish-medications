#!/usr/bin/env node
/**
 * FASS Medication Lookup Script
 * Searches Swedish pharmaceutical database for medication information.
 * 
 * Usage:
 *   node fass_lookup.js <medication_name>
 *   node fass_lookup.js paracetamol
 *   node fass_lookup.js "alvedon 500mg"
 */

const https = require('https');
const url = require('url');

// Common Swedish medications database
const COMMON_MEDICATIONS = {
  paracetamol: {
    brands: ['Alvedon', 'Panodil', 'Pamol'],
    use: 'Pain relief, fever reduction',
    dose: 'Adult: 500-1000mg every 4-6h, max 4g/day',
    otc: true,
    warnings: 'Avoid with liver disease, limit alcohol',
    atc: 'N02BE01'
  },
  ibuprofen: {
    brands: ['Ipren', 'Ibumetin', 'Brufen'],
    use: 'Pain, inflammation, fever',
    dose: 'Adult: 200-400mg every 4-6h, max 1200mg/day (OTC)',
    otc: true,
    warnings: 'Take with food, avoid if stomach ulcers or kidney issues',
    atc: 'M01AE01'
  },
  omeprazol: {
    brands: ['Losec', 'Omeprazol'],
    use: 'Acid reflux, stomach ulcers, GERD',
    dose: 'Adult: 20mg once daily',
    otc: 'Low dose OTC, higher doses Rx',
    warnings: 'Long-term use may affect B12/magnesium',
    atc: 'A02BC01'
  },
  sertralin: {
    brands: ['Zoloft', 'Sertralin'],
    use: 'Depression, anxiety, OCD, PTSD',
    dose: 'Adult: Start 50mg/day, may increase',
    otc: false,
    warnings: 'Takes 2-4 weeks for effect, do not stop abruptly',
    atc: 'N06AB06'
  },
  metformin: {
    brands: ['Metformin', 'Glucophage'],
    use: 'Type 2 diabetes',
    dose: 'Adult: Start 500mg 1-2x/day with food',
    otc: false,
    warnings: 'Monitor kidney function, stop before contrast imaging',
    atc: 'A10BA02'
  },
  atorvastatin: {
    brands: ['Lipitor', 'Atorvastatin'],
    use: 'High cholesterol, cardiovascular prevention',
    dose: 'Adult: 10-80mg once daily',
    otc: false,
    warnings: 'Report muscle pain, avoid grapefruit',
    atc: 'C10AA05'
  },
  loratadin: {
    brands: ['Clarityn', 'Loratadin'],
    use: 'Allergies, hay fever, hives',
    dose: 'Adult: 10mg once daily',
    otc: true,
    warnings: 'Non-drowsy antihistamine',
    atc: 'R06AX13'
  },
  cetirizin: {
    brands: ['Zyrtec', 'Cetirizin'],
    use: 'Allergies, hay fever, hives',
    dose: 'Adult: 10mg once daily',
    otc: true,
    warnings: 'May cause slight drowsiness',
    atc: 'R06AE07'
  },
  diklofenak: {
    brands: ['Voltaren', 'Diklofenak'],
    use: 'Pain, inflammation, arthritis',
    dose: 'Adult: 50mg 2-3x/day or gel topically',
    otc: 'Gel OTC, tablets Rx',
    warnings: 'Cardiovascular risk with long-term use',
    atc: 'M01AB05'
  },
  amoxicillin: {
    brands: ['Amoxicillin', 'Amimox'],
    use: 'Bacterial infections',
    dose: 'Adult: 500mg 3x/day or 875mg 2x/day',
    otc: false,
    warnings: 'Complete full course, check for penicillin allergy',
    atc: 'J01CA04'
  }
};

/**
 * Search for medication in local database
 */
function findMedication(query) {
  const queryLower = query.toLowerCase().trim();
  
  for (const [medName, info] of Object.entries(COMMON_MEDICATIONS)) {
    // Check exact match on substance name
    if (queryLower === medName) {
      return { name: medName, ...info };
    }
    // Check brand names
    if (info.brands.some(b => b.toLowerCase() === queryLower)) {
      return { name: medName, ...info };
    }
    // Check partial match
    if (medName.includes(queryLower) || 
        info.brands.some(b => b.toLowerCase().includes(queryLower))) {
      return { name: medName, ...info };
    }
  }
  return null;
}

/**
 * Format medication info for display
 */
function formatMedication(med) {
  const otcStatus = med.otc === true ? 'Yes (receptfritt)' 
    : med.otc === false ? 'No (receptbelagt)' 
    : med.otc;
  
  return `### ${med.name.charAt(0).toUpperCase() + med.name.slice(1)} (${med.brands.join(', ')})

**Use:** ${med.use}
**Dosage:** ${med.dose}
**OTC:** ${otcStatus}
**ATC Code:** ${med.atc}
**Warnings:** ${med.warnings}`;
}

/**
 * Generate FASS search URL
 */
function getFassUrl(query) {
  return `https://fass.se/search?query=${encodeURIComponent(query)}`;
}

/**
 * Main lookup function
 */
function lookupMedication(query) {
  const output = [];
  output.push(`## Swedish Medication Lookup: ${query}\n`);
  
  const med = findMedication(query);
  
  if (med) {
    output.push(formatMedication(med));
    output.push('');
  } else {
    output.push(`No quick info available for "${query}" in local database.`);
    output.push('');
  }
  
  output.push('### Full Information on FASS');
  output.push(`🔗 ${getFassUrl(query)}`);
  output.push('');
  output.push('---');
  output.push('*This is informational only. Always consult healthcare professionals for medical advice.*');
  output.push('*Sources: FASS.se, Läkemedelsverket*');
  
  return output.join('\n');
}

/**
 * Export for use as module
 */
module.exports = {
  lookupMedication,
  findMedication,
  getFassUrl,
  COMMON_MEDICATIONS
};

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node fass_lookup.js <medication_name>');
    console.log('Example: node fass_lookup.js paracetamol');
    console.log('Example: node fass_lookup.js alvedon');
    console.log('');
    console.log('Available medications in quick-lookup:');
    Object.keys(COMMON_MEDICATIONS).forEach(m => {
      console.log(`  - ${m} (${COMMON_MEDICATIONS[m].brands.join(', ')})`);
    });
    process.exit(1);
  }
  
  const query = args.join(' ');
  console.log(lookupMedication(query));
}
