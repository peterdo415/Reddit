import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';
import ImageUploader from '../components/profile/AvatarUploader';

interface ProfileFormData {
  username: string;
  bio: string;
  profile_image_url: string;
}

const ProfilePage: React.FC = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<ProfileFormData>();
  
  // Load user profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('users')
          .select('username, bio, profile_image_url')
          .eq('id', user.id)
          .single();
          
        if (error) throw error;
        
        if (data) {
          setValue('username', data.username || '');
          setValue('bio', data.bio || '');
          setValue('profile_image_url', data.profile_image_url || '');
          setAvatarUrl(data.profile_image_url || null);
        }
      } catch (err: any) {
        console.error('Error loading profile:', err);
        setError(err.message);
      }
    };
    
    loadProfile();
  }, [user, setValue]);
  
  const onSubmit = async (data: ProfileFormData) => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      let uploadedAvatarUrl = avatarUrl;
      // 画像ファイルが選択されていればアップロード
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const filePath = `avatars/${user.id}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
        uploadedAvatarUrl = publicUrlData?.publicUrl || null;
      }
      // プロフィール情報を更新
      const { error: updateError } = await supabase
        .from('users')
        .update({
          username: data.username,
          bio: data.bio,
          profile_image_url: uploadedAvatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      if (updateError) throw updateError;
      // Auth metadataも更新
      await supabase.auth.updateUser({
        data: {
          username: data.username,
          avatar_url: uploadedAvatarUrl
        }
      });
      setAvatarUrl(uploadedAvatarUrl);
      setValue('profile_image_url', uploadedAvatarUrl || '');
      setSuccess('プロフィールを保存しました');
      setAvatarFile(null);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // 画像ファイル選択時のコールバック
  const handleAvatarFileSelect = (file: File | null) => {
    setAvatarFile(file);
  };
  
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6">プロフィール設定</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
            {success}
          </div>
        )}
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Profile Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              プロフィール画像
            </label>
            <ImageUploader
              imageUrl={avatarUrl}
              onFileSelect={handleAvatarFileSelect}
              defaultImageUrl="/default-avatar.png"
              alt="プロフィール画像"
              buttonLabel="画像を変更"
            />
          </div>
          
          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              ユーザー名
            </label>
            <input
              id="username"
              type="text"
              {...register('username', {
                required: 'ユーザー名は必須です',
                minLength: {
                  value: 3,
                  message: 'ユーザー名は3文字以上必要です'
                },
                pattern: {
                  value: /^[a-zA-Z0-9_]+$/,
                  message: 'ユーザー名は英数字とアンダースコアのみ使用できます'
                }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
            />
            {errors.username && (
              <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
            )}
          </div>
          
          {/* Bio */}
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
              自己紹介
            </label>
            <textarea
              id="bio"
              {...register('bio')}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              placeholder="あなたについて教えてください..."
            />
          </div>
          
          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-[var(--primary)] text-white px-6 py-2 rounded-md hover:bg-[var(--primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;