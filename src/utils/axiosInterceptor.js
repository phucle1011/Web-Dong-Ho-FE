// utils/axiosInterceptor.js
import axios from "axios";
import { toast } from "react-toastify";

let isToastShown = false; // Biến flag để kiểm soát toast

const setupAxiosInterceptors = (navigate) => {
  axios.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      const status = error?.response?.status;
      const message = error?.response?.data?.message;

      if (status === 401 && message?.includes("jwt expired")) {
        if (!isToastShown) {
          localStorage.removeItem("token");
          toast.info("Phiên đăng nhập đã hết hạn.");
          isToastShown = true;
        }

        // Phát ra sự kiện global
        const event = new Event("tokenExpired");
        window.dispatchEvent(event);

        // Dùng setTimeout để reset lại trạng thái sau khi toast ẩn đi
        setTimeout(() => {
          isToastShown = false;
        }, 3000); // Thời gian tương ứng với thời gian toast tồn tại

        navigate("/login", { replace: true });
      }

      return Promise.reject(error);
    }
  );
};

export default setupAxiosInterceptors;