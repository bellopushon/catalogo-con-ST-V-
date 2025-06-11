const handleManageSubscription = async () => {
  try {
    const response = await fetch('/api/create-portal-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customerId: user.stripe_customer_id,
      }),
    });

    const { url } = await response.json();
    window.location.href = url;
  } catch (error) {
    console.error('Error al abrir el portal de Stripe:', error);
  }
};

// En tu JSX
<button onClick={handleManageSubscription}>
  Gestionar Suscripción
</button> 