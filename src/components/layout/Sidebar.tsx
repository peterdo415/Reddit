import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, Plus, RefreshCw, Menu } from 'lucide-react';
import { useCommunityStore } from '../../stores/communityStore';
import { useAuthStore } from '../../stores/authStore';
import { useUiStore } from '../../stores/uiStore';

const Sidebar: React.FC = () => {
  const { communities, fetchCommunities, loading } = useCommunityStore();
  const { user, initialized } = useAuthStore();
  const { isSidebarOpen, toggleSidebar, closeSidebar } = useUiStore();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (initialized && user) {
      fetchCommunities();
    }
  }, [initialized, user, fetchCommunities]);

  useEffect(() => {
    closeSidebar();
  }, [location.pathname, closeSidebar]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        closeSidebar();
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [closeSidebar]);

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={toggleSidebar}
        className={`fixed left-2 top-20 w-8 h-8 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center text-gray-600 hover:text-gray-900 focus:outline-none lg:hidden z-50 transform transition-transform duration-300 ${
          isSidebarOpen ? 'translate-x-48' : ''
        }`}
        aria-label={isSidebarOpen ? 'サイドバーを閉じる' : 'サイドバーを開く'}
      >
        <Menu size={20} />
      </button>

      {/* Vertical Line */}
      <div className={`fixed left-6 top-14 h-[calc(100%-3.5rem)] border-l border-gray-200 lg:hidden transform transition-transform duration-300 ${
        isSidebarOpen ? 'translate-x-48' : ''
      }`} />

      {/* Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 lg:hidden z-40"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed top-14 left-0 w-[calc(48rem/8)] h-[calc(100vh-3.5rem)] bg-white lg:border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 z-50 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full p-4">
          {/* Home Link */}
          <Link 
            to="/" 
            className="flex items-center p-2 text-gray-700 hover:bg-gray-100 rounded-md"
            onClick={closeSidebar}
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
                    onClick={closeSidebar}
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
                  closeSidebar();
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