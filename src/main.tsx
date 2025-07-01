import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./globals.css"; // Ensure global styles are imported
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster"; // Ensure Toaster is included globally
import { Provider } from "react-redux"; // ✅ Import Provider
import { store } from "./store";
import { AppNameProvider } from "./contenxt/AppNameContext";
import { AuthProvider } from "./contenxt/AuthProvider";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <AppNameProvider>
        <BrowserRouter>
          <AuthProvider>    {/* <-- Wrap App here */}
            <App />
          </AuthProvider>
        
          <Toaster />
        </BrowserRouter>
      </AppNameProvider>
    </Provider>
  </React.StrictMode>
);
