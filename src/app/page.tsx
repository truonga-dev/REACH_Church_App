'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Calendar, PlayCircle, BookOpen, Heart, Flame,
  Newspaper, ChevronRight, Bell, Sun, Music,
  ArrowRight, FileText, X, Search, Loader2, Tv2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getYoutubeId, getYoutubeThumbnailUrl } from '@/lib/youtube';
import { htmlExcerpt, parseCategories } from '@/lib/html-utils';
import { POST_CONTENT_TYPES } from '@/lib/post-categories';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import './page.css';

const tagColors: Record<string, string> = {
  'Bản tin': '#48BCE1', 'Thông báo': '#F4CC30', 'Sự kiện': '#F12D5C',
  'Bài viết': '#a78bfa', 'Tin tức': '#34d399',
};

const DAILY_VERSES = [
  { text: 'Vì Ðức Chúa Trời yêu thương thế gian, đến nỗi đã ban Con một của Ngài, hầu cho hễ ai tin Con ấy không bị hư mất mà được sự sống đời đời.', ref: 'Giăng 3:16', book: 43, chapter: 3, verse: 16 },
  { text: 'Ðức Chúa Trời là nơi nương náu và sức lực của chúng tôi; Ngài là sự giúp đỡ rất sẵn trong lúc hoạn nạn.', ref: 'Thi Thiên 46:1', book: 19, chapter: 46, verse: 1 },
  { text: 'Hãy tin Đức Chúa Jêsus, thì ngươi và cả nhà ngươi sẽ được cứu rỗi.', ref: 'Công Vụ 16:31', book: 44, chapter: 16, verse: 31 },
  { text: 'Tôi làm được mọi sự nhờ Đấng ban thêm sức cho tôi.', ref: 'Phi-líp 4:13', book: 50, chapter: 4, verse: 13 },
  { text: 'Chúa là Đấng chăn giữ tôi: tôi sẽ chẳng thiếu thốn gì.', ref: 'Thi Thiên 23:1', book: 19, chapter: 23, verse: 1 },
  { text: 'Hãy phó thác đường lối mình cho Đức Giê-hô-va, và nhờ cậy nơi Ngài, thì Ngài sẽ làm thành việc đó.', ref: 'Thi Thiên 37:5', book: 19, chapter: 37, verse: 5 },
  { text: 'Đừng lo lắng chi hết, nhưng trong mọi sự hãy dùng lời cầu nguyện, nài xin, và sự tạ ơn mà trình các sự cầu xin của mình cho Đức Chúa Trời.', ref: 'Phi-líp 4:6', book: 50, chapter: 4, verse: 6 },
  { text: 'Hãy đến cùng ta, hỡi những kẻ mệt mỏi và gánh nặng, ta sẽ cho các ngươi được yên nghỉ.', ref: 'Ma-thi-ơ 11:28', book: 40, chapter: 11, verse: 28 },
  { text: 'Mọi sự đều có thể được cho kẻ nào tin.', ref: 'Mác 9:23', book: 41, chapter: 9, verse: 23 },
  { text: 'Đức Chúa Trời yêu thương chúng ta và sai Con Ngài làm của lễ chuộc tội lỗi chúng ta.', ref: '1 Giăng 4:10', book: 62, chapter: 4, verse: 10 },
  { text: 'Nhưng những kẻ trông đợi Đức Giê-hô-va thì được thêm sức mới; họ bay lên như chim phụng hoàng.', ref: 'Ê-sai 40:31', book: 23, chapter: 40, verse: 31 },
  { text: 'Hễ sự gì các ngươi làm, hãy làm hết sức mình như làm cho Chúa, chứ không phải làm cho người ta.', ref: 'Cô-lô-se 3:23', book: 51, chapter: 3, verse: 23 },
  { text: 'Đức Giê-hô-va là ánh sáng và là sự cứu rỗi của tôi; tôi sẽ sợ ai?', ref: 'Thi Thiên 27:1', book: 19, chapter: 27, verse: 1 },
  { text: 'Hãy vững lòng bền chí; chớ run sợ và chớ kinh hãi, vì Giê-hô-va Đức Chúa Trời ngươi ở cùng ngươi trong mọi nơi ngươi đi.', ref: 'Giô-suê 1:9', book: 6, chapter: 1, verse: 9 },
  { text: 'Đức Chúa Trời là sự sáng, trong Ngài chẳng có sự tối tăm nào hết.', ref: '1 Giăng 1:5', book: 62, chapter: 1, verse: 5 },
  { text: 'Vả, đức tin là sự biết chắc vững vàng của những điều mình đang trông mong, là bằng cớ của những điều mình chẳng xem thấy.', ref: 'Hê-bơ-rơ 11:1', book: 58, chapter: 11, verse: 1 },
  { text: 'Hãy yêu thương nhau như ta đã yêu thương các ngươi.', ref: 'Giăng 15:12', book: 43, chapter: 15, verse: 12 },
  { text: 'Nhưng hãy tìm kiếm trước nhất nước Đức Chúa Trời và sự công bình của Ngài, thì Ngài sẽ cho thêm các ngươi mọi điều ấy nữa.', ref: 'Ma-thi-ơ 6:33', book: 40, chapter: 6, verse: 33 },
  { text: 'Đức Chúa Trời đã chẳng ban cho chúng ta tâm thần nhút nhát, bèn là tâm thần mạnh mẽ, có tình thương yêu và dè giữ.', ref: '2 Ti-mô-thê 1:7', book: 55, chapter: 1, verse: 7 },
  { text: 'Khá cẩn thận, hãy tỉnh thức; vì ma quỉ, thù nghịch anh em, như sư tử rống, đi vòng quanh tìm kiếm người nào nó có thể nuốt được.', ref: '1 Phi-e-rơ 5:8', book: 60, chapter: 5, verse: 8 },
  { text: 'Thật vậy, ta biết những ý tưởng ta nghĩ đối cùng các ngươi... là ý tưởng bình an, không phải tai họa, để cho các ngươi được sự trông cậy trong lúc cuối cùng của mình.', ref: 'Giê-rê-mi 29:11', book: 24, chapter: 29, verse: 11 },
  { text: 'Ân điển của Đức Chúa Trời là nguồn cứu rỗi cho mọi người.', ref: 'Tít 2:11', book: 56, chapter: 2, verse: 11 },
  { text: 'Chúng ta yêu Ngài, vì Ngài đã yêu chúng ta trước.', ref: '1 Giăng 4:19', book: 62, chapter: 4, verse: 19 },
  { text: 'Hãy kính sợ Đức Giê-hô-va và tránh khỏi điều ác; điều đó sẽ là thuốc chữa bệnh cho thân thể ngươi, là sự bổ dưỡng cho xương cốt ngươi.', ref: 'Châm Ngôn 3:7-8', book: 20, chapter: 3, verse: 7 },
  { text: 'Song những ai tiếp nhận Ngài thì Ngài ban cho quyền phép trở nên con cái Đức Chúa Trời.', ref: 'Giăng 1:12', book: 43, chapter: 1, verse: 12 },
  { text: 'Hãy nhớ đến Đấng Tạo Hóa ngươi trong những ngày còn trẻ tuổi.', ref: 'Truyền Đạo 12:1', book: 21, chapter: 12, verse: 1 },
  { text: 'Đừng lấy điều ác thắng điều thiện, nhưng hãy lấy điều thiện thắng điều ác.', ref: 'Rô-ma 12:21', book: 45, chapter: 12, verse: 21 },
  { text: 'Chúa là thành tín; Ngài sẽ làm cho anh em vững lòng và gìn giữ khỏi điều ác.', ref: '2 Tê-sa-lô-ni-ca 3:3', book: 53, chapter: 3, verse: 3 },
  { text: 'Hãy suy ngẫm sách luật pháp này ngày và đêm, để cẩn thận làm theo mọi điều đã chép ở trong; vì như vậy ngươi mới được thịnh vượng trong con đường mình.', ref: 'Giô-suê 1:8', book: 6, chapter: 1, verse: 8 },
  { text: 'Đức Chúa Trời là Đấng yêu thương; ai ở trong sự yêu thương là ở trong Đức Chúa Trời, và Đức Chúa Trời ở trong người ấy.', ref: '1 Giăng 4:16', book: 62, chapter: 4, verse: 16 },
  { text: 'Bình an ta để lại cho các ngươi; bình an ta ban cho các ngươi.', ref: 'Giăng 14:27', book: 43, chapter: 14, verse: 27 },
];

function getDailyVerse() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / 86400000);
  return DAILY_VERSES[dayOfYear % DAILY_VERSES.length];
}

export default function Home() {
  const router = useRouter();
  const { t, getDbField } = useLanguage();
  const { profile, user } = useAuth();
  const [greeting, setGreeting] = useState('Chào mừng bạn đến với REACH 🙏');

  // Real Supabase data
  const [dbNews, setDbNews] = useState<any[]>([]);
  const [dbSermons, setDbSermons] = useState<any[]>([]);
  const [dbDevotionals, setDbDevotionals] = useState<any[]>([]);
  const [dbEvents, setDbEvents] = useState<any[]>([]);
  const [dbActiveLive, setDbActiveLive] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [prayerCount, setPrayerCount] = useState(0);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);

  // UI state
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [notifs, setNotifs] = useState<any[]>([]);
  const [playingSermon, setPlayingSermon] = useState<any>(null);
  const [toast, setToast] = useState('');
  const [selectedNews, setSelectedNews] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchModal, setShowSearchModal] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Chúc buổi sáng bình an ☀️');
    else if (hour < 18) setGreeting('Chúc buổi chiều tốt lành 🌤️');
    else setGreeting('Chúc buổi tối bình an 🌙');
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    try {
      const [newsRes, sermonsRes, prayerRes, eventsRes, devotionalsRes, liveRes] = await Promise.all([
        supabase.from('news')
          .select('*')
          .neq('status', 'draft')
          .not('type', 'in', '("Dưỡng linh","Dưỡng Linh","Sách Nói","Tài liệu")')
          .order('created_at', { ascending: false })
          .limit(6),
        supabase.from('sermons')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(3),
        supabase.from('prayers')
          .select('id', { count: 'exact' })
          .eq('status', 'ongoing'),
        supabase.from('events')
          .select('*')
          .gte('event_date', new Date().toISOString())
          .order('event_date', { ascending: true })
          .limit(4),
        supabase.from('devotionals')
          .select('*')
          .order('published_at', { ascending: false })
          .limit(2),
        supabase.from('livestreams')
          .select('*')
          .eq('is_live', true)
          .maybeSingle(),
      ]);

      if (newsRes.data) {
        setDbNews(newsRes.data);
        // Build notifications from latest content
        const dynamicNotifs = newsRes.data.slice(0, 5).map((n: any, i: number) => {
          let icon = '🔔';
          if (n.type?.includes('Dưỡng linh')) icon = '📖';
          else if (n.type === 'Sự kiện') icon = '🎉';
          else if (n.type === 'Sách Nói' || n.type === 'Tài liệu') icon = '📚';
          const date = new Date(n.created_at);
          return { id: n.id || i, icon, title: `${n.type}: ${getDbField(n, 'title')}`, time: date.toLocaleDateString('vi-VN'), read: false };
        });
        if (dynamicNotifs.length > 0) {
          const readIds = JSON.parse(typeof window !== 'undefined' ? localStorage.getItem('readNotifs') || '[]' : '[]');
          setNotifs(dynamicNotifs.map((nx: any) => ({ ...nx, read: readIds.includes(nx.id) })));
        }
      }
      if (sermonsRes.data) setDbSermons(sermonsRes.data);
      if (prayerRes.count !== null) setPrayerCount(prayerRes.count);
      if (eventsRes.data) setDbEvents(eventsRes.data);
      if (devotionalsRes.data) setDbDevotionals(devotionalsRes.data);
      if (liveRes?.data) setDbActiveLive(liveRes.data);

      const { data: authData } = await supabase.auth.getUser();
      if (authData.user) {
        const { data: streakData } = await supabase
          .from('user_streaks')
          .select('current_streak')
          .eq('user_id', authData.user.id)
          .single();
        if (streakData) setStreak(streakData.current_streak);
      }
    } catch (error: any) {
      console.error('Error fetching home data:', error);
      setFetchError(error?.message || error?.toString() || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const unreadCount = notifs.filter(n => !n.read).length;

  const markAllRead = () => {
    const newNotifs = notifs.map(n => ({ ...n, read: true }));
    setNotifs(newNotifs);
    localStorage.setItem('readNotifs', JSON.stringify(newNotifs.map(n => n.id)));
  };

  const handleNotifClick = (n: any) => {
    const newNotifs = notifs.map(x => x.id === n.id ? { ...x, read: true } : x);
    setNotifs(newNotifs);
    localStorage.setItem('readNotifs', JSON.stringify(newNotifs.filter(x => x.read).map(x => x.id)));
  };

  const handleSermonClick = (sermon: any) => {
    const source = sermon.youtube_url || sermon.youtube_id || sermon.video_url;
    const embedId = getYoutubeId(source);
    if (embedId) {
      setPlayingSermon({ ...sermon, youtube_url: source || `https://youtu.be/${embedId}` });
    } else {
      showToast('🎵 Bài giảng này chưa có video hợp lệ. Vui lòng liên hệ Admin!');
    }
  };

  // Bible search: detect patterns like "Giăng 3:16", "Ma-thi-ơ 5:3"
  const BIBLE_BOOKS: { names: string[]; id: number }[] = [
    { names: ['sáng thế ký','sáng thế','st','genesis','gen'], id: 1 },
    { names: ['xuất ê-díp-tô ký','xuất ê-díp-tô','xuất','exodus','exo'], id: 2 },
    { names: ['lê-vi ký','lê-vi','lêvi','leviticus','lev'], id: 3 },
    { names: ['dân số ký','dân số','numbers','num'], id: 4 },
    { names: ['phục truyền','phục-truyền','phục truyền luật lệ ký','deuteronomy','deut'], id: 5 },
    { names: ['giô-suê','giôsuê','giô suê','joshua','josh'], id: 6 },
    { names: ['các quan xét','thẩm phán','judges','judg'], id: 7 },
    { names: ['ru-tơ','ru tơ','ruth'], id: 8 },
    { names: ['1 sa-mu-ên','1 samuel','1sa'], id: 9 },
    { names: ['2 sa-mu-ên','2 samuel','2sa'], id: 10 },
    { names: ['1 các vua','1 vua','1kings','1ki'], id: 11 },
    { names: ['2 các vua','2 vua','2kings','2ki'], id: 12 },
    { names: ['1 sử ký','1 sử-ký','1chronicles','1ch'], id: 13 },
    { names: ['2 sử ký','2 sử-ký','2chronicles','2ch'], id: 14 },
    { names: ['ê-xơ-ra','êxơra','ezra'], id: 15 },
    { names: ['nê-hê-mi','nêhêmi','nehemiah','neh'], id: 16 },
    { names: ['ê-xơ-tê','êxơtê','esther','esth'], id: 17 },
    { names: ['gióp','job'], id: 18 },
    { names: ['thi thiên','thi-thiên','thithiên','psalms','ps','psalm'], id: 19 },
    { names: ['châm ngôn','châm-ngôn','proverbs','prov','pr'], id: 20 },
    { names: ['truyền đạo','truyền-đạo','ecclesiastes','eccl'], id: 21 },
    { names: ['nhã ca','nhã-ca','song of songs','song'], id: 22 },
    { names: ['ê-sai','êsai','isaiah','isa'], id: 23 },
    { names: ['giê-rê-mi','giêrêmi','jeremiah','jer'], id: 24 },
    { names: ['ca thương','ca-thương','lamentations','lam'], id: 25 },
    { names: ['ê-xê-chi-ên','êxêchiên','ezekiel','ezek'], id: 26 },
    { names: ['đa-ni-ên','đaniên','daniel','dan'], id: 27 },
    { names: ['ô-sê','ôsê','hosea','hos'], id: 28 },
    { names: ['giô-ên','giôên','joel'], id: 29 },
    { names: ['a-mốt','amốt','amos'], id: 30 },
    { names: ['áp-đia','ápđia','obadiah','ob','oba'], id: 31 },
    { names: ['giô-na','giôna','jonah','jon'], id: 32 },
    { names: ['mi-chê','michê','micah','mic'], id: 33 },
    { names: ['na-hum','nahum','nah'], id: 34 },
    { names: ['ha-ba-cúc','habacúc','habakkuk','hab'], id: 35 },
    { names: ['sô-phô-ni','sôphôni','zephaniah','zeph'], id: 36 },
    { names: ['a-gai','agai','haggai','hag'], id: 37 },
    { names: ['xa-cha-ri','xachari','zechariah','zech'], id: 38 },
    { names: ['ma-la-chi','malachi','mal'], id: 39 },
    { names: ['ma-thi-ơ','mathiơ','matthew','matt','mt'], id: 40 },
    { names: ['mác','mark','mk'], id: 41 },
    { names: ['lu-ca','luca','luke','lk'], id: 42 },
    { names: ['giăng','john','jn'], id: 43 },
    { names: ['công vụ','công-vụ','công vụ các sứ đồ','acts'], id: 44 },
    { names: ['rô-ma','rôma','romans','rom'], id: 45 },
    { names: ['1 cô-rinh-tô','1 côrintô','1corinthians','1cor'], id: 46 },
    { names: ['2 cô-rinh-tô','2 côrintô','2corinthians','2cor'], id: 47 },
    { names: ['ga-la-ti','galati','galatians','gal'], id: 48 },
    { names: ['ê-phê-sô','êphêsô','ephesians','eph'], id: 49 },
    { names: ['phi-líp','philíp','philippians','phil'], id: 50 },
    { names: ['cô-lô-se','côlôse','colossians','col'], id: 51 },
    { names: ['1 tê-sa-lô-ni-ca','1 têsalônica','1thessalonians','1thess'], id: 52 },
    { names: ['2 tê-sa-lô-ni-ca','2 têsalônica','2thessalonians','2thess'], id: 53 },
    { names: ['1 ti-mô-thê','1 timôthê','1timothy','1tim'], id: 54 },
    { names: ['2 ti-mô-thê','2 timôthê','2timothy','2tim'], id: 55 },
    { names: ['tít','titus'], id: 56 },
    { names: ['phi-lê-môn','philêmôn','philemon','phlm'], id: 57 },
    { names: ['hê-bơ-rơ','hêbơrơ','hebrews','heb'], id: 58 },
    { names: ['gia-cơ','giacơ','james','jas'], id: 59 },
    { names: ['1 phi-e-rơ','1 phierơ','1peter','1pet'], id: 60 },
    { names: ['2 phi-e-rơ','2 phierơ','2peter','2pet'], id: 61 },
    { names: ['1 giăng','1john','1jn'], id: 62 },
    { names: ['2 giăng','2john','2jn'], id: 63 },
    { names: ['3 giăng','3john','3jn'], id: 64 },
    { names: ['giu-đe','giuđe','jude'], id: 65 },
    { names: ['khải huyền','khải-huyền','revelation','rev'], id: 66 },
  ];

  const parseBibleQuery = (q: string): { bookId: number; bookName: string; chapter: number; verse?: number } | null => {
    // Match: "BookName chapter:verse" e.g. "Giăng 3:16" or "Giăng 3" or "John 3:16-18"
    const m = q.trim().match(/^(.+?)\s+(\d+)(?::(\d+)(?:-\d+)?)?$/i);
    if (!m) return null;
    const bookRaw = m[1].trim().toLowerCase()
      .replace(/[àáảãạăắặằẵẫâấậầẩẫđèéẻẽẹêếệềểễìíỉĩịòóỏõọôốộồổỗơớợờởỡùúủũụưứựừửữỳýỷỹỵ]/g, c => c) // keep diacritics as-is for matching
      ;
    const chapter = parseInt(m[2]);
    const verse = m[3] ? parseInt(m[3]) : undefined;
    const found = BIBLE_BOOKS.find(b => b.names.some(n => bookRaw.startsWith(n) || n.startsWith(bookRaw)));
    if (!found) return null;
    // Get the display name from the Bible page books array (1-indexed)
    const displayNames = [
      'Sáng-thế Ký','Xuất Ê-díp-tô Ký','Lê-vi Ký','Dân-số Ký','Phục-truyền Luật-lệ Ký',
      'Giô-suê','Các Quan Xét','Ru-tơ','1 Sa-mu-ên','2 Sa-mu-ên','1 Các Vua','2 Các Vua',
      '1 Sử-ký','2 Sử-ký','Ê-xơ-ra','Nê-hê-mi','Ê-xơ-tê','Gióp','Thi-thiên','Châm-ngôn',
      'Truyền-đạo','Nhã-ca','Ê-sai','Giê-rê-mi','Ca-thương','Ê-xê-chi-ên','Đa-ni-ên',
      'Ô-sê','Giô-ên','A-mốt','Áp-đia','Giô-na','Mi-chê','Na-hum','Ha-ba-cúc','Sô-phô-ni',
      'A-gai','Xa-cha-ri','Ma-la-chi','Ma-thi-ơ','Mác','Lu-ca','Giăng','Công-vụ các Sứ-đồ',
      'Rô-ma','1 Cô-rinh-tô','2 Cô-rinh-tô','Ga-la-ti','Ê-phê-sô','Phi-líp','Cô-lô-se',
      '1 Tê-sa-lô-ni-ca','2 Tê-sa-lô-ni-ca','1 Ti-mô-thê','2 Ti-mô-thê','Tít','Phi-lê-môn',
      'Hê-bơ-rơ','Gia-cơ','1 Phi-e-rơ','2 Phi-e-rơ','1 Giăng','2 Giăng','3 Giăng','Giu-đe','Khải-huyền',
    ];
    return { bookId: found.id, bookName: displayNames[found.id - 1] || m[1], chapter, verse };
  };

  const bibleSearch = searchQuery.length >= 2 ? parseBibleQuery(searchQuery) : null;

  // Search across all content
  const searchLower = searchQuery.toLowerCase();
  const searchResults = searchQuery.length >= 2 ? [
    ...dbNews.filter((n: any) =>
      getDbField(n, 'title').toLowerCase().includes(searchLower) ||
      (n.content || '')?.toLowerCase().includes(searchLower)
    ).map((n: any) => ({ ...n, _type: 'news' })),
    ...dbSermons.filter((s: any) =>
      getDbField(s, 'title').toLowerCase().includes(searchLower) ||
      (s.speaker || '')?.toLowerCase().includes(searchLower)
    ).map((s: any) => ({ ...s, _type: 'sermon' })),
    ...dbEvents.filter((ev: any) =>
      getDbField(ev, 'title').toLowerCase().includes(searchLower) ||
      (ev.location || '')?.toLowerCase().includes(searchLower)
    ).map((ev: any) => ({ ...ev, _type: 'event' })),
  ] : [];
  const getYoutubeEmbedId = getYoutubeId;

  return (
    <div className="home-container">
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: '#48BCE1', color: '#fff', padding: '10px 20px', borderRadius: '12px', zIndex: 9999, fontWeight: 'bold', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', whiteSpace: 'nowrap' }}>
          {toast}
        </div>
      )}

      {/* Sermon Video Modal */}
      {playingSermon && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9998, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ width: '100%', maxWidth: '560px', background: '#1a1d24', borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', alignItems: 'center' }}>
              <div>
                <p style={{ color: '#48BCE1', fontSize: '0.8rem', fontWeight: 'bold' }}>{playingSermon.series}</p>
                <h3 style={{ color: '#fff', fontSize: '1rem' }}>{getDbField(playingSermon, 'title')}</h3>
              </div>
              <button onClick={() => setPlayingSermon(null)} style={{ color: '#fff', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={18} />
              </button>
            </div>
            {getYoutubeEmbedId(playingSermon.youtube_url || playingSermon.youtube_id || playingSermon.video_url) ? (
              <iframe width="100%" height="280" src={`https://www.youtube.com/embed/${getYoutubeEmbedId(playingSermon.youtube_url || playingSermon.youtube_id || playingSermon.video_url)}?autoplay=1`} allow="autoplay; encrypted-media" allowFullScreen style={{ display: 'block', border: 'none' }} />
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>Không tìm thấy video.</div>
            )}
            {playingSermon.content && (
              <div className="rich-text-content" style={{ padding: '1rem 1.25rem', color: '#ccc', lineHeight: 1.6, fontSize: '0.95rem' }} dangerouslySetInnerHTML={{ __html: playingSermon.content }} />
            )}
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <header className="home-header">
        <button
          className="logo-container"
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}
          onClick={() => { router.push('/'); router.refresh(); }}
          aria-label="Về trang chủ"
        >
          <Image src="/logo.png" alt="R.E.A.C.H Church Logo" width={44} height={44} className="app-logo" />
          <div>
            <h1 className="logo-text">R.E.A.C.H Church</h1>
            <p className="greeting">{greeting}</p>
          </div>
        </button>
        <div className="header-actions">
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'linear-gradient(135deg, #ff7a00, #ff3366)', padding: '4px 10px', borderRadius: '20px', color: '#fff', fontSize: '0.85rem', fontWeight: 'bold' }}>
            <Flame size={16} /> {streak}
          </div>
          {/* Search Icon Button */}
          <button
            className="icon-btn"
            aria-label="Tìm kiếm"
            onClick={() => setShowSearchModal(true)}
          >
            <Search size={22} />
          </button>

          {/* Live Button */}
          <Link href="/live" className="icon-btn" aria-label="Trực tiếp" style={{ textDecoration: 'none', color: 'inherit' }}>
            <Tv2 size={22} />
          </Link>

          <div style={{ position: 'relative' }}>
            <button className="icon-btn" aria-label="Thông báo" onClick={() => setShowNotifPanel(!showNotifPanel)}>
              <Bell size={22} />
              {unreadCount > 0 && <span className="notif-dot" />}
            </button>
            {showNotifPanel && (
              <div style={{ position: 'absolute', top: '44px', right: 0, width: '300px', background: '#1a1d24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', zIndex: 1000, overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <span style={{ fontWeight: 'bold', color: '#fff' }}>Thông báo</span>
                  <button onClick={markAllRead} style={{ color: '#48BCE1', fontSize: '0.8rem', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}>Đọc tất cả</button>
                </div>
                {notifs.map((n: any) => (
                  <div key={n.id} style={{ display: 'flex', gap: '10px', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: n.read ? 'transparent' : 'rgba(72,188,225,0.06)', cursor: 'pointer' }}
                    onClick={() => handleNotifClick(n)}>
                    <span style={{ fontSize: '1.4rem' }}>{n.icon}</span>
                    <div>
                      <p style={{ color: '#fff', fontSize: '0.88rem', fontWeight: n.read ? 400 : 600 }}>{getDbField(n, 'title')}</p>
                      <p style={{ color: '#666', fontSize: '0.75rem' }}>{n.time}</p>
                    </div>
                    {!n.read && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#48BCE1', flexShrink: 0, marginLeft: 'auto', alignSelf: 'center' }} />}
                  </div>
                ))}
                <button onClick={() => setShowNotifPanel(false)} style={{ width: '100%', padding: '10px', color: '#888', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}>Đóng</button>
              </div>
            )}
          </div>
          <Link href="/profile" className="avatar-link" aria-label="Hồ sơ">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.2)' }} />
            ) : (
              <div className="header-avatar">{profile?.full_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'R'}</div>
            )}
          </Link>
        </div>
      </header>

      {/* ── Search Modal ── */}
      {showSearchModal && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
            zIndex: 9990, display: 'flex', flexDirection: 'column',
            alignItems: 'stretch', padding: '0',
          }}
          onClick={() => { setShowSearchModal(false); setSearchQuery(''); }}
        >
          <div
            style={{
              background: '#0f1520', borderBottom: '1px solid rgba(255,255,255,0.1)',
              padding: '1rem',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.6rem',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(72,188,225,0.4)',
              borderRadius: 14, padding: '0 1rem', height: 50,
              boxShadow: '0 0 0 3px rgba(72,188,225,0.1)',
            }}>
              <Search size={18} style={{ color: '#48BCE1', flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Tìm kiếm bài giảng, tin tức, sự kiện..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                autoFocus
                style={{
                  background: 'none', border: 'none', outline: 'none',
                  color: '#fff', fontSize: '0.95rem', width: '100%', fontFamily: 'inherit',
                }}
              />
              {searchQuery ? (
                <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7a8599', padding: 0, display: 'flex' }}>
                  <X size={17} />
                </button>
              ) : (
                <button onClick={() => { setShowSearchModal(false); setSearchQuery(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7a8599', padding: 0, fontSize: '0.82rem', fontWeight: 600, fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                  Hủy
                </button>
              )}
            </div>
          </div>

          {/* Results */}
          <div
            onClick={e => e.stopPropagation()}
            style={{ flex: 1, overflowY: 'auto', background: '#0f1520' }}
          >
            {searchQuery.length === 0 ? (
              <div style={{ padding: '2rem 1.25rem' }}>
                <p style={{ color: '#7a8599', fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1rem' }}>Gợi ý tìm kiếm</p>
                {['Bài giảng', 'Giăng 3:16', 'Ma-thi-ơ 5:3', 'Thờ phượng', 'Cầu nguyện'].map(hint => (
                  <button key={hint} onClick={() => setSearchQuery(hint)}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      padding: '0.7rem 0.85rem', background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10,
                      color: '#9ca3af', fontSize: '0.88rem', cursor: 'pointer',
                      marginBottom: '0.5rem', fontFamily: 'inherit',
                    }}
                  >
                    🔍 {hint}
                  </button>
                ))}
              </div>
            ) : bibleSearch || searchResults.length > 0 ? (
              <div style={{ padding: '0.75rem' }}>
                {/* Bible result */}
                {bibleSearch && (
                  <>
                    <p style={{ color: '#7a8599', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0.25rem 0.5rem', marginBottom: '0.25rem' }}>📖 Kinh Thánh</p>
                    <div
                      onClick={() => {
                        const url = `/bible?book=${bibleSearch.bookId}&chapter=${bibleSearch.chapter}${bibleSearch.verse ? `&verse=${bibleSearch.verse}` : ''}`;
                        router.push(url);
                        setShowSearchModal(false);
                        setSearchQuery('');
                      }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        padding: '0.75rem 0.85rem', cursor: 'pointer',
                        borderRadius: 12, marginBottom: '0.75rem',
                        background: 'rgba(72,188,225,0.08)',
                        border: '1px solid rgba(72,188,225,0.2)',
                      }}
                    >
                      <span style={{
                        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem',
                        background: 'rgba(72,188,225,0.18)',
                      }}>📖</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem', margin: 0 }}>
                          {bibleSearch.bookName} {bibleSearch.chapter}{bibleSearch.verse ? `:${bibleSearch.verse}` : ''}
                        </p>
                        <p style={{ color: '#48BCE1', fontSize: '0.76rem', margin: '2px 0 0', fontWeight: 600 }}>Mở trong Kinh Thánh →</p>
                      </div>
                      <ArrowRight size={15} style={{ color: '#48BCE1', flexShrink: 0 }} />
                    </div>
                  </>
                )}
                {/* Other results */}
                {searchResults.length > 0 && (
                  <>
                    <p style={{ color: '#7a8599', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0.25rem 0.5rem', marginBottom: '0.25rem' }}>
                      {searchResults.length} kết quả khác
                    </p>
                    {searchResults.map((result: any, idx: number) => (
                      <div
                        key={idx}
                        onClick={() => {
                          if (result._type === 'news') { setSelectedNews(result); setShowSearchModal(false); setSearchQuery(''); }
                          else if (result._type === 'sermon') { handleSermonClick(result); setShowSearchModal(false); setSearchQuery(''); }
                          else if (result._type === 'event') { setShowSearchModal(false); setSearchQuery(''); window.location.href = '/events'; }
                        }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.75rem',
                          padding: '0.75rem 0.85rem', cursor: 'pointer',
                          borderRadius: 12, marginBottom: '0.25rem',
                          transition: 'background 0.15s',
                          background: 'rgba(255,255,255,0.03)',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(72,188,225,0.08)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                      >
                        <span style={{
                          width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem',
                          background: result._type === 'sermon' ? 'rgba(72,188,225,0.12)'
                            : result._type === 'event' ? 'rgba(244,204,48,0.12)'
                            : 'rgba(241,45,92,0.12)',
                        }}>
                          {result._type === 'sermon' ? '🎵' : result._type === 'event' ? '📅' : '📰'}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {result.title}
                          </p>
                          <p style={{ color: '#7a8599', fontSize: '0.76rem', margin: '2px 0 0' }}>
                            {result._type === 'sermon' ? 'Bài giảng' : result._type === 'event' ? 'Sự kiện' : result.type || 'Tin tức'}
                          </p>
                        </div>
                        <ArrowRight size={15} style={{ color: '#48BCE1', flexShrink: 0 }} />
                      </div>
                    ))}
                  </>
                )}
              </div>
            ) : (
              <div style={{ padding: '3rem 1.25rem', textAlign: 'center' }}>
                <p style={{ color: '#fff', fontWeight: 700, marginBottom: '0.5rem' }}>Không tìm thấy kết quả</p>
                <p style={{ color: '#7a8599', fontSize: '0.85rem' }}>Thử tìm câu Kinh Thánh như &ldquo;Giăng 3:16&rdquo;</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Active Livestream Banner ── */}
      {dbActiveLive && (
        <Link href="/live" style={{ textDecoration: 'none' }}>
          <div style={{
            margin: '1rem 1.25rem 0',
            padding: '1rem',
            background: 'linear-gradient(135deg, #F12D5C, #ff5c77)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 8px 24px rgba(241, 45, 92, 0.3)',
            animation: 'pulse 2s infinite',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '40px', height: '40px', background: 'rgba(255,255,255,0.2)',
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <PlayCircle size={24} color="#fff" fill="#fff" />
              </div>
              <div>
                <p style={{ margin: 0, color: 'rgba(255,255,255,0.9)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Đang Phát Trực Tiếp
                </p>
                <h3 style={{ margin: 0, color: '#fff', fontSize: '1.05rem', fontWeight: 700 }}>
                  {getDbField(dbActiveLive, 'title') || 'Sự kiện Live'}
                </h3>
              </div>
            </div>
            <ArrowRight size={20} color="#fff" />
          </div>
        </Link>
      )}

      {/* ── Daily Verse ── */}
      {(() => {
        const verse = getDailyVerse();
        return (
          <Link href={`/bible?book=${verse.book}&chapter=${verse.chapter}&verse=${verse.verse}`} style={{ textDecoration: 'none' }}>
            <section className="verse-card" style={{ cursor: 'pointer' }}>
              <div className="verse-top">
                <BookOpen size={18} className="verse-icon" />
                <span className="verse-label">Câu Kinh Thánh hôm nay — Chạm để đọc</span>
              </div>
              <blockquote className="verse-text">
                &ldquo;{verse.text}&rdquo;
              </blockquote>
              <p className="verse-ref">— {verse.ref}</p>
            </section>
          </Link>
        );
      })()}

      {/* ── Daily Devotional ── */}
      <section className="section">
        <div className="section-header">
          <h2 className="section-title">
            <Sun size={18} style={{ marginRight: 6, color: '#F4CC30', verticalAlign: 'middle' }} />
            Dưỡng Linh Hằng Ngày
          </h2>
          <Link href="/library" className="see-all">Xem thêm <ArrowRight size={14} /></Link>
        </div>
        <div className="devotional-list">
          {loading ? (
            [0,1].map(i => <div key={i} className="devotional-card skeleton" style={{ height: 120, borderLeftColor: '#2a3044' }} />)
          ) : dbDevotionals.length > 0 ? dbDevotionals.map((d, i) => (
            <Link key={i} href={`/devotional?id=${d.id}&title=${encodeURIComponent(getDbField(d, 'title'))}&text=${encodeURIComponent(getDbField(d, 'content').slice(0, 200) || '')}`} style={{ textDecoration: 'none' }}>
              <div className="devotional-card" style={{ 
                  borderLeftColor: i === 0 ? '#48BCE1' : '#F4CC30', 
                  cursor: 'pointer',
                  backgroundImage: d.featured_image_url ? `linear-gradient(to right, rgba(26, 29, 36, 0.95) 30%, rgba(26, 29, 36, 0.7)), url(${d.featured_image_url})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center right'
                }}>
                <div className="dev-day-badge" style={{ backgroundColor: i === 0 ? '#48BCE1' : '#F4CC30' }}>Mới nhất</div>
                <h3 className="dev-title">{getDbField(d, 'title')}</h3>
                <p className="dev-text">&quot;{htmlExcerpt(d.content || '', 120)}&quot;</p>
                <div className="dev-footer">
                  <span className="dev-duration">5 phút đọc</span>
                  <span className="dev-read-btn">Đọc bài →</span>
                </div>
              </div>
            </Link>
          )) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
              <BookOpen size={32} style={{ marginBottom: '0.5rem', opacity: 0.4 }} />
              <p style={{ fontSize: '0.9rem' }}>Chưa có bài dưỡng linh</p>
            </div>
          )}
        </div>
      </section>

      {/* ── Featured Sermon ── */}
      <section className="section">
        <div className="section-header">
          <h2 className="section-title">
            <Music size={18} style={{ marginRight: 6, color: '#48BCE1', verticalAlign: 'middle' }} />
            Bài Giảng Mới Nhất
          </h2>
          <Link href="/library" className="see-all">Xem thêm <ArrowRight size={14} /></Link>
        </div>
        <div className="sermons-list">
          {loading ? (
            [0,1,2].map(i => <div key={i} className="sermon-item skeleton" style={{ height: 80 }} />)
          ) : dbSermons.length > 0 ? dbSermons.map(sermon => {
            const thumb = getYoutubeThumbnailUrl(sermon.youtube_url || sermon.youtube_id || sermon.video_url);
            return (
              <div key={sermon.id} className="sermon-item" onClick={() => handleSermonClick(sermon)} style={{ cursor: 'pointer' }}>
                <div className="sermon-thumb">
                  {thumb ? (
                     
                    <img src={thumb} alt="" className="sermon-thumb-image" />
                  ) : (
                    <PlayCircle size={30} className="play-icon" />
                  )}
                  {thumb && <PlayCircle size={22} className="play-icon play-icon-overlay" />}
                </div>
                <div className="sermon-info">
                  <span className="sermon-series">{sermon.series}</span>
                  <h3 className="sermon-title">{getDbField(sermon, 'title')}</h3>
                  <p className="sermon-meta">{sermon.speaker} • {sermon.created_at ? new Date(sermon.created_at).toLocaleDateString('vi-VN') : ''}</p>
                </div>
                <div style={{ paddingRight: '12px', color: '#48BCE1' }}>
                  <PlayCircle size={18} />
                </div>
              </div>
            );
          }) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
              <PlayCircle size={32} style={{ marginBottom: '0.5rem', opacity: 0.4 }} />
              <p style={{ fontSize: '0.9rem' }}>Chưa có bài giảng</p>
            </div>
          )}
        </div>
      </section>

      {/* Bản Tin & Thông Báo */}
      <section className="section">
        <div className="section-header">
          <h2 className="section-title"><Newspaper size={20} className="mr-xs text-primary" /> Bản tin & Thông báo</h2>
          <Link href="/news" className="see-all">Xem tất cả <ChevronRight size={14} /></Link>
        </div>
        {/* News Detail Modal */}
        {selectedNews && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9997, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}
            onClick={() => setSelectedNews(null)}>
            <div style={{ background: '#1a1d24', borderRadius: '24px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflow: 'auto', padding: '1.5rem' }}
              onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ padding: '4px 12px', borderRadius: '8px', background: '#48BCE122', color: '#48BCE1', fontWeight: 'bold', fontSize: '0.8rem' }}>{selectedNews.type || selectedNews.tag}</span>
                <button onClick={() => setSelectedNews(null)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16}/></button>
              </div>
              {selectedNews.image_url && <img src={selectedNews.image_url} alt="" style={{ width: '100%', borderRadius: '12px', marginBottom: '1rem', objectFit: 'cover', maxHeight: '220px' }} />}
              <h2 style={{ color: '#fff', marginBottom: '0.5rem', fontSize: '1.2rem', lineHeight: '1.4' }}>{getDbField(selectedNews, 'title')}</h2>
              <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '0.35rem' }}>{selectedNews.created_at ? new Date(selectedNews.created_at).toLocaleDateString('vi-VN') : selectedNews.date}</p>
              {selectedNews.author && <p style={{ color: '#ccc', fontSize: '0.85rem', marginBottom: '1rem' }}>Bởi {selectedNews.author}{selectedNews.location ? ` • ${selectedNews.location}` : ''}</p>}
              <div className="rich-text-content" style={{ color: '#ccc', lineHeight: '1.7', whiteSpace: 'normal', fontSize: '1rem', marginBottom: '1rem' }} dangerouslySetInnerHTML={{ __html: selectedNews.content || selectedNews.summary }}></div>
              {selectedNews.audio_url && <audio controls style={{ width: '100%', marginBottom: '1rem' }} src={selectedNews.audio_url} />}
              {selectedNews.pdf_url && (
                <a href={selectedNews.pdf_url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', background: '#F12D5C', color: '#fff', borderRadius: '12px', textDecoration: 'none', fontWeight: 'bold' }}>
                  <FileText size={18}/> Mở PDF đính kèm
                </a>
              )}
            </div>
          </div>
        )}

        <div className="bulletin-list">
          {loading ? (
            [0,1,2].map(i => <div key={i} className="bulletin-card skeleton" style={{ height: 140 }} />)
          ) : dbNews.length > 0 ? dbNews.map(item => {
            const cats = parseCategories(item.categories);
            const displayTag = cats[0] || item.type || item.tag;
            return (
            <div key={item.id} className="bulletin-card" onClick={() => setSelectedNews(item)} style={{ cursor: 'pointer' }}>
              {item.image_url && (
                <div className="bulletin-featured-image">
                  { }
                  <img src={item.image_url} alt={item.title} />
                </div>
              )}
              <div className="bulletin-top" style={item.image_url ? { marginTop: 0 } : {}}>
                <span className="bulletin-tag" style={{ backgroundColor: `${tagColors[displayTag] || '#48BCE1'}22`, color: tagColors[displayTag] || '#48BCE1' }}>
                  {displayTag}
                </span>
                <span className="bulletin-date">
                  {item.created_at ? new Date(item.created_at).toLocaleDateString('vi-VN') : ''}
                </span>
              </div>
              <h3 className="bulletin-title">{getDbField(item, 'title')}</h3>
              {item.author && <p className="bulletin-meta" style={{ marginBottom: '0.35rem' }}>Bởi {item.author} • {item.location || 'REACH Church'}</p>}
              <p className="bulletin-summary">{htmlExcerpt(item.content || '', 120)}</p>
              {item.audio_url && (
                <div style={{ marginTop: '12px' }} onClick={e => e.stopPropagation()}>
                  <audio controls style={{ width: '100%', height: '40px' }} src={item.audio_url}></audio>
                </div>
              )}
              <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <span style={{ flex: 1, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '8px', borderRadius: '8px', background: 'rgba(72,188,225,0.1)', color: '#48BCE1', fontSize: '0.9rem' }}>
                  Đọc thêm <ChevronRight size={14} />
                </span>
                {item.pdf_url && (
                  <a href={item.pdf_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ flex: 1, color: '#F12D5C', textDecoration: 'none', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '8px', borderRadius: '8px', background: 'rgba(241,45,92,0.08)' }}>
                    <FileText size={14} /> Xem PDF
                  </a>
                )}
              </div>
            </div>
          );}) : (
            <div style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
              <Newspaper size={36} style={{ marginBottom: '0.5rem', opacity: 0.4 }} />
              <p style={{ fontWeight: 600, color: '#94a3b8', marginBottom: '0.25rem' }}>Chưa có tin tức nào</p>
              <p style={{ fontSize: '0.82rem' }}>Hội thánh chưa đăng bản tin nào</p>
            </div>
          )}
        </div>
      </section>

      {/* ── Prayer Quick Access ── */}
      <Link href="/profile?tab=prayer" style={{ textDecoration: 'none' }}>
        <section className="prayer-banner" style={{ cursor: 'pointer' }}>
          <Heart size={28} className="prayer-banner-icon" />
          <div>
            <p className="prayer-banner-title">Đề mục cầu nguyện của bạn</p>
            <p className="prayer-banner-sub">
              {prayerCount > 0 ? `Bạn đang có ${prayerCount} đề mục đang cầu nguyện` : 'Chạm để thêm đề mục cầu nguyện mới'}
            </p>
          </div>
          <span className="prayer-banner-btn">Xem</span>
        </section>
      </Link>

      {/* ── Upcoming Events ── */}
      <section className="section">
        <div className="section-header">
          <h2 className="section-title">
            <Calendar size={18} style={{ marginRight: 6, color: '#48BCE1', verticalAlign: 'middle' }} />
            Sự Kiện Sắp Tới
          </h2>
          <Link href="/events" className="see-all">Xem tất cả <ArrowRight size={14} /></Link>
        </div>
        <div className="events-list">
          {loading ? (
            [0,1,2].map(i => <div key={i} className="event-item skeleton" style={{ height: 68 }} />)
          ) : dbEvents.length > 0 ? dbEvents.map((ev, idx) => {
            const d = new Date(ev.event_date);
            return (
              <Link key={idx} href="/events" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="event-item" style={{ cursor: 'pointer' }}>
                  <div className="event-date">
                    <span className="date-day">{d.getDate().toString().padStart(2, '0')}</span>
                    <span className="date-month">Th.{d.getMonth() + 1}</span>
                  </div>
                  <div className="event-details">
                    <h4 className="event-title">{getDbField(ev, 'title')}</h4>
                    <p className="event-time">{d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p>
                    <p className="event-loc">📍 {ev.location || 'Hội trường chính'}</p>
                  </div>
                  <ChevronRight size={14} style={{ color: '#48BCE1', flexShrink: 0, alignSelf: 'center' }} />
                </div>
              </Link>
            );
          }) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
              <Calendar size={32} style={{ marginBottom: '0.5rem', opacity: 0.4 }} />
              <p style={{ fontSize: '0.9rem' }}>Không có sự kiện sắp tới</p>
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
