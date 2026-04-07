'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import {
  type CheckoutConfig,
  type TokenCreatedData,
  type PayViaPostMessage,
  PAYVIA_CHECKOUT_URLS,
  PAYVIA_ALLOWED_ORIGINS,
  type PayViaEnvironment,
} from '@/lib/payvia';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export interface PayViaCheckoutProps {
  /** Checkout configuration to send to iframe */
  config: Omit<CheckoutConfig, 'merchantId'>;
  /** Environment (staging or production) */
  environment?: PayViaEnvironment;
  /** Called when payment token is created */
  onTokenCreated: (data: TokenCreatedData) => void;
  /** Called when an error occurs */
  onError?: (error: string) => void;
  /** Called when iframe is ready */
  onReady?: () => void;
  /** Called when validation error occurs */
  onValidationError?: (errors: Record<string, string>) => void;
  /** Custom class name for the container */
  className?: string;
  /** Whether the component is in a loading/disabled state */
  disabled?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function PayViaCheckout({
  config,
  environment = 'staging',
  onTokenCreated,
  onError,
  onReady,
  onValidationError,
  className = '',
  disabled = false,
}: PayViaCheckoutProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isIframeReady, setIsIframeReady] = useState(false);
  const [iframeHeight, setIframeHeight] = useState(600);
  const [error, setError] = useState<string | null>(null);
  const configSentRef = useRef(false);

  // Store callbacks in refs to avoid re-registering event listeners
  const onTokenCreatedRef = useRef(onTokenCreated);
  const onErrorRef = useRef(onError);
  const onReadyRef = useRef(onReady);
  const onValidationErrorRef = useRef(onValidationError);

  // Guard to prevent duplicate token submissions
  const tokenProcessedRef = useRef(false);

  // Keep refs in sync with latest callbacks
  useEffect(() => {
    onTokenCreatedRef.current = onTokenCreated;
    onErrorRef.current = onError;
    onReadyRef.current = onReady;
    onValidationErrorRef.current = onValidationError;
  });

  const checkoutUrl = PAYVIA_CHECKOUT_URLS[environment];
  const merchantId = process.env.NEXT_PUBLIC_PAYVIA_MERCHANT_ID || '';

  // Send checkout configuration to iframe
  const sendCheckoutConfig = useCallback(() => {
    if (!iframeRef.current?.contentWindow || configSentRef.current) {
      return;
    }

    const fullConfig: CheckoutConfig = {
      ...config,
      merchantId,
    };

    iframeRef.current.contentWindow.postMessage(
      {
        type: 'digitzs:init-checkout',
        config: fullConfig,
      },
      checkoutUrl
    );

    configSentRef.current = true;
  }, [config, merchantId, checkoutUrl]);

  // Handle postMessage events from iframe
  // Using refs for callbacks to prevent re-registering listeners on every render
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Security: Validate origin
      if (!PAYVIA_ALLOWED_ORIGINS.includes(event.origin)) {
        console.warn('[PayViaCheckout] Rejected message from untrusted origin:', event.origin);
        return;
      }

      const message = event.data as PayViaPostMessage;

      switch (message.type) {
        case 'digitzs:ready':
          console.log('[PayViaCheckout] Iframe ready');
          setIsIframeReady(true);
          setError(null);
          onReadyRef.current?.();
          // Send config when iframe signals ready
          sendCheckoutConfig();
          break;

        case 'digitzs:token-created':
          // Guard against duplicate token submissions
          if (tokenProcessedRef.current) {
            console.warn('[PayViaCheckout] Ignoring duplicate token-created event');
            return;
          }
          tokenProcessedRef.current = true;
          console.log('[PayViaCheckout] Token created');
          onTokenCreatedRef.current(message.data);
          break;

        case 'digitzs:error':
          console.error('[PayViaCheckout] Error:', message.error);
          const errorMessage = message.error?.message || 'Payment error occurred';
          setError(errorMessage);
          onErrorRef.current?.(errorMessage);
          break;

        case 'digitzs:resize':
          if (message.height && message.height > 0) {
            setIframeHeight(message.height);
          }
          break;

        case 'digitzs:validation-error':
          console.log('[PayViaCheckout] Validation error');
          onValidationErrorRef.current?.(message.errors || {});
          break;

        default:
          // Unknown message type - ignore
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [sendCheckoutConfig]);

  // Reset config sent flag when config changes
  useEffect(() => {
    configSentRef.current = false;
    if (isIframeReady) {
      sendCheckoutConfig();
    }
  }, [config, isIframeReady, sendCheckoutConfig]);

  // Show error state
  if (error && !isIframeReady) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Payment Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Loading overlay when disabled */}
      {disabled && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Processing...</span>
          </div>
        </div>
      )}

      {/* PayVia checkout iframe - iframe has its own loading indicator */}
      <iframe
        ref={iframeRef}
        src={checkoutUrl}
        style={{
          width: '100%',
          height: `${iframeHeight}px`,
          border: 'none',
        }}
        title="PayVia Secure Checkout"
        allow="payment"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      />
    </div>
  );
}

// ============================================================================
// Helper Hook
// ============================================================================

/**
 * Hook to build checkout configuration from order data
 */
export function useCheckoutConfig(params: {
  amount: number;
  email: string;
  cardHolderName: string;
  invoice: string;
  zipCode?: string;
  orderItems?: Array<{
    type: string;
    description: string;
    quantity: number;
    price: number;
    sku: string;
  }>;
}): Omit<CheckoutConfig, 'merchantId'> {
  return {
    amount: params.amount,
    email: params.email,
    cardHolderName: params.cardHolderName,
    invoice: params.invoice,
    zipCode: params.zipCode,
    isZipCodeEnabled: true,
    isEmailEnabled: false, // Email already collected in personal info step
    defaultPaymentMethod: 'card',
    styles: {
      backgroundColor: 'transparent',
      buttonColor: '#3b82f6',
      buttonTextColor: '#ffffff',
      inputBorderColor: '#e2e8f0',
      borderRadius: '8px',
      fontSize: '16px',
    },
    orderPayload: params.orderItems
      ? { orderItems: params.orderItems }
      : undefined,
  };
}
