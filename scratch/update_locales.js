const fs = require('fs');
const path = require('path');

const viPath = path.join(__dirname, '../src/locales/vi.json');
const enPath = path.join(__dirname, '../src/locales/en.json');
const koPath = path.join(__dirname, '../src/locales/ko.json');

const vi = JSON.parse(fs.readFileSync(viPath, 'utf8'));
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const ko = JSON.parse(fs.readFileSync(koPath, 'utf8'));

const newKeys = {
  settings_usage: {
    home_title: "Trang ch?",
    home_desc: "Xem tin t?c m?i nh?t, s? ki?n s?p di?n ra và thông báo t? h?i thánh theo th?i gian th?c.",
    home_tip1: "Nh?n vào bài vi?t d? d?c d?y d?",
    home_tip2: "Chia s? n?i dung qua m?ng xã h?i",
    bible_title: "Kinh Thánh",
    bible_desc: "Ð?c và theo dõi ti?n d? Kinh Thánh. Ðánh d?u chuong dã d?c, ghi chú câu yêu thích.",
    bible_tip1: "Vu?t trái/ph?i d? chuy?n chuong",
    bible_tip2: "L?ch d?c hi?n th? trên trang H? so",
    library_title: "Thu vi?n",
    library_desc: "Kho tài nguyên d?c tin: bài gi?ng audio/video, sách nói, tài li?u PDF và du?ng linh hàng ngày.",
    library_tip1: "L?c theo th? lo?i d? tìm nhanh",
    library_tip2: "T?i v? d? nghe offline",
    prayer_title: "C?u nguy?n",
    prayer_desc: "G?i d? m?c c?u nguy?n cá nhân ho?c chia s? v?i c?ng d?ng. Cùng nhau nâng d? nhau trong d?c tin.",
    prayer_tip1: "Ð? m?c riêng tu ch? mình b?n th?y",
    prayer_tip2: "Nh?n ?? d? c?u nguy?n cho ngu?i khác",
    profile_title: "H? so & Cài d?t",
    profile_desc: "Cá nhân hóa tài kho?n, xem th?ng kê d?c tin, qu?n lý bài gi?ng dã luu và thi?t l?p app.",
    profile_tip1: "Ch?nh s?a tên b?ng cách nh?n bi?u tu?ng bút chì",
    profile_tip2: "Huy hi?u c?p d? d?a trên ngày d?c KT"
  },
  settings_privacy: {
    title_security: "Cam k?t b?o m?t",
    desc_security: "R.E.A.C.H Church Vietnam tôn tr?ng và b?o v? quy?n riêng tu c?a b?n.",
    acct_title: "B?o m?t tài kho?n",
    acct_desc: "Email và m?t kh?u du?c mã hóa b?ng Supabase Auth. Chúng tôi không luu m?t kh?u du?i d?ng van b?n.",
    display_title: "D? li?u hi?n th?",
    display_desc: "Ch? tên và ?nh d?i di?n hi?n th? công khai. Ð? m?c c?u nguy?n riêng tu hoàn toàn ?n kh?i ngu?i khác.",
    device_title: "D? li?u thi?t b?",
    device_desc: "Ti?n d? d?c Kinh Thánh luu c?c b? trên thi?t b?. Xóa cache app s? xóa d? li?u này.",
    sell_title: "Không bán d? li?u",
    sell_desc: "R.E.A.C.H Church Vietnam cam k?t không chia s? hay bán thông tin cá nhân cho bên th? ba.",
    danger_zone: "Vùng nguy hi?m",
    danger_desc: "N?u mu?n xóa tài kho?n và toàn b? d? li?u, hãy liên h? h?i thánh d? du?c h? tr?.",
    danger_btn: "Liên h? xóa tài kho?n"
  },
  settings_feedback: {
    hero_title: "Góp ý & H? tr?",
    hero_desc: "Ph?n h?i c?a b?n giúp chúng tôi c?i thi?n REACH App m?i ngày.",
    cat_label: "Lo?i ph?n h?i",
    cat_bug: "?? Báo l?i",
    cat_bug_desc: "App b? crash, tính nang không ho?t d?ng",
    cat_feature: "?? Ð? xu?t tính nang",
    cat_feature_desc: "Ý tu?ng c?i thi?n app",
    cat_content: "?? N?i dung",
    cat_content_desc: "Ph?n h?i v? bài gi?ng, bài vi?t",
    cat_other: "?? Khác",
    cat_other_desc: "Góp ý chung",
    content_label: "N?i dung",
    content_placeholder: "Mô t? chi ti?t d? chúng tôi có th? h? tr? t?t nh?t...",
    btn_send: "G?i ph?n h?i",
    info_email: "Ph?n h?i s? g?i t?i reachchurch.vn@gmail.com. Ph?n h?i trong 1–3 ngày làm vi?c.",
    success_title: "C?m on b?n! ??",
    success_desc: "Góp ý dã du?c chuy?n d?n ?ng d?ng email. Chúng tôi s? xem xét và ph?n h?i s?m nh?t có th?.",
    btn_send_another: "G?i ph?n h?i khác"
  },
  settings_payment: {
    hero_title: "Dâng Hi?n Tr?c Tuy?n",
    hero_quote: "\"M?i ngu?i nên tùy theo lòng mình dã d?nh mà quyên ra, không ph?i phàn nàn hay mi?n cu?ng.\"",
    hero_verse: "— 2 Cô-rinh-tô 9:7",
    bank_name: "Vietcombank",
    bank_sub: "Ngân hàng TMCP Ngo?i thuong VN",
    acc_number: "S? tài kho?n",
    acc_holder: "Ch? tài kho?n",
    acc_name: "H?I THÁNH REACH VIETNAM",
    content_label: "N?i dung CK",
    content_note: "DANGHIEN [H? tên]",
    btn_ewallet: "Dâng hi?n qua MoMo / VNPay",
    info_secure: "Giao d?ch du?c b?o m?t và xác nh?n b?i Ban Tài chính h?i thánh.",
    copied: "Ðã sao chép",
    copy: "Sao chép"
  },
  settings_guide: {
    title: "Hu?ng d?n s? d?ng",
    desc: "Khám phá d?y d? tính nang c?a REACH Church App",
    info_contact: "C?n h? tr? thêm? Liên h? h?i thánh ho?c dùng ch?c nang Góp ý."
  }
};

const enKeys = {
  settings_usage: {
    home_title: "Home",
    home_desc: "View the latest news, upcoming events, and church announcements in real time.",
    home_tip1: "Tap on articles to read in full",
    home_tip2: "Share content via social media",
    bible_title: "Bible",
    bible_desc: "Read and track Bible progress. Bookmark chapters, highlight favorite verses.",
    bible_tip1: "Swipe left/right to change chapters",
    bible_tip2: "Reading plan displayed on Profile page",
    library_title: "Library",
    library_desc: "Faith resources: audio/video sermons, audiobooks, PDFs, and daily devotionals.",
    library_tip1: "Filter by category to find quickly",
    library_tip2: "Download to listen offline",
    prayer_title: "Prayer",
    prayer_desc: "Send personal prayer requests or share with the community. Lift each other up in faith.",
    prayer_tip1: "Private requests only visible to you",
    prayer_tip2: "Tap ?? to pray for others",
    profile_title: "Profile & Settings",
    profile_desc: "Personalize account, view faith stats, manage saved sermons, and configure app.",
    profile_tip1: "Edit name by tapping the pencil icon",
    profile_tip2: "Level badges based on Bible reading streak"
  },
  settings_privacy: {
    title_security: "Privacy Commitment",
    desc_security: "R.E.A.C.H Church Vietnam respects and protects your privacy.",
    acct_title: "Account Security",
    acct_desc: "Email and password are encrypted by Supabase Auth. We do not store plain-text passwords.",
    display_title: "Display Data",
    display_desc: "Only name and avatar are public. Private prayer requests are completely hidden from others.",
    device_title: "Device Data",
    device_desc: "Bible reading progress is stored locally on the device. Clearing app cache clears this data.",
    sell_title: "No Data Selling",
    sell_desc: "R.E.A.C.H Church Vietnam is committed to not sharing or selling personal info to third parties.",
    danger_zone: "Danger Zone",
    danger_desc: "To delete your account and all data, contact the church for support.",
    danger_btn: "Contact to delete account"
  },
  settings_feedback: {
    hero_title: "Feedback & Support",
    hero_desc: "Your feedback helps us improve the REACH App every day.",
    cat_label: "Feedback Type",
    cat_bug: "?? Report Bug",
    cat_bug_desc: "App crash, feature not working",
    cat_feature: "?? Feature Request",
    cat_feature_desc: "Idea to improve the app",
    cat_content: "?? Content",
    cat_content_desc: "Feedback on sermons, articles",
    cat_other: "?? Other",
    cat_other_desc: "General suggestions",
    content_label: "Content",
    content_placeholder: "Provide details so we can assist you better...",
    btn_send: "Send Feedback",
    info_email: "Feedback will be sent to reachchurch.vn@gmail.com. Expect reply in 1-3 business days.",
    success_title: "Thank you! ??",
    success_desc: "Feedback sent to email app. We will review and respond as soon as possible.",
    btn_send_another: "Send another feedback"
  },
  settings_payment: {
    hero_title: "Online Giving",
    hero_quote: "\"Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion.\"",
    hero_verse: "— 2 Corinthians 9:7",
    bank_name: "Vietcombank",
    bank_sub: "Joint Stock Commercial Bank for Foreign Trade of VN",
    acc_number: "Account Number",
    acc_holder: "Account Holder",
    acc_name: "HOI THANH REACH VIETNAM",
    content_label: "Transfer Note",
    content_note: "DANGHIEN [Full Name]",
    btn_ewallet: "Give via MoMo / VNPay",
    info_secure: "Transactions are secured and verified by the church Finance team.",
    copied: "Copied",
    copy: "Copy"
  },
  settings_guide: {
    title: "User Guide",
    desc: "Discover all features of REACH Church App",
    info_contact: "Need more help? Contact the church or use Feedback."
  }
};

const koKeys = {
  settings_usage: {
    home_title: "?",
    home_desc: "??? ?? ??, ???? ?? ? ????? ????? ?????.",
    home_tip1: "??? ??? ?? ??",
    home_tip2: "?? ???? ?? ??? ??",
    bible_title: "??",
    bible_desc: "?? ?? ??? ?? ?????. ?? ?? ????? ???? ??? ?????.",
    bible_tip1: "??/????? ?????? ? ??",
    bible_tip2: "??? ???? ???? ?? ??",
    library_title: "???",
    library_desc: "?? ??: ???/??? ??, ????, PDF ? ??? ??.",
    library_tip1: "?????? ????? ??? ??",
    library_tip2: "?????? ?? ?? ????",
    prayer_title: "??",
    prayer_desc: "?? ?? ??? ???? ????? ?????. ?? ??? ?? ?????.",
    prayer_tip1: "???? ??? ??? ??",
    prayer_tip2: "?? ??? ?? ????? ?? ?",
    profile_title: "??? ? ??",
    profile_desc: "??? ?????, ?? ??? ????, ??? ??? ????, ?? ?????.",
    profile_tip1: "?? ???? ??? ?? ??",
    profile_tip2: "?? ?? ?? ??? ?? ?? ??"
  },
  settings_privacy: {
    title_security: "?? ?? ?? ??",
    desc_security: "R.E.A.C.H Church Vietnam? ??? ?? ??? ???? ?????.",
    acct_title: "?? ??",
    acct_desc: "???? ????? Supabase Auth? ??????. ?? ??? ????? ???? ????.",
    display_title: "??? ??",
    display_desc: "??? ???? ?????. ??? ?? ??? ?? ???? ??? ?????.",
    device_title: "?? ???",
    device_desc: "?? ?? ?? ??? ??? ??? ?????. ? ??? ??? ? ???? ?????.",
    sell_title: "??? ?? ??",
    sell_desc: "R.E.A.C.H Church Vietnam? ?? ??? ?3?? ????? ???? ?? ?? ?????.",
    danger_zone: "?? ??",
    danger_desc: "?? ? ?? ???? ????? ??? ??? ?????.",
    danger_btn: "?? ?? ??"
  },
  settings_feedback: {
    hero_title: "??? ? ??",
    hero_desc: "???? ???? REACH ?? ?? ???? ? ??? ???.",
    cat_label: "??? ??",
    cat_bug: "?? ?? ??",
    cat_bug_desc: "? ??, ?? ?? ? ?",
    cat_feature: "?? ?? ??",
    cat_feature_desc: "? ?? ????",
    cat_content: "?? ???",
    cat_content_desc: "??, ??? ?? ???",
    cat_other: "?? ??",
    cat_other_desc: "?? ??",
    content_label: "???",
    content_placeholder: "? ?? ??? ?? ?? ??? ?????...",
    btn_send: "??? ???",
    info_email: "???? reachchurch.vn@gmail.com?? ?????. ??? ?? 1~3? ?? ??? ????.",
    success_title: "?????! ??",
    success_desc: "??? ??? ???? ???????. ??? ?? ???? ??? ??????.",
    btn_send_another: "?? ??? ???"
  },
  settings_payment: {
    hero_title: "??? ??",
    hero_quote: "\"?? ? ??? ?? ?? ? ??? ?????? ??? ?? ???...\"",
    hero_verse: "— ????? 9:7",
    bank_name: "Vietcombank",
    bank_sub: "??? ?? ?? ?? ?? ??",
    acc_number: "?? ??",
    acc_holder: "???",
    acc_name: "HOI THANH REACH VIETNAM",
    content_label: "?? ??",
    content_note: "DANGHIEN [??]",
    btn_ewallet: "MoMo / VNPay? ?? ??",
    info_secure: "?? ??? ?? ????? ???? ???? ?????.",
    copied: "???",
    copy: "??"
  },
  settings_guide: {
    title: "??? ???",
    desc: "REACH Church ?? ?? ?? ????",
    info_contact: "? ?? ??? ??????? ??? ????? ???? ?????."
  }
};

Object.assign(vi, newKeys);
Object.assign(en, enKeys);
Object.assign(ko, koKeys);

fs.writeFileSync(viPath, JSON.stringify(vi, null, 2) + '\n');
fs.writeFileSync(enPath, JSON.stringify(en, null, 2) + '\n');
fs.writeFileSync(koPath, JSON.stringify(ko, null, 2) + '\n');

console.log("Locales updated!");
