import { NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';

const VERSION_MAP: Record<string, { file: string, label: string }> = {
  'VIE1925': { file: 'bible_vie1925.json', label: 'Kinh Thánh Tiếng Việt Bản Truyền Thống Hiệu Đính (VIE1925)' },
  'NVB': { file: 'bible_nvb.json', label: 'Bản Dịch Mới (NVB)' },
  'NKJV': { file: 'bible_nkjv.json', label: 'New King James Version (NKJV)' },
};

const cachedMetadata: Record<string, unknown> = {};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  let versionParam = searchParams.get('version');
  
  if (!versionParam || !VERSION_MAP[versionParam]) {
    versionParam = 'VIE1925';
  }

  const versionInfo = VERSION_MAP[versionParam];
  const dataPath = path.join(process.cwd(), 'public', versionInfo.file);
  let filePath: string;
  let isExactFile = false;

  try {
    await fs.access(dataPath);
    filePath = dataPath;
    isExactFile = true;

    // Only return cache if we previously loaded the exact file
    if (cachedMetadata[versionParam]) {
      return NextResponse.json(cachedMetadata[versionParam]);
    }
  } catch {
    // File doesn't exist — clear any stale cache
    delete cachedMetadata[versionParam];

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

    const bibleData = JSON.parse(fileContent);
    
    const metadata = bibleData.map((book: { name?: string; chapters: unknown[][] }, idx: number) => ({
      bookIndex: idx + 1,
      name: book.name || `Book ${idx + 1}`,
      chapterCount: book.chapters.length,
      chapters: book.chapters.map((ch: unknown[]) => ch.length) // verses count per chapter
    }));

    // Only cache if we loaded the exact file for this version
    if (isExactFile) {
      cachedMetadata[versionParam] = metadata;
    }
    return NextResponse.json(metadata);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('Error reading metadata:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
