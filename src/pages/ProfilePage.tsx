import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { User } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';

interface ProfileFormData {
  username: string;
  bio: string;
  profile_image_url: string;
}

const ProfilePage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ProfileFormData>();
  
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
          setImagePreview(data.profile_image_url);
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
      
      // Update profile
      const { error } = await supabase
        .from('users')
        .update({
          username: data.username,
          bio: data.bio,
          profile_image_url: data.profile_image_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
        
      if (error) throw error;
      
      // Update auth metadata
      await supabase.auth.updateUser({
        data: {
          username: data.username,
          avatar_url: data.profile_image_url
        }
      });
      
      navigate('/');
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Preview image
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    // TODO: Implement image upload to storage
    // For now, just use a placeholder URL
    setValue('profile_image_url', 'https://api.dicebear.com/7.x/avatars/svg?seed=' + Date.now());
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
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Profile Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              プロフィール画像
            </label>
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {imagePreview ? (
                  <img 
                    src={imagePreview} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={40} className="text-gray-400" />
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id="profile-image"
              />
              <label
                htmlFor="profile-image"
                className="bg-white text-[var(--primary)] border border-[var(--primary)] px-4 py-2 rounded-md hover:bg-[var(--primary)] hover:text-white transition-colors cursor-pointer"
              >
                画像を選択
              </label>
            </div>
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