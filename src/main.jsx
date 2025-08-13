import React, { useEffect, useRef } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";
import "./index.css";
import "react-range-slider-input/dist/style.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import App from "./App";
import { registerSW } from "virtual:pwa-register";
import setupAxiosInterceptors from "./utils/axiosInterceptor";
import AuthProvider from "./components/Auth/AuthContext/index";

function AppWrapper() {
  return <App />;
}

// Function để truyền navigate vào interceptor
const setupInterceptorsWithNavigate = (navigate) => {
  setupAxiosInterceptors(navigate);
};

const RootComponent = () => {
  const navigateRef = useRef();

  useEffect(() => {
    AOS.init();
    if (import.meta.env.MODE === "production") {
      registerSW();
    }
    // Gọi interceptor với navigate từ ref
    if (navigateRef.current) {
      setupInterceptorsWithNavigate(navigateRef.current);
    }
  }, []);

  return <AppWrapper ref={navigateRef} />;
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <RootComponent />
        <ToastContainer />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);