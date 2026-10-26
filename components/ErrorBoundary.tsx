"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, ArrowLeft, LifeBuoy } from "lucide-react";
import Link from "next/link";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an unhandled component error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    if (this.props.onReset) {
      this.props.onReset();
    }
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  handleResume = () => {
    if (this.props.onReset) {
      this.props.onReset();
    }
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="w-full max-w-xl rounded-2xl bg-card border border-destructive/30 p-8 shadow-2xl backdrop-blur-md">
            <div className="flex items-center gap-3 mb-4 text-destructive">
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  {this.props.fallbackTitle || "Interview Interface Recovery"}
                </h2>
                <p className="text-xs text-muted-foreground">
                  An unexpected UI exception occurred, but your interview progress and session state are preserved.
                </p>
              </div>
            </div>

            {this.state.error && (
              <div className="my-4 p-3.5 rounded-lg bg-black/40 border border-border font-mono text-xs text-amber-300 overflow-x-auto">
                <div className="font-semibold text-gray-400 mb-1">Diagnostic Details:</div>
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 mt-6 pt-4 border-t border-border">
              <button
                type="button"
                onClick={this.handleReload}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-95 transition-all shadow-md"
              >
                <RefreshCw className="h-4 w-4" />
                Reload Interview Room
              </button>

              <button
                type="button"
                onClick={this.handleResume}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary text-secondary-foreground font-medium text-sm hover:bg-secondary/80 transition-colors border border-border"
              >
                <LifeBuoy className="h-4 w-4 text-emerald-400" />
                Resume Current Round
              </button>

              <Link
                href="/interview/new"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-muted text-muted-foreground font-medium text-sm hover:text-foreground transition-colors ml-auto"
              >
                <ArrowLeft className="h-4 w-4" />
                Exit to Setup
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
