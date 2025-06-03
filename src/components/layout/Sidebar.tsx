import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, Plus, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { useCommunityStore } from '../../stores/communityStore';
import { useAuthStore } from '../../stores/authStore';

const Sidebar: React.FC = () => {
  const { communities, fetchCommunities, loading } = useCommunityStore();
  const { user, initialized } = useAuthStore();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = React.useState(true);
  const [showFeedMenu, setShowFeedMenu] = React.useState(false);
  
  useEffect(() => {
    if (initialized && user) {
      fetchCommunities();
    }
  }, [initialized, user, fetchCommunities]);

  // Auto-collapse sidebar on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsOpen(false);
      } else {
        setIsOpen(true);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  // Close sidebar when clicking outside on mobile
  const handleBackdropClick = () => {
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* モバイル用バックドロップ */}
      {isOpen && window.innerWidth < 1024 && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={handleBackdropClick}
        />
      )}

      {/* サイドバー */}
      <aside 
        className={`fixed lg:static top-0 left-0 w-64 h-full bg-white z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } mt-14 lg:mt-0 overflow-y-auto`}
      >
        <div className="flex flex-col h-full p-2">
          {/* フィードセクション */}
          <div className="mb-4">
            <button
              onClick={() => setShowFeedMenu(!showFeedMenu)}
              className="w-full flex items-center justify-between p-2 text-sm font-medium text-gray-500 hover:bg-gray-100 rounded-md"
            >
              <span>フィード</span>
              {showFeedMenu ? (
                <ChevronUp size={16} />
              ) : (
                <ChevronDown size={16} />
              )}
            </button>
            
            {showFeedMenu && (
              <div className="ml-2 space-y-1">
                <Link 
                  to="/" 
                  className="flex items-center p-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  <Home size={16} className="mr-2" />
                  <span>ホーム</span>
                </Link>
                <Link 
                  to="/popular" 
                  className="flex items-center p-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  <span className="w-4 h-4 mr-2 text-center">🔥</span>
                  <span>人気</span>
                </Link>
                <Link 
                  to="/all" 
                  className="flex items-center p-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  <span className="w-4 h-4 mr-2 text-center">🌐</span>
                  <span>すべて</span>
                </Link>
              </div>
            )}
          </div>
          
          {/* コミュニティセクション */}
          <div className="mb-4">
            <div className="flex items-center justify-between p-2">
              <h3 className="text-xs font-medium text-gray-500 uppercase">コミュニティ</h3>
              {loading ? (
                <RefreshCw size={14} className="text-gray-400 animate-spin" />
              ) : (
                <button 
                  onClick={() => fetchCommunities()}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <RefreshCw size={14} />
                </button>
              )}
            </div>
            
            {/* コミュニティリスト */}
            <div className="space-y-1">
              {communities.length > 0 ? (
                communities.map((community) => (
                  <Link
                    key={community.id}
                    to={`/c/${community.name}`}
                    className="flex items-center p-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                  >
                    <div className="w-6 h-6 mr-2 bg-gray-200 rounded-full overflow-hidden flex items-center justify-center">
                      {community.image_url ? (
                        <img 
                          src={community.image_url} 
                          alt={community.display_name} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xs font-bold">
                          {community.display_name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <span className="truncate">{community.display_name}</span>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-gray-500 p-2">
                  {user ? 'コミュニティが選択されていません' : 'ログインしてコミュニティを選択してください'}
                </p>
              )}
            </div>
            
            {/* コミュニティ追加ボタン */}
            {user && (
              <button
                onClick={() => navigate('/community-selection')}
                className="flex items-center w-full mt-2 p-2 text-sm text-[var(--primary)] hover:bg-gray-100 rounded-md"
              >
                <Plus size={16} className="mr-2" />
                <span>コミュニティを追加</span>
              </button>
            )}
          </div>
          
          {/* リソースセクション */}
          <div className="mt-auto text-xs text-gray-500 p-2 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-2">
              <Link to="/help" className="hover:underline">ヘルプ</Link>
              <Link to="/about" className="hover:underline">Redditsuについて</Link>
              <Link to="/terms" className="hover:underline">利用規約</Link>
              <Link to="/privacy" className="hover:underline">プライバシー</Link>
            </div>
            <p className="mt-2">© {new Date().getFullYear()} Redditsu</p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;