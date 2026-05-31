/**
 * Tải toàn bộ Kinh Thánh Bản Truyền Thống Hiệu Đính (RVV11) từ kinhthanh.httlvn.org
 * và lưu thành public/bible_vie1925.json — định dạng tương thích API hiện tại.
 *
 * Chạy: node scripts/fetch-bible-vie1925.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'public', 'bible_vie1925.json');
const VERSION = 'RVV11';
const BASE = `https://kinhthanh.httlvn.org/doc-kinh-thanh`;
const CONCURRENCY = 6;
const DELAY_MS = 120;

const BOOK_SLUGS = [
  'sa', 'xu', 'le', 'dan', 'phu', 'gios', 'cac', 'ru', '1sa', '2sa', '1vua', '2vua',
  '1su', '2su', 'exo', 'ne', 'et', 'giop', 'thi', 'ch', 'tr', 'nha', 'es', 'gie', 'ca',
  'exe', 'da', 'os', 'gio', 'am', 'ap', 'gion', 'mi', 'na', 'ha', 'so', 'ag', 'xa', 'ma',
  'mat', 'mac', 'lu', 'gi', 'cong', 'ro', '1co', '2co', 'ga', 'eph', 'phi', 'co', '1te',
  '2te', '1ti', '2ti', 'tit', 'phil', 'he', 'gia', '1phi', '2phi', '1gi', '2gi', '3gi',
  'giu', 'kh',
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function decodeHtml(text) {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&emsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

export function parseChapterHtml(html) {
  const verses = [];
  const re = /<span class="verse [^"]*">\s*(?:&emsp;\s*)*<sup>(\d+)<\/sup>([\s\S]*?)<\/span>/gi;
  let m;
  while ((m = re.exec(html))) {
    let text = m[2]
      .replace(/<sup[^>]*>[\s\S]*?<\/sup>/gi, '')
      .replace(/<a[^>]*>[\s\S]*?<\/a>/gi, '')
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    text = decodeHtml(text);
    if (text) verses.push({ verse: Number(m[1]), text });
  }
  verses.sort((a, b) => a.verse - b.verse);
  return verses;
}

function getChapterCount(html, slug) {
  const re = new RegExp(`/doc-kinh-thanh/${slug}/(\\d+)\\?v=${VERSION}`, 'gi');
  let max = 0;
  let m;
  while ((m = re.exec(html))) {
    max = Math.max(max, Number(m[1]));
  }
  return max;
}

async function fetchText(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'REACH-Church-App/1.0 (bible sync)' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (err) {
      if (i === retries - 1) throw err;
      await sleep(500 * (i + 1));
    }
  }
  throw new Error('unreachable');
}

async function mapPool(items, limit, fn) {
  const results = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: limit }, worker));
  return results;
}

async function fetchBook(slug, meta) {
  const ch1Url = `${BASE}/${slug}/1?v=${VERSION}`;
  const ch1Html = await fetchText(ch1Url);
  await sleep(DELAY_MS);
  const chapterCount = getChapterCount(ch1Html, slug) || 1;

  const chapterNums = Array.from({ length: chapterCount }, (_, i) => i + 1);
  const chapters = await mapPool(chapterNums, CONCURRENCY, async (ch) => {
    const url = `${BASE}/${slug}/${ch}?v=${VERSION}`;
    const html = ch === 1 ? ch1Html : await fetchText(url);
    if (ch !== 1) await sleep(DELAY_MS);
    const verses = parseChapterHtml(html);
    if (!verses.length) {
      console.warn(`  ⚠ ${slug} ch.${ch}: không parse được câu nào`);
    }
    return verses.map((v) => v.text);
  });

  return {
    abbrev: meta?.abbrev || slug,
    name: meta?.name || slug,
    chapters,
  };
}

async function main() {
  const existingPath = path.join(ROOT, 'public', 'bible_vie.json');
  let raw = fs.readFileSync(existingPath, 'utf8');
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
  const existing = JSON.parse(raw);

  console.log(`Đang tải ${BOOK_SLUGS.length} sách (${VERSION})...`);
  const bible = [];

  for (let i = 0; i < BOOK_SLUGS.length; i++) {
    const slug = BOOK_SLUGS[i];
    const meta = existing[i];
    process.stdout.write(`[${i + 1}/${BOOK_SLUGS.length}] ${meta?.name || slug}... `);
    try {
      const book = await fetchBook(slug, meta);
      bible.push(book);
      console.log(`✓ ${book.chapters.length} chương`);
    } catch (err) {
      console.log(`✗ ${err.message}`);
      throw err;
    }
  }

  fs.writeFileSync(OUT, JSON.stringify(bible), 'utf8');
  const sizeMb = (fs.statSync(OUT).size / 1024 / 1024).toFixed(2);
  console.log(`\nĐã lưu ${OUT} (${sizeMb} MB)`);

  const gal = bible[47];
  const ch5 = gal.chapters[4];
  console.log('Kiểm tra Ga-la-ti 5:21:', ch5[20]?.slice(0, 80));
  console.log('Kiểm tra Ga-la-ti 5:22:', ch5[21]?.slice(0, 80));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
