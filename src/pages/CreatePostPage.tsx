import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Image as ImageIcon, X, Search } from 'lucide-react';
import { usePostStore } from '../stores/postStore';
import { useCommunityStore } from '../stores/communityStore';
import { useAuthStore } from '../stores/authStore';
import { Post, Community } from '../lib/supabase';
import { supabase } from '../lib/supabase';

interface PostFormValues {
  title: string;
  body?: string;
  community_id: number;
  image_url?: string;
}

const CreatePostPage: React.FC = () => {
  const { createPost } = usePostStore();
  const { fetchAllCommunities, searchCommunities } = useCommunityStore();
  const { user, selectedCommunities } = useAuthStore();
  const navigate = useNavigate();
  
  const [imagePreview, setImagePreview] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [communityInput, setCommunityInput] = useState('');
  const [communityOptions, setCommunityOptions] = useState<Community[]>([]);
  const [suggestedCommunities, setSuggestedCommunities] = useState<Community[]>([]);
  const [loadingCommunities, setLoadingCommunities] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<PostFormValues>();
  const selectedCommunityId = watch('community_id');
  
  useEffect(() => {
    // 初期サジェスト: 所属コミュニティ or 人気コミュニティ
    const fetchSuggested = async () => {
      setLoadingCommunities(true);
      let data = [];
      if (selectedCommunities.length > 0) {
        const res = await supabase
          .from('communities')
          .select('*')
          .in('id', selectedCommunities)
          .order('member_count', { ascending: false });
        data = res.data || [];
      }
      // 所属がなければ人気順でエンタメなどをサジェスト
      if (data.length === 0) {
        const res = await supabase
          .from('communities')
          .select('*')
          .order('member_count', { ascending: false })
          .limit(2);
        data = res.data || [];
      }
      setLoadingCommunities(false);
      setSuggestedCommunities(data);
    };
    fetchSuggested();
  }, [selectedCommunities]);
  
  useEffect(() => {
    // 検索ワードが1文字以上なら検索、空ならサジェストのみ
    let active = true;
    const search = async () => {
      if (communityInput.length === 0) {
        setCommunityOptions([]);
        return;
      }
      setLoadingCommunities(true);
      const results = await searchCommunities(communityInput);
      setLoadingCommunities(false);
      if (active) setCommunityOptions(results);
    };
    if (communityInput.length > 0) search();
    return () => { active = false; };
  }, [communityInput, searchCommunities]);
  
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
  
  // サジェスト・検索候補の合成
  const items = communityInput.length === 0 ? suggestedCommunities.slice(0, 2) : communityOptions;

  // キーボード操作
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || items.length === 0) return;
    if (e.key === 'ArrowDown') {
      setHighlightedIndex(i => Math.min(i + 1, items.length - 1));
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      setHighlightedIndex(i => Math.max(i - 1, 0));
      e.preventDefault();
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      const item = items[highlightedIndex];
      setValue('community_id', item.id);
      setCommunityInput(item.display_name);
      setShowDropdown(false);
      setHighlightedIndex(-1);
      e.preventDefault();
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setHighlightedIndex(-1);
    }
  };

  // フォーカス外れたらドロップダウンを閉じる
  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setShowDropdown(false);
      setHighlightedIndex(-1);
    }
  };

  // 候補選択
  const handleSelect = (item: Community) => {
    setValue('community_id', item.id);
    setCommunityInput(item.display_name);
    setShowDropdown(false);
    setHighlightedIndex(-1);
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
          {/* Reddit風コミュニティ選択 */}
          <div tabIndex={-1} onBlur={handleBlur} className="relative">
            <label htmlFor="community" className="block text-sm font-medium text-gray-700 mb-1">
              コミュニティを選択
            </label>
            <div className="flex items-center border rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-[var(--primary)]">
              <Search className="text-gray-400 mr-2" size={20} />
              <input
                id="community"
                type="text"
                value={communityInput}
                onChange={e => {
                  setCommunityInput(e.target.value);
                  setShowDropdown(true);
                  setHighlightedIndex(-1);
                }}
                onFocus={() => setShowDropdown(true)}
                onKeyDown={handleKeyDown}
                placeholder="コミュニティ名（日本語可）で検索..."
                className="flex-1 outline-none bg-transparent"
                autoComplete="off"
              />
            </div>
            {showDropdown && (
              <div className="absolute left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-20 max-h-72 overflow-y-auto">
                {items.length > 0 ? items.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`flex items-center px-4 py-2 cursor-pointer hover:bg-gray-100 ${highlightedIndex === idx ? 'bg-orange-100' : ''} ${selectedCommunityId == item.id ? 'bg-orange-50' : ''}`}
                    onMouseDown={() => handleSelect(item)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                  >
                    <img src={item.image_url || '/default-community.png'} className="w-8 h-8 rounded-full mr-3" alt={item.display_name} />
                    <div className="flex-1">
                      <div className="font-medium flex items-center">
                        {item.display_name}
                        {selectedCommunities.includes(item.id) && (
                          <span className="ml-2 text-xs text-blue-500">Subscribed</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">r/{item.name} ・ {item.member_count?.toLocaleString() || 0} members</div>
                    </div>
                  </div>
                )) : (
                  <div className="px-4 py-2 text-gray-400">該当するコミュニティがありません</div>
                )}
                {loadingCommunities && (
                  <div className="px-4 py-2 text-gray-400">検索中...</div>
                )}
              </div>
            )}
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