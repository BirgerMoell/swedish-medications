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
  acetylsalicylsyra: {
    brands: ['Treo', 'Aspirin', 'Magnecyl'],
    use: 'Pain, fever, headache',
    dose: 'Adult: 500-1000mg every 4-6h',
    otc: true,
    warnings: 'Not for children, risk of stomach bleeding',
    atc: 'N02BA01'
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
  mometason: {
    brands: ['Nasonex', 'Mometason'],
    use: 'Nasal allergies, congestion',
    dose: 'Adult: 2 sprays per nostril once daily',
    otc: false,
    warnings: 'Nasal steroid, use regularly for best effect',
    atc: 'R01AD09'
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
  makrogol: {
    brands: ['Movicol', 'Laxido'],
    use: 'Constipation',
    dose: 'Adult: 1-3 sachets daily',
    otc: true,
    warnings: 'Drink plenty of fluids',
    atc: 'A06AD65'
  },
  natriumpikosulfat: {
    brands: ['Laxoberal', 'Cilaxoral'],
    use: 'Constipation',
    dose: 'Adult: 5-10mg at bedtime',
    otc: true,
    warnings: 'Stimulant laxative, not for long-term use',
    atc: 'A06AB08'
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
  hydroxizin: {
    brands: ['Atarax', 'Hydroxizin'],
    use: 'Anxiety, itching, sleep aid',
    dose: 'Adult: 25-100mg/day in divided doses',
    otc: false,
    warnings: 'Causes drowsiness, avoid driving',
    atc: 'N05BB01'
  },
  propiomazin: {
    brands: ['Propavan'],
    use: 'Short-term insomnia',
    dose: 'Adult: 25mg at bedtime',
    otc: false,
    warnings: 'Short-term use only, may cause morning drowsiness',
    atc: 'N05CM06'
  },
  zopiklon: {
    brands: ['Imovane', 'Zopiklon'],
    use: 'Short-term insomnia',
    dose: 'Adult: 5-7.5mg at bedtime',
    otc: false,
    warnings: 'Risk of dependence, short-term use only',
    atc: 'N05CF01'
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
  dexamfetamin: {
    brands: ['Attentin'],
    use: 'ADHD',
    dose: 'Adult: 5-20mg 2-3 times daily',
    otc: false,
    warnings: 'Controlled substance, fast-acting',
    atc: 'N06BA02'
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
  enalapril: {
    brands: ['Renitec', 'Enalapril'],
    use: 'High blood pressure, heart failure',
    dose: 'Adult: 5-40mg once daily',
    otc: false,
    warnings: 'ACE inhibitor, may cause dry cough',
    atc: 'C09AA02'
  },
  amlodipin: {
    brands: ['Norvasc', 'Amlodipin'],
    use: 'High blood pressure, angina',
    dose: 'Adult: 5-10mg once daily',
    otc: false,
    warnings: 'Calcium channel blocker, may cause ankle swelling',
    atc: 'C08CA01'
  },
  simvastatin: {
    brands: ['Zocord', 'Simvastatin'],
    use: 'High cholesterol',
    dose: 'Adult: 10-40mg once daily at bedtime',
    otc: false,
    warnings: 'Statin, avoid grapefruit, report muscle pain',
    atc: 'C10AA01'
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
  apixaban: {
    brands: ['Eliquis'],
    use: 'Blood clot prevention, atrial fibrillation',
    dose: 'Adult: 2.5-5mg twice daily',
    otc: false,
    warnings: 'NOAC, no routine monitoring needed',
    atc: 'B01AF02'
  },
  trombyl: {
    brands: ['Trombyl'],
    use: 'Blood clot prevention (low-dose aspirin)',
    dose: 'Adult: 75mg once daily',
    otc: false,
    warnings: 'Take with food, risk of bleeding',
    atc: 'B01AC06'
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
  empagliflozin: {
    brands: ['Jardiance'],
    use: 'Type 2 diabetes, heart failure',
    dose: 'Adult: 10-25mg once daily',
    otc: false,
    warnings: 'SGLT2 inhibitor, risk of genital infections, stay hydrated',
    atc: 'A10BK03'
  },
  insulinaspart: {
    brands: ['NovoRapid', 'Fiasp'],
    use: 'Diabetes (rapid-acting insulin)',
    dose: 'Individualized, given with meals',
    otc: false,
    warnings: 'Fast-acting, risk of hypoglycemia',
    atc: 'A10AB05'
  },
  insulinglargin: {
    brands: ['Lantus', 'Toujeo'],
    use: 'Diabetes (long-acting insulin)',
    dose: 'Individualized, once daily',
    otc: false,
    warnings: 'Long-acting basal insulin, do not mix with other insulins',
    atc: 'A10AE04'
  },

  // === ASTHMA & COPD ===
  salbutamol: {
    brands: ['Ventoline', 'Airomir', 'Buventol'],
    use: 'Asthma relief, bronchospasm',
    dose: 'Adult: 1-2 puffs as needed, max 8 puffs/day',
    otc: false,
    warnings: 'Rescue inhaler, if using frequently see doctor',
    atc: 'R03AC02'
  },
  budesonid: {
    brands: ['Pulmicort', 'Giona'],
    use: 'Asthma prevention',
    dose: 'Adult: 200-800mcg twice daily',
    otc: false,
    warnings: 'Inhaled steroid, rinse mouth after use',
    atc: 'R03BA02'
  },
  budesonidformoterol: {
    brands: ['Symbicort', 'Bufomix'],
    use: 'Asthma and COPD maintenance',
    dose: 'Adult: 1-2 puffs twice daily',
    otc: false,
    warnings: 'Combination inhaler, rinse mouth after use',
    atc: 'R03AK07'
  },
  terbutalin: {
    brands: ['Bricanyl'],
    use: 'Asthma relief, bronchospasm',
    dose: 'Adult: 0.25-0.5mg as needed',
    otc: false,
    warnings: 'Rescue medication, available as inhaler or injection',
    atc: 'R03AC03'
  },
  montelukast: {
    brands: ['Singulair', 'Montelukast'],
    use: 'Asthma, allergic rhinitis',
    dose: 'Adult: 10mg once daily at bedtime',
    otc: false,
    warnings: 'Leukotriene inhibitor, watch for mood changes',
    atc: 'R03DC03'
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
  fenoximetylpenicillin: {
    brands: ['Kåvepenin', 'Tikacillin'],
    use: 'Strep throat, ear infections, mild infections',
    dose: 'Adult: 1g 2-3 times daily',
    otc: false,
    warnings: 'Penicillin V, take on empty stomach',
    atc: 'J01CE02'
  },
  azitromycin: {
    brands: ['Azitromax', 'Azitromycin'],
    use: 'Respiratory infections, STIs',
    dose: 'Adult: 500mg day 1, then 250mg days 2-5',
    otc: false,
    warnings: 'Macrolide antibiotic, short course',
    atc: 'J01FA10'
  },
  ciprofloxacin: {
    brands: ['Ciproxin', 'Ciprofloxacin'],
    use: 'UTIs, GI infections, severe infections',
    dose: 'Adult: 250-750mg twice daily',
    otc: false,
    warnings: 'Fluoroquinolone, risk of tendon damage, avoid in elderly',
    atc: 'J01MA02'
  },
  nitrofurantoin: {
    brands: ['Furadantin', 'Nitrofurantoin'],
    use: 'Urinary tract infections',
    dose: 'Adult: 50mg 4x/day or 100mg 2x/day',
    otc: false,
    warnings: 'Take with food, may turn urine dark',
    atc: 'J01XE01'
  },

  // === THYROID ===
  levotyroxin: {
    brands: ['Levaxin', 'Euthyrox'],
    use: 'Hypothyroidism (underactive thyroid)',
    dose: 'Adult: 25-200mcg once daily',
    otc: false,
    warnings: 'Take on empty stomach, 30-60min before breakfast',
    atc: 'H03AA01'
  },

  // === OTHER COMMON ===
  allopurinol: {
    brands: ['Allopurinol', 'Zyloric'],
    use: 'Gout prevention',
    dose: 'Adult: 100-300mg once daily',
    otc: false,
    warnings: 'May trigger gout attack initially, drink plenty of fluids',
    atc: 'M04AA01'
  },
  gabapentin: {
    brands: ['Neurontin', 'Gabapentin'],
    use: 'Nerve pain, epilepsy',
    dose: 'Adult: 300-3600mg/day in divided doses',
    otc: false,
    warnings: 'May cause dizziness and drowsiness',
    atc: 'N03AX12'
  },
  pregabalin: {
    brands: ['Lyrica', 'Pregabalin'],
    use: 'Nerve pain, anxiety, epilepsy',
    dose: 'Adult: 150-600mg/day in divided doses',
    otc: false,
    warnings: 'Controlled substance, may cause dizziness and weight gain',
    atc: 'N03AX16'
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
  
  const showHelp = () => {
    console.log('🇸🇪 Swedish Medications - FASS Lookup\n');
    console.log('Usage: fass-lookup <medication_name>');
    console.log('       fass-lookup paracetamol');
    console.log('       fass-lookup Alvedon');
    console.log('       fass-lookup "alvedon 500mg"\n');
    console.log('Options:');
    console.log('  -h, --help     Show this help message');
    console.log('  -l, --list     List all medications in quick-lookup\n');
    console.log('Available medications in quick-lookup:');
    Object.keys(COMMON_MEDICATIONS).forEach(m => {
      console.log(`  - ${m} (${COMMON_MEDICATIONS[m].brands.join(', ')})`);
    });
    console.log('\nFor medications not listed, a FASS.se search link is provided.');
  };
  
  if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
    showHelp();
    process.exit(0);
  }
  
  if (args.includes('-l') || args.includes('--list')) {
    console.log('Available medications:\n');
    Object.entries(COMMON_MEDICATIONS).forEach(([name, info]) => {
      console.log(`${name} (${info.brands.join(', ')})`);
      console.log(`  Use: ${info.use}`);
      console.log(`  OTC: ${info.otc === true ? 'Yes' : info.otc === false ? 'No (Rx)' : info.otc}\n`);
    });
    process.exit(0);
  }
  
  const query = args.join(' ');
  console.log(lookupMedication(query));
}
