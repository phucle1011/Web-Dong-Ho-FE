import React, { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import Layout from "../../Partials/LayoutHomeThree";
import { toast } from "react-toastify";
import axios from "axios";
import Thumbnail from "./Thumbnail";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    if (!password.trim()) {
      newErrors.password = "Mật khẩu không được để trống!";
      isValid = false;
    } else if (password.length < 6) {
      newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự!";
      isValid = false;
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Mật khẩu không khớp!";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await axios.post(
        `https://web-dong-ho-be.onrender.com/auth/update-password/${token}`,
        { password }
      );
      if (response.data.success) {
        toast.success("Mật khẩu đã được cập nhật!");
        setTimeout(() => navigate("/login"), 2000);
      }
    } catch (error) {
      setErrors({ general: error.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại!" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout childrenClasses="pt-0 pb-0">
      <div className="login-page-wrapper w-full py-12">
        <div className="container-x mx-auto">
          <div className="lg:flex items-center relative">
            <div className="lg:w-[572px] w-full bg-white flex flex-col justify-center sm:p-12 p-6 border border-[#E0E0E0]">
              <div className="w-full">
                <div className="title-area flex flex-col justify-center items-center relative text-center mb-8">
                  <h1 className="text-[36px] font-bold leading-[80px] text-qblack">
                    Đặt lại mật khẩu
                  </h1>
                  <div className="shape -mt-6">
                    <svg width="354" height="30" viewBox="0 0 354 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M1 28.8027C17.6508 20.3626 63.9476 8.17089 113.509 17.8802C166.729 28.3062 341.329 42.704 353 1"
                        stroke="#FFBB38"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                </div>

                {errors.general && (
                  <p className="text-red-500 text-sm mb-4">{errors.general}</p>
                )}

                <form onSubmit={handleSubmit}>
                  {/* Mật khẩu mới */}
                  <div className="mb-4">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                      Mật khẩu mới<span className="text-red-500">*</span>
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="● ● ● ● ● ●"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full px-4 py-2 border ${errors.password ? "border-red-500" : "border-gray-300"} rounded-md focus:outline-none focus:border-indigo-500`}
                    />
                    {errors.password && (
                      <p className="text-red-500 text-sm mt-2">{errors.password}</p>
                    )}
                  </div>

                  {/* Xác nhận mật khẩu */}
                  <div className="mb-4">
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      Xác nhận mật khẩu<span className="text-red-500">*</span>
                    </label>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      placeholder="● ● ● ● ● ●"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`w-full px-4 py-2 border ${errors.confirmPassword ? "border-red-500" : "border-gray-300"} rounded-md focus:outline-none focus:border-indigo-500`}
                    />
                    {errors.confirmPassword && (
                      <p className="text-red-500 text-sm mt-2">{errors.confirmPassword}</p>
                    )}
                  </div>

                  {/* Nút cập nhật mật khẩu */}
                  <div className="signin-area mt-6">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full px-4 py-2 bg-black text-white font-semibold rounded-md hover:bg-gray-800 transition duration-300"
                    >
                      {loading ? "Đang xử lý..." : "Cập nhật mật khẩu"}
                    </button>
                  </div>
                </form>

                {/* Quay lại đăng nhập */}
                <div className="signup-area flex justify-center mt-4">
                  <p className="text-base text-qgraytwo font-normal">
                    Quay lại{' '}
                    <Link to="/login" className="ml-2 text-qblack font-medium">
                      Đăng nhập
                    </Link>
                  </p>
                </div>
              </div>
            </div>

            {/* Hình ảnh bên phải */}
            <div className="flex-1 lg:flex hidden transform scale-60 xl:scale-100 xl:justify-center">
              <div className="absolute xl:-right-20 -right-[138px]" style={{ top: "calc(50% - 258px)" }}>
                <Thumbnail />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
