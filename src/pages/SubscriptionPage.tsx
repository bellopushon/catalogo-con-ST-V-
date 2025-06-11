import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { User } from '../types';
import { Invoice } from '../constants/stripe';
import { Spinner } from '../components/ui/Spinner';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { formatDate } from '../utils/date';

export const SubscriptionPage: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('');
  const [subscriptionEndDate, setSubscriptionEndDate] = useState<string>('');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      try {
        const response = await fetch('/api/stripe-subscription-status', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (!response.ok) {
          throw new Error('Error al obtener el estado de la suscripción');
        }

        const data = await response.json();
        setSubscriptionStatus(data.status);
        setSubscriptionEndDate(data.current_period_end);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoadingStatus(false);
      }
    };

    const fetchInvoices = async () => {
      try {
        const response = await fetch('/api/stripe-invoices', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (!response.ok) {
          throw new Error('Error al obtener las facturas');
        }

        const data = await response.json();
        setInvoices(data.invoices);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoadingInvoices(false);
      }
    };

    if (user) {
      fetchSubscriptionStatus();
      fetchInvoices();
    }
  }, [user]);

  const handleOpenBillingPortal = async () => {
    try {
      const response = await fetch('/api/stripe-billing-portal', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al abrir el portal de facturación');
      }

      const data = await response.json();
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  if (loading || loadingStatus) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Gestión de Suscripción</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <Card className="mb-8">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Resumen de Suscripción</h2>
          <div className="space-y-4">
            <div>
              <p className="text-gray-600">Plan actual</p>
              <p className="font-medium">{user?.plan || 'Gratuito'}</p>
            </div>
            <div>
              <p className="text-gray-600">Estado</p>
              <p className="font-medium capitalize">{subscriptionStatus}</p>
            </div>
            {subscriptionEndDate && (
              <div>
                <p className="text-gray-600">Próxima fecha de facturación</p>
                <p className="font-medium">{formatDate(subscriptionEndDate)}</p>
              </div>
            )}
            <Button
              onClick={handleOpenBillingPortal}
              className="w-full sm:w-auto"
            >
              Gestionar Suscripción
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Historial de Facturas</h2>
          {loadingInvoices ? (
            <div className="flex justify-center py-4">
              <Spinner />
            </div>
          ) : invoices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Monto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(invoice.created)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          invoice.status === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {invoice.status === 'paid' ? 'Pagada' : 'Pendiente'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Intl.NumberFormat('es-ES', {
                          style: 'currency',
                          currency: invoice.currency,
                        }).format(invoice.amount_paid / 100)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <a
                          href={invoice.hosted_invoice_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Ver factura
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">
              No hay facturas disponibles
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}; 