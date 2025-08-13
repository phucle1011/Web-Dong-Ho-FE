import { useForm } from "react-hook-form";
import Constants from "../../../Constants";
import axios from "axios";
import { ToastContainer} from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { toast } from "react-toastify";

import { useNavigate } from "react-router-dom";

const URL = Constants.DOMAIN_API;
function ResetForm() {
    const { register, handleSubmit, formState: { errors } } = useForm();


    const onSubmit = async (spors) => {
        try {
            const data = {
                email: spors.email
            };
            const res = await axios.post(`${URL}/resetPassword`, data);
            toast.success("Yêu cầu đặt lại mật khẩu đã được gửi đến email của bạn!");
        } catch (err) {

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
            <ToastContainer position="top-right" autoClose={2000} />

            <div className="w-full max-w-md bg-white p-6 my-[50px] rounded-lg shadow-lg">
                <a href="/" className="text-[#043175] hover:underline hover:text-blue-800 text-sm">&larr; Quay về trang chủ</a>

                <h2 className="text-2xl font-bold text-center text-[#043175] mt-2">
                    Quên mật khẩu
                </h2>

                <form onSubmit={handleSubmit(onSubmit)} className="mt-2 p-3">
                    <div>
                        <label className="block text-sm mb-2 font-bold text-[#043175]">Email</label>
                        <input
                            type="email"
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Nhập email đã đăng ký"
                            {...register("email", {
                                required: "Vui lòng nhập email",
                                pattern: {
                                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                    message: "Email không hợp lệ",
                                },
                            })}
                        />
                        {errors.email && <small className="text-red-600">{errors.email.message}</small>}
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-[#043175] text-white py-2 rounded-lg mt-4 hover:bg-blue-700"
                    >
                        Gửi yêu cầu đặt lại mật khẩu
                    </button>

                    <p className="text-center text-sm mt-3">
                        Đã nhớ mật khẩu? <a href="/login" className="text-blue-600 hover:underline">Đăng nhập</a>
                    </p>
                </form>
            </div>
        </main>
    );
}

export default ResetForm;
