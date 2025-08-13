import { useForm } from "react-hook-form";
import { useParams  } from "react-router-dom";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Constants from "../../../Constants";

const URL = Constants.DOMAIN_API;

function ResetPassword() {
    const { register, handleSubmit, watch, formState: { errors } } = useForm({ mode: "onTouched"});
    const {token} = useParams();
    const navigate = useNavigate();

    const onSubmit = async (data) => {
        try {
            const formData = {
                password: data.password,
            };

            const response = await axios.patch(`${URL}/resetPassword/reset/${token}`, formData);
            toast.success(response.data.message, {
                onClose: () => {
                    navigate("/login");
                },
            });
        } catch (err) {
            console.error("Error in reset password:", err);
            if (err.response) {
                const errorMessage = err.response.data.message;
                toast.error(errorMessage);
            } else {
                toast.error("Lỗi kết nối đến server!");
            }
        }
    };

    return (
        <main className="flex items-center justify-center h-screen">
            <div className="w-full max-w-md bg-white p-6 my-[50px] rounded-lg shadow-lg">
                <a href="/" className="text-[#043175] hover:underline hover:text-blue-800 text-sm">
                    ← Quay về trang chủ
                </a>

                <h2 className="text-2xl font-bold text-center text-[#043175] mt-2">
                    Đặt lại mật khẩu
                </h2>

                <form onSubmit={handleSubmit(onSubmit)} className="mt-2 p-3">
                    <div>
                        <label className="block text-sm mb-2 font-bold text-[#043175]">
                            Mật khẩu mới
                        </label>
                        <input
                            type="password"
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            {...register("password", {
                                required: "Vui lòng nhập mật khẩu mới",
                                minLength: {
                                    value: 6,
                                    message: "Mật khẩu phải có ít nhất 6 ký tự",
                                },
                            })}
                        />
                        {errors.password && (
                            <small className="text-red-600">{errors.password.message}</small>
                        )}
                    </div>

                    <div className="mt-3">
                        <label className="block text-sm mb-2 font-bold text-[#043175]">
                            Nhập lại mật khẩu
                        </label>
                        <input
                            type="password"
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            {...register("confirmPassword", {
                                validate: (value) =>
                                    value === watch("password") || "Mật khẩu nhập lại không khớp",
                            })}
                        />
                        {errors.confirmPassword && (
                            <small className="text-red-600">{errors.confirmPassword.message}</small>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-[#043175] text-white py-2 rounded-lg mt-4 hover:bg-blue-700"
                    >
                        Đặt lại mật khẩu
                    </button>

                    <p className="text-center text-sm mt-3">
                        Quay lại{" "}
                        <a href="/login" className="text-blue-600 hover:underline">
                            đăng nhập
                        </a>
                    </p>
                </form>
            </div>
        </main>
    );
}

export default ResetPassword;