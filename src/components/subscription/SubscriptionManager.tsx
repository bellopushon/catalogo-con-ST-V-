import { useState } from 'react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { CreditCard, FileText, Settings, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import type { Subscription } from '../../types/stripe';

interface SubscriptionManagerProps {
  subscription: Subscription & {
    plans: {
      name: string;
    };
  };
}

export default function SubscriptionManager({ subscription }: SubscriptionManagerProps) {
  const [loading, setLoading] = useState(false);

  const handleOpenPortal = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/customer-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Error al abrir el portal');
      }

      const { url } = await response.json();
      
      // Abrir portal de Stripe en nueva pestaña
      window.open(url, '_blank', 'noopener,noreferrer');
      
      toast.success('Portal de gestión abierto en nueva pestaña');
    } catch (error) {
      console.error('Error:', error);
      toast.error('No se pudo abrir el portal de gestión');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Activa', variant: 'default' as const },
      canceled: { label: 'Cancelada', variant: 'destructive' as const },
      past_due: { label: 'Pago pendiente', variant: 'warning' as const },
      trialing: { label: 'Prueba gratuita', variant: 'secondary' as const }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Tu Suscripción</CardTitle>
          {getStatusBadge(subscription.status)}
        </div>
        <CardDescription>
          Gestiona tu plan, métodos de pago y facturación
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Plan actual</p>
            <p className="font-medium">{subscription.plans.name}</p>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Próximo pago</p>
            <p className="font-medium">
              {subscription.cancel_at_period_end ? (
                <span className="text-destructive">
                  Expira el {new Date(subscription.current_period_end).toLocaleDateString()}
                </span>
              ) : (
                new Date(subscription.current_period_end).toLocaleDateString()
              )}
            </p>
          </div>
        </div>

        <div className="border rounded-lg p-4 space-y-3">
          <h4 className="font-medium text-sm">En el portal de Stripe podrás:</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Actualizar o cambiar tu método de pago
            </li>
            <li className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Descargar tus facturas y recibos
            </li>
            <li className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Cambiar tu plan o cancelar suscripción
            </li>
          </ul>
        </div>
      </CardContent>
      
      <CardFooter>
        <Button
          onClick={handleOpenPortal}
          disabled={loading}
          className="w-full"
          size="lg"
        >
          {loading ? (
            'Abriendo portal...'
          ) : (
            <>
              Gestionar Suscripción
              <ExternalLink className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
} 