import { NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';

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

    // Đọc file JSON Kinh Thánh tĩnh (vì API getbible.net đã bị lỗi Cloudflare)
    const filePath = path.join(process.cwd(), 'public', 'bible_vie.json');
    let fileContent = await fs.readFile(filePath, 'utf-8');
    // Strip UTF-8 BOM if present
    if (fileContent.charCodeAt(0) === 0xFEFF) {
      fileContent = fileContent.slice(1);
    }
    const bibleData = JSON.parse(fileContent);

    if (bookIndex >= bibleData.length) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    const bookData = bibleData[bookIndex];
    if (chapterIndex >= bookData.chapters.length) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }

    const versesArray = bookData.chapters[chapterIndex];
    
    // Format lại dữ liệu cho dễ dùng ở frontend
    const formattedVerses = versesArray.map((verseText: string, idx: number) => ({
      verse: idx + 1,
      text: verseText
    }));

    return NextResponse.json({ verses: formattedVerses });
  } catch (error: any) {
    console.error('Error in bible API proxy:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
