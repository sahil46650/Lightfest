'use client';

import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Error boundary specific to the checkout flow.
 * Catches React rendering errors and provides recovery options.
 */

interface Props {
  children: ReactNode;
  /** Custom fallback UI - if not provided, uses default error display */
  fallback?: ReactNode;
  /** Called when error is caught - useful for error reporting */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  /** Called when user clicks reset - can be used to clear checkout state */
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class CheckoutErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error for debugging
    console.error('[CheckoutErrorBoundary] Caught error:', error);
    console.error('[CheckoutErrorBoundary] Component stack:', errorInfo.componentStack);

    // Call optional error handler (e.g., for Sentry, analytics)
    this.props.onError?.(error, errorInfo);
  }

  handleReset = (): void => {
    this.props.onReset?.();
    this.setState({ hasError: false, error: null });
  };

  handleRefresh = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50 p-8">
          <div className="mb-4 rounded-full bg-red-100 p-3">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>

          <h2 className="mb-2 text-xl font-semibold text-gray-900">
            Something went wrong
          </h2>

          <p className="mb-6 max-w-md text-center text-gray-600">
            We encountered an error while processing your checkout. Your cart items
            are safe. Please try again or refresh the page.
          </p>

          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mb-6 w-full max-w-md">
              <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                Error details (development only)
              </summary>
              <pre className="mt-2 overflow-auto rounded bg-gray-100 p-3 text-xs text-gray-800">
                {this.state.error.message}
                {'\n\n'}
                {this.state.error.stack}
              </pre>
            </details>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={this.handleReset}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>

            <Button onClick={this.handleRefresh}>
              Refresh Page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default CheckoutErrorBoundary;
