import React, { useState } from 'react';
import { Community } from '../../lib/supabase';
import ImageUploader from '../profile/AvatarUploader';
import { supabase } from '../../lib/supabase';

interface CommunityEditModalProps {
  community: Community;
  onClose: () => void;
  onSaved: (updated: Community) => void;
}

const CommunityEditModal: React.FC<CommunityEditModalProps> = ({ community, onClose, onSaved }) => {
  const [displayName, setDisplayName] = useState(community.display_name);
  const [description, setDescription] = useState(community.description || '');
  const [imageUrl, setImageUrl] = useState<string | null>(community.image_url || null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // 画像アップロード処理
  const uploadImage = async (file: File, communityName: string): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const filePath = `${communityName}/${Date.now()}.${ext}`;
    setUploading(true);
    const { error } = await supabase.storage
      .from('community-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });
    setUploading(false);
    if (error) {
      setError('画像のアップロードに失敗しました');
      return null;
    }
    // 公開URL取得
    const { data: publicUrlData } = supabase.storage
      .from('community-images')
      .getPublicUrl(filePath);
    return publicUrlData?.publicUrl || null;
  };

  const handleSave = async () => {
    setError('');
    if (displayName.length > 32) {
      setError('表示名は32文字以内で入力してください');
      return;
    }
    setSaving(true);
    let uploadedImageUrl = imageUrl;
    if (imageFile) {
      uploadedImageUrl = await uploadImage(imageFile, community.name);
      if (!uploadedImageUrl) {
        setSaving(false);
        return;
      }
    }
    // DB更新
    const { data, error: updateError } = await supabase
      .from('communities')
      .update({
        display_name: displayName,
        description,
        image_url: uploadedImageUrl,
      })
      .eq('id', community.id)
      .select()
      .maybeSingle();
    setSaving(false);
    if (updateError || !data) {
      setError(updateError?.message || '更新に失敗しました');
      return;
    }
    onSaved(data);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          onClick={onClose}
        >
          ×
        </button>
        <h2 className="text-xl font-bold mb-4">コミュニティを編集</h2>
        {error && <div className="mb-3 p-2 bg-red-100 text-red-700 rounded">{error}</div>}
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">コミュニティ名（変更不可）</label>
          <input
            type="text"
            value={community.name}
            disabled
            className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-100 text-gray-500"
          />
        </div>
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">表示名（日本語・多言語可、32文字以内）</label>
          <input
            type="text"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
            maxLength={32}
          />
        </div>
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">説明</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">コミュニティ画像</label>
          <ImageUploader
            imageUrl={imageUrl}
            onFileSelect={file => setImageFile(file)}
            defaultImageUrl="/default-community.png"
            alt="コミュニティ画像"
            buttonLabel="画像を変更"
          />
          {uploading && <p className="text-blue-500 text-sm mt-2">画像をアップロード中...</p>}
        </div>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
            disabled={saving}
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-[var(--primary)] text-white rounded-md hover:bg-[var(--primary-hover)]"
            disabled={saving || uploading}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommunityEditModal; 