import React, { useRef, useState } from 'react';

// デフォルトアバター画像（public配下に配置する想定）
const DEFAULT_AVATAR_URL = '/default-avatar.png';

type Props = {
  avatarUrl?: string | null;
  onFileSelect: (file: File | null) => void;
};

const AvatarUploader: React.FC<Props> = ({ avatarUrl, onFileSelect }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // バリデーション関数
  const validateImage = (file: File): string | null => {
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      return 'JPEGまたはPNG画像のみアップロードできます。';
    }
    if (file.size > 5 * 1024 * 1024) {
      return '画像サイズは5MB以下にしてください。';
    }
    return null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setPreview(null);
      onFileSelect(null);
      return;
    }
    const validationError = validateImage(file);
    if (validationError) {
      setError(validationError);
      setPreview(null);
      onFileSelect(null);
      return;
    }
    setError(null);
    setPreview(URL.createObjectURL(file));
    onFileSelect(file);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <img
        src={preview || avatarUrl || DEFAULT_AVATAR_URL}
        alt="プロフィール画像"
        className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
      />
      <button
        type="button"
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        onClick={() => inputRef.current?.click()}
      >
        画像を変更
      </button>
      <input
        type="file"
        accept="image/jpeg,image/png"
        className="hidden"
        ref={inputRef}
        onChange={handleFileChange}
      />
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
};

export default AvatarUploader; 