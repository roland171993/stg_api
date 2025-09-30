#!/usr/bin/env node
/**
 * Dump all .doc/.docx files as CoverLetters (title = filename without "_")
 * Uses your existing model: ../src/models/cover-letter.model.js
 *
 * Usage:
 *   node scripts/dump-cover-letters.js [optional/path/to/dir]
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');
require('dotenv').config();
const mongoose = require('mongoose');

// --- Config / DB ---
const DB_URI = process.env.DB_URI;
if (!DB_URI) {
  console.error('Missing DB_URI in environment. Please set it in .env');
  process.exit(1);
}

// --- Use YOUR existing model ---
let CoverLetter;
try {
  const modelPath = path.resolve(__dirname, '../src/models/cover-letter.model.js');
  const exported = require(modelPath);
  // support either module.exports = Model or export default Model
  CoverLetter = exported.default || exported;
} catch (e) {
  console.error('Failed to load CoverLetter model from ../src/models/cover-letter.model.js');
  console.error(e);
  process.exit(1);
}

// --- Helpers ---
function expandHome(p) {
  if (!p) return p;
  if (p.startsWith('~/')) return path.join(os.homedir(), p.slice(2));
  return p;
}

function titleFromFilename(filename) {
  const base = filename.replace(/\.(docx?|DOCX?)$/, '');
  return base.replace(/_/g, ' ').trim();
}

async function extractText(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.docx') {
    const mammoth = require('mammoth');
    const { value } = await mammoth.extractRawText({ path: filePath });
    return (value || '').trim();
  } else if (ext === '.doc') {
    const WordExtractor = require('word-extractor');
    const extractor = new WordExtractor();
    const doc = await extractor.extract(filePath);
    return (doc.getBody() || '').trim();
  } else {
    return '';
  }
}

async function* iterWordFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      yield* iterWordFiles(full);
    } else if (/\.(docx?|DOCX?)$/.test(e.name)) {
      yield full;
    }
  }
}

// --- Main ---
(async () => {
  const inputDir = expandHome(
    process.argv[2] || '~/Documents/CENTENIER/stg_api/document/cover_letters_ini'
  );

  console.log('Connecting to MongoDB...');
  await mongoose.connect(DB_URI, { autoIndex: false });

  console.log(`Scanning: ${inputDir}`);
  let ok = 0, skipped = 0, failed = 0;

  for await (const file of iterWordFiles(inputDir)) {
    const filename = path.basename(file);
    const title = titleFromFilename(filename);

    try {
      const content = await extractText(file);
      if (!content) {
        console.warn(`(skip) No content extracted: ${filename}`);
        skipped++;
        continue;
      }

      // Upsert by title to avoid duplicates on re-runs
      await CoverLetter.updateOne(
        { title },
        { $set: { title, content } },
        { upsert: true }
      );

      console.log(`(ok) ${filename} -> "${title}"`);
      ok++;
    } catch (err) {
      console.error(`(fail) ${filename}:`, err.message);
      failed++;
    }
  }

  console.log(`\nDone. Imported: ${ok}, Skipped: ${skipped}, Failed: ${failed}`);
  await mongoose.disconnect();
})().catch(async (e) => {
  console.error('Fatal error:', e);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});
