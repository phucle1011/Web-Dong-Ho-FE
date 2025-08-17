import axios from "axios";
import { useEffect, useState, useCallback } from "react";
import Constants from "../../../../Constants.jsx";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import { FaAngleDoubleLeft, FaChevronLeft, FaChevronRight, FaAngleDoubleRight, FaSearch, FaEye } from 'react-icons/fa';

function UserList() {
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [appliedSearchTerm, setAppliedSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const [searchError, setSearchError] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [showReasonModal, setShowReasonModal] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [selectedNewStatus, setSelectedNewStatus] = useState('');
    const [reasonOption, setReasonOption] = useState('');
    const [customReason, setCustomReason] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [userCounts, setUserCounts] = useState({ all: 0, active: 0, locked: 0 });
    const limit = 10;
    const [processingReason, setProcessingReason] = useState(false);


    const fetchData = useCallback(async (page, currentFilterStatus, currentAppliedSearchTerm) => {
        setLoading(true);
        try {
            let url;
            let params = { page, limit };

            if (currentAppliedSearchTerm.trim()) {
                url = `${Constants.DOMAIN_API}/admin/user/search`;
                params.searchTerm = currentAppliedSearchTerm.trim();
                if (currentFilterStatus) params.status = currentFilterStatus;
            } else {
                url = `${Constants.DOMAIN_API}/admin/user/list`;
                if (currentFilterStatus) params.status = currentFilterStatus;
            }

            const res = await axios.get(url, { params });

            if (res.data.status === 200) {
                setUsers((res.data.data || []).filter(u => u.role !== 'admin'));
                setTotalPages(res.data.totalPages || 1);
                setSearchError('');
                if (res.data.counts) setUserCounts(res.data.counts);
            } else {
                setUsers([]);
                setTotalPages(1);
                setSearchError("Không tìm thấy người dùng nào.");
            }
        } catch (error) {
            console.error("Lỗi khi lấy danh sách người dùng hoặc tìm kiếm:", error);
            toast.error("Lỗi tải danh sách hoặc tìm kiếm người dùng");
            setUsers([]);
            setTotalPages(1);
            setSearchError("Có lỗi xảy ra khi tải dữ liệu.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData(currentPage, filterStatus, appliedSearchTerm);
    }, [fetchData, currentPage, filterStatus, appliedSearchTerm]);

    const handleSearchSubmit = () => {

        setCurrentPage(1);
        setAppliedSearchTerm(searchTerm);
        setIsSearching(true);
    };

    const handleFilterChange = (status) => {
        setFilterStatus(status);
        setCurrentPage(1);
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const handleStatusChange = (userId, newStatus) => {
        const u = users.find(u => u.id === userId);
        if (u?.role === 'admin') {
            toast.warn("Không thể thay đổi trạng thái tài khoản admin.");
            return;
        }
        setSelectedUserId(userId);
        setSelectedNewStatus(newStatus);
        setReasonOption('');
        setCustomReason('');
        setShowReasonModal(true);
    };


    const handleSubmitReason = async () => {
        const finalReason = reasonOption === 'Khác' ? customReason : reasonOption;
        if (!finalReason?.trim()) {
            toast.warning("Vui lòng nhập lý do thay đổi trạng thái.");
            return;
        }

        setProcessingReason(true);
        try {
            const res = await axios.put(`${Constants.DOMAIN_API}/admin/user/${selectedUserId}/status`, {
                status: selectedNewStatus,
                reason: finalReason,
            });
            toast.success(res.data.message);
            await fetchData(currentPage, filterStatus, appliedSearchTerm);
        } catch (error) {
            toast.error(`Không thể cập nhật trạng thái người dùng: ${error.response?.data?.message || error.message}`);
        } finally {
            setProcessingReason(false);
            setShowReasonModal(false);
            setSelectedUserId(null);
            setSelectedNewStatus('');
            setReasonOption('');
            setCustomReason('');
        }
    };


    const getVietnameseStatus = (englishStatus) => {
        switch (englishStatus) {
            case "active": return "Hoạt động";
            // case "inactive": return "Ngưng hoạt động";
            case "locked": return "Bị khóa";
            default: return englishStatus;
        }
    };

    const getReasonOptionsForStatus = (status) => {
        switch (status) {
            // case "inactive":
            //     return (
            //         <>
            //             <option value="">-- Chọn lý do --</option>
            //             <option value="Không hoạt động trong thời gian dài">Không hoạt động trong thời gian dài</option>
            //             <option value="Yêu cầu tạm dừng của người dùng">Yêu cầu tạm dừng của người dùng</option>
            //             <option value="Lý do nội bộ hệ thống">Lý do nội bộ hệ thống</option>
            //             <option value="Khác">Khác</option>
            //         </>
            //     );
            case "locked":
                return (
                    <>
                        <option value="">-- Chọn lý do --</option>
                        <option value="Vi phạm chính sách cộng đồng">Vi phạm chính sách cộng đồng</option>
                        <option value="Hoạt động đáng ngờ">Hoạt động đáng ngờ</option>
                        <option value="Spam hoặc lạm dụng">Spam hoặc lạm dụng</option>
                        <option value="Khác">Khác</option>
                    </>
                );
            case "active":
                return (
                    <>
                        <option value="">-- Chọn lý do --</option>
                        <option value="Kích hoạt lại tài khoản">Kích hoạt lại tài khoản</option>
                        <option value="Xác minh thành công">Xác minh thành công</option>
                        <option value="Khác">Khác</option>
                    </>
                );
            default:
                return (
                    <>
                        <option value="">-- Chọn lý do --</option>
                        <option value="Lý do chung">Lý do chung</option>
                        <option value="Khác">Khác</option>
                    </>
                );
        }
    };

    return (
        <div className="container mx-auto p-6">
            <div className="bg-white p-4 shadow rounded-md">
                <h2 className="text-xl font-semibold mb-4">Danh sách người dùng</h2>

                {/* Các nút lọc trạng thái */}
                <div className="flex flex-wrap gap-2 mb-4 whitespace-nowrap">
                    {[
                        { key: "", label: "Tất cả", color: "bg-gray-300", textColor: "text-gray-700", countKey: "all" },
                        { key: "active", label: "Hoạt động", color: "bg-green-300", textColor: "text-green-800", countKey: "active" },
                        // { key: "inactive", label: "Ngưng hoạt động", color: "bg-red-300", textColor: "text-red-800", countKey: "inactive" },
                        { key: "locked", label: "Bị khóa", color: "bg-purple-300", textColor: "text-purple-800", countKey: "locked" },
                    ].map(({ key, label, color, textColor, countKey }) => (
                        <button
                            key={key || "all"}
                            onClick={() => handleFilterChange(key)}
                            className={`
                                    flex items-center gap-2 border px-3 py-1.5 rounded-md text-sm transition-all
                                    ${filterStatus === key ? "bg-[#073272] text-white" : "bg-white text-gray-700"}
                                `}
                        >
                            {label}
                            <span className={`px-2 py-0.5 rounded ${color} ${textColor} text-xs font-semibold`}>
                                {userCounts[countKey] ?? 0}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Form tìm kiếm */}
                <div className="mb-4 relative flex">
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo tên hoặc email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
                        className="flex-grow border border-gray-300 rounded py-2 px-4 text-gray-700 leading-tight focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        onClick={handleSearchSubmit}
                        className="bg-blue-900 hover:bg-blue-800 text-white px-4 py-1.5 rounded ms-2"
                        title="Tìm kiếm"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1010.5 3a7.5 7.5 0 006.15 13.65z" />
                        </svg>
                    </button>
                </div>

                {/* Bảng danh sách người dùng */}
                {loading ? (
                    <div className="text-center py-4">Đang tải dữ liệu...</div>
                ) : (
                    <>
                        <table className="w-full border-collapse border border-gray-300 mt-3">
                            <thead>
                                <tr className="bg-gray-200">
                                    <th className="p-2 border">#</th>
                                    <th className="p-2 border">Tên</th>
                                    <th className="p-2 border">Email</th>
                                    <th className="p-2 border">Điện thoại</th>
                                    <th className="p-2 border">Avatar</th>
                                    {/* <th className="p-2 border">Vai trò</th> */}
                                    <th className="p-2 border">Trạng thái</th>
                                    <th className="p-2 border"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.length > 0 ? (
                                    users.map((user, index) => (
                                        <tr key={user.id} className="border-b">
                                            <td className="p-2 border">{(currentPage - 1) * limit + index + 1}</td>
                                            <td className="p-2 border">{user.name}</td>
                                            <td className="p-2 border">{user.email}</td>
                                            <td className="p-2 border">{user.phone}</td>
                                            <td className="p-2 border">
                                                {user.avatar ? (
                                                    <img
                                                        src={user.avatar.startsWith('http') ? user.avatar : `${Constants.DOMAIN_API}/uploads/${user.avatar}`}
                                                        alt={user.name}
                                                        className="w-16 h-16 object-cover rounded-full"
                                                    />
                                                ) : (
                                                    <span className="text-gray-400">Không có avatar</span>
                                                )}
                                            </td>
                                            {/* <td className="p-2 border capitalize whitespace-nowrap">{user.role}</td> */}
                                            <td className="p-2 border capitalize">
                                                {(() => {
                                                    const isAdmin = user.role === 'admin';
                                                    return (
                                                        <select
                                                            value={user.status}
                                                            onChange={(e) => {
                                                                if (isAdmin) return; // chặn FE
                                                                handleStatusChange(user.id, e.target.value);
                                                            }}
                                                            disabled={isAdmin}
                                                            title={isAdmin ? "Không thể thay đổi trạng thái tài khoản admin" : "Thay đổi trạng thái"}
                                                            className={`border rounded px-2 py-1 ${isAdmin ? "bg-gray-100 text-gray-500 cursor-not-allowed opacity-60" : ""}`}
                                                        >
                                                            <option value="active">Hoạt động</option>
                                                            <option value="locked">Bị khóa</option>
                                                        </select>
                                                    );
                                                })()}
                                            </td>
                                            <td className="p-2 border text-center">
                                                <Link
                                                    to={`/admin/user/detail/${user.id}`}
                                                    className="bg-blue-500 text-white p-2 rounded w-10 h-10 inline-flex items-center justify-center"
                                                >
                                                    <FaEye size={20} className="font-bold" />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="9" className="p-4 text-center text-red-500 font-medium">
                                            {appliedSearchTerm ? "Không tìm thấy người dùng nào phù hợp." : "Không có dữ liệu."}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        {/* Phân trang */}
                        <div className="flex justify-center mt-4 items-center">
                            <div className="flex items-center space-x-1">
                                <button disabled={currentPage === 1} onClick={() => handlePageChange(1)} className="px-2 py-1 border rounded disabled:opacity-50"><FaAngleDoubleLeft /></button>
                                <button disabled={currentPage === 1} onClick={() => handlePageChange(currentPage - 1)} className="px-2 py-1 border rounded disabled:opacity-50"><FaChevronLeft /></button>
                                {[...Array(totalPages)].map((_, i) => {
                                    const page = i + 1;
                                    if (page >= currentPage - 1 && page <= currentPage + 1 || page === 1 || page === totalPages) {
                                        if (page === 1 && currentPage > 2) {
                                            return <span key="dots-start" className="px-2 py-1">...</span>;
                                        }
                                        if (page === totalPages && currentPage < totalPages - 1) {
                                            return <span key="dots-end" className="px-2 py-1">...</span>;
                                        }
                                        return (
                                            <button
                                                key={page}
                                                onClick={() => handlePageChange(page)}
                                                className={`px-3 py-1 border rounded ${currentPage === page ? "bg-blue-500 text-white" : "bg-blue-100 text-black hover:bg-blue-200"}`}
                                            >
                                                {page}
                                            </button>
                                        );
                                    }
                                    return null;
                                })}
                                <button disabled={currentPage === totalPages} onClick={() => handlePageChange(currentPage + 1)} className="px-2 py-1 border rounded disabled:opacity-50"><FaChevronRight /></button>
                                <button disabled={currentPage === totalPages} onClick={() => handlePageChange(totalPages)} className="px-2 py-1 border rounded disabled:opacity-50"><FaAngleDoubleRight /></button>
                            </div>
                        </div>
                    </>
                )}

                {/* Modal chọn lý do */}
                {showReasonModal && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                        <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
                            <h3 className="text-lg font-semibold mb-4">
                                Lý do thay đổi trạng thái sang: <span className="text-blue-600">{getVietnameseStatus(selectedNewStatus)}</span>
                            </h3>
                            <label className="block mb-2">Chọn lý do mẫu:</label>
                            <select
                                value={reasonOption}
                                onChange={(e) => {
                                    setReasonOption(e.target.value);
                                    setCustomReason('');
                                }}
                                className="w-full border rounded px-3 py-2 mb-4"
                            >
                                {getReasonOptionsForStatus(selectedNewStatus)}
                            </select>
                            {reasonOption === 'Khác' && (
                                <>
                                    <label className="block mb-2">Nhập lý do khác:</label>
                                    <input
                                        type="text"
                                        value={customReason}
                                        onChange={(e) => setCustomReason(e.target.value)}
                                        className="w-full border rounded px-3 py-2"
                                        placeholder="Nhập lý do..."
                                    />
                                </>
                            )}
                            <div className="flex justify-end mt-4 space-x-2">
                                <button
                                    onClick={() => setShowReasonModal(false)}
                                    className="px-4 py-2 bg-gray-300 rounded"
                                    disabled={processingReason}
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleSubmitReason}
                                    className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
                                    disabled={processingReason}
                                >
                                    {processingReason ? "Đang xử lý..." : "Xác nhận"}
                                </button>
                            </div>

                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default UserList;