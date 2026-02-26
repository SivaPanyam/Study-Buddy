import React from 'react';

class AppErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, errorMessage: '' };
    }

    static getDerivedStateFromError(error) {
        return {
            hasError: true,
            errorMessage: error?.message || 'Unknown runtime error'
        };
    }

    componentDidCatch(error, errorInfo) {
        console.error('App crashed:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-background px-6 text-center">
                    <div className="max-w-2xl w-full bg-card border border-border rounded-2xl p-6">
                        <h1 className="text-2xl font-bold text-text mb-2">Application Error</h1>
                        <p className="text-text-secondary mb-3">
                            The app hit a runtime error during startup.
                        </p>
                        <pre className="text-left text-xs bg-black/20 border border-border rounded-lg p-3 overflow-auto text-red-300">
                            {this.state.errorMessage}
                        </pre>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default AppErrorBoundary;
