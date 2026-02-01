#!/usr/bin/env node
/**
 * FASS Database Builder
 * Fetches all Swedish medications from FASS API and builds a compact local database.
 * 
 * Usage:
 *   node build-database.js          # Fetch all medications
 *   node build-database.js --test   # Fetch first 100 for testing
 */

const https = require('https');
const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

const API_BASE = 'https://api.fass.se';
const DATA_DIR = path.join(__dirname, '..', 'data');

/**
 * Make HTTPS request with promise
 */
function fetchJSON(urlPath) {
  return new Promise((resolve, reject) => {
    const url = `${API_BASE}${urlPath}`;
    console.log(`Fetching: ${url}`);
    
    const req = https.get(url, {
      headers: {
        'Accept': 'application/fassapi-v1+json',
        'User-Agent': 'SwedishMedicationsSkill/1.0'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse JSON: ${e.message}`));
        }
      });
    });
    
    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

/**
 * Fetch all medications with pagination
 */
async function fetchAllMedications(testMode = false) {
  const medications = [];
  let cursor = null;
  let pageSize = 100;
  let maxPages = testMode ? 1 : 1000; // Safety limit
  let page = 0;
  
  console.log(`\n📦 Fetching medications from FASS API${testMode ? ' (TEST MODE - 1 page)' : ''}...\n`);
  
  while (page < maxPages) {
    try {
      const urlPath = cursor 
        ? `/fass-document/all?number=${pageSize}&cursor=${encodeURIComponent(cursor)}`
        : `/fass-document/all?number=${pageSize}`;
      
      const response = await fetchJSON(urlPath);
      
      if (!response.content || response.content.length === 0) {
        console.log('No more results.');
        break;
      }
      
      // Extract compact medication data
      for (const doc of response.content) {
        const med = extractMedicationData(doc);
        if (med) {
          medications.push(med);
        }
      }
      
      console.log(`  Page ${page + 1}: Got ${response.content.length} items (total: ${medications.length})`);
      
      // Check for next page
      if (response.page && response.page.cursor) {
        cursor = response.page.cursor;
      } else {
        break;
      }
      
      page++;
      
      // Small delay to be nice to the API
      await new Promise(r => setTimeout(r, 100));
      
    } catch (error) {
      console.error(`Error on page ${page + 1}: ${error.message}`);
      if (page === 0) throw error; // Fail if first page fails
      break; // Continue with what we have
    }
  }
  
  return medications;
}

/**
 * Extract compact medication data from FASS document
 */
function extractMedicationData(doc) {
  if (!doc) return null;
  
  try {
    return {
      id: doc.nplId || doc.id,
      n: doc.productName || doc.name || '',           // name
      s: doc.substanceName || doc.substance || '',    // substance
      a: doc.atcCode || '',                           // ATC code
      f: doc.pharmaceuticalForm || '',                // form
      st: doc.strength || '',                         // strength
      rx: doc.prescriptionRequired !== false,         // prescription required
      m: doc.marketingAuthorizationHolder || ''       // manufacturer
    };
  } catch (e) {
    return null;
  }
}

/**
 * Build search index for fast lookups
 */
function buildSearchIndex(medications) {
  const index = {
    byName: {},      // name -> [ids]
    bySubstance: {}, // substance -> [ids]
    byAtc: {}        // atc -> [ids]
  };
  
  for (let i = 0; i < medications.length; i++) {
    const med = medications[i];
    const idx = i;
    
    // Index by name (lowercase)
    if (med.n) {
      const nameLower = med.n.toLowerCase();
      if (!index.byName[nameLower]) index.byName[nameLower] = [];
      index.byName[nameLower].push(idx);
      
      // Also index first word
      const firstWord = nameLower.split(/\s+/)[0];
      if (firstWord && firstWord !== nameLower) {
        if (!index.byName[firstWord]) index.byName[firstWord] = [];
        index.byName[firstWord].push(idx);
      }
    }
    
    // Index by substance
    if (med.s) {
      const subLower = med.s.toLowerCase();
      if (!index.bySubstance[subLower]) index.bySubstance[subLower] = [];
      index.bySubstance[subLower].push(idx);
    }
    
    // Index by ATC
    if (med.a) {
      const atc = med.a.toUpperCase();
      if (!index.byAtc[atc]) index.byAtc[atc] = [];
      index.byAtc[atc].push(idx);
      
      // Also index ATC prefixes (e.g., N02 for N02BE01)
      for (let len = 3; len < atc.length; len++) {
        const prefix = atc.substring(0, len);
        if (!index.byAtc[prefix]) index.byAtc[prefix] = [];
        if (!index.byAtc[prefix].includes(idx)) {
          index.byAtc[prefix].push(idx);
        }
      }
    }
  }
  
  return index;
}

/**
 * Save database to files
 */
function saveDatabase(medications, index) {
  // Ensure data directory exists
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  
  const db = {
    version: '1.0.0',
    updated: new Date().toISOString(),
    count: medications.length,
    medications: medications
  };
  
  // Save compressed JSON
  const jsonStr = JSON.stringify(db);
  const compressed = zlib.gzipSync(jsonStr);
  const compressedPath = path.join(DATA_DIR, 'medications.json.gz');
  fs.writeFileSync(compressedPath, compressed);
  
  // Also save uncompressed for easy inspection
  const jsonPath = path.join(DATA_DIR, 'medications.json');
  fs.writeFileSync(jsonPath, jsonStr);
  
  // Save index
  const indexPath = path.join(DATA_DIR, 'index.json');
  fs.writeFileSync(indexPath, JSON.stringify(index));
  
  const stats = {
    medications: medications.length,
    jsonSize: (jsonStr.length / 1024).toFixed(1) + ' KB',
    compressedSize: (compressed.length / 1024).toFixed(1) + ' KB',
    compressionRatio: ((1 - compressed.length / jsonStr.length) * 100).toFixed(1) + '%'
  };
  
  return stats;
}

/**
 * Main
 */
async function main() {
  const testMode = process.argv.includes('--test');
  
  console.log('🏥 Swedish Medications Database Builder');
  console.log('=======================================\n');
  
  try {
    // Fetch medications
    const medications = await fetchAllMedications(testMode);
    
    if (medications.length === 0) {
      console.error('❌ No medications fetched!');
      process.exit(1);
    }
    
    console.log(`\n✅ Fetched ${medications.length} medications`);
    
    // Build index
    console.log('\n📇 Building search index...');
    const index = buildSearchIndex(medications);
    console.log(`   Indexed ${Object.keys(index.byName).length} names`);
    console.log(`   Indexed ${Object.keys(index.bySubstance).length} substances`);
    console.log(`   Indexed ${Object.keys(index.byAtc).length} ATC codes`);
    
    // Save
    console.log('\n💾 Saving database...');
    const stats = saveDatabase(medications, index);
    
    console.log('\n📊 Database Statistics:');
    console.log(`   Medications: ${stats.medications}`);
    console.log(`   JSON size: ${stats.jsonSize}`);
    console.log(`   Compressed: ${stats.compressedSize}`);
    console.log(`   Compression: ${stats.compressionRatio}`);
    
    console.log(`\n✨ Done! Database saved to ${DATA_DIR}/`);
    
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    process.exit(1);
  }
}

main();
