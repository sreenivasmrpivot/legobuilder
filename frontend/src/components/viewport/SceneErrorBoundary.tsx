/**
 * Component: SceneErrorBoundary
 *
 * React error boundary that catches WebGL initialization errors
 * and render errors from the 3D scene, displaying a user-friendly
 * fallback UI.
 *
 * FR: FR-SCENE-001
 * LLD: docs/features/FR-SCENE-001/LOW_LEVEL_DESIGN.md §6.2
 *
 * Spectra-Agent: frontend-coding
 * Spectra-FRs: FR-SCENE-001
 */

import React from 'react';

interface SceneErrorBoundaryProps {
  children: React.ReactNode;
}

interface SceneErrorBoundaryState {
  hasError: boolean;
  errorCode?: string;
}

export class SceneErrorBoundary extends React.Component<
  SceneErrorBoundaryProps,
  SceneErrorBoundaryState
> {
  constructor(props: SceneErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): SceneErrorBoundaryState {
    const code =
      'code' in error ? String((error as { code: string }).code) : 'UNKNOWN';
    return {
      hasError: true,
      errorCode: code,
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('[SceneErrorBoundary]', error, info);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div
          className="scene-error-fallback"
          role="alert"
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#1a1a2e',
            color: '#ffffff',
            padding: '2rem',
          }}
        >
          <p>
            3D rendering is not available. Please refresh or try a different
            browser.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
