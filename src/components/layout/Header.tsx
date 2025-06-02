import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, LogIn, User, PlusCircle, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

const Header: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim().length > 0) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
    navigate('/');
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 flex items-center justify-between h-14">
        {/* Logo - Left */}
        <Link to="/" className="flex items-center">
          <span className="text-2xl font-bold text-[var(--primary)]">
            Redditsu
          </span>
        </Link>

        {/* Search - Center */}
        <form 
          onSubmit={handleSearch}
          className="flex-grow max-w-xl mx-4 relative hidden md:block"
        >
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="検索..."
              className="w-full py-2 pl-10 pr-4 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          </div>
        </form>

        {/* User Menu - Right */}
        <div className="flex items-center">
          {user ? (
            <div className="relative">
              <button 
                onClick={toggleUserMenu}
                className="flex items-center text-gray-700 hover:text-[var(--primary)] transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                  {user.user_metadata?.avatar_url ? (
                    <img 
                      src={user.user_metadata.avatar_url} 
                      alt="User" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={20} className="text-gray-500" />
                  )}
                </div>
                <ChevronDown size={16} className="ml-1" />
              </button>
              
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 animate-fadeIn">
                  <Link 
                    to="/profile" 
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowUserMenu(false)}
                  >
                    プロフィール
                  </Link>
                  <Link 
                    to="/create-post" 
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <span className="flex items-center">
                      <PlusCircle size={16} className="mr-2" />
                      投稿を作成
                    </span>
                  </Link>
                  <Link 
                    to="/community-selection" 
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowUserMenu(false)}
                  >
                    コミュニティ選択
                  </Link>
                  <hr className="my-1" />
                  <button 
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                  >
                    ログアウト
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link 
              to="/login" 
              className="flex items-center text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium"
            >
              <LogIn size={18} className="mr-1" />
              ログイン
            </Link>
          )}
        </div>
      </div>
      
      {/* Mobile Search */}
      <div className="md:hidden px-4 pb-3">
        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="検索..."
            className="w-full py-2 pl-10 pr-4 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        </form>
      </div>
    </header>
  );
};

export default Header;