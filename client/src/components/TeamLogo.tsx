import React, { useState } from 'react';
import { Shield } from 'lucide-react';

interface TeamLogoProps {
  src?: string;
  alt: string;
  className?: string;
}

export const TeamLogo: React.FC<TeamLogoProps> = ({ src, alt, className = '' }) => {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-full ${className}`} title={alt}>
        <Shield className="w-1/2 h-1/2 text-gray-400" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setError(true)}
      loading="lazy"
    />
  );
};
