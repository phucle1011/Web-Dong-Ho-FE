import { useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import Constants from "../../../Constants";
import axios from "axios";

function LoginAdmin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = "Email không được để trống.";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email không hợp lệ.";
    }

    if (!password.trim()) {
      newErrors.password = "Mật khẩu không được để trống.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Vui lòng kiểm tra lại thông tin đăng nhập.");
      return;
    }

    try {
      const response = await axios.post(`${Constants.DOMAIN_API}/admin/login`, {
        email,
        password,
      });

      if (response.data.success) {
        const { token } = response.data.data;
        localStorage.setItem("token", token); // Lưu token vào localStorage
        toast.success("Đăng nhập admin thành công!");
        navigate("/admin/");
      }
    } catch (error) {
      console.error("Lỗi đăng nhập:", error); // Debug lỗi
      const message =
        error.response?.data?.message ||
        error.message ||
        "Có lỗi xảy ra, vui lòng thử lại!";
      toast.error(message);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    }
  };

  return (
    <div className="container mt-5">
      <div className="row">
        <div className="offset-md-3 col-md-6">
          <div
            className="card card-body shadow-sm border-0"
            style={{ marginBottom: "50px", backgroundColor: "#f8f9fa" }}
          >
            <div className="flex items-center justify-between mb-4 relative">
              <button
                onClick={() => navigate("/")}
                className="flex items-center text-gray-700 hover:text-blue-600 transition-colors duration-200"
              >
                <FaArrowLeft />
              </button>
              <h2 className="absolute left-1/2 -translate-x-1/2 text-xl font-semibold text-center">
                Đăng nhập
              </h2>
            </div>

            <form onSubmit={handleSubmit}>
              <input type="hidden" name="method" value="POST" />

              <div className="form-group mb-3">
                <label htmlFor="email" className="form-label text-dark">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  className="form-control border-dark rounded-0"
                  placeholder="Nhập email đăng nhập"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                {errors.email && (
                  <div className="text-danger mt-1 text-sm">{errors.email}</div>
                )}
              </div>

              <div className="form-group mb-3">
                <label htmlFor="password" className="form-label text-dark">
                  Mật khẩu
                </label>
                <input
                  type="password"
                  name="password"
                  id="password"
                  className="form-control border-dark rounded-0"
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                {errors.password && (
                  <div className="text-danger mt-1 text-sm">{errors.password}</div>
                )}
              </div>

              <div className="form-check mb-3">
                <input
                  type="checkbox"
                  className="form-check-input border-dark rounded-0"
                  name="remember"
                  id="remember"
                  defaultChecked
                />
                <label className="form-check-label text-dark" htmlFor="remember">
                  Ghi nhớ đăng nhập
                </label>
              </div>

              <div className="d-flex justify-content-center gap-2 mt-3">
                <button
                  type="reset"
                  className="btn btn-outline-dark rounded-0 px-4"
                  onClick={() => {
                    setEmail("");
                    setPassword("");
                    setErrors({});
                  }}
                >
                  Nhập lại
                </button>
                <button
                  type="submit"
                  className="inline-block bg-[#073272] text-white px-4 py-2 rounded"
                >
                  Đăng nhập
                </button>
              </div>

              <div className="text-center mt-3">
                <a href="#" className="text-dark text-decoration-none" style={{ fontSize: "0.8rem" }}>
                  Quên mật khẩu?
                </a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginAdmin;