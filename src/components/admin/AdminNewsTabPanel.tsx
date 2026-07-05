'use client';

import { Edit, Trash2 } from 'lucide-react';
import WordPressPostEditor from '@/components/admin/WordPressPostEditor';
import { parseCategories } from '@/lib/html-utils';

type NewsItem = {
  id?: string;
  title: string;
  type: string;
  content: string;
  image_url?: string;
  pdf_url?: string;
  audio_url?: string;
  categories?: string[] | string;
  status?: string;
  created_at?: string;
};

type NewsForm = {
  title: string;
  type: string;
  content: string;
  image_url?: string;
  pdf_url?: string;
  audio_url?: string;
  categories?: string[] | string;
  status?: string;
};

type Props = {
  contentType?: string;
  listTitle: string;
  items: NewsItem[];
  form: NewsForm;
  onFormChange: (next: NewsForm) => void;
  onSubmit: (e: React.FormEvent) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: () => void;
  onEdit: (item: NewsItem) => void;
  onDelete: (id?: string) => void;
  uploading: boolean;
  quillKey: number;
  quillModules: Record<string, unknown>;
  submitLabel?: string;
  showCategories?: boolean;
  showFeaturedImage?: boolean;
  extraMetaboxes?: React.ReactNode;
};

export default function AdminNewsTabPanel({
  contentType,
  listTitle,
  items,
  form,
  onFormChange,
  onSubmit,
  onImageUpload,
  onRemoveImage,
  onEdit,
  onDelete,
  uploading,
  quillKey,
  quillModules,
  submitLabel = 'Xuất bản',
  showCategories = true,
  showFeaturedImage = true,
  extraMetaboxes,
}: Props) {
  const effectiveType = contentType || form.type || 'Bài viết';

  return (
    <div className="wp-posts-section">
      <WordPressPostEditor
        fixedType={contentType}
        value={{
          title: form.title,
          content: form.content,
          type: effectiveType,
          image_url: form.image_url,
          categories: parseCategories(form.categories),
          status: form.status === 'draft' ? 'draft' : 'published',
        }}
        onChange={(next) =>
          onFormChange({
            ...form,
            title: next.title,
            content: next.content,
            type: contentType || next.type,
            image_url: next.image_url,
            categories: next.categories,
            status: next.status,
          })
        }
        onSubmit={onSubmit}
        onImageUpload={onImageUpload}
        onRemoveImage={onRemoveImage}
        uploading={uploading}
        quillKey={quillKey}
        quillModules={quillModules}
        submitLabel={submitLabel}
        showCategories={showCategories}
        showFeaturedImage={showFeaturedImage}
        extraMetaboxes={extraMetaboxes}
      />

      <div className="admin-panel-card wp-post-list-card">
        <div className="panel-header">
          <h3>
            {listTitle} ({items.length})
          </h3>
        </div>
        <div className="data-list">
          {items.length > 0 ? (
            items.map((n) => {
              const cats = parseCategories(n.categories);
              return (
                <div key={n.id} className="data-item wp-post-list-item">
                  <div className="data-item-content">
                    {n.image_url && (
                       
                      <img src={n.image_url} alt="" className="wp-post-list-thumb" />
                    )}
                    <div>
                      <strong>
                        <span className="badge">{n.status === 'draft' ? 'Nháp' : n.type}</span> {n.title}
                      </strong>
                      {cats.length > 0 && <p className="wp-post-list-cats">{cats.join(', ')}</p>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => onEdit({ ...n, categories: cats })}
                      className="btn-icon-edit"
                      title="Sửa"
                      type="button"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => onDelete(n.id)}
                      className="btn-icon-danger"
                      title="Xóa"
                      type="button"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="wp-post-list-empty">Chưa có nội dung nào.</p>
          )}
        </div>
      </div>
    </div>
  );
}
