import { useState, useEffect } from 'react';
import { User } from '../types';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export const useAuth = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setState({ user: null, loading: false, error: null });
          return;
        }

        const response = await fetch('/api/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Error al obtener el usuario');
        }

        let user = await response.json();
        // Mapear stripe_customer_id a stripeCustomerId si existe
        if (user && user.stripe_customer_id && !user.stripeCustomerId) {
          user.stripeCustomerId = user.stripe_customer_id;
        }
        setState({ user, loading: false, error: null });
      } catch (error) {
        setState({
          user: null,
          loading: false,
          error: error instanceof Error ? error.message : 'Error desconocido',
        });
      }
    };

    fetchUser();
  }, []);

  return state;
}; 