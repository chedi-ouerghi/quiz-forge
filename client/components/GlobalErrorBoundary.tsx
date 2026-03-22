import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { LucideAlertCircle, LucideRefreshCcw } from 'lucide-react-native';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Global Error Boundary to catch UI-breaking errors in the React tree.
 */
export class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      if (fallback) {
        return fallback;
      }
      
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <LucideAlertCircle color="#EF4444" size={64} style={styles.icon} />
            <Text style={styles.title}>Oups ! Une erreur est survenue</Text>
            <Text style={styles.message}>
              L'application a rencontré un problème inattendu.
            </Text>
            
            {__DEV__ && (
              <View style={styles.errorCard}>
                <Text style={styles.errorText}>{error?.message}</Text>
              </View>
            )}

            <TouchableOpacity style={styles.button} onPress={this.handleReset}>
              <LucideRefreshCcw color="#FFFFFF" size={20} style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }

    return children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 32,
  },
  errorCard: {
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 8,
    marginBottom: 32,
    width: '100%',
  },
  errorText: {
    color: '#EF4444',
    fontFamily: 'monospace',
    fontSize: 12,
  },
  button: {
    flexDirection: 'row',
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
