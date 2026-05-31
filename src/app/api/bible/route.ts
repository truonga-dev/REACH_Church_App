import { NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';

const VERSION = 'VIE1925';
const VERSION_LABEL = 'Kinh Thánh Tiếng Việt Bản Truyền Thống Hiệu Đính (VIE1925)';

let cachedBible: unknown[] | null = null;

async function loadBibleData() {
  if (cachedBible) return cachedBible;

  const vie1925Path = path.join(process.cwd(), 'public', 'bible_vie1925.json');
  let filePath = vie1925Path;

  try {
    await fs.access(vie1925Path);
  } catch {
    filePath = path.join(process.cwd(), 'public', 'bible_vie.json');
  }

  let fileContent = await fs.readFile(filePath, 'utf-8');
  if (fileContent.charCodeAt(0) === 0xfeff) {
    fileContent = fileContent.slice(1);
  }

  cachedBible = JSON.parse(fileContent) as unknown[];
  return cachedBible;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const bookParam = searchParams.get('book') || '1';
  const chapterParam = searchParams.get('chapter') || '1';

  try {
    const bookIndex = parseInt(bookParam, 10) - 1;
    const chapterIndex = parseInt(chapterParam, 10) - 1;

    if (isNaN(bookIndex) || isNaN(chapterIndex) || bookIndex < 0 || chapterIndex < 0) {
      return NextResponse.json({ error: 'Invalid book or chapter' }, { status: 400 });
    }

    const bibleData = await loadBibleData();

    if (bookIndex >= bibleData.length) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    const bookData = bibleData[bookIndex] as { chapters: string[][] };
    if (chapterIndex >= bookData.chapters.length) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }

    const versesArray = bookData.chapters[chapterIndex];
    const formattedVerses = versesArray.map((verseText: string, idx: number) => ({
      verse: idx + 1,
      text: verseText,
    }));

    return NextResponse.json({
      verses: formattedVerses,
      version: VERSION,
      versionLabel: VERSION_LABEL,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error in bible API proxy:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
