import * as React from "react";
import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-200">
          <div className="max-w-2xl w-full bg-slate-900 border border-red-500/30 rounded-xl p-8 shadow-2xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-red-500/20 rounded-lg">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">System Fault Detected</h1>
                <p className="text-slate-400 font-mono text-sm">Critical UI rendering failure</p>
              </div>
            </div>
            
            <div className="bg-black/50 p-4 rounded-lg font-mono text-sm text-red-400 overflow-auto whitespace-pre-wrap max-h-96 border border-slate-800">
              {this.state.error?.toString()}
              {'\n\n'}
              {this.state.error?.stack}
            </div>

            <button 
              onClick={() => window.location.reload()}
              className="mt-6 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg w-full transition-colors font-mono"
            >
              INITIALIZE REBOOT SEQUENCE
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
