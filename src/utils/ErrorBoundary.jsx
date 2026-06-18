import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error boundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background text-foreground transition-colors">
          <div className="max-w-md w-full text-center border border-border rounded-lg shadow-lg bg-card/80 backdrop-blur-md p-6">
            <h2 className="text-xl font-semibold text-red-500 mb-3">
              ¡Oops! Algo salió mal
            </h2>

            <p className="text-muted-foreground mb-5">
              Ha ocurrido un error inesperado en la aplicación.
            </p>

            <details
              className="
              text-left text-sm rounded-md p-3 mb-5
              bg-muted/50 text-muted-foreground
              dark:bg-white/5 dark:text-gray-300
              border border-border/50
            "
            >
              <summary className="cursor-pointer font-medium hover:text-foreground">
                Ver detalles del error
              </summary>
              <pre className="mt-2 text-xs overflow-auto whitespace-pre-wrap break-all">
                {this.state.error?.toString()}
              </pre>
            </details>

            <button
              onClick={() => window.location.reload()}
              className="
    px-5 py-2 rounded-md font-medium text-white
    bg-[#F97316] hover:bg-[#FF7A1C]
    dark:bg-[#FF7A1C] dark:hover:bg-[#FFA047]
    transition-all duration-300
    focus:ring-2 focus:ring-offset-2 focus:ring-[#FF7A1C]/40
  "
            >
              Recargar página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
