import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus } from 'lucide-react';
import { useCommunityStore } from '../stores/communityStore';
import { useAuthStore } from '../stores/authStore';
import { Community } from '../lib/supabase';
import ImageUploader from '../components/profile/AvatarUploader';
import { supabase } from '../lib/supabase';

const CommunitySelectionPage: React.FC = () => {
  const { 
    defaultCommunities, 
    communities,
    fetchDefaultCommunities, 
    searchCommunities,
    createCommunity
  } = useCommunityStore();
  
  const { selectedCommunities, setSelectedCommunities } = useAuthStore();
  const navigate = useNavigate();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Community[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>(selectedCommunities);
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCommunityName, setNewCommunityName] = useState('');
  const [newCommunityDisplayName, setNewCommunityDisplayName] = useState('');
  const [newCommunityDescription, setNewCommunityDescription] = useState('');
  const [error, setError] = useState('');
  
  // Fetch default communities on mount
  useEffect(() => {
    fetchDefaultCommunities();
  }, [fetchDefaultCommunities]);
  
  // Update search results when query changes
  useEffect(() => {
    const fetchResults = async () => {
      if (searchQuery.length >= 2) {
        const results = await searchCommunities(searchQuery);
        setSearchResults(results);
      } else {
        setSearchResults([]);
      }
    };
    
    fetchResults();
  }, [searchQuery, searchCommunities]);
  
  const handleToggleCommunity = (communityId: number) => {
    setSelectedIds(prev => {
      if (prev.includes(communityId)) {
        return prev.filter(id => id !== communityId);
      } else {
        return [...prev, communityId];
      }
    });
  };
  
  const handleSaveSelection = () => {
    setSelectedCommunities(selectedIds);
    localStorage.removeItem('first_login');
    navigate('/');
  };
  
  const handleSkip = () => {
    localStorage.removeItem('first_login');
    navigate('/');
  };
  
  const handleCreateCommunity = async () => {
    // Validate
    if (!newCommunityName || !newCommunityDisplayName) {
      setError('コミュニティ名と表示名は必須です');
      return;
    }
    
    if (!/^[a-z0-9_]+$/.test(newCommunityName)) {
      setError('コミュニティ名は英小文字、数字、アンダースコアのみ使用できます');
      return;
    }
    
    try {
      const newCommunity = await createCommunity({
        name: newCommunityName,
        display_name: newCommunityDisplayName,
        description: newCommunityDescription
      });
      
      if (newCommunity) {
        setShowCreateForm(false);
        setNewCommunityName('');
        setNewCommunityDisplayName('');
        setNewCommunityDescription('');
        setError('');
        
        // Auto-select the new community
        if (!selectedIds.includes(newCommunity.id)) {
          setSelectedIds(prev => [...prev, newCommunity.id]);
        }
      }
    } catch (err: any) {
      setError(err.message || 'コミュニティの作成に失敗しました');
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-2">コミュニティを選択</h1>
        <p className="text-gray-600 mb-6">
          参加したいコミュニティを選択してください。少なくとも1つ選択する必要があります。
        </p>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="コミュニティを検索..."
              className="w-full py-2 pl-10 pr-4 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          </div>
        </div>
        
        {/* Create community button */}
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="mb-6 flex items-center text-[var(--primary)] hover:text-[var(--primary-hover)]"
        >
          <Plus size={20} className="mr-1" />
          新しいコミュニティを作成
        </button>
        
        {/* Create community form */}
        {showCreateForm && (
          <div className="mb-6 p-4 border border-gray-200 rounded-md bg-gray-50">
            <h3 className="text-lg font-medium mb-3">新しいコミュニティ</h3>
            
            <div className="mb-3">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                コミュニティ名 (URL用、英小文字・数字・アンダースコアのみ)
              </label>
              <input
                id="name"
                type="text"
                value={newCommunityName}
                onChange={(e) => setNewCommunityName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                placeholder="example_community"
              />
            </div>
            
            <div className="mb-3">
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
                表示名
              </label>
              <input
                id="displayName"
                type="text"
                value={newCommunityDisplayName}
                onChange={(e) => setNewCommunityDisplayName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                placeholder="コミュニティの表示名"
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                説明 (任意)
              </label>
              <textarea
                id="description"
                value={newCommunityDescription}
                onChange={(e) => setNewCommunityDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                placeholder="コミュニティの説明"
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
              >
                キャンセル
              </button>
              <button
                onClick={handleCreateCommunity}
                className="px-4 py-2 bg-[var(--primary)] text-white rounded-md hover:bg-[var(--primary-hover)]"
              >
                作成
              </button>
            </div>
          </div>
        )}
        
        {/* Community grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {/* Show search results if searching */}
          {searchQuery.length >= 2 ? (
            searchResults.length > 0 ? (
              searchResults.map(community => (
                <div 
                  key={community.id}
                  onClick={() => handleToggleCommunity(community.id)}
                  className={`p-4 rounded-md border cursor-pointer transition-all ${
                    selectedIds.includes(community.id)
                      ? 'border-[var(--primary)] bg-orange-50'
                      : 'border-gray-200 hover:border-[var(--primary)]'
                  }`}
                >
                  <div className="flex items-center mb-2">
                    {community.image_url ? (
                      <img 
                        src={community.image_url} 
                        alt={community.display_name}
                        className="w-8 h-8 rounded-full mr-2"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-2">
                        <span className="text-sm font-bold text-gray-600">
                          {community.display_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <h3 className="font-medium">{community.display_name}</h3>
                  </div>
                  {community.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">{community.description}</p>
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-gray-500">
                検索結果がありません
              </div>
            )
          ) : (
            // Show default communities + user's communities
            [...defaultCommunities, ...communities].map(community => (
              <div 
                key={community.id}
                onClick={() => handleToggleCommunity(community.id)}
                className={`p-4 rounded-md border cursor-pointer transition-all ${
                  selectedIds.includes(community.id)
                    ? 'border-[var(--primary)] bg-orange-50'
                    : 'border-gray-200 hover:border-[var(--primary)]'
                }`}
              >
                <div className="flex items-center mb-2">
                  {community.image_url ? (
                    <img 
                      src={community.image_url} 
                      alt={community.display_name}
                      className="w-8 h-8 rounded-full mr-2"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-2">
                      <span className="text-sm font-bold text-gray-600">
                        {community.display_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <h3 className="font-medium">{community.display_name}</h3>
                </div>
                {community.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">{community.description}</p>
                )}
              </div>
            ))
          )}
        </div>
        
        {/* Save button */}
        <div className="flex justify-end items-center space-x-4">
          <button
            onClick={handleSkip}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
            type="button"
          >
            スキップ
          </button>
          <button
            onClick={handleSaveSelection}
            className="px-6 py-2 bg-[var(--primary)] text-white rounded-md hover:bg-[var(--primary-hover)]"
            type="button"
          >
            続ける ({selectedIds.length} 選択)
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommunitySelectionPage;

// 新規コミュニティ作成フォームをコンポーネント化
export const CommunityCreateForm: React.FC<{
  onCreated?: (community: Community) => void;
}> = ({ onCreated }) => {
  const { createCommunity } = useCommunityStore();
  const [newCommunityName, setNewCommunityName] = useState('');
  const [newCommunityDisplayName, setNewCommunityDisplayName] = useState('');
  const [newCommunityDescription, setNewCommunityDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // 画像アップロード処理
  const uploadImage = async (file: File, communityName: string): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const filePath = `${communityName}/${Date.now()}.${ext}`;
    setUploading(true);
    const { data, error } = await supabase.storage
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
    // 画像の公開URLを取得
    const { data: publicUrlData } = supabase.storage
      .from('community-images')
      .getPublicUrl(filePath);
    return publicUrlData?.publicUrl || null;
  };

  const handleCreateCommunity = async () => {
    if (!newCommunityName || !newCommunityDisplayName) {
      setError('コミュニティ名と表示名は必須です');
      return;
    }
    if (!/^[a-z0-9_]+$/.test(newCommunityName)) {
      setError('コミュニティ名は英小文字、数字、アンダースコアのみ使用できます');
      return;
    }
    let uploadedImageUrl: string | null = null;
    if (imageFile) {
      uploadedImageUrl = await uploadImage(imageFile, newCommunityName);
      if (!uploadedImageUrl) return;
    }
    try {
      const newCommunity = await createCommunity({
        name: newCommunityName,
        display_name: newCommunityDisplayName,
        description: newCommunityDescription,
        image_url: uploadedImageUrl || null,
      });
      if (newCommunity) {
        setNewCommunityName('');
        setNewCommunityDisplayName('');
        setNewCommunityDescription('');
        setImageFile(null);
        setImageUrl(null);
        setError('');
        if (onCreated) onCreated(newCommunity);
        else navigate(`/c/${newCommunity.name}`);
      }
    } catch (err: any) {
      setError(err.message || 'コミュニティの作成に失敗しました');
    }
  };

  return (
    <div className="max-w-lg mx-auto bg-white p-6 rounded-lg shadow-md mt-8">
      <h1 className="text-2xl font-bold mb-4">新しいコミュニティ</h1>
      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">{error}</div>}
      <div className="mb-3">
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          コミュニティ名 (URL用、英小文字・数字・アンダースコアのみ)
        </label>
        <input
          id="name"
          type="text"
          value={newCommunityName}
          onChange={e => setNewCommunityName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
          placeholder="example_community"
        />
      </div>
      <div className="mb-3">
        <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
          表示名
        </label>
        <input
          id="displayName"
          type="text"
          value={newCommunityDisplayName}
          onChange={e => setNewCommunityDisplayName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
          placeholder="コミュニティの表示名"
        />
      </div>
      <div className="mb-4">
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          説明 (任意)
        </label>
        <textarea
          id="description"
          value={newCommunityDescription}
          onChange={e => setNewCommunityDescription(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
          placeholder="コミュニティの説明"
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          コミュニティ画像 (5MB以下/JPEG/PNG)
        </label>
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
          onClick={() => navigate(-1)}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
        >
          キャンセル
        </button>
        <button
          onClick={handleCreateCommunity}
          className="px-4 py-2 bg-[var(--primary)] text-white rounded-md hover:bg-[var(--primary-hover)]"
          disabled={uploading}
        >
          作成
        </button>
      </div>
    </div>
  );
};