"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

type ClientErrorBoundaryState = {
  hasError: boolean;
};

export class ClientErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  ClientErrorBoundaryState
> {
  state: ClientErrorBoundaryState = {
    hasError: false
  };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (process.env.NODE_ENV !== "production") {
      console.error(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
            This section could not be rendered.
          </div>
        )
      );
    }

    return this.props.children;
  }
}
