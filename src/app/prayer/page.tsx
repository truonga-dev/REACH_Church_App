import { Heart, Send } from 'lucide-react';
import './page.css';
import '../bible/page.css'; // Reusing some classes

export default function Prayer() {
  return (
    <div className="page-container">
      <header className="page-header text-center">
        <div className="heart-icon-wrapper mx-auto">
          <Heart size={32} className="text-accent" />
        </div>
        <h1 className="page-title mt-sm">Cầu Nguyện</h1>
        <p className="page-subtitle">"Hãy vui mừng mãi mãi, cầu nguyện không thôi" - 1 Tê-sa-lô-ni-ca 5:16-17</p>
      </header>

      <section className="section">
        <div className="prayer-form-card">
          <h2 className="section-title mb-sm">Gửi Nhu Cầu Cầu Nguyện</h2>
          <p className="text-muted text-sm mb-md">Mục sư và Ban cầu nguyện luôn sẵn sàng đồng hành cùng bạn trong sự cầu thay.</p>
          
          <form className="prayer-form">
            <div className="form-group">
              <label htmlFor="name">Họ và tên (Tùy chọn)</label>
              <input type="text" id="name" placeholder="Nhập tên của bạn" className="form-control" />
            </div>
            
            <div className="form-group">
              <label htmlFor="topic">Chủ đề</label>
              <select id="topic" className="form-control">
                <option value="health">Sức khỏe</option>
                <option value="family">Gia đình</option>
                <option value="work">Công việc / Tài chính</option>
                <option value="faith">Đời sống thuộc linh</option>
                <option value="other">Khác</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="content">Nội dung cầu nguyện</label>
              <textarea 
                id="content" 
                rows={4} 
                placeholder="Xin hãy cầu nguyện cho..."
                className="form-control"
              ></textarea>
            </div>

            <div className="checkbox-group">
              <input type="checkbox" id="private" />
              <label htmlFor="private">Chỉ gửi riêng cho Mục sư (Không công khai)</label>
            </div>
            
            <button type="button" className="btn-primary w-full mt-sm flex-center">
              <Send size={18} className="mr-sm" />
              Gửi lời cầu nguyện
            </button>
          </form>
        </div>
      </section>

      <section className="section mt-md">
        <h2 className="section-title">Danh Sách Cầu Nguyện</h2>
        <div className="prayer-wall">
          <div className="prayer-request">
            <div className="prayer-meta">
              <span className="prayer-author">Ẩn danh</span>
              <span className="prayer-time">2 giờ trước</span>
            </div>
            <p className="prayer-content">Xin cầu nguyện cho ba tôi đang nằm viện vì bệnh tim được Chúa chữa lành và ban bình an.</p>
            <button className="btn-pray"><Heart size={16} className="mr-xs" /> Đã cầu nguyện (12)</button>
          </div>
          
          <div className="prayer-request">
            <div className="prayer-meta">
              <span className="prayer-author">Chị Hương</span>
              <span className="prayer-time">Hôm qua</span>
            </div>
            <p className="prayer-content">Cảm tạ Chúa vì con trai tôi đã thi đỗ Đại học đúng như nguyện vọng. Xin Chúa tiếp tục dẫn dắt cháu trong chặng đường sắp tới.</p>
            <button className="btn-pray active"><Heart size={16} className="mr-xs" fill="currentColor" /> Đã cầu nguyện (25)</button>
          </div>
        </div>
      </section>
    </div>
  );
}
