import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, Plus, RefreshCw } from 'lucide-react';
import { useCommunityStore } from '../../stores/communityStore';
import { useAuthStore } from '../../stores/authStore';
import { useSidebarStore } from '../../stores/sidebarStore';

const Sidebar: React.FC = () => {
  const { communities, fetchCommunities, loading } = useCommunityStore();
  const { user, initialized } = useAuthStore();
  const { isOpen, close } = useSidebarStore();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (initialized && user) {
      fetchCommunities();
    }
  }, [initialized, user, fetchCommunities]);

  // Close sidebar on window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        close();
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [close]);

  const handleLinkClick = () => {
    if (window.innerWidth < 1024) {
      close();
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={close}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed lg:sticky top-0 left-0 h-full w-64 bg-white z-50 border-r border-gray-200 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } pt-14 lg:pt-0`}
      >
        <div className="flex flex-col h-full p-4">
          {/* Home Link */}
          <Link 
            to="/" 
            className="flex items-center p-2 text-gray-700 hover:bg-gray-100 rounded-md"
            onClick={handleLinkClick}
          >
            <Home size={20} className="mr-2" />
            <span>ホーム</span>
          </Link>
          
          {/* Communities Section */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-500 uppercase">コミュニティ</h3>
              {loading ? (
                <RefreshCw size={16} className="text-gray-400 animate-spin" />
              ) : (
                <button 
                  onClick={() => fetchCommunities()}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <RefreshCw size={16} />
                </button>
              )}
            </div>
            
            {/* Communities List */}
            <div className="space-y-1">
              {communities.length > 0 ? (
                communities.map((community) => (
                  <Link
                    key={community.id}
                    to={`/c/${community.name}`}
                    className="flex items-center p-2 text-gray-700 hover:bg-gray-100 rounded-md"
                    onClick={handleLinkClick}
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
            
            {/* Add Community Button */}
            {user && (
              <button
                onClick={() => {
                  navigate('/community-selection');
                  handleLinkClick();
                }}
                className="flex items-center mt-4 p-2 text-[var(--primary)] hover:bg-gray-100 rounded-md w-full"
              >
                <Plus size={20} className="mr-2" />
                <span>コミュニティを追加</span>
              </button>
            )}
          </div>
          
          {/* Footer */}
          <div className="mt-auto text-xs text-gray-500 pt-4">
            <p>© {new Date().getFullYear()} Redditsu</p>
            <p className="mt-1">今話題の投稿を見つけよう</p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;