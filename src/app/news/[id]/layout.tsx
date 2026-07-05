import type { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import { htmlExcerpt } from '@/lib/html-utils';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const { data } = await supabase.from('news').select('*').eq('id', params.id).single();

  if (!data) {
    return {
      title: 'Không tìm thấy bài viết',
    };
  }

  const excerpt = htmlExcerpt(data.content || data.summary || '', 160);

  return {
    title: `${data.title} | R.E.A.C.H Church`,
    description: excerpt,
    openGraph: {
      title: data.title,
      description: excerpt,
      images: data.image_url ? [{ url: data.image_url }] : [],
      type: 'article',
      publishedTime: data.created_at,
    },
    twitter: {
      card: 'summary_large_image',
      title: data.title,
      description: excerpt,
      images: data.image_url ? [data.image_url] : [],
    },
  };
}

export default function NewsDetailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
