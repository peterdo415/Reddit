import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-[var(--primary)] mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">ページが見つかりません</h2>
        <p className="text-gray-600 mb-8">
          お探しのページは存在しないか、移動された可能性があります。
        </p>
        <Link 
          to="/" 
          className="inline-flex items-center px-6 py-3 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
        >
          <Home size={20} className="mr-2" />
          ホームに戻る
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;