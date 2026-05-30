'use client';
import { useState } from 'react';
import { Users, Music, Heart, Baby, MessageCircle, ChevronRight, X, Search, Sparkles } from 'lucide-react';
import './page.css';

const ministries = [
  {
    id: 1,
    category: 'Nam giới',
    name: 'Mục vụ Nam giới',
    icon: Users,
    desc: 'Gắn kết các anh em trong Hội Thánh để trưởng thành đức tin và sống chứng đạo.',
    leader: 'Chấp sự Nguyễn Văn A',
    schedule: 'Tối Thứ Sáu hàng tuần, 19:30',
    location: 'Phòng sinh hoạt 1',
    mission: 'Tạo môi trường anh em cùng học Lời Chúa, thảo luận, cầu nguyện và hỗ trợ nhau trong đời sống gia đình.',
    goal: 'Xây dựng đội ngũ nam tín hữu mạnh mẽ, lãnh nhận trách nhiệm phục vụ và đối diện thử thách đời sống bằng đức tin.',
    activities: [
      'Chia sẻ Giáo lý và Kinh Thánh hàng tuần.',
      'Mời anh em thảo luận về vai trò người nam trong gia đình và Hội Thánh.',
      'Tổ chức hoạt động cộng đồng, hỗ trợ gia đình khó khăn.',
    ],
    details: 'Mục vụ Nam giới dành cho những anh em khao khát lớn lên trong đức tin, được huấn luyện để lãnh đạo gia đình và phục vụ Hội Thánh.',
  },
  {
    id: 2,
    category: 'Nữ giới',
    name: 'Mục vụ Nữ giới',
    icon: Heart,
    desc: 'Xây dựng tình yêu thương, phục vụ và đời sống cầu nguyện cho chị em.',
    leader: 'Chấp sự Trần Thị B',
    schedule: 'Sáng Thứ Bảy hàng tuần, 09:00',
    location: 'Phòng sinh hoạt 2',
    mission: 'Khích lệ chị em sống gương mẫu trong gia đình và cộng đồng, luôn nương tựa vào Chúa.',
    goal: 'Phát triển kỹ năng chăm sóc gia đình, phục vụ người yếu thế và lan tỏa tình yêu Chúa.',
    activities: [
      'Học Kinh Thánh và chia sẻ kinh nghiệm phục vụ.',
      'Tổ chức phụ nữ cầu nguyện, khích lệ nhau.',
      'Hỗ trợ phụ nữ trong gia đình và phục vụ người cao tuổi.',
    ],
    details: 'Mục vụ Nữ giới giúp chị em xây dựng bản sắc Tin Lành, vững vàng trong vai trò con gái, vợ, mẹ và môn đồ Chúa.',
  },
  {
    id: 3,
    category: 'Thanh niên',
    name: 'Mục vụ Thanh niên',
    icon: Users,
    desc: 'Thắp lên ngọn lửa đức tin và năng lượng cho giới trẻ.',
    leader: 'Anh Lê Văn C',
    schedule: 'Tối Thứ Bảy hàng tuần, 19:00',
    location: 'Hội trường thanh niên',
    mission: 'Xây dựng môi trường lành mạnh để thanh niên được trang bị, truyền cảm hứng và phát triển năng khiếu.',
    goal: 'Trang bị giới trẻ dấn thân trong đức tin và phục vụ Hội Thánh, tránh xa những cám dỗ xã hội.',
    activities: [
      'Sinh hoạt nhóm nhỏ với đề tài thực tế.',
      'Học kỹ năng lãnh đạo, giao tiếp và truyền giảng.',
      'Tổ chức chương trình phục vụ giang rộng Tin Lành.',
    ],
    details: 'Mục vụ Thanh niên dành cho các bạn trẻ muốn tìm hiểu Chúa, kết nối bạn hữu và trở thành người trẻ có ảnh hưởng tích cực.',
  },
  {
    id: 4,
    category: 'Thiếu nhi',
    name: 'Mục vụ Thiếu nhi',
    icon: Baby,
    desc: 'Ươm mầm đức tin qua trò chơi và câu chuyện Kinh Thánh.',
    leader: 'Cô Phạm Thị D',
    schedule: 'Sáng Chúa Nhật, 09:00',
    location: 'Khu vực trường Chúa Nhật',
    mission: 'Giúp các em nhỏ yêu mến Chúa bằng phương pháp dạy học sinh động và thân thiện.',
    goal: 'Xây đắp nền tảng đức tin cho thế hệ thiếu nhi, giúp trẻ nhận diện giá trị của Chúa trong cuộc sống.',
    activities: [
      'Học Kinh Thánh qua câu chuyện và trò chơi.',
      'Thực hành thờ phượng bằng âm nhạc thiếu nhi.',
      'Khám phá đức tin qua các hoạt động sáng tạo.',
    ],
    details: 'Mục vụ Thiếu nhi là nơi các em được học lời Chúa với niềm vui, tăng trưởng đức tin và xây dựng tình bạn tốt.',
  },
  {
    id: 5,
    category: 'Âm nhạc',
    name: 'Ban Hát dẫn',
    icon: Music,
    desc: 'Tôn vinh Chúa bằng âm nhạc và thờ phượng.',
    leader: 'Chị Nguyễn Thị E',
    schedule: 'Tối Thứ Năm hàng tuần, 19:30',
    location: 'Hội trường chính',
    mission: 'Chuẩn bị đội ngũ thờ phượng chuyên nghiệp và kính trọng Chúa trong lòng.',
    goal: 'Phát triển kỹ thuật hát, nhạc cụ và tâm linh thờ phượng để dẫn dắt Hội Thánh.',
    activities: [
      'Luyện giọng và kỹ thuật nhạc cụ.',
      'Lên chương trình thờ phượng cho các buổi nhóm và sự kiện.',
      'Phục vụ trong các chương trình lễ và nhóm nhỏ.',
    ],
    details: 'Ban Hát dẫn chào đón những ai yêu thích âm nhạc và muốn dùng tài năng để tôn vinh Chúa.',
  },
  {
    id: 6,
    category: 'Truyền giáo',
    name: 'Ban Truyền giáo',
    icon: MessageCircle,
    desc: 'Rao truyền Tin Lành đến cộng đồng và thân hữu.',
    leader: 'Anh Vũ Văn F',
    schedule: 'Chiều Chủ Nhật hàng tuần, 14:00',
    location: 'Khắp các khu vực',
    mission: 'Gửi anh em ra ngoài để chia sẻ Tin Lành và phục vụ xã hội bằng tình yêu Chúa.',
    goal: 'Duy trì lực lượng truyền giáo năng động và tổ chức các hoạt động mang Tin Lành vào đời sống.',
    activities: [
      'Chuẩn bị nhóm truyền đạo và chương trình truyền giáo.',
      'Hội nhập thân hữu và tổ chức sự kiện cộng đồng.',
      'Thăm viếng gia đình, xóm làng và hỗ trợ người khó khăn.',
    ],
    details: 'Ban Truyền giáo phù hợp với những ai muốn lan tỏa tình yêu Chúa đến những người chưa biết Ngài.',
  },
];

export default function Ministry() {
  const [selectedMinistry, setSelectedMinistry] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formNote, setFormNote] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const displayedMinistries = ministries.filter(ministry => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return ministry.name.toLowerCase().includes(query) || ministry.desc.toLowerCase().includes(query) || ministry.details.toLowerCase().includes(query);
  });

  const handleJoin = () => {
    if (!formName.trim() || !formPhone.trim()) {
      showToast('⚠️ Vui lòng nhập đầy đủ tên và số điện thoại.');
      return;
    }

    setSubmitted(true);
    showToast(`🎉 Cảm ơn ${formName}! Chúng tôi sẽ liên hệ bạn sớm.`);

    setTimeout(() => {
      setSubmitted(false);
      setShowForm(false);
      setFormName('');
      setFormPhone('');
      setFormNote('');
      setSelectedMinistry(null);
    }, 2000);
  };

  return (
    <div className="page-container">
      {toast && (
        <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: '#48BCE1', color: '#fff', padding: '10px 20px', borderRadius: '12px', zIndex: 9999, fontWeight: 'bold', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', whiteSpace: 'nowrap' }}>
          {toast}
        </div>
      )}

      {selectedMinistry && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ width: '100%', maxWidth: '560px', background: '#1a1d24', borderRadius: '18px', overflow: 'hidden', padding: '1.5rem', position: 'relative' }}>
            <button onClick={() => { setSelectedMinistry(null); setShowForm(false); }} style={{ position: 'absolute', top: 18, right: 18, background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%', width: 38, height: 38, cursor: 'pointer', color: '#fff' }}>
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
              <selectedMinistry.icon size={28} color="#48BCE1" />
              <div>
                <h2 style={{ fontSize: '1.5rem', margin: 0, color: '#fff' }}>{selectedMinistry.name}</h2>
                <p style={{ margin: '6px 0 0', color: '#9ca3af' }}>{selectedMinistry.category} • {selectedMinistry.schedule}</p>
              </div>
            </div>

            <p style={{ color: '#d1d5db', lineHeight: 1.7, marginBottom: '1.25rem' }}>{selectedMinistry.details}</p>

            <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ padding: '1rem', borderRadius: '16px', background: 'rgba(72, 188, 225, 0.08)' }}>
                <p style={{ margin: 0, color: '#38bdf8', fontWeight: 700 }}>Sứ mạng</p>
                <p style={{ margin: '0.6rem 0 0', color: '#e5e7eb' }}>{selectedMinistry.mission}</p>
              </div>
              <div style={{ padding: '1rem', borderRadius: '16px', background: 'rgba(244, 204, 48, 0.08)' }}>
                <p style={{ margin: 0, color: '#facc15', fontWeight: 700 }}>Mục tiêu</p>
                <p style={{ margin: '0.6rem 0 0', color: '#e5e7eb' }}>{selectedMinistry.goal}</p>
              </div>
            </div>

            <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {selectedMinistry.activities.map((activity: string, index: number) => (
                <div key={index} style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start', background: 'rgba(255,255,255,0.03)', padding: '0.9rem 1rem', borderRadius: '14px' }}>
                  <Sparkles size={18} color="#22c55e" />
                  <p style={{ margin: 0, color: '#d1d5db', lineHeight: 1.6 }}>{activity}</p>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={{ padding: '1rem', borderRadius: '16px', background: 'rgba(255,255,255,0.03)' }}>
                <p style={{ margin: 0, color: '#38bdf8', fontWeight: 700 }}>Người điều hành</p>
                <p style={{ margin: '0.6rem 0 0', color: '#e5e7eb' }}>{selectedMinistry.leader}</p>
              </div>
              <div style={{ padding: '1rem', borderRadius: '16px', background: 'rgba(255,255,255,0.03)' }}>
                <p style={{ margin: 0, color: '#38bdf8', fontWeight: 700 }}>Địa điểm</p>
                <p style={{ margin: '0.6rem 0 0', color: '#e5e7eb' }}>{selectedMinistry.location}</p>
              </div>
            </div>

            {!showForm ? (
              <button className="btn-primary" style={{ width: '100%', padding: '14px 16px', borderRadius: '14px', fontWeight: 700 }} onClick={() => setShowForm(true)}>
                Đăng ký tham gia mục vụ này
              </button>
            ) : (
              <div style={{ background: 'rgba(72, 188, 225, 0.08)', padding: '1rem', borderRadius: '16px', border: '1px solid rgba(72, 188, 225, 0.2)' }}>
                <h3 style={{ margin: 0, color: '#fff', fontSize: '1.1rem' }}>Thông tin đăng ký</h3>
                {submitted ? (
                  <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                    <Heart size={36} color="#fb7185" style={{ marginBottom: '0.75rem' }} />
                    <p style={{ color: '#d1d5db', margin: 0 }}>Đăng ký đã gửi! Chúng tôi sẽ gọi lại trong thời gian sớm nhất.</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '0.8rem', marginTop: '1rem' }}>
                    <input className="join-input" type="text" placeholder="Họ và tên" value={formName} onChange={e => setFormName(e.target.value)} />
                    <input className="join-input" type="tel" placeholder="Số điện thoại" value={formPhone} onChange={e => setFormPhone(e.target.value)} />
                    <textarea className="join-input" rows={3} placeholder="Bạn muốn đóng góp gì cho mục vụ?" value={formNote} onChange={e => setFormNote(e.target.value)} style={{ resize: 'vertical' }} />
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button className="join-btn" style={{ flex: 1, background: '#0f172a', color: '#fff' }} onClick={() => { setShowForm(false); setFormName(''); setFormPhone(''); setFormNote(''); }}>
                        Hủy
                      </button>
                      <button className="join-btn" style={{ flex: 1, background: '#48BCE1', color: '#111' }} onClick={handleJoin}>
                        Gửi đăng ký
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <header className="page-header">
        <h1 className="page-title">Mục vụ</h1>
        <p className="page-subtitle">Cùng nhau hầu việc Chúa, chia sẻ đức tin và xây dựng cộng đồng.</p>
      </header>

      <section className="section" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 320px', display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#111827', padding: '0.85rem 1rem', borderRadius: '16px' }}>
            <Search size={18} color="#94a3b8" />
            <input type="search" placeholder="Tìm mục vụ theo tên hoặc mô tả" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: '0.95rem' }} />
          </div>
        </div>

        <div className="ministry-list">
          {displayedMinistries.map(ministry => {
            const Icon = ministry.icon;
            return (
              <div key={ministry.id} className="ministry-item" onClick={() => setSelectedMinistry(ministry)}>
                <div className="ministry-icon-wrapper">
                  <Icon size={22} className="ministry-icon" />
                </div>
                <div className="ministry-info">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <h3 className="ministry-name" style={{ margin: 0 }}>{ministry.name}</h3>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', padding: '4px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: '9999px' }}>{ministry.category}</span>
                  </div>
                  <p className="ministry-desc">{ministry.desc}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '8px', color: '#9ca3af', fontSize: '0.82rem' }}>
                    <span>Điều hành: {ministry.leader}</span>
                    <span>{ministry.schedule}</span>
                  </div>
                </div>
                <ChevronRight className="arrow-icon" size={20} />
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
