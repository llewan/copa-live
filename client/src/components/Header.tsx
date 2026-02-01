import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { User as UserIcon, LogOut } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import Logo from './Logo';

export const Header = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();

  return (
    <div className="flex flex-col w-full">
      {/* Main Header */}
      <header className="bg-black text-white h-14">
        <div className="container mx-auto h-full flex items-center justify-between px-4">
          <div className="flex items-center h-full">
            <Link to="/" className="flex items-center h-full mr-8 hover:opacity-80 transition-opacity">
              <Logo />
            </Link>
            
            <nav className="hidden md:flex items-center h-full">
              <Link
                to="/"
                className="px-4 h-full flex items-center text-sm font-bold text-white border-b-2 border-white"
              >
                {t('nav.football')}
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4 text-gray-300">
            {user ? (
              <div className="flex items-center gap-4">
                <Link to="/preferences" className="flex items-center gap-2 hover:text-white transition-colors">
                  <span className="text-sm font-medium">{user.username}</span>
                  <UserIcon className="w-5 h-5" />
                </Link>
                <button 
                  onClick={logout} 
                  className="hover:text-red-400 transition-colors"
                  title={t('nav.signOut')}
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <Link to="/login" className="flex items-center gap-2 hover:text-white transition-colors">
                <span className="text-sm font-medium hidden sm:block">{t('nav.signIn')}</span>
                <UserIcon className="w-5 h-5" />
              </Link>
            )}
          </div>
        </div>
      </header>
    </div>
  );
};

export default Header;
