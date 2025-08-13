import React, { useState, useEffect } from 'react';
import { useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Layout from "../../Partials/LayoutHomeThree";
import Constants from "../../../../Constants";
import axios from 'axios'; // Thêm import axios vì bạn đang sử dụng nó

const VerifyEmail = () => {
    const [message, setMessage] = useState("Đang xác thực email...");
    const [isVerified, setIsVerified] = useState(false); // Trạng thái để kiểm soát đã xác thực chưa
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const verifyEmail = async () => {
            const queryParams = new URLSearchParams(location.search);
            const token = queryParams.get("token");

            if (!token) {
                setMessage("Không tìm thấy token xác thực!");
                return;
            }

            try {
                const response = await axios.get(
                    `${Constants.DOMAIN_API}/auth/verify-email?token=${token}`
                );

                if (response.data.success) {
                    setMessage(response.data.message);
                    setIsVerified(true);
                    if (!toast.isActive("emailVerified")) {
                        toast.success(response.data.message, { toastId: "emailVerified" });
                    }
                    setTimeout(() => {
                        navigate("/");
                    }, 3000);
                } else {
                    setMessage(response.data.message);
                }
            } catch (err) {
                setMessage(
                    err.response?.data?.message || "Đã có lỗi xảy ra khi xác thực email!"
                );
            }
        };

        if (!isVerified) {
            verifyEmail();
        }
    }, [location, navigate, isVerified]);

    return (
        <Layout childrenClasses="pt-0 pb-0">
            <div className="login-page-wrapper w-full py-10">
                <div className="container-x mx-auto">
                    <div className="w-full max-w-md mx-auto bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
                        <p className="text-lg">Đang xác thực email...</p>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default VerifyEmail;