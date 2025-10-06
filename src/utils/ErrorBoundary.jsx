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
        <div className="min-h-screen bg-clinic flex items-center justify-center p-4">
          <div className="card max-w-md w-full text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-4">
              ¡Oops! Algo salió mal
            </h2>
            <p className="text-gray-600 mb-4">
              Ha ocurrido un error inesperado en la aplicación.
            </p>
            <details className="text-left bg-gray-50 p-3 rounded mb-4">
              <summary className="cursor-pointer font-medium">
                Ver detalles del error
              </summary>
              <pre className="text-xs mt-2 overflow-auto">
                {this.state.error?.toString()}
              </pre>
            </details>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary"
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
