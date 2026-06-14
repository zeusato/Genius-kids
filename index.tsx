import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './src/index.css';

// Service worker (PWA) được đăng ký trong services/updateService.ts qua registerSW(),
// initUpdateService() được gọi từ App.tsx.

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);