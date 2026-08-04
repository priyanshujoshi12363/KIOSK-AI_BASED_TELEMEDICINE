import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { KioskProvider } from "./context/KioskContext.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <KioskProvider>
    <App />
  </KioskProvider>
);
