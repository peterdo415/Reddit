import React, { useRef, useState } from 'react';
import { validateImage } from '../../lib/imageUpload';

// デフォルトコミュニティ画像（public配下に配置する想定）
const DEFAULT_COMMUNITY_IMAGE_URL = '/default-community.png';

type Props = {
  imageUrl?: string | null;
  onFileSelect: (file: File | null) => void;
  defaultImageUrl: string;
  alt?: string;
  className?: string;
  buttonLabel?: string;
};

const ImageUploader: React.FC<Props> = ({
  imageUrl,
  onFileSelect,
  defaultImageUrl,
  alt = '画像',
  className = 'w-24 h-24 rounded-full object-cover border-2 border-gray-200',
  buttonLabel = '画像を変更',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        src={preview || imageUrl || defaultImageUrl}
        alt={alt}
        className={className}
      />
      <button
        type="button"
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        onClick={() => inputRef.current?.click()}
      >
        {buttonLabel}
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

export default ImageUploader; 