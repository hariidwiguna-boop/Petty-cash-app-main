// ============================================
// ERROR BOUNDARY COMPONENT
// ============================================

import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
    showRetry?: boolean;
    customMessage?: string;
}

interface State {
    hasError: boolean;
    error?: Error;
    errorInfo?: React.ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        
        this.setState({ error, errorInfo });
        
        // Call custom error handler if provided
        this.props.onError?.(error, errorInfo);
        
        // Log to external service if needed
        this.logErrorToService(error, errorInfo);
    }

    private logErrorToService = (error: Error, errorInfo: React.ErrorInfo) => {
        // Here you could integrate with error tracking services like Sentry, LogRocket, etc.
        // For now, we'll just log to console
        const errorReport = {
            message: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack,
            timestamp: new Date().toISOString(),
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
        };

        console.error('Error Report:', JSON.stringify(errorReport, null, 2));
    };

    private handleRetry = () => {
        this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <View style={styles.container}>
                    <View style={styles.errorCard}>
                        <Text style={styles.errorIcon}>⚠️</Text>
                        <Text style={styles.errorTitle}>
                            {this.props.customMessage || 'Terjadi Kesalahan'}
                        </Text>
                        
                        <Text style={styles.errorMessage}>
                            {this.state.error?.message || 'Aplikasi mengalami kesalahan yang tidak terduga. Silakan coba lagi.'}
                        </Text>

                        {__DEV__ && this.state.error?.stack && (
                            <View style={styles.debugContainer}>
                                <Text style={styles.debugTitle}>Debug Info:</Text>
                                <Text style={styles.debugText}>
                                    {this.state.error.stack}
                                </Text>
                            </View>
                        )}

                        {this.props.showRetry && (
                            <TouchableOpacity
                                style={styles.retryButton}
                                onPress={this.handleRetry}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.retryButtonText}>Coba Lagi</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            );
        }

        return this.props.children;
    }
}

// ============================================
// FUNCTIONAL ERROR BOUNDARY HOOK
// ============================================

import { useState, useCallback } from 'react';

export interface UseErrorBoundaryReturn {
    ErrorBoundaryComponent: React.ComponentType<{ children: ReactNode }>;
    triggerError: (error: Error) => void;
    clearError: () => void;
}

export const useErrorBoundary = (
    fallback?: ReactNode,
    onError?: (error: Error) => void
): UseErrorBoundaryReturn => {
    const [error, setError] = useState<Error | null>(null);

    const triggerError = useCallback((error: Error) => {
        console.error('Error triggered manually:', error);
        setError(error);
        onError?.(error);
    }, [onError]);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const ErrorBoundaryComponent = useCallback(
        ({ children }: { children: ReactNode }) => {
            if (error) {
                if (fallback) {
                    return fallback;
                }

                return (
                    <View style={styles.container}>
                        <View style={styles.errorCard}>
                            <Text style={styles.errorIcon}>⚠️</Text>
                            <Text style={styles.errorTitle}>Terjadi Kesalahan</Text>
                            <Text style={styles.errorMessage}>
                                {error.message || 'Aplikasi mengalami kesalahan yang tidak terduga.'}
                            </Text>

                            <TouchableOpacity
                                style={styles.retryButton}
                                onPress={clearError}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.retryButtonText}>Tutup</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                );
            }

            return <>{children}</>;
        },
        [error, fallback, clearError]
    );

    return {
        ErrorBoundaryComponent,
        triggerError,
        clearError,
    };
};

// ============================================
// ROUTE-LEVEL ERROR BOUNDARY
// ============================================

export const RouteErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => {
    return (
        <ErrorBoundary
            showRetry={true}
            customMessage="Halaman mengalami kesalahan. Silakan refresh halaman ini."
            onError={(error, errorInfo) => {
                // You could send route-specific errors here
                console.error('Route Error:', { error, errorInfo });
            }}
        >
            {children}
        </ErrorBoundary>
    );
};

// ============================================
// API ERROR BOUNDARY
// ============================================

export const ApiErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => {
    return (
        <ErrorBoundary
            showRetry={true}
            customMessage="Terjadi kesalahan saat menghubungi server. Silakan periksa koneksi internet Anda."
            onError={(error, errorInfo) => {
                // API-specific error handling
                console.error('API Error:', { error, errorInfo });
            }}
        >
            {children}
        </ErrorBoundary>
    );
};

// ============================================
// FORM ERROR BOUNDARY
// ============================================

export const FormErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => {
    return (
        <ErrorBoundary
            showRetry={true}
            customMessage="Form mengalami kesalahan. Data yang Anda masukkan mungkin hilang."
            onError={(error, errorInfo) => {
                // Form-specific error handling
                console.error('Form Error:', { error, errorInfo });
            }}
        >
            {children}
        </ErrorBoundary>
    );
};

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#f9fafb',
    },
    errorCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        maxWidth: 350,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    errorIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    errorTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1a1a1a',
        textAlign: 'center',
        marginBottom: 8,
    },
    errorMessage: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 20,
    },
    debugContainer: {
        backgroundColor: '#f3f4f6',
        borderRadius: 8,
        padding: 12,
        width: '100%',
        marginBottom: 20,
    },
    debugTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    debugText: {
        fontSize: 10,
        color: '#6b7280',
        fontFamily: 'monospace',
    },
    retryButton: {
        backgroundColor: '#3b82f6',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    retryButtonText: {
        fontSize: 14,
        fontWeight: '700',
        color: 'white',
    },
});