import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, LogIn, User, PlusCircle, Menu, X } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useUiStore } from '../../stores/uiStore';

const Header: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { isMenuOpen, toggleMenu, closeMenu } = useUiStore();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showUserMenu, setShowUserMenu] = React.useState(false);

  // Close menu on route change
  useEffect(() => {
    closeMenu();
  }, [location.pathname, closeMenu]);

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeMenu();
        setShowUserMenu(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [closeMenu]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim().length > 0) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
    navigate('/');
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 flex items-center justify-between h-14">
        {/* Logo */}
        <Link to="/" className="flex items-center">
          <span className="text-2xl font-bold text-[var(--primary)]">
            Redditsu
          </span>
        </Link>

        {/* Search - Desktop */}
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

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-4">
          {user ? (
            <div className="relative">
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
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
              </button>
              
              {showUserMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 animate-fadeIn">
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
                </>
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

        {/* Mobile Menu Button */}
        <button
          onClick={toggleMenu}
          className="md:hidden p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
          aria-label="メニュー"
        >
          {isMenuOpen ? (
            <X size={24} className="transition-transform duration-200 ease-in-out" />
          ) : (
            <Menu size={24} className="transition-transform duration-200 ease-in-out" />
          )}
        </button>

        {/* Mobile Menu Overlay */}
        {isMenuOpen && (
          <>
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
              onClick={closeMenu}
            />
            <div className="fixed top-14 right-0 w-64 bg-white shadow-lg z-50 md:hidden transform transition-transform duration-200 ease-in-out">
              <div className="py-2">
                {user ? (
                  <>
                    <div className="px-4 py-3 border-b border-gray-200">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                          {user.user_metadata?.avatar_url ? (
                            <img 
                              src={user.user_metadata.avatar_url} 
                              alt="User" 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User size={24} className="text-gray-500" />
                          )}
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-700">
                            {user.user_metadata?.username || user.email}
                          </p>
                        </div>
                      </div>
                    </div>
                    <Link 
                      to="/profile" 
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                      onClick={closeMenu}
                    >
                      プロフィール
                    </Link>
                    <Link 
                      to="/create-post" 
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                      onClick={closeMenu}
                    >
                      <span className="flex items-center">
                        <PlusCircle size={16} className="mr-2" />
                        投稿を作成
                      </span>
                    </Link>
                    <Link 
                      to="/community-selection" 
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                      onClick={closeMenu}
                    >
                      コミュニティ選択
                    </Link>
                    <hr className="my-1" />
                    <button 
                      onClick={() => {
                        handleLogout();
                        closeMenu();
                      }}
                      className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      ログアウト
                    </button>
                  </>
                ) : (
                  <Link 
                    to="/login" 
                    className="block px-4 py-2 text-[var(--primary)] hover:bg-gray-100"
                    onClick={closeMenu}
                  >
                    <span className="flex items-center">
                      <LogIn size={18} className="mr-2" />
                      ログイン
                    </span>
                  </Link>
                )}
              </div>
            </div>
          </>
        )}
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