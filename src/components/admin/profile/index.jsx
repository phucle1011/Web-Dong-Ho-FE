import { useEffect, useState, useRef } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaSignOutAlt, FaCamera } from "react-icons/fa";
import Constants from "../../../Constants";
import axios from "axios";
import { decodeToken } from "../../../pages/client/Helpers/jwtDecode";
import { uploadToCloudinary } from "../../../Upload/uploadToCloudinary";

function AdminProfile() {
    const navigate = useNavigate();
    const [adminInfo, setAdminInfo] = useState({
        id: "",
        name: "",
        email: "",
        phone: "",
        avatar: "",
        role: "",
        created_at: "",
        updated_at: "",
    });
    const [loading, setLoading] = useState(true);
    const [profileImg, setProfileImg] = useState(null);
    const profileImgInput = useRef(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            toast.error("Vui lòng đăng nhập để xem thông tin admin.");
            navigate("/admin/login");
            return;
        }

        const decoded = decodeToken(token);
        if (!decoded) {
            toast.error("Phiên đăng nhập hết hạn hoặc không hợp lệ.");
            localStorage.removeItem("token");
            navigate("/admin/login");
            return;
        }

        // Gọi API để lấy thông tin chi tiết admin
        const fetchAdminProfile = async () => {
            try {
                const res = await axios.get(`${Constants.DOMAIN_API}/admin/user/${decoded.id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.data.data) {
                    setAdminInfo(res.data.data);
                    setProfileImg(res.data.data.avatar || null);
                } else {
                    setAdminInfo({
                        id: decoded.id,
                        name: decoded.name || "",
                        email: decoded.email || "",
                        role: decoded.role || 0,
                    });
                }
            } catch (error) {
                console.error("Lỗi khi lấy thông tin admin:", error);
                toast.error("Không thể lấy thông tin admin, sử dụng dữ liệu từ token.");
                setAdminInfo({
                    id: decoded.id,
                    name: decoded.name || "",
                    email: decoded.email || "",
                    role: decoded.role || 0,
                });
            } finally {
                setLoading(false);
            }
        };

        fetchAdminProfile();
    }, [navigate]);

    const handleLogout = async () => {
        try {
            await axios.post(
                `${Constants.DOMAIN_API}/admin/logout`,
                {},
                {
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                }
            );
        } catch (error) {
            console.error("Lỗi khi đăng xuất:", error);
        } finally {
            localStorage.removeItem("token");
            toast.success("Đã đăng xuất thành công!");
            navigate("/");
        }
    };

    const browseProfileImg = () => {
        profileImgInput.current.click();
    };

    const profileImgChangeHandler = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                setProfileImg(event.target.result); // Hiển thị ảnh tạm thời
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUpdateAvatar = async () => {
        try {
            const token = localStorage.getItem("token");
            const file = profileImgInput.current?.files[0];
            let avatarUrl = adminInfo.avatar;

            if (file) {
                const uploaded = await uploadToCloudinary(file);
                avatarUrl = uploaded.url;
            } else if (!adminInfo.avatar) {
                toast.warning("Vui lòng chọn ảnh để cập nhật.");
                return;
            }

            // Gọi API cập nhật avatar
            await axios.put(
                `${Constants.DOMAIN_API}/admin/user/${adminInfo.id}/avatar`,
                { avatar: avatarUrl },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setAdminInfo({ ...adminInfo, avatar: avatarUrl });
            setProfileImg(avatarUrl);
            toast.success("Cập nhật avatar thành công!");
        } catch (error) {
            console.error("Lỗi khi cập nhật avatar:", error);
            toast.error("Cập nhật avatar thất bại.");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-gray-600 text-lg">Đang tải thông tin...</div>
            </div>
        );
    }

    if (!adminInfo) {
        return null; // Đã xử lý chuyển hướng trong useEffect
    }

    return (
        <div className="max-w-6xl mx-auto p-6 bg-white-50 min-h-screen">
            <div className="bg-white shadow-lg rounded-xl p-6 mb-8 border border-gray-200">
                <h1 className="text-xl font-semibold mb-6 border-b border-gray-200 pb-2 text-gray-700">
                    Thông tin Admin
                </h1>

                <div className="flex flex-col md:flex-row gap-6">
                    {/* Avatar bên trái */}
                    <div className="md:w-1/3 flex flex-col items-center">
                        {profileImg ? (
                            <img
                                src={profileImg.startsWith('http') ? profileImg : `${Constants.DOMAIN_API}/uploads/${profileImg}`}
                                alt={adminInfo.name || "Admin"}
                                className="w-32 h-32 object-cover rounded-full shadow-md border-2 border-gray-300 mb-4"
                            />
                        ) : (
                            <div className="w-32 h-32 flex items-center justify-center bg-gray-100 rounded-full border-2 border-dashed border-gray-300 mb-4">
                                <span className="text-gray-400 text-sm text-center px-2">Không có avatar</span>
                            </div>
                        )}
                        <input
                            ref={profileImgInput}
                            onChange={profileImgChangeHandler}
                            type="file"
                            accept="image/*"
                            className="hidden"
                        />
                        <button
                            onClick={browseProfileImg}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md shadow-md hover:bg-blue-700 transition duration-200 flex items-center"
                        >
                            <FaCamera className="mr-2" />
                            Chọn ảnh
                        </button>
                        {profileImg !== adminInfo.avatar && (
                            <button
                                onClick={handleUpdateAvatar}
                                className="mt-2 bg-green-600 text-white px-4 py-2 rounded-md shadow-md hover:bg-green-700 transition duration-200"
                            >
                                Lưu ảnh
                            </button>
                        )}
                    </div>

                    {/* Thông tin bên phải */}
                    <div className="md:w-2/3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 mb-6">
                            <div className="flex items-center">
                                <strong className="text-gray-600 w-24">Họ tên:</strong>
                                <input
                                    type="text"
                                    className="text-gray-800 border border-gray-200 rounded px-3 py-1.5 bg-gray-50 w-full focus:outline-none"
                                    value={adminInfo.name || "Không xác định"}
                                    readOnly
                                />
                            </div>
                            <div className="flex items-center">
                                <strong className="text-gray-600 w-24">Email:</strong>
                                <input
                                    type="text"
                                    className="text-blue-600 border border-gray-200 rounded px-3 py-1.5 bg-gray-50 w-full cursor-pointer hover:underline focus:outline-none"
                                    value={adminInfo.email || "Không xác định"}
                                    readOnly
                                    onClick={() => adminInfo.email && window.open(`mailto:${adminInfo.email}`)}
                                />
                            </div>
                            <div className="flex items-center">
                                <strong className="text-gray-600 w-24">Điện thoại:</strong>
                                <input
                                    type="text"
                                    className="text-gray-800 border border-gray-200 rounded px-3 py-1.5 bg-gray-50 w-full focus:outline-none"
                                    value={adminInfo.phone || "Không xác định"}
                                    readOnly
                                />
                            </div>
                            <div className="flex items-center">
                                <strong className="text-gray-600 w-24">Vai trò:</strong>
                                <input
                                    type="text"
                                    className="capitalize px-3 py-1.5 border border-gray-200 rounded bg-blue-100 text-blue-800 text-sm font-medium w-full focus:outline-none"
                                    value={adminInfo.role === 0 ? "Admin" : adminInfo.role || "Không xác định"}
                                    readOnly
                                />
                            </div>
                            {adminInfo.created_at && (
                                <div className="flex items-center">
                                    <strong className="text-gray-600 w-24">Ngày tạo:</strong>
                                    <input
                                        type="text"
                                        className="text-gray-800 border border-gray-200 rounded px-3 py-1.5 bg-gray-50 w-full focus:outline-none"
                                        value={adminInfo.created_at ? new Date(adminInfo.created_at).toLocaleDateString("vi-VN") : "Không xác định"}
                                        readOnly
                                    />
                                </div>
                            )}
                            {adminInfo.updated_at && (
                                <div className="flex items-center">
                                    <strong className="text-gray-600 w-24">Ngày cập nhật:</strong>
                                    <input
                                        type="text"
                                        className="text-gray-800 border border-gray-200 rounded px-3 py-1.5 bg-gray-50 w-full focus:outline-none"
                                        value={adminInfo.updated_at ? new Date(adminInfo.updated_at).toLocaleDateString("vi-VN") : "Không xác định"}
                                        readOnly
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-6 flex space-x-4">
                <button
                    onClick={handleLogout}
                    className="bg-red-600 text-white px-6 py-2 rounded-md shadow-md hover:bg-red-700 transition duration-200 flex items-center"
                >
                    <FaSignOutAlt className="mr-2" />
                    Đăng xuất
                </button>
                <button
                    onClick={() => navigate(-1)}
                    className="bg-gray-600 text-white px-6 py-2 rounded-md shadow-md hover:bg-gray-700 transition duration-200 flex items-center"
                >
                    Quay lại
                </button>
                <button
                    onClick={() => navigate("/")}
                    className="bg-gray-600 text-white px-6 py-2 rounded-md shadow-md hover:bg-gray-700 transition duration-200 flex items-center"
                >
                    Về trang chủ
                </button>
            </div>
        </div>
    );
}

export default AdminProfile;