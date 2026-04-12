import { Component, ErrorInfo, ReactNode } from 'react';

interface Props { children: ReactNode; fallback: ReactNode; }
interface State { hasError: boolean; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };
  static getDerivedStateFromError(): State { return { hasError: true }; }
  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[LegoBuilder] Error boundary caught:', { error: error.message, componentStack: info.componentStack });
  }
  render(): ReactNode { return this.state.hasError ? this.props.fallback : this.props.children; }
}
