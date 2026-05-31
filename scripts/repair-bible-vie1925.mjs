/**
 * Sửa các chương trống trong bible_vie1925.json (Thi-thiên, Châm-ngôn thơ, v.v.)
 * Chạy: node scripts/repair-bible-vie1925.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseChapterHtml } from './fetch-bible-vie1925.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const FILE = path.join(ROOT, 'public', 'bible_vie1925.json');
const VERSION = 'RVV11';
const BASE = `https://kinhthanh.httlvn.org/doc-kinh-thanh`;

const BOOK_SLUGS = [
  'sa', 'xu', 'le', 'dan', 'phu', 'gios', 'cac', 'ru', '1sa', '2sa', '1vua', '2vua',
  '1su', '2su', 'exo', 'ne', 'et', 'giop', 'thi', 'ch', 'tr', 'nha', 'es', 'gie', 'ca',
  'exe', 'da', 'os', 'gio', 'am', 'ap', 'gion', 'mi', 'na', 'ha', 'so', 'ag', 'xa', 'ma',
  'mat', 'mac', 'lu', 'gi', 'cong', 'ro', '1co', '2co', 'ga', 'eph', 'phi', 'co', '1te',
  '2te', '1ti', '2ti', 'tit', 'phil', 'he', 'gia', '1phi', '2phi', '1gi', '2gi', '3gi',
  'giu', 'kh',
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'REACH-Church-App/1.0' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

async function main() {
  const bible = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  let repaired = 0;

  for (let bi = 0; bi < bible.length; bi++) {
    const slug = BOOK_SLUGS[bi];
    for (let ci = 0; ci < bible[bi].chapters.length; ci++) {
      const ch = bible[bi].chapters[ci];
      if (ch.length > 0) continue;

      const chapterNum = ci + 1;
      const url = `${BASE}/${slug}/${chapterNum}?v=${VERSION}`;
      process.stdout.write(`Sửa ${slug} ${chapterNum}... `);
      try {
        const html = await fetchText(url);
        await sleep(150);
        const verses = parseChapterHtml(html);
        if (!verses.length) {
          console.log('vẫn trống');
          continue;
        }
        bible[bi].chapters[ci] = verses.map((v) => v.text);
        repaired++;
        console.log(`✓ ${verses.length} câu`);
      } catch (err) {
        console.log(`✗ ${err.message}`);
      }
    }
  }

  fs.writeFileSync(FILE, JSON.stringify(bible), 'utf8');
  console.log(`\nĐã sửa ${repaired} chương.`);

  const ps23 = bible[18].chapters[22];
  console.log('Thi 23:1:', ps23[0]?.slice(0, 60));
}

main().catch(console.error);
