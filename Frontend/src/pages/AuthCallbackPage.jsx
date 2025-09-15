import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  useEffect(() => {
    const token = searchParams.get('token');
    const userString = searchParams.get('user');

    if (token && userString) {
      try {
        const user = JSON.parse(decodeURIComponent(userString));
        login({ token, user });
        setTimeout(() => {
            navigate(user.role === 'ARTISAN' ? '/dashboard' : '/');
        }, 500);
      } catch (error) {
        console.error("Failed to process auth callback:", error);
        navigate('/'); 
      }
    } else {
      console.error("Auth callback is missing token or user data.");
      navigate('/');
    }
  }, [searchParams, login, navigate]);

  return (
    <div className="flex flex-col justify-center items-center h-screen">
      <Loader2 className="h-8 w-8 animate-spin mb-4" />
      <p className="text-muted-foreground">Finalizing your login, please wait...</p>
    </div>
  );
}