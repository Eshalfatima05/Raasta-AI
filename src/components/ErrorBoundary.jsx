import { Component } from 'react';
import './ErrorBoundary.css';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Logged for post-mortem debugging — doesn't block the recovery UI below.
    console.error('Rasta crashed:', error, info);
  }

  handleRestart = () => {
    this.setState({ hasError: false });
    // A hard reload clears any bad in-memory state (stuck recorder, stale
    // route session, etc.) rather than risking the same crash immediately.
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-boundary__icon">⚠️</div>
          <h1 className="error-boundary__title">Kuch ghalat ho gaya</h1>
          <p className="error-boundary__subtitle">Something went wrong. Tap below to restart Rasta.</p>
          <button className="error-boundary__button" onClick={this.handleRestart}>
            Restart
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
