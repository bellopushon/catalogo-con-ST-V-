import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  email: string;
  name: string;
  plan: string;
  subscriptionStatus?: string;
  createdAt: string;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  maxStores: number;
  maxProducts: number;
  isActive: boolean;
  isFree: boolean;
  level: number;
}

interface SuperAdminContextType {
  users: User[];
  plans: Plan[];
  isLoading: boolean;
  error: string | null;
  loadUsers: () => Promise<void>;
  loadPlans: () => Promise<void>;
  updateUserPlan: (userId: string, planId: string) => Promise<void>;
}

const SuperAdminContext = createContext<SuperAdminContextType | null>(null);

export const SuperAdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('users')
        .select('id, email, name, plan, subscription_status, created_at')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setUsers(data?.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan,
        subscriptionStatus: user.subscription_status,
        createdAt: user.created_at
      })) || []);
    } catch (err: any) {
      console.error('Error loading users:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPlans = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .order('level', { ascending: true });
      
      if (error) throw error;
      
      setPlans(data?.map(plan => ({
        id: plan.id,
        name: plan.name,
        price: parseFloat(plan.price),
        maxStores: plan.max_stores,
        maxProducts: plan.max_products,
        isActive: plan.is_active,
        isFree: plan.is_free,
        level: plan.level
      })) || []);
    } catch (err: any) {
      console.error('Error loading plans:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserPlan = async (userId: string, planId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get Supabase URL from environment
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) {
        throw new Error('Supabase URL not configured');
      }
      
      // Get authentication token
      const { data: { session } } = await supabase.auth.getSession();
      const userToken = session?.access_token;
      
      if (!userToken) {
        throw new Error('No authentication token available');
      }
      
      // Call the Edge Function to update the user's plan
      const response = await fetch(`${supabaseUrl}/functions/v1/update-user-plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({
          userId,
          planId
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error updating user plan');
      }
      
      // Refresh the users list
      await loadUsers();
      
    } catch (err: any) {
      console.error('Error updating plan:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const checkSuperAdmin = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setError('No authenticated user');
          setIsLoading(false);
          return;
        }
        
        // Check if user is super admin
        const { data, error } = await supabase
          .from('users')
          .select('email')
          .eq('id', user.id)
          .single();
        
        if (error) throw error;
        
        if (data.email !== 'the.genio27@gmail.com') {
          setError('Unauthorized: Only super admin can access this page');
        } else {
          // Load initial data
          await Promise.all([loadUsers(), loadPlans()]);
        }
      } catch (err: any) {
        console.error('Error checking super admin:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkSuperAdmin();
  }, []);

  return (
    <SuperAdminContext.Provider value={{
      users,
      plans,
      isLoading,
      error,
      loadUsers,
      loadPlans,
      updateUserPlan
    }}>
      {children}
    </SuperAdminContext.Provider>
  );
};

export const useSuperAdmin = () => {
  const context = useContext(SuperAdminContext);
  if (!context) {
    throw new Error('useSuperAdmin must be used within a SuperAdminProvider');
  }
  return context;
};