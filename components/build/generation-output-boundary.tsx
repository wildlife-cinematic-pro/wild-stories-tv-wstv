"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

type GenerationOutputBoundaryProps = {
  children: ReactNode;
  resetKey: string;
};

type GenerationOutputBoundaryState = {
  hasError: boolean;
};

export default class GenerationOutputBoundary extends Component<
  GenerationOutputBoundaryProps,
  GenerationOutputBoundaryState
> {
  state: GenerationOutputBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): GenerationOutputBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Generation output boundary caught a render error.", error, info);
  }

  componentDidUpdate(prevProps: GenerationOutputBoundaryProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-sm shadow-amber-100/60"
        >
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-600">
            Output Workspace
          </div>
          <div className="mt-1 font-semibold">
            The generated output hit a render problem.
          </div>
          <div className="mt-1 text-xs text-amber-800">
            Your package is still preserved. Try reopening the output workspace.
          </div>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false })}
            className="mt-3 rounded-xl border border-amber-200 bg-white px-3 py-1.5 text-xs font-semibold text-amber-800 shadow-sm shadow-amber-100/70 hover:bg-amber-100 active:scale-[0.98]"
          >
            Try output again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
