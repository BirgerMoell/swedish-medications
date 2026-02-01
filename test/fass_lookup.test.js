#!/usr/bin/env node
/**
 * Tests for FASS Medication Lookup
 * Run with: npm test
 */

const { 
  lookupMedication, 
  findMedication, 
  getFassUrl, 
  COMMON_MEDICATIONS 
} = require('../scripts/fass_lookup.js');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (err) {
    console.log(`❌ ${name}`);
    console.log(`   ${err.message}`);
    failed++;
  }
}

function assertEqual(actual, expected, msg = '') {
  if (actual !== expected) {
    throw new Error(`Expected "${expected}" but got "${actual}" ${msg}`);
  }
}

function assertContains(str, substring, msg = '') {
  if (!str.includes(substring)) {
    throw new Error(`Expected string to contain "${substring}" ${msg}`);
  }
}

function assertNotNull(val, msg = '') {
  if (val === null || val === undefined) {
    throw new Error(`Expected non-null value ${msg}`);
  }
}

function assertNull(val, msg = '') {
  if (val !== null) {
    throw new Error(`Expected null but got ${JSON.stringify(val)} ${msg}`);
  }
}

console.log('\n🧪 Swedish Medications Skill Tests\n');
console.log('─'.repeat(50));

// ============================================
// Database Tests
// ============================================
console.log('\n📦 Database Tests\n');

test('COMMON_MEDICATIONS should have medications', () => {
  const count = Object.keys(COMMON_MEDICATIONS).length;
  if (count < 5) {
    throw new Error(`Expected at least 5 medications, got ${count}`);
  }
});

test('Each medication should have required fields', () => {
  const required = ['brands', 'use', 'dose', 'otc', 'warnings', 'atc'];
  for (const [name, med] of Object.entries(COMMON_MEDICATIONS)) {
    for (const field of required) {
      if (!(field in med)) {
        throw new Error(`Medication "${name}" missing field "${field}"`);
      }
    }
  }
});

test('Each medication should have valid ATC code format', () => {
  const atcPattern = /^[A-Z]\d{2}[A-Z]{2}\d{2}$/;
  for (const [name, med] of Object.entries(COMMON_MEDICATIONS)) {
    if (!atcPattern.test(med.atc)) {
      throw new Error(`Medication "${name}" has invalid ATC code: ${med.atc}`);
    }
  }
});

test('Brands should be non-empty arrays', () => {
  for (const [name, med] of Object.entries(COMMON_MEDICATIONS)) {
    if (!Array.isArray(med.brands) || med.brands.length === 0) {
      throw new Error(`Medication "${name}" should have at least one brand`);
    }
  }
});

// ============================================
// findMedication Tests
// ============================================
console.log('\n🔍 findMedication Tests\n');

test('findMedication should find by exact substance name', () => {
  const result = findMedication('paracetamol');
  assertNotNull(result);
  assertEqual(result.name, 'paracetamol');
});

test('findMedication should find by brand name (Alvedon)', () => {
  const result = findMedication('Alvedon');
  assertNotNull(result);
  assertEqual(result.name, 'paracetamol');
});

test('findMedication should find by brand name (Ipren)', () => {
  const result = findMedication('Ipren');
  assertNotNull(result);
  assertEqual(result.name, 'ibuprofen');
});

test('findMedication should be case-insensitive', () => {
  const r1 = findMedication('PARACETAMOL');
  const r2 = findMedication('PaRaCeTaMoL');
  const r3 = findMedication('paracetamol');
  assertNotNull(r1);
  assertNotNull(r2);
  assertNotNull(r3);
  assertEqual(r1.name, r2.name);
  assertEqual(r2.name, r3.name);
});

test('findMedication should handle whitespace', () => {
  const result = findMedication('  paracetamol  ');
  assertNotNull(result);
  assertEqual(result.name, 'paracetamol');
});

test('findMedication should return null for unknown medications', () => {
  const result = findMedication('nonexistentdrug12345');
  assertNull(result);
});

test('findMedication should find by partial match', () => {
  const result = findMedication('para');
  assertNotNull(result);
  assertEqual(result.name, 'paracetamol');
});

test('findMedication should find Zoloft -> sertralin', () => {
  const result = findMedication('Zoloft');
  assertNotNull(result);
  assertEqual(result.name, 'sertralin');
});

// ============================================
// getFassUrl Tests
// ============================================
console.log('\n🔗 getFassUrl Tests\n');

test('getFassUrl should generate correct URL', () => {
  const url = getFassUrl('paracetamol');
  assertEqual(url, 'https://fass.se/search?query=paracetamol');
});

test('getFassUrl should encode special characters', () => {
  const url = getFassUrl('alvedon 500mg');
  assertContains(url, 'alvedon%20500mg');
});

test('getFassUrl should handle Swedish characters', () => {
  const url = getFassUrl('läkemedel');
  assertContains(url, 'l%C3%A4kemedel');
});

// ============================================
// lookupMedication Tests
// ============================================
console.log('\n📋 lookupMedication Tests\n');

test('lookupMedication should return markdown output', () => {
  const result = lookupMedication('paracetamol');
  assertContains(result, '##');
  assertContains(result, 'paracetamol');
});

test('lookupMedication should include brand names for known meds', () => {
  const result = lookupMedication('paracetamol');
  assertContains(result, 'Alvedon');
  assertContains(result, 'Panodil');
});

test('lookupMedication should include dosage info', () => {
  const result = lookupMedication('ibuprofen');
  assertContains(result, 'Dosage');
  assertContains(result, 'mg');
});

test('lookupMedication should include FASS link', () => {
  const result = lookupMedication('sertralin');
  assertContains(result, 'https://fass.se/search');
});

test('lookupMedication should include disclaimer', () => {
  const result = lookupMedication('anything');
  assertContains(result, 'informational only');
  assertContains(result, 'healthcare professionals');
});

test('lookupMedication should handle unknown medications gracefully', () => {
  const result = lookupMedication('unknownmed123');
  assertContains(result, 'No quick info available');
  assertContains(result, 'https://fass.se/search');
});

test('lookupMedication should show OTC status', () => {
  const result = lookupMedication('paracetamol');
  assertContains(result, 'OTC');
  assertContains(result, 'receptfritt');
});

test('lookupMedication should show prescription status for Rx meds', () => {
  const result = lookupMedication('sertralin');
  assertContains(result, 'receptbelagt');
});

// ============================================
// Integration Tests
// ============================================
console.log('\n🔄 Integration Tests\n');

test('Should find all common OTC medications', () => {
  const otcMeds = ['paracetamol', 'ibuprofen', 'loratadin', 'cetirizin'];
  for (const med of otcMeds) {
    const result = findMedication(med);
    assertNotNull(result, `for ${med}`);
    if (result.otc !== true) {
      throw new Error(`${med} should be OTC`);
    }
  }
});

test('Should find all common Rx medications', () => {
  const rxMeds = ['sertralin', 'metformin', 'atorvastatin', 'amoxicillin'];
  for (const med of rxMeds) {
    const result = findMedication(med);
    assertNotNull(result, `for ${med}`);
    if (result.otc !== false) {
      throw new Error(`${med} should be Rx (prescription)`);
    }
  }
});

test('Brand name lookups should return same info as substance', () => {
  const brands = [
    ['Alvedon', 'paracetamol'],
    ['Ipren', 'ibuprofen'],
    ['Zoloft', 'sertralin'],
    ['Losec', 'omeprazol']
  ];
  for (const [brand, substance] of brands) {
    const byBrand = findMedication(brand);
    const bySubstance = findMedication(substance);
    assertNotNull(byBrand, `for brand ${brand}`);
    assertNotNull(bySubstance, `for substance ${substance}`);
    assertEqual(byBrand.name, bySubstance.name, `${brand} should map to ${substance}`);
  }
});

// ============================================
// Results
// ============================================
console.log('\n' + '─'.repeat(50));
console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log('🎉 All tests passed!\n');
  process.exit(0);
}
