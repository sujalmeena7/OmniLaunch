"use client";

import React from "react";

/* ─── Types ─────────────────────────────────────────────────── */

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/* ─── Base Error Boundary ───────────────────────────────────── */

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("[ErrorBoundary] Caught error:", error);
    console.error("[ErrorBoundary] Component stack:", errorInfo.componentStack);
  }

  resetErrorBoundary = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return null;
    }
    return this.props.children;
  }
}

/* ─── Page Error Boundary ───────────────────────────────────── */

interface PageErrorBoundaryProps {
  children: React.ReactNode;
}

interface PageErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class PageErrorBoundary extends React.Component<PageErrorBoundaryProps, PageErrorBoundaryState> {
  constructor(props: PageErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): PageErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("[PageErrorBoundary] Caught error:", error);
    console.error("[PageErrorBoundary] Component stack:", errorInfo.componentStack);
  }

  resetErrorBoundary = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "48px 24px",
            textAlign: "center",
            minHeight: "300px",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "rgba(250, 82, 82, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "16px",
            }}
          >
            <span style={{ fontSize: "24px" }}>⚠️</span>
          </div>
          <h2
            style={{
              fontSize: "18px",
              fontWeight: 700,
              color: "var(--text-secondary)",
              marginBottom: "8px",
            }}
          >
            Something went wrong
          </h2>
          <p
            style={{
              fontSize: "14px",
              color: "var(--text-muted)",
              marginBottom: "24px",
              maxWidth: "400px",
            }}
          >
            {this.state.error?.message || "An unexpected error occurred while rendering this page."}
          </p>
          <button
            onClick={this.resetErrorBoundary}
            style={{
              padding: "10px 24px",
              borderRadius: "12px",
              border: "none",
              background: "var(--gradient-brand)",
              color: "white",
              fontWeight: 600,
              fontSize: "14px",
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
              transition: "opacity 0.2s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.opacity = "0.9";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.opacity = "1";
            }}
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ─── Root Error Boundary ───────────────────────────────────── */

interface RootErrorBoundaryProps {
  children: React.ReactNode;
}

interface RootErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class RootErrorBoundary extends React.Component<RootErrorBoundaryProps, RootErrorBoundaryState> {
  constructor(props: RootErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): RootErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("[RootErrorBoundary] Caught error:", error);
    console.error("[RootErrorBoundary] Component stack:", errorInfo.componentStack);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            padding: "24px",
            textAlign: "center",
            background: "var(--bg-app)",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "16px",
              background: "rgba(250, 82, 82, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "24px",
            }}
          >
            <span style={{ fontSize: "32px" }}>💥</span>
          </div>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: 800,
              color: "var(--text-secondary)",
              marginBottom: "12px",
            }}
          >
            Application Error
          </h1>
          <p
            style={{
              fontSize: "15px",
              color: "var(--text-muted)",
              marginBottom: "32px",
              maxWidth: "480px",
              lineHeight: 1.6,
            }}
          >
            A critical error occurred and the application could not recover.
            Please reload the page to try again.
          </p>
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              window.location.reload();
            }}
            style={{
              padding: "12px 32px",
              borderRadius: "12px",
              border: "none",
              background: "var(--gradient-brand)",
              color: "white",
              fontWeight: 600,
              fontSize: "15px",
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
              textDecoration: "none",
              display: "inline-block",
              transition: "opacity 0.2s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.opacity = "0.9";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.opacity = "1";
            }}
          >
            Reload Application
          </a>
          {this.state.error && (
            <p
              style={{
                marginTop: "24px",
                fontSize: "12px",
                color: "var(--text-muted)",
                opacity: 0.6,
                maxWidth: "480px",
                wordBreak: "break-word",
              }}
            >
              Error: {this.state.error.message}
            </p>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

export { ErrorBoundary, PageErrorBoundary, RootErrorBoundary };
