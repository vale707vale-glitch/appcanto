import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Error de renderizado en la aplicación:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <main className="mx-auto min-h-screen max-w-xl bg-slate-950 px-4 py-12 text-white">
          <section
            className="rounded-2xl border border-red-900 bg-red-950/60 p-6"
            role="alert"
          >
            <h1 className="text-xl font-bold">Ocurrió un error en la pantalla</h1>
            <p className="mt-2 text-sm text-red-200">
              Podés volver al inicio y continuar. Si vuelve a ocurrir, recargá la
              página.
            </p>
            <button
              onClick={() => {
                this.setState({ error: null });
                window.location.hash = '#/';
              }}
              className="mt-5 rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold hover:bg-slate-700"
            >
              Volver al inicio
            </button>
          </section>
        </main>
      );
    }
    return this.props.children;
  }
}
