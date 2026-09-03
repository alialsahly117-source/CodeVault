import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
  info: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, info: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.setState({ error, info });
  }

  render() {
    if (this.state.error) {
      return (
        <div className="mx-auto max-w-2xl px-4 py-16 text-center" dir="rtl">
          <h1 className="text-lg font-bold text-text">حدث خطأ غير متوقع</h1>
          <p className="mt-2 text-sm text-text-secondary">
            حاول تحديث الصفحة. إذا استمرت المشكلة، تواصل معنا.
          </p>
          <button
            className="mt-4 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white"
            onClick={() => window.location.reload()}
          >
            تحديث الصفحة
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
