import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useUiStore } from './stores/uiStore';

// Components
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Pages
import HomePage from './pages/HomePage';
import PostDetailPage from './pages/PostDetailPage';
import CommunityPage from './pages/CommunityPage';
import SearchPage from './pages/SearchPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CommunitySelectionPage from './pages/CommunitySelectionPage';
import CreatePostPage from './pages/CreatePostPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';
import CommunityCreatePage from './pages/CommunityCreatePage';

// Hooks
import { useAuthStore } from './stores/authStore';

function App() {
  const { user, initialized } = useAuthStore();
  const { isSidebarOpen } = useUiStore();

  if (!initialized) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <Header />
        <div className="flex flex-grow relative">
          <Sidebar />
          {/* Overlay for mobile */}
          <div 
            className={`fixed inset-0 bg-black transition-opacity duration-300 lg:hidden ${
              isSidebarOpen ? 'opacity-50 z-30' : 'opacity-0 pointer-events-none'
            }`}
          />
          <main className={`flex-grow p-4 transition-all duration-300 ease-in-out ${
            isSidebarOpen ? 'lg:ml-64 blur-sm lg:blur-none' : ''
          }`}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/post/:postId" element={<PostDetailPage />} />
              <Route path="/c/:communityName" element={<CommunityPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route 
                path="/community-selection" 
                element={
                  <ProtectedRoute>
                    <CommunitySelectionPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/community-create"
                element={
                  <ProtectedRoute>
                    <CommunityCreatePage />
                  </ProtectedRoute>
                }
              />
              <Route 
                path="/create-post" 
                element={
                  <ProtectedRoute>
                    <CreatePostPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                } 
              />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;