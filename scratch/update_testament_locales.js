const fs = require('fs');
const path = require('path');

const viPath = path.join(__dirname, '../src/locales/vi.json');
const enPath = path.join(__dirname, '../src/locales/en.json');
const koPath = path.join(__dirname, '../src/locales/ko.json');

const vi = JSON.parse(fs.readFileSync(viPath, 'utf8'));
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const ko = JSON.parse(fs.readFileSync(koPath, 'utf8'));

vi.page_bible.old_testament = "C?U U?C";
vi.page_bible.new_testament = "TÂN U?C";
vi.page_bible.chapter_label = "Chuong";

en.page_bible.old_testament = "OLD TESTAMENT";
en.page_bible.new_testament = "NEW TESTAMENT";
en.page_bible.chapter_label = "Chapter";

ko.page_bible.old_testament = "?? ??";
ko.page_bible.new_testament = "?? ??";
ko.page_bible.chapter_label = "?";

fs.writeFileSync(viPath, JSON.stringify(vi, null, 2) + '\n');
fs.writeFileSync(enPath, JSON.stringify(en, null, 2) + '\n');
fs.writeFileSync(koPath, JSON.stringify(ko, null, 2) + '\n');

console.log("Testament locales updated!");
