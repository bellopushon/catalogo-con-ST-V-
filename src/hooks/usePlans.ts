import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plan } from '../contexts/StoreContext';

export function usePlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { data, error: fetchError } = await supabase
          .from('plans')
          .select('*')
          .eq('is_active', true)
          .order('level', { ascending: true });
          
        if (fetchError) {
          throw fetchError;
        }
        
        if (data) {
          const formattedPlans = data.map(plan => ({
            id: plan.id,
            name: plan.name,
            description: plan.description,
            price: parseFloat(plan.price),
            maxStores: plan.max_stores,
            maxProducts: plan.max_products,
            maxCategories: plan.max_categories,
            features: plan.features || [],
            isActive: plan.is_active,
            isFree: plan.is_free,
            level: plan.level,
            createdAt: plan.created_at,
            updatedAt: plan.updated_at
          }));
          
          setPlans(formattedPlans);
        }
      } catch (err: any) {
        console.error('Error fetching plans:', err);
        setError(err.message || 'Error al cargar los planes');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPlans();
  }, []);

  return { plans, loading, error };
}