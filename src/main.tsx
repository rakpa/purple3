import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

// Add global error handler
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

try {
  const root = createRoot(rootElement);
  root.render(<App />);
} catch (error) {
  console.error("Error rendering app:", error);
  rootElement.innerHTML = `
    <div style="padding: 20px; font-family: 'Inter', system-ui, sans-serif; max-width: 600px; margin: 50px auto;">
      <h1 style="color: #dc2626; margin-bottom: 16px;">Error Loading App</h1>
      <p style="color: #6b7280; margin-bottom: 8px;">${error instanceof Error ? error.message : "Unknown error"}</p>
      <p style="color: #6b7280; margin-bottom: 16px;">Check the browser console for more details.</p>
      <p style="color: #6b7280; font-size: 14px;">
        If this is a deployment issue, please check:
        <ul style="margin-top: 8px; padding-left: 20px;">
          <li>Environment variables are set in Vercel</li>
          <li>VITE_SUPABASE_URL is configured</li>
          <li>VITE_SUPABASE_ANON_KEY is configured</li>
        </ul>
      </p>
    </div>
  `;
}
