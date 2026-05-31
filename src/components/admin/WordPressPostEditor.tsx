'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Eye, ImageIcon, Pin, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { POST_CATEGORIES, type PostStatus } from '@/lib/post-categories';
import { countWords } from '@/lib/html-utils';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

type PostFormData = {
  title: string;
  content: string;
  type: string;
  image_url?: string;
  categories: string[];
  status: PostStatus;
};

type Props = {
  value: PostFormData;
  onChange: (next: PostFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: () => void;
  uploading: boolean;
  quillKey?: number;
  quillModules: Record<string, unknown>;
  submitLabel?: string;
  fixedType?: string;
  showTypeSelect?: boolean;
  showCategories?: boolean;
  showFeaturedImage?: boolean;
  extraMetaboxes?: React.ReactNode;
};

function Metabox({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="wp-metabox">
      <button type="button" className="wp-metabox-header" onClick={() => setOpen(!open)}>
        <span>{title}</span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {open && <div className="wp-metabox-body">{children}</div>}
    </div>
  );
}

export default function WordPressPostEditor({
  value,
  onChange,
  onSubmit,
  onImageUpload,
  onRemoveImage,
  uploading,
  quillKey = 0,
  quillModules,
  submitLabel = 'Xuất bản',
  fixedType,
  showTypeSelect,
  showCategories = true,
  showFeaturedImage = true,
  extraMetaboxes,
}: Props) {
  const effectiveType = fixedType || value.type;
  const typeSelectVisible = showTypeSelect ?? !fixedType;
  const toggleCategory = (cat: string) => {
    const has = value.categories.includes(cat);
    onChange({
      ...value,
      categories: has
        ? value.categories.filter((c) => c !== cat)
        : [...value.categories, cat],
    });
  };

  const wordCount = countWords(value.content);
  const statusLabel = value.status === 'published' ? 'Đã xuất bản' : 'Bản nháp';

  return (
    <form onSubmit={onSubmit} className="wp-editor-form">
      <div className="wp-editor-layout">
        <div className="wp-editor-main">
          <input
            className="wp-title-input"
            placeholder="Thêm tiêu đề bài viết"
            required
            value={value.title}
            onChange={(e) => onChange({ ...value, title: e.target.value })}
          />
          <div className="wp-editor-content">
            <ReactQuill
              key={quillKey}
              theme="snow"
              modules={quillModules}
              value={value.content}
              onChange={(content) => onChange({ ...value, content })}
              className="quill-editor wp-quill"
            />
          </div>
          <div className="wp-editor-footer">
            <span>Số từ: {wordCount}</span>
          </div>
        </div>

        <aside className="wp-editor-sidebar">
          <Metabox title="Xuất bản">
            <div className="wp-meta-row">
              <Pin size={14} />
              <span>
                Trạng thái: <strong>{statusLabel}</strong>
              </span>
              <button
                type="button"
                className="wp-link-btn"
                onClick={() =>
                  onChange({
                    ...value,
                    status: value.status === 'published' ? 'draft' : 'published',
                  })
                }
              >
                Chỉnh sửa
              </button>
            </div>
            <div className="wp-meta-row">
              <Eye size={14} />
              <span>
                Hiển thị: <strong>Công khai</strong>
              </span>
            </div>
            <div className="wp-meta-row">
              <Calendar size={14} />
              <span>
                Xuất bản: <strong>{new Date().toLocaleString('vi-VN')}</strong>
              </span>
            </div>
            <div className="wp-meta-row wp-meta-row-stack">
              <label htmlFor="post-type-select">Loại bài</label>
              {typeSelectVisible ? (
                <select
                  id="post-type-select"
                  value={value.type}
                  onChange={(e) => onChange({ ...value, type: e.target.value })}
                  className="wp-select"
                >
                  <option value="Bài viết">Bài viết</option>
                  <option value="Sự kiện">Sự kiện</option>
                  <option value="Thông báo">Thông báo</option>
                  <option value="Bản tin">Bản tin</option>
                </select>
              ) : (
                <strong>{effectiveType}</strong>
              )}
            </div>
            <div className="wp-publish-actions">
              <button type="submit" className="btn-primary-solid wp-publish-btn">
                {submitLabel}
              </button>
            </div>
          </Metabox>

          {showFeaturedImage && (
          <Metabox title="Ảnh đại diện">
            {value.image_url ? (
              <div className="wp-featured-preview">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={value.image_url} alt="Ảnh đại diện" />
                <p className="wp-featured-hint">Nhấn để thay đổi ảnh đại diện</p>
                <label className="wp-link-btn wp-featured-change">
                  {uploading ? 'Đang tải...' : 'Thay ảnh'}
                  <input type="file" accept="image/*" onChange={onImageUpload} disabled={uploading} hidden />
                </label>
                <button type="button" className="wp-link-danger" onClick={onRemoveImage}>
                  Xóa ảnh đại diện
                </button>
              </div>
            ) : (
              <div className="wp-featured-empty">
                <ImageIcon size={32} />
                <label className="btn-upload wp-featured-upload">
                  {uploading ? 'Đang tải...' : 'Đặt ảnh đại diện'}
                  <input type="file" accept="image/*" onChange={onImageUpload} disabled={uploading} hidden />
                </label>
              </div>
            )}
          </Metabox>
          )}

          {extraMetaboxes}

          {showCategories && (
          <Metabox title="Danh mục">
            <div className="wp-category-list">
              {POST_CATEGORIES.map((cat) => (
                <label key={cat} className="wp-category-item">
                  <input
                    type="checkbox"
                    checked={value.categories.includes(cat)}
                    onChange={() => toggleCategory(cat)}
                  />
                  <span>{cat}</span>
                </label>
              ))}
            </div>
          </Metabox>
          )}
        </aside>
      </div>
    </form>
  );
}
