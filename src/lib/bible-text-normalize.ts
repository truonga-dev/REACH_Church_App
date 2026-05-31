/** Chuẩn hóa bản 1934 (getBible) sang VIE1925 / Bản Hiệu Đính 1925 */

const PHRASE_REPLACEMENTS: [string, string][] = [
  ['ganh gổ', 'ganh tị'],
  ['mê ăn uống', 'chè chén'],
  ['cùng các sự khác giống như vậy', 'và những việc tương tự khác'],
  [
    'Tôi nói trước cho anh em, như tôi đã nói rồi: hễ ai phạm những việc thể ấy thì không được hưởng nước Ðức Chúa Trời',
    'Tôi cảnh cáo anh em, như tôi đã từng cảnh cáo: Những ai làm các việc như thế sẽ không được hưởng vương quốc Đức Chúa Trời',
  ],
  [
    'Nhưng trái của Thánh Linh, ấy là lòng yêu thương, sự vui mừng',
    'Nhưng trái của Thánh Linh là: Yêu thương, vui mừng',
  ],
  ['nhơn từ', 'nhân từ'],
  ['mềm mại', 'khiêm nhu'],
  [', tiết độ:', ', tiết độ.'],
  ['nước Ðức Chúa Trời', 'vương quốc Đức Chúa Trời'],
  ['nước Đức Chúa Trời', 'vương quốc Đức Chúa Trời'],
  ['Ð', 'Đ'],
];

export function normalizeVerseToVie2010(text: string): string {
  let result = text;
  for (const [from, to] of PHRASE_REPLACEMENTS) {
    result = result.split(from).join(to);
  }
  return result.replace(/\s+/g, ' ').trim();
}
