/*
  # Add Stripe webhook handler function

  1. New Functions
    - `handle_stripe_webhook`: Processes Stripe webhook events
    - `update_user_subscription`: Updates user subscription based on Stripe events
  
  2. Security
    - Functions are set as SECURITY DEFINER to run with elevated privileges
    - Access is restricted to the webhook endpoint
*/

-- Function to handle Stripe webhook events
CREATE OR REPLACE FUNCTION handle_stripe_webhook(payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  event_type TEXT;
  event_id TEXT;
  customer_id TEXT;
  subscription_id TEXT;
  plan_id TEXT;
  user_id UUID;
  result JSONB;
BEGIN
  -- Extract event data
  event_type := payload->>'type';
  event_id := payload->>'id';
  
  -- Log the webhook event
  INSERT INTO stripe_webhooks (
    stripe_event_id,
    event_type,
    data,
    processed
  ) VALUES (
    event_id,
    event_type,
    payload,
    false
  );
  
  -- Process based on event type
  CASE
    -- Handle checkout session completed
    WHEN event_type = 'checkout.session.completed' THEN
      customer_id := payload->'data'->'object'->>'customer';
      subscription_id := payload->'data'->'object'->>'subscription';
      
      -- Get metadata from the session
      plan_id := payload->'data'->'object'->'metadata'->>'plan_id';
      user_id := (payload->'data'->'object'->'metadata'->>'user_id')::UUID;
      
      -- Update user subscription
      IF user_id IS NOT NULL AND plan_id IS NOT NULL THEN
        PERFORM update_user_subscription(
          user_id,
          plan_id,
          subscription_id,
          customer_id,
          'active'
        );
        
        result := jsonb_build_object(
          'success', true,
          'message', 'Subscription created successfully',
          'user_id', user_id,
          'plan_id', plan_id
        );
      ELSE
        result := jsonb_build_object(
          'success', false,
          'message', 'Missing user_id or plan_id in metadata'
        );
      END IF;
    
    -- Handle subscription updated
    WHEN event_type = 'customer.subscription.updated' THEN
      subscription_id := payload->'data'->'object'->>'id';
      customer_id := payload->'data'->'object'->>'customer';
      
      -- Get the subscription status
      DECLARE
        subscription_status TEXT := payload->'data'->'object'->>'status';
        app_status TEXT;
      BEGIN
        -- Map Stripe status to app status
        CASE subscription_status
          WHEN 'active' THEN app_status := 'active';
          WHEN 'canceled' THEN app_status := 'canceled';
          WHEN 'unpaid' THEN app_status := 'expired';
          WHEN 'past_due' THEN app_status := 'expired';
          ELSE app_status := subscription_status;
        END CASE;
        
        -- Find the user by customer ID
        SELECT id INTO user_id
        FROM users
        WHERE subscription_id = subscription_id;
        
        IF user_id IS NOT NULL THEN
          -- Update subscription status
          UPDATE users
          SET subscription_status = app_status,
              updated_at = NOW()
          WHERE id = user_id;
          
          result := jsonb_build_object(
            'success', true,
            'message', 'Subscription status updated',
            'user_id', user_id,
            'status', app_status
          );
        ELSE
          result := jsonb_build_object(
            'success', false,
            'message', 'User not found for subscription'
          );
        END IF;
      END;
    
    -- Handle subscription canceled
    WHEN event_type = 'customer.subscription.deleted' THEN
      subscription_id := payload->'data'->'object'->>'id';
      
      -- Find the user by subscription ID
      SELECT id INTO user_id
      FROM users
      WHERE subscription_id = subscription_id;
      
      IF user_id IS NOT NULL THEN
        -- Update user to canceled status
        UPDATE users
        SET subscription_status = 'canceled',
            subscription_canceled_at = NOW(),
            updated_at = NOW()
        WHERE id = user_id;
        
        result := jsonb_build_object(
          'success', true,
          'message', 'Subscription canceled',
          'user_id', user_id
        );
      ELSE
        result := jsonb_build_object(
          'success', false,
          'message', 'User not found for subscription'
        );
      END IF;
    
    -- Default case for unhandled events
    ELSE
      result := jsonb_build_object(
        'success', true,
        'message', 'Event type not processed: ' || event_type
      );
  END CASE;
  
  -- Mark webhook as processed
  UPDATE stripe_webhooks
  SET processed = true
  WHERE stripe_event_id = event_id;
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error and return failure
    result := jsonb_build_object(
      'success', false,
      'message', 'Error processing webhook: ' || SQLERRM,
      'error', SQLERRM
    );
    RETURN result;
END;
$$;

-- Function to update user subscription
CREATE OR REPLACE FUNCTION update_user_subscription(
  p_user_id UUID,
  p_plan_id TEXT,
  p_subscription_id TEXT,
  p_customer_id TEXT,
  p_status TEXT DEFAULT 'active'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  subscription_end_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Calculate subscription end date (30 days from now)
  subscription_end_date := NOW() + INTERVAL '30 days';
  
  -- Update user subscription details
  UPDATE users
  SET 
    plan = p_plan_id,
    subscription_id = p_subscription_id,
    subscription_status = p_status,
    subscription_start_date = NOW(),
    subscription_end_date = subscription_end_date,
    payment_method = 'stripe',
    updated_at = NOW()
  WHERE id = p_user_id;
  
  -- Record the transaction
  INSERT INTO stripe_transactions (
    id,
    user_id,
    customer_id,
    amount,
    currency,
    status,
    payment_method,
    subscription_id,
    metadata
  )
  SELECT
    'txn_' || p_subscription_id,
    p_user_id,
    p_customer_id,
    p.price,
    'USD',
    'succeeded',
    'stripe',
    p_subscription_id,
    jsonb_build_object(
      'plan_id', p_plan_id,
      'plan_name', p.name
    )
  FROM plans p
  WHERE p.id::text = p_plan_id;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error updating subscription: %', SQLERRM;
    RETURN FALSE;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION handle_stripe_webhook(JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION update_user_subscription(UUID, TEXT, TEXT, TEXT, TEXT) TO service_role;