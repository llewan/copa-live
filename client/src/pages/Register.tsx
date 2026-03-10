import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import { logEvent } from '@/lib/analytics';
import { Trophy, ArrowRight } from 'lucide-react';
import SurfaceCard from '@/components/SurfaceCard';
import StateMessage from '@/components/StateMessage';

const Register = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const { register, isLoading, error } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await register(email, password, username);
    if (useAuthStore.getState().user) {
      logEvent('Auth', 'Register', 'Email');
      navigate('/preferences');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <SurfaceCard variant="elevated" className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center mb-4">
             <Trophy className="h-6 w-6 text-primary-600" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">{t('auth.register_title')}</h2>
          <p className="mt-2 text-sm text-gray-600">
            {t('auth.or')}{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
              {t('auth.signin_link')}
            </Link>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <StateMessage tone="error" message={error} />
          )}
          
          <div className="rounded-md shadow-sm -space-y-px">
             <div>
              <label htmlFor="username" className="sr-only">Username</label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder={t('auth.username_optional')}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="email-address" className="sr-only">Email address</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder={t('auth.email')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder={t('auth.password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="ui-btn-base ui-btn-md ui-btn-primary group relative w-full"
            >
              {isLoading ? t('auth.creating_account') : t('auth.register_button')}
              {!isLoading && (
                 <span className="absolute right-0 inset-y-0 flex items-center pr-3">
                   <ArrowRight className="h-5 w-5 text-primary-500 group-hover:text-primary-400" aria-hidden="true" />
                 </span>
              )}
            </button>
          </div>
        </form>
      </SurfaceCard>
    </div>
  );
};

export default Register;
