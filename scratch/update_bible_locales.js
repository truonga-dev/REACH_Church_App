const fs = require('fs');
const path = require('path');

const viPath = path.join(__dirname, '../src/locales/vi.json');
const enPath = path.join(__dirname, '../src/locales/en.json');
const koPath = path.join(__dirname, '../src/locales/ko.json');

const vi = JSON.parse(fs.readFileSync(viPath, 'utf8'));
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const ko = JSON.parse(fs.readFileSync(koPath, 'utf8'));

vi.page_bible = {
  version_label: "Kinh Thánh Ti?ng Vi?t B?n Truy?n Th?ng Hi?u Ðính (VIE1925)",
  loading: "Ðang t?i Kinh Thánh...",
  share_title: "Chia s? do?n Kinh Thánh",
  read_title: "Ð?C KINH THÁNH",
  select_book: "Ch?n sách",
  select_chapter: "Ch?n chuong",
  share: "Chia s?",
  highlight: "Ðánh d?u",
  copy: "Sao chép",
  copied: "Ðã sao chép!"
};

en.page_bible = {
  version_label: "Vietnamese Revised Version (VIE1925)",
  loading: "Loading Bible...",
  share_title: "Share Bible verses",
  read_title: "READ BIBLE",
  select_book: "Select book",
  select_chapter: "Select chapter",
  share: "Share",
  highlight: "Highlight",
  copy: "Copy",
  copied: "Copied!"
};

ko.page_bible = {
  version_label: "???? ?? ??? (VIE1925)",
  loading: "?? ???? ?...",
  share_title: "?? ?? ??",
  read_title: "?? ??",
  select_book: "? ??",
  select_chapter: "? ??",
  share: "??",
  highlight: "??",
  copy: "??",
  copied: "???!"
};

fs.writeFileSync(viPath, JSON.stringify(vi, null, 2) + '\n');
fs.writeFileSync(enPath, JSON.stringify(en, null, 2) + '\n');
fs.writeFileSync(koPath, JSON.stringify(ko, null, 2) + '\n');

console.log("Bible locales updated!");
