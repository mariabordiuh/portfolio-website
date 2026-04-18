import React from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the full error to console only
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-brand-bg text-white font-sans">
          <div className="max-w-md w-full p-8 bg-brand-surface border border-white/10 rounded-3xl text-center shadow-2xl">
            <AlertCircle className="mx-auto mb-6 text-brand-accent" size={48} />
            <h2 className="text-2xl font-bold mb-4 tracking-tighter">Application Error</h2>
            <p className="text-brand-muted mb-8 leading-relaxed">
              We've encountered an unexpected issue. Our team has been notified. 
              Please try reloading the page.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="px-8 py-3 bg-brand-accent text-brand-bg font-bold uppercase tracking-widest rounded-full hover:scale-105 transition-transform"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
