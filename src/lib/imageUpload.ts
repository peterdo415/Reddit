import { supabase } from './supabase';

// 画像バリデーション（5MB以下、JPEG/PNG）
export function validateImage(file: File): string | null {
  if (!['image/jpeg', 'image/png'].includes(file.type)) {
    return 'JPEGまたはPNG画像のみアップロードできます。';
  }
  if (file.size > 5 * 1024 * 1024) {
    return '画像サイズは5MB以下にしてください。';
  }
  return null;
}

// 画像アップロード（バケット名・ファイルパス指定）
export async function uploadImageToSupabase(
  file: File,
  bucket: string,
  filePath: string
): Promise<string | null> {
  const { error } = await supabase.storage.from(bucket).upload(filePath, file, {
    cacheControl: '3600',
    upsert: true,
  });
  if (error) {
    return null;
  }
  const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return publicUrlData?.publicUrl || null;
} 