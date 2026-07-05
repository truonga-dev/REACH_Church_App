import { NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';

let cachedMetadata: unknown = null;

export async function GET() {
  if (cachedMetadata) {
    return NextResponse.json(cachedMetadata);
  }

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

  const bibleData = JSON.parse(fileContent);
  
  const metadata = bibleData.map((book: { name?: string; chapters: unknown[][] }, idx: number) => ({
    bookIndex: idx + 1,
    name: book.name || `Book ${idx + 1}`,
    chapterCount: book.chapters.length,
    chapters: book.chapters.map((ch: unknown[]) => ch.length) // verses count per chapter
  }));

  cachedMetadata = metadata;
  return NextResponse.json(metadata);
}
