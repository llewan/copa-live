import React from 'react';
import { Trophy } from 'lucide-react';

const Logo = () => {
  return (
    <div className="flex items-center gap-2">
      <div className="relative w-8 h-8 flex items-center justify-center bg-white rounded-full">
        <Trophy className="w-5 h-5 text-primary-600" />
      </div>
      <span className="text-xl font-black tracking-tight text-white">
        Copa<span className="text-gray-400">Live</span>
      </span>
    </div>
  );
};

export default Logo;
