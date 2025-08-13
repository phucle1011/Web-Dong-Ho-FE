import React, { useState, useEffect } from "react";
import Layout from "../../Partials/LayoutHomeThree";
import Thumbnail from "./Thumbnail";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Constants from "../../../../Constants";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import { GoogleLogin } from '@react-oauth/google';
import { setAuthData } from "../../../../helper/auth";



export default function Login() {
  const [checked, setValue] = useState(!!localStorage.getItem("token"));
  const rememberMe = () => {
    setValue(!checked);
  };
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [forgotEmail, setForgotEmail] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleForgotEmailChange = (e) => {
    setForgotEmail(e.target.value);
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    // Kiểm tra email
    if (!formData.email.trim()) {
      newErrors.email = "Email không được để trống!";
      isValid = false;
    } else if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(formData.email)) {
      newErrors.email = "Email không đúng định dạng!";
      isValid = false;
    }

    // Kiểm tra mật khẩu
    if (!formData.password.trim()) {
      newErrors.password = "Mật khẩu không được để trống!";
      isValid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự!";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const validateForgotEmail = () => {
    const newErrors = {};
    if (!forgotEmail.trim()) {
      newErrors.forgotEmail = "Email không được để trống!";
    } else if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(forgotEmail)) {
      newErrors.forgotEmail = "Email không đúng định dạng!";
    }
    setErrors((prev) => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setLoading(true);
    setErrors({});

    try {
      const response = await fetch(`${Constants.DOMAIN_API}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          rememberMe: checked,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        switch (result.message) {
          case "Email không tồn tại!":
            setErrors({ email: "Email không tồn tại!" });
            toast.error("Email không tồn tại!");
            break;
          case "Tài khoản bị khóa!":
            setErrors({ email: "Tài khoản bị khóa!" });
            toast.error("Tài khoản bị khóa. Vui lòng liên hệ hỗ trợ.");
            break;
          case "Mật khẩu không chính xác!":
            setErrors({ password: "Mật khẩu không đúng!" });
            toast.error("Mật khẩu không chính xác!");
            break;
          default:
            toast.error(result.message || "Đăng nhập thất bại!");
            break;
        }
        setLoading(false);
        return;
      }

      const { token } = result.data;

      localStorage.setItem("token", token);

      setAuthData(result.data);

      if (!result.data.user.email_verified_at) {
        toast.info("Vui lòng xác thực email trước khi sử dụng!");
      }

      toast.success("Đăng nhập thành công!");
      navigate("/");
    } catch (error) {
      console.error("Lỗi khi đăng nhập:", error);
      toast.error("Có lỗi xảy ra. Vui lòng thử lại sau!");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (credentialResponse) => {
    const idToken = credentialResponse.credential;
    try {
      setLoading(true);
      const res = await axios.post(
        `${Constants.DOMAIN_API}/auth/google`,
        { idToken, rememberMe: checked }
      );
      const { token } = res.data.data;
      localStorage.setItem("token", token);
      setAuthData(res.data.data);
      toast.success("Đăng nhập bằng Google thành công!");
      navigate("/");
    } catch (err) {
      console.error(err);
      if (err.response) {
        const { status, data } = err.response;
        const msg = data.message || "";

        if (status === 403 && msg.includes("Tài khoản bị khóa")) {
          toast.error("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ bộ phận hỗ trợ.");
        } else if (status === 401 && msg.includes("Google")) {
          toast.error("Token Google không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.");
        } else {
          toast.error(msg || "Đăng nhập Google thất bại. Vui lòng thử lại.");
        }
      } else {
        toast.error("Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!validateForgotEmail()) return;
    setLoading(true);
    try {
      const response = await axios.post(`${Constants.DOMAIN_API}/auth/reset-password`, {
        email: forgotEmail,
      });
      if (response.data.success) {
        toast.success("Kiểm tra email để đặt lại mật khẩu!");
        setShowForgotPassword(false);
        setForgotEmail("");
      }
    } catch (error) {
      setErrors((prev) => ({ ...prev, forgotEmail: error.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại!" }));
      toast.error(error.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  const isTokenValid = () => {
    const token = localStorage.getItem("token");
    if (!token) return false;

    try {
      const decoded = jwtDecode(token);
      const expirationTime = decoded.exp * 1000;
      return Date.now() < expirationTime;
    } catch (error) {
      console.error("Invalid token", error);
      return false;
    }
  };

  useEffect(() => {
    const handleTokenExpired = () => {
      localStorage.removeItem("token");
      navigate("/login", { replace: true });
    };

    window.addEventListener("tokenExpired", handleTokenExpired);

    return () => {
      window.removeEventListener("tokenExpired", handleTokenExpired);
    };
  }, [navigate]);

  return (
    <Layout childrenClasses="pt-0 pb-0">
      <div className="login-page-wrapper w-full py-12">
        <div className="container-x mx-auto">
          <div className="lg:flex items-center relative">
            <div className="lg:w-[572px] w-full bg-white flex flex-col justify-center sm:p-12 p-6 border border-[#E0E0E0]">
              <div className="w-full">
                <div className="title-area flex flex-col justify-center items-center relative text-center mb-8">
                  <h1 className="text-[36px] font-bold leading-[80px] text-qblack">
                    {showForgotPassword ? "Đặt lại mật khẩu" : "Đăng nhập"}
                  </h1>
                  <div className="shape -mt-6">
                    <svg
                      width="354"
                      height="30"
                      viewBox="0 0 354 30"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M1 28.8027C17.6508 20.3626 63.9476 8.17089 113.509 17.8802C166.729 28.3062 341.329 42.704 353 1"
                        stroke="#FFBB38"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                </div>

                {errors.general && <div className="text-red-500 text-sm mb-4">{errors.general}</div>}

                {!showForgotPassword ? (
                  <>
                    {/* Email */}
                    <div className="mb-4">
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Email<span className="text-red-500">*</span>
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`w-full px-4 py-2 border ${errors.email ? "border-red-500" : "border-gray-300"} rounded-md focus:outline-none focus:border-indigo-500`}
                      />
                      {errors.email && (
                        <p className="text-red-500 text-sm mt-2">{errors.email}</p>
                      )}
                    </div>

                    {/* Mật khẩu */}
                    <div className="mb-4">
                      <label
                        htmlFor="password"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Mật khẩu<span className="text-red-500">*</span>
                      </label>
                      <input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="● ● ● ● ● ●"
                        value={formData.password}
                        onChange={handleChange}
                        className={`w-full px-4 py-2 border ${errors.password ? "border-red-500" : "border-gray-300"} rounded-md focus:outline-none focus:border-indigo-500`}
                      />
                      {errors.password && (
                        <p className="text-red-500 text-sm mt-2">{errors.password}</p>
                      )}
                    </div>

                    {/* Ghi nhớ mật khẩu + Quên mật khẩu */}
                    <div className="forgot-password-area flex justify-between items-center mb-4">
                      <div className="remember-checkbox flex items-center space-x-2.5">
                        <button
                          onClick={rememberMe}
                          type="button"
                          className="w-5 h-5 text-qblack flex justify-center items-center border border-light-gray"
                        >
                          {checked && (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </button>
                        <span
                          onClick={rememberMe}
                          className="text-base text-black"
                        >
                          Ghi nhớ tôi
                        </span>
                      </div>
                      <Link
                        to="#"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-base text-qyellow"
                      >
                        Quên mật khẩu
                      </Link>
                    </div>

                    {/* Nút đăng nhập */}
                    <div className="signin-area mb-4">
                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full px-4 py-2 bg-black text-white font-semibold rounded-md hover:bg-gray-800 transition duration-300"
                      >
                        {loading ? "Đang xử lý..." : "Đăng nhập"}
                      </button>
                    </div>

                    <hr />
                    <div className="google-login-area mb-4 flex justify-center mt-4">
                      <GoogleLogin
                        onSuccess={handleGoogleLogin}
                        onError={() => toast.error("Đăng nhập Google thất bại!")}
                      />
                    </div>

                    {/* Đăng ký mới */}
                    <div className="signup-area flex justify-center mt-4">
                      <p className="text-base text-qgraytwo font-normal">
                        Chưa có tài khoản?
                        <Link to="/signup" className="ml-1 text-qblack font-medium">
                          Đăng ký ngay
                        </Link>
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Form quên mật khẩu */}
                    <div className="mb-4">
                      <label
                        htmlFor="forgotEmail"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Email<span className="text-red-500">*</span>
                      </label>
                      <input
                        id="forgotEmail"
                        name="email"
                        type="email"
                        placeholder="Email"
                        value={forgotEmail}
                        onChange={handleForgotEmailChange}
                        className={`w-full px-4 py-2 border ${errors.forgotEmail ? "border-red-500" : "border-gray-300"} rounded-md focus:outline-none focus:border-indigo-500`}
                      />
                      {errors.forgotEmail && (
                        <p className="text-red-500 text-sm mt-2">{errors.forgotEmail}</p>
                      )}
                    </div>
                    <div className="signin-area mb-4">
                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        disabled={loading}
                        className="w-full px-4 py-2 bg-black text-white font-semibold rounded-md hover:bg-gray-800 transition duration-300"
                      >
                        {loading ? "Đang xử lý..." : "Gửi"}
                      </button>
                    </div>
                    <div className="signup-area flex justify-center mt-4">
                      <p className="text-base text-qgraytwo font-normal">
                        Quay lại{" "}
                        <span
                          onClick={() => setShowForgotPassword(false)}
                          className="ml-2 text-qblack cursor-pointer hover:underline"
                        >
                          Đăng nhập
                        </span>
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>


            {/* Hình ảnh bên phải */}
            <div className="flex-1 lg:flex hidden transform scale-60 xl:scale-100 xl:justify-center">
              <div
                className="absolute xl:-right-20 -right-[138px]"
                style={{ top: "calc(50% - 258px)" }}
              >
                <Thumbnail />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}