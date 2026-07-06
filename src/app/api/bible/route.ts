import { NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';

const VERSION_MAP: Record<string, { file: string, label: string }> = {
  'VIE1925': { file: 'bible_vie1925.json', label: 'Kinh Thánh Tiếng Việt Bản Truyền Thống Hiệu Đính (VIE1925)' },
  'NVB': { file: 'bible_nvb.json', label: 'Bản Dịch Mới (NVB)' },
  'NKJV': { file: 'bible_nkjv.json', label: 'New King James Version (NKJV)' },
};

const cachedBibles: Record<string, unknown[]> = {};

async function loadBibleData(version: string) {
  // Always try to load the actual version file fresh (no stale fallback cache)
  const versionInfo = VERSION_MAP[version] || VERSION_MAP['VIE1925'];
  const dataPath = path.join(process.cwd(), 'public', versionInfo.file);

  let filePath: string;
  let isExactFile = false;

  try {
    await fs.access(dataPath);
    filePath = dataPath;
    isExactFile = true;

    // If we have it cached AND it was the correct file, return cached
    if (cachedBibles[version]) return cachedBibles[version];
  } catch {
    // File doesn't exist — clear any stale cache for this version
    delete cachedBibles[version];

    // Fallback to VIE1925 or bible_vie.json
    try {
      filePath = path.join(process.cwd(), 'public', 'bible_vie1925.json');
      await fs.access(filePath);
    } catch {
      filePath = path.join(process.cwd(), 'public', 'bible_vie.json');
    }
  }

  try {
    let fileContent = await fs.readFile(filePath, 'utf-8');
    if (fileContent.charCodeAt(0) === 0xfeff) {
      fileContent = fileContent.slice(1);
    }

    const parsed = JSON.parse(fileContent) as unknown[];

    // Only cache if we loaded the exact file for this version
    if (isExactFile) {
      cachedBibles[version] = parsed;
    }

    return parsed;
  } catch (e) {
    throw new Error(`Failed to load bible data for version ${version}: ${e}`);
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const bookParam = searchParams.get('book') || '1';
  const chapterParam = searchParams.get('chapter') || '1';
  let versionParam = searchParams.get('version');
  
  if (!versionParam || !VERSION_MAP[versionParam]) {
    versionParam = 'VIE1925';
  }

  const versionInfo = VERSION_MAP[versionParam];

  try {
    const bookIndex = parseInt(bookParam, 10) - 1;
    const chapterIndex = parseInt(chapterParam, 10) - 1;

    if (isNaN(bookIndex) || isNaN(chapterIndex) || bookIndex < 0 || chapterIndex < 0) {
      return NextResponse.json({ error: 'Invalid book or chapter' }, { status: 400 });
    }

    const bibleData = await loadBibleData(versionParam);

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
      version: versionParam,
      versionLabel: versionInfo.label,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error in bible API proxy:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
