import { supabase } from './supabase';

export interface FavoriteItem {
  id: string;
  user_id: string;
  item_type: 'devotional' | 'sermon' | 'audiobook' | 'pdf';
  item_id: string;
  created_at: string;
  item_title?: string;
}

export async function fetchFavorites(userId: string): Promise<FavoriteItem[]> {
  const { data, error } = await supabase
    .from('user_favorites')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !data) {
    console.error('Error fetching favorites:', error);
    return [];
  }

  const favoritesWithTitles = await Promise.all(data.map(async (fav) => {
    let title = `ID: ${fav.item_id.slice(0, 8)}...`;
    try {
      let table = '';
      if (fav.item_type === 'devotional') table = 'devotionals';
      else if (fav.item_type === 'sermon') table = 'sermons';
      else if (fav.item_type === 'audiobook') table = 'audiobooks';
      else if (fav.item_type === 'pdf') table = 'pdfs';

      if (table) {
        const { data: itemData } = await supabase.from(table).select('title').eq('id', fav.item_id).single();
        if (itemData && itemData.title) {
          title = itemData.title;
        }
      }
    } catch (err) {
      console.error('Error fetching title for favorite', fav.item_id, err);
    }
    return { ...fav, item_title: title } as FavoriteItem;
  }));

  return favoritesWithTitles;
}

export async function addFavorite(userId: string, itemType: string, itemId: string): Promise<boolean> {
  const { error } = await supabase
    .from('user_favorites')
    .insert([{ user_id: userId, item_type: itemType, item_id: itemId }]);

  if (error) {
    console.error('Error adding favorite:', error);
    return false;
  }
  return true;
}

export async function removeFavorite(userId: string, itemType: string, itemId: string): Promise<boolean> {
  const { error } = await supabase
    .from('user_favorites')
    .delete()
    .match({ user_id: userId, item_type: itemType, item_id: itemId });

  if (error) {
    console.error('Error removing favorite:', error);
    return false;
  }
  return true;
}

export async function checkIsFavorite(userId: string, itemType: string, itemId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_favorites')
    .select('id')
    .match({ user_id: userId, item_type: itemType, item_id: itemId })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error checking favorite:', error);
  }
  return !!data;
}
