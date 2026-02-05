import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import logger from '../src/utils/logger';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        logger.error('Uncaught error:', error, errorInfo);
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null });
        window.location.reload();
    };

    private handleGoHome = () => {
        this.setState({ hasError: false, error: null });
        window.location.href = '/';
    };

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
                    <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-8 text-center">
                        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle size={40} className="text-red-500" />
                        </div>

                        <h1 className="text-2xl font-bold text-slate-900 mb-2">Oops! Terjadi Kesalahan</h1>
                        <p className="text-slate-600 mb-8">
                            Aplikasi mengalami kendala yang tidak terduga. Jangan khawatir, data Anda tetap aman.
                        </p>

                        <div className="bg-slate-50 rounded-2xl p-4 mb-8 text-left">
                            <p className="text-xs font-mono text-slate-500 break-words">
                                {this.state.error?.message || 'Unknown error occurred'}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={this.handleReset}
                                className="flex items-center justify-center gap-2 px-6 py-3 bg-[#1E3A8A] text-white rounded-xl font-bold hover:bg-[#172554] transition-all shadow-lg active:scale-95"
                            >
                                <RefreshCw size={18} />
                                Muat Ulang
                            </button>
                            <button
                                onClick={this.handleGoHome}
                                className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-all active:scale-95"
                            >
                                <Home size={18} />
                                Ke Beranda
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
