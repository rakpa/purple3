import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

try {
  const root = createRoot(rootElement);
  root.render(<App />);
} catch (error) {
  console.error("Error rendering app:", error);
  rootElement.innerHTML = `
    <div style="padding: 20px; font-family: 'Inter', system-ui, sans-serif;">
      <h1>Error Loading App</h1>
      <p>${error instanceof Error ? error.message : "Unknown error"}</p>
      <p>Check the console for more details.</p>
    </div>
  `;
}
