import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { QuoteProvider } from "./context/QuoteContext";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <QuoteProvider>
          <App />
        </QuoteProvider>
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>,
);
