import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Image as ImageIcon, X } from 'lucide-react';
import { usePostStore } from '../stores/postStore';
import { useCommunityStore } from '../stores/communityStore';
import { useAuthStore } from '../stores/authStore';
import { Post } from '../lib/supabase';

interface PostFormValues {
  title: string;
  body?: string;
  community_id: number;
  image_url?: string;
}

const CreatePostPage: React.FC = () => {
  const { createPost } = usePostStore();
  const { communities, fetchCommunities } = useCommunityStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  const [imagePreview, setImagePreview] = useState<string>('');
  const [error, setError] = useState<string>('');
  
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<PostFormValues>();
  const selectedCommunityId = watch('community_id');
  
  useEffect(() => {
    fetchCommunities();
  }, [fetchCommunities]);
  
  const onSubmit = async (data: PostFormValues) => {
    try {
      if (!user) {
        setError('投稿するにはログインが必要です');
        return;
      }
      
      const newPost: Partial<Post> = {
        title: data.title,
        body: data.body,
        community_id: data.community_id,
        image_url: data.image_url,
        user_id: user.id
      };
      
      const post = await createPost(newPost);
      if (post) {
        // Update community post count
        await supabase
          .from('communities')
          .update({
            post_count: supabase.rpc('increment', { x: 1 })
          })
          .eq('id', data.community_id);
          
        navigate(`/post/${post.id}`);
      } else {
        setError('投稿の作成に失敗しました');
      }
    } catch (err: any) {
      setError(err.message || '投稿の作成に失敗しました');
    }
  };
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('画像ファイルのみアップロードできます');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('画像サイズは5MB以下にしてください');
      return;
    }
    
    try {
      // Create unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `post-images/${fileName}`;
      
      // Upload to Supabase Storage
      const { error: uploadError, data } = await supabase.storage
        .from('public')
        .upload(filePath, file);
        
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('public')
        .getPublicUrl(filePath);
        
      setImagePreview(publicUrl);
      setValue('image_url', publicUrl);
      setError('');
    } catch (err: any) {
      setError('画像のアップロードに失敗しました');
    }
  };
  
  const removeImage = () => {
    setImagePreview('');
    setValue('image_url', '');
  };
  
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6">新しい投稿を作成</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Community selection */}
          <div>
            <label htmlFor="community" className="block text-sm font-medium text-gray-700 mb-1">
              コミュニティを選択
            </label>
            <select
              id="community"
              {...register('community_id', { required: 'コミュニティを選択してください' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
            >
              <option value="">選択してください</option>
              {communities.map(community => (
                <option key={community.id} value={community.id}>
                  {community.display_name}
                </option>
              ))}
            </select>
            {errors.community_id && (
              <p className="mt-1 text-sm text-red-600">{errors.community_id.message}</p>
            )}
          </div>
          
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              タイトル
            </label>
            <input
              id="title"
              type="text"
              {...register('title', { 
                required: 'タイトルは必須です',
                maxLength: {
                  value: 300,
                  message: 'タイトルは300文字以内にしてください'
                }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              placeholder="投稿のタイトル"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>
          
          {/* Body */}
          <div>
            <label htmlFor="body" className="block text-sm font-medium text-gray-700 mb-1">
              本文 (任意)
            </label>
            <textarea
              id="body"
              {...register('body')}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              placeholder="投稿の本文"
            />
          </div>
          
          {/* Image upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              画像 (任意)
            </label>
            
            {imagePreview ? (
              <div className="relative">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="max-h-96 rounded-md"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md hover:bg-gray-100"
                >
                  <X size={20} className="text-gray-600" />
                </button>
              </div>
            ) : (
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <ImageIcon
                    className="mx-auto h-12 w-12 text-gray-400"
                    aria-hidden="true"
                  />
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="image-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-[var(--primary)] hover:text-[var(--primary-hover)] focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-[var(--primary)]"
                    >
                      <span>画像をアップロード</span>
                      <input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="sr-only"
                      />
                    </label>
                    <p className="pl-1">またはドラッグ＆ドロップ</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, GIF up to 5MB
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {/* Submit button */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-[var(--primary)] text-white px-6 py-2 rounded-md hover:bg-[var(--primary-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!selectedCommunityId}
            >
              投稿する
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePostPage;