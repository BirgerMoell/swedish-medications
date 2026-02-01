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

const fs = require('fs');
const path = require('path');

// Load full medications database
const DATA_DIR = path.join(__dirname, '..', 'data');
let FULL_DATABASE = [];
let SUBSTANCES_INDEX = {};

try {
  const medsPath = path.join(DATA_DIR, 'medications.json');
  const subsPath = path.join(DATA_DIR, 'substances.json');
  
  if (fs.existsSync(medsPath)) {
    FULL_DATABASE = JSON.parse(fs.readFileSync(medsPath, 'utf8'));
  }
  if (fs.existsSync(subsPath)) {
    SUBSTANCES_INDEX = JSON.parse(fs.readFileSync(subsPath, 'utf8'));
  }
} catch (e) {
  // Database not available, will use curated list only
}

// Curated medications with extra info (use, warnings, dosage)
const CURATED_MEDICATIONS = {
  // === PAIN & FEVER ===
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
  diklofenak: {
    brands: ['Voltaren', 'Diklofenak'],
    use: 'Pain, inflammation, arthritis',
    dose: 'Adult: 50mg 2-3x/day or gel topically',
    otc: 'Gel OTC, tablets Rx',
    warnings: 'Cardiovascular risk with long-term use',
    atc: 'M01AB05'
  },
  naproxen: {
    brands: ['Naproxen', 'Pronaxen'],
    use: 'Pain, inflammation, menstrual cramps',
    dose: 'Adult: 250-500mg twice daily',
    otc: 'Low dose OTC, higher doses Rx',
    warnings: 'Take with food, avoid long-term use',
    atc: 'M01AE02'
  },

  // === ALLERGIES ===
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
  desloratadin: {
    brands: ['Aerius', 'Desloratadin'],
    use: 'Allergies, hay fever, hives',
    dose: 'Adult: 5mg once daily',
    otc: true,
    warnings: 'Non-drowsy, active metabolite of loratadin',
    atc: 'R06AX27'
  },

  // === STOMACH & DIGESTION ===
  omeprazol: {
    brands: ['Losec', 'Omeprazol'],
    use: 'Acid reflux, stomach ulcers, GERD',
    dose: 'Adult: 20mg once daily',
    otc: 'Low dose OTC, higher doses Rx',
    warnings: 'Long-term use may affect B12/magnesium',
    atc: 'A02BC01'
  },
  loperamid: {
    brands: ['Imodium', 'Loperamid'],
    use: 'Acute diarrhea',
    dose: 'Adult: 4mg initially, then 2mg after each loose stool, max 16mg/day',
    otc: true,
    warnings: 'Do not use if fever or bloody stools',
    atc: 'A07DA03'
  },

  // === MENTAL HEALTH ===
  sertralin: {
    brands: ['Zoloft', 'Sertralin'],
    use: 'Depression, anxiety, OCD, PTSD',
    dose: 'Adult: Start 50mg/day, may increase',
    otc: false,
    warnings: 'Takes 2-4 weeks for effect, do not stop abruptly',
    atc: 'N06AB06'
  },
  escitalopram: {
    brands: ['Cipralex', 'Escitalopram'],
    use: 'Depression, anxiety disorders',
    dose: 'Adult: 10-20mg once daily',
    otc: false,
    warnings: 'Takes 2-4 weeks for effect, do not stop abruptly',
    atc: 'N06AB10'
  },
  mirtazapin: {
    brands: ['Remeron', 'Mirtazapin'],
    use: 'Depression, anxiety, insomnia',
    dose: 'Adult: 15-45mg at bedtime',
    otc: false,
    warnings: 'May cause weight gain and drowsiness',
    atc: 'N06AX11'
  },
  venlafaxin: {
    brands: ['Efexor', 'Venlafaxin'],
    use: 'Depression, anxiety disorders',
    dose: 'Adult: 75-225mg once daily',
    otc: false,
    warnings: 'SNRI, do not stop abruptly, may raise blood pressure',
    atc: 'N06AX16'
  },

  // === ADHD ===
  metylfenidat: {
    brands: ['Concerta', 'Ritalin', 'Medikinet'],
    use: 'ADHD',
    dose: 'Adult: 18-72mg once daily (extended-release)',
    otc: false,
    warnings: 'Controlled substance, monitor heart rate and blood pressure',
    atc: 'N06BA04'
  },
  lisdexamfetamin: {
    brands: ['Elvanse'],
    use: 'ADHD',
    dose: 'Adult: 30-70mg once daily in morning',
    otc: false,
    warnings: 'Controlled substance, prodrug converted to dexamphetamine',
    atc: 'N06BA12'
  },
  atomoxetin: {
    brands: ['Strattera', 'Atomoxetin'],
    use: 'ADHD (non-stimulant)',
    dose: 'Adult: 40-100mg once daily',
    otc: false,
    warnings: 'Takes 4-6 weeks for full effect, not a controlled substance',
    atc: 'N06BA09'
  },

  // === HEART & BLOOD PRESSURE ===
  metoprolol: {
    brands: ['Seloken', 'Metoprolol'],
    use: 'High blood pressure, heart conditions, anxiety symptoms',
    dose: 'Adult: 50-200mg once daily',
    otc: false,
    warnings: 'Beta-blocker, do not stop abruptly',
    atc: 'C07AB02'
  },
  atorvastatin: {
    brands: ['Lipitor', 'Atorvastatin'],
    use: 'High cholesterol, cardiovascular prevention',
    dose: 'Adult: 10-80mg once daily',
    otc: false,
    warnings: 'Statin, avoid grapefruit, report muscle pain',
    atc: 'C10AA05'
  },
  warfarin: {
    brands: ['Waran', 'Warfarin'],
    use: 'Blood clot prevention',
    dose: 'Individualized based on INR monitoring',
    otc: false,
    warnings: 'Requires regular blood tests, many drug/food interactions',
    atc: 'B01AA03'
  },

  // === DIABETES ===
  metformin: {
    brands: ['Metformin', 'Glucophage'],
    use: 'Type 2 diabetes',
    dose: 'Adult: Start 500mg 1-2x/day with food',
    otc: false,
    warnings: 'Monitor kidney function, stop before contrast imaging',
    atc: 'A10BA02'
  },

  // === ASTHMA ===
  salbutamol: {
    brands: ['Ventoline', 'Airomir', 'Buventol'],
    use: 'Asthma relief, bronchospasm',
    dose: 'Adult: 1-2 puffs as needed, max 8 puffs/day',
    otc: false,
    warnings: 'Rescue inhaler, if using frequently see doctor',
    atc: 'R03AC02'
  },

  // === ANTIBIOTICS ===
  amoxicillin: {
    brands: ['Amoxicillin', 'Amimox'],
    use: 'Bacterial infections',
    dose: 'Adult: 500mg 3x/day or 875mg 2x/day',
    otc: false,
    warnings: 'Complete full course, check for penicillin allergy',
    atc: 'J01CA04'
  },

  // === THYROID ===
  levotyroxin: {
    brands: ['Levaxin', 'Euthyrox'],
    use: 'Hypothyroidism (underactive thyroid)',
    dose: 'Adult: 25-200mcg once daily',
    otc: false,
    warnings: 'Take on empty stomach, 30-60min before breakfast',
    atc: 'H03AA01'
  }
};

/**
 * Search in full database
 */
function searchFullDatabase(query) {
  if (FULL_DATABASE.length === 0) return [];
  
  const queryLower = query.toLowerCase().trim();
  const results = [];
  
  for (const med of FULL_DATABASE) {
    // Match by name
    if (med.nameNormalized && med.nameNormalized.includes(queryLower)) {
      results.push(med);
      continue;
    }
    // Match by substance
    if (med.activeSubstances) {
      for (const sub of med.activeSubstances) {
        if (sub.toLowerCase().includes(queryLower)) {
          results.push(med);
          break;
        }
      }
    }
  }
  
  // Sort by relevance (exact matches first, then by name length)
  results.sort((a, b) => {
    const aExact = a.nameNormalized === queryLower ? 0 : 1;
    const bExact = b.nameNormalized === queryLower ? 0 : 1;
    if (aExact !== bExact) return aExact - bExact;
    return a.name.length - b.name.length;
  });
  
  return results.slice(0, 10); // Return top 10
}

/**
 * Search for medication in curated database
 */
function findCuratedMedication(query) {
  const queryLower = query.toLowerCase().trim();
  
  for (const [medName, info] of Object.entries(CURATED_MEDICATIONS)) {
    if (queryLower === medName) {
      return { name: medName, ...info };
    }
    if (info.brands.some(b => b.toLowerCase() === queryLower)) {
      return { name: medName, ...info };
    }
    if (medName.includes(queryLower) || 
        info.brands.some(b => b.toLowerCase().includes(queryLower))) {
      return { name: medName, ...info };
    }
  }
  return null;
}

/**
 * Combined search - curated first, then full database
 */
function findMedication(query) {
  // Try curated first (has extra info)
  const curated = findCuratedMedication(query);
  if (curated) return curated;
  
  // Fall back to full database
  const dbResults = searchFullDatabase(query);
  if (dbResults.length > 0) {
    const med = dbResults[0];
    return {
      name: med.name,
      brands: [med.name],
      use: med.summary || `${med.form || ''} ${med.strength || ''}`.trim(),
      dose: med.strength || '',
      otc: !med.prescriptionRequired,
      warnings: med.prescriptionRequired ? 'Prescription required (receptbelagt)' : 'OTC (receptfritt)',
      atc: med.atcCode || '',
      substances: med.activeSubstances || [],
      manufacturer: med.manufacturer || '',
      form: med.form || '',
      fromDatabase: true
    };
  }
  
  return null;
}

/**
 * Search and return multiple results
 */
function searchMedications(query, limit = 10) {
  const results = [];
  
  // Search curated
  const queryLower = query.toLowerCase().trim();
  for (const [medName, info] of Object.entries(CURATED_MEDICATIONS)) {
    if (medName.includes(queryLower) || 
        info.brands.some(b => b.toLowerCase().includes(queryLower))) {
      results.push({ name: medName, ...info, curated: true });
    }
  }
  
  // Search full database
  const dbResults = searchFullDatabase(query);
  for (const med of dbResults) {
    // Avoid duplicates
    if (!results.some(r => r.atc === med.atcCode && r.name.toLowerCase() === med.name.toLowerCase())) {
      results.push({
        name: med.name,
        use: med.summary || '',
        dose: med.strength || '',
        otc: !med.prescriptionRequired,
        atc: med.atcCode || '',
        substances: med.activeSubstances || [],
        fromDatabase: true
      });
    }
  }
  
  return results.slice(0, limit);
}

/**
 * Format medication info for display
 */
function formatMedication(med) {
  const otcStatus = med.otc === true ? 'Yes (receptfritt)' 
    : med.otc === false ? 'No (receptbelagt)' 
    : med.otc;
  
  let output = `### ${med.name.charAt(0).toUpperCase() + med.name.slice(1)}`;
  
  if (med.brands && med.brands.length > 0 && med.brands[0] !== med.name) {
    output += ` (${med.brands.join(', ')})`;
  }
  
  output += '\n\n';
  
  if (med.substances && med.substances.length > 0) {
    output += `**Active substances:** ${med.substances.join(', ')}\n`;
  }
  
  output += `**Use:** ${med.use}\n`;
  
  if (med.dose) {
    output += `**Dosage:** ${med.dose}\n`;
  }
  
  output += `**OTC:** ${otcStatus}\n`;
  
  if (med.atc) {
    output += `**ATC Code:** ${med.atc}\n`;
  }
  
  if (med.warnings && !med.fromDatabase) {
    output += `**Warnings:** ${med.warnings}`;
  }
  
  if (med.manufacturer) {
    output += `**Manufacturer:** ${med.manufacturer}\n`;
  }
  
  return output;
}

/**
 * Format multiple results
 */
function formatSearchResults(results, query) {
  if (results.length === 0) {
    return `No medications found for "${query}".`;
  }
  
  let output = `## Found ${results.length} medication(s) for "${query}"\n\n`;
  
  for (const med of results) {
    const rx = med.otc ? '🟢 OTC' : '🔴 Rx';
    output += `- **${med.name}** ${rx}`;
    if (med.atc) output += ` [${med.atc}]`;
    if (med.substances && med.substances.length > 0) {
      output += ` — ${med.substances.join(', ')}`;
    }
    output += '\n';
  }
  
  return output;
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
    output.push(`No quick info available for "${query}" in database.`);
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
  searchMedications,
  getFassUrl,
  CURATED_MEDICATIONS,
  COMMON_MEDICATIONS: CURATED_MEDICATIONS, // Backward compatibility
  FULL_DATABASE,
  SUBSTANCES_INDEX,
  getDatabaseStats: () => ({
    curated: Object.keys(CURATED_MEDICATIONS).length,
    full: FULL_DATABASE.length,
    substances: Object.keys(SUBSTANCES_INDEX).length
  })
};

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  const showHelp = () => {
    const stats = module.exports.getDatabaseStats();
    console.log('🇸🇪 Swedish Medications - FASS Lookup\n');
    console.log(`Database: ${stats.curated} curated + ${stats.full} full database\n`);
    console.log('Usage: fass-lookup <medication_name>');
    console.log('       fass-lookup paracetamol');
    console.log('       fass-lookup Alvedon');
    console.log('       fass-lookup --search "blood pressure"\n');
    console.log('Options:');
    console.log('  -h, --help     Show this help message');
    console.log('  -s, --search   Search and show multiple results');
    console.log('  -l, --list     List curated medications with extra info');
    console.log('  --stats        Show database statistics\n');
  };
  
  if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
    showHelp();
    process.exit(0);
  }
  
  if (args.includes('--stats')) {
    const stats = module.exports.getDatabaseStats();
    console.log('📊 Database Statistics:');
    console.log(`   Curated medications (with dosage/warnings): ${stats.curated}`);
    console.log(`   Full database entries: ${stats.full}`);
    console.log(`   Indexed substances: ${stats.substances}`);
    process.exit(0);
  }
  
  if (args.includes('-l') || args.includes('--list')) {
    console.log('Curated medications (with extra info):\n');
    Object.entries(CURATED_MEDICATIONS).forEach(([name, info]) => {
      console.log(`${name} (${info.brands.join(', ')})`);
      console.log(`  Use: ${info.use}`);
      console.log(`  OTC: ${info.otc === true ? 'Yes' : info.otc === false ? 'No (Rx)' : info.otc}\n`);
    });
    process.exit(0);
  }
  
  if (args.includes('-s') || args.includes('--search')) {
    const searchIdx = args.indexOf('-s') !== -1 ? args.indexOf('-s') : args.indexOf('--search');
    const query = args.slice(searchIdx + 1).join(' ');
    if (!query) {
      console.log('Usage: fass-lookup --search <query>');
      process.exit(1);
    }
    const results = searchMedications(query, 20);
    console.log(formatSearchResults(results, query));
    process.exit(0);
  }
  
  const query = args.join(' ');
  console.log(lookupMedication(query));
}
