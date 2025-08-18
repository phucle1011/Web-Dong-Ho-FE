import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import React, { useEffect, useState, useRef } from "react";
import {
    FaChevronLeft,
    FaChevronRight,
    FaAngleDoubleLeft,
    FaAngleDoubleRight,
    FaEdit,
    FaTrashAlt,
    FaEye,
    FaListUl,
    FaClock,
    FaPlayCircle,
    FaTimesCircle
} from "react-icons/fa";
import Constants from "../../../../Constants.jsx";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import FormDelete from "../../../../components/formDelete";

function AuctionGetAll() {
    const [auctions, setAuctions] = useState([]);
    const [selectedAuction, setSelectedAuction] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [statusFilter, setStatusFilter] = useState("all");
    const [activeStatus, setActiveStatus] = useState('');
    const [expandedRows, setExpandedRows] = useState({});
    const productNameRefs = useRef({});

    const toggleRow = (id) => {
        setExpandedRows(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const [statusCounts, setStatusCounts] = useState({
        all: 0,
        upcoming: 0,
        active: 0,
        ended: 0
    });
    const recordsPerPage = 10;

    const STATUS_LABELS = {
        upcoming: "Sắp diễn ra",
        active: "Đang diễn ra",
        ended: "Đã kết thúc",
    };

    const STATUS_COLORS = {
        upcoming: "bg-blue-100 text-blue-700",
        active: "bg-green-100 text-green-700",
        ended: "bg-red-100 text-red-700",
    };

    const formatDateLocal = (date) => {
        if (!date) return "";
        const year = date.getFullYear();
        const month = `${date.getMonth() + 1}`.padStart(2, "0");
        const day = `${date.getDate()}`.padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    const fetchAuctions = async (page = 1, keyword = searchTerm, start = startDate, end = endDate, status = statusFilter) => {
        try {
            const params = {
                page,
                limit: recordsPerPage,
            };

            if (keyword.trim()) {
                params.searchTerm = keyword.trim();
            }

            if (start) params.startDate = formatDateLocal(start);
            if (end) params.endDate = formatDateLocal(end);
            if (status && status !== 'all') params.status = status;

            const res = await axios.get(`${Constants.DOMAIN_API}/admin/auctions`, { params });

            setAuctions(res.data.data || []);
            setTotalPages(res.data.pagination?.totalPages || 1);
            setCurrentPage(res.data.pagination?.currentPage || 1);

            if (res.data.statusCounts) {
                setStatusCounts({
                    all: res.data.statusCounts.all || 0,
                    upcoming: res.data.statusCounts.upcoming || 0,
                    active: res.data.statusCounts.active || 0,
                    ended: res.data.statusCounts.ended || 0
                });
            }
        } catch (error) {
            console.error("Lỗi khi tải phiên đấu giá:", error);
            toast.error("Không thể tải dữ liệu từ máy chủ.");
        }
    };

    const deleteAuction = async () => {
        if (!selectedAuction) return;

        try {
            await axios.delete(`${Constants.DOMAIN_API}/admin/auctions/delete/${selectedAuction.id}`);
            toast.success("Xóa phiên đấu giá thành công!");
            if (auctions.length === 1 && currentPage > 1) {
                setCurrentPage(currentPage - 1);
            } else {
                fetchAuctions(currentPage, searchTerm, startDate, endDate, statusFilter);
            }
        } catch (error) {
            console.error("Lỗi khi xóa phiên đấu giá:", error);
            toast.error(error.response?.data?.message || "Xóa phiên đấu giá thất bại");
        } finally {
            setSelectedAuction(null);
        }
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const handleFilter = () => {
        setCurrentPage(1);
        fetchAuctions(1, searchTerm, startDate, endDate, statusFilter);
    };

    const handleFilterClick = (status) => {
        setStatusFilter(status);
        setActiveStatus(status);
        setCurrentPage(1);
        fetchAuctions(1, searchTerm, startDate, endDate, status);
    };

    useEffect(() => {
        fetchAuctions(currentPage, searchTerm, startDate, endDate, statusFilter);
    }, [currentPage]);

    return (
        <div className="container mx-auto p-2">
            <div className="bg-white p-4 shadow rounded-md">
                <div className="mb-6">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-3">
                        <h2 className="text-xl font-semibold">Danh sách phiên đấu giá</h2>
                        <Link
                            to="/admin/auctions/create"
                            className="bg-[#073272] hover:bg-[#052652] text-white px-4 py-2 rounded shadow"
                        >
                            + Thêm đấu giá
                        </Link>
                    </div>

                    <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                        <span className="italic text-gray-600">Chọn khoảng thời gian để lọc theo ngày bắt đầu:</span>
                        <DatePicker
                            selected={startDate}
                            onChange={(date) => setStartDate(date)}
                            dateFormat="yyyy-MM-dd"
                            placeholderText="Ngày bắt đầu"
                            className="border px-3 py-2 rounded w-40"
                        />
                        <DatePicker
                            selected={endDate}
                            onChange={(date) => setEndDate(date)}
                            dateFormat="yyyy-MM-dd"
                            placeholderText="Ngày kết thúc"
                            className="border px-3 py-2 rounded w-40"
                        />
                        <button
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow"
                            onClick={handleFilter}
                        >
                            Lọc theo ngày
                        </button>
                    </div>

                    <div className="flex flex-nowrap items-center gap-6 border-b border-gray-200 px-6 py-4 overflow-x-auto mb-4">
                        {[
                            { key: "all", label: "Tất cả", icon: <FaListUl />, color: "bg-gray-800", textColor: "text-white", count: statusCounts.all },
                            { key: "upcoming", label: "Sắp diễn ra", icon: <FaClock />, color: "bg-blue-300", textColor: "text-blue-800", count: statusCounts.upcoming },
                            { key: "active", label: "Đang diễn ra", icon: <FaPlayCircle />, color: "bg-green-300", textColor: "text-green-800", count: statusCounts.active },
                            { key: "ended", label: "Đã kết thúc", icon: <FaTimesCircle />, color: "bg-red-300", textColor: "text-red-800", count: statusCounts.ended },
                        ].map(({ key, label, color, textColor, count, icon }) => {
                            const isActive = activeStatus === key;
                            return (
                                <button
                                    key={key}
                                    onClick={() => handleFilterClick(key)}
                                    className={`border px-3 py-1.5 text-xs flex items-center gap-1 ${isActive ? 'bg-[#073272] text-white' : 'bg-white text-gray-700'}`}
                                >
                                    {icon && <span>{icon}</span>}
                                    <span> {label}</span>
                                    <span className={`${color} ${textColor} rounded-full px-1 py-0.5 ms-1`}>
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="mb-6 flex items-center gap-2">
                    <input
                        type="text"
                        className="flex-grow border border-gray-300 rounded py-2 px-4 text-gray-700 leading-tight focus:ring-2 focus:ring-blue-500"
                        placeholder="Tìm kiếm theo sản phẩm đấu giá..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleFilter()}
                    />
                    <button
                        type="button"
                        className="bg-blue-900 hover:bg-blue-800 text-white px-4 py-1.5 rounded"
                        onClick={handleFilter}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1010.5 3a7.5 7.5 0 006.15 13.65z" />
                        </svg>
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300 mt-3 text-left text-sm">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="text-center py-3 px-2 whitespace-nowrap">#</th>
                                <th className="text-center py-3 px-2 whitespace-nowrap">Sản phẩm đấu giá</th>
                                <th className="text-center py-3 px-2 whitespace-nowrap">Giá khởi điểm</th>
                                <th className="text-center py-3 px-2 whitespace-nowrap">Bước giá</th>
                                <th className="text-center py-3 px-2 whitespace-nowrap">Thời gian bắt đầu</th>
                                <th className="text-center py-3 px-2 whitespace-nowrap">Thời gian kết thúc</th>
                                <th className="text-center py-3 px-2 whitespace-nowrap">Trạng thái</th>
                                <th className="text-center py-3 px-2 whitespace-nowrap"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {auctions.length > 0 ? auctions.map((item, index) => {
                                const name = item.variant?.product?.name || "";
                                const displayText = name ? `${name} (${item.variant.sku})` : 'Không có tên sản phẩm';
                                const isExpanded = expandedRows[item.id];
                                const shouldShowToggle = productNameRefs.current[item.id]?.scrollHeight > productNameRefs.current[item.id]?.clientHeight;

                                return (
                                    <tr key={item.id}>
                                        <td className="p-2 border text-center">{(currentPage - 1) * recordsPerPage + index + 1}</td>
                                        <td className="p-2 border text-left max-w-xs">
                                            <div
                                                ref={(el) => productNameRefs.current[item.id] = el}
                                                className={`relative ${isExpanded ? '' : 'line-clamp-2'} break-words`}
                                            >
                                                {displayText}
                                            </div>
                                            {shouldShowToggle && (
                                                <button
                                                    onClick={() => toggleRow(item.id)}
                                                    className="text-blue-600 hover:blue-800 text-sm mt-1"
                                                >
                                                    {isExpanded ? 'Ẩn bớt' : 'Xem thêm'}
                                                </button>
                                            )}
                                        </td>
                                        <td className="p-2 border text-center">{Number(item.variant.price).toLocaleString("vi-VN")} ₫</td>
                                        <td className="p-2 border text-center">{Number(item.priceStep).toLocaleString("vi-VN")} ₫</td>
                                        <td className="p-2 border text-center">{item.start_time?.replace("T", " ").substring(0, 19)}</td>
                                        <td className="p-2 border text-center">{item.end_time?.replace("T", " ").substring(0, 19)}</td>
                                        <td className="p-2 border text-center whitespace-nowrap">
                                            <span
                                                className={`px-2 py-1 rounded text-sm font-medium ${STATUS_COLORS[item.status] || "bg-gray-100 text-gray-700"}`}
                                            >
                                                {STATUS_LABELS[item.status] || "Không xác định"}
                                            </span>
                                        </td>
                                        <td className="p-2 border text-center">
                                            <div className="flex justify-center items-center gap-2">
                                                <Link to={`/admin/auctions/detail/${item.id}`} className="bg-blue-500 text-white p-2 rounded" title="Xem chi tiết">
                                                    <FaEye size={16} className="font-bold" />
                                                </Link>
                                                {item.status === "upcoming" ? (
                                                    <>
                                                        <Link to={`/admin/auctions/edit/${item.id}`} className="bg-yellow-500 text-white p-2 rounded w-8 h-8 inline-flex items-center justify-center" title="Chỉnh sửa">
                                                            <FaEdit size={20} className="font-bold" />
                                                        </Link>
                                                        <button
                                                            onClick={() => setSelectedAuction(item)}
                                                            className="p-2 rounded-full bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700 transition duration-200"
                                                            title="Xoá"
                                                        >
                                                            <FaTrashAlt size={20} className="font-bold" />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="bg-gray-300 text-gray-500 p-2 rounded w-8 h-8 inline-flex items-center justify-center cursor-not-allowed" title="Chỉ có thể chỉnh sửa phiên sắp diễn ra">
                                                            <FaEdit size={20} className="font-bold" />
                                                        </span>
                                                        <span className="p-2 rounded-full bg-gray-100 text-gray-400 cursor-not-allowed" title="Chỉ có thể xoá phiên sắp diễn ra">
                                                            <FaTrashAlt size={20} className="font-bold" />
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan={8} className="text-center p-4 text-gray-500">Không có phiên đấu giá nào.</td>
                                </tr>
                            )}

                        </tbody>
                    </table>
                </div>

                <div className="flex justify-center mt-6">
                    <div className="flex items-center space-x-1">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => handlePageChange(1)}
                            className="px-2 py-1 border rounded disabled:opacity-50"
                        >
                            <FaAngleDoubleLeft />
                        </button>
                        <button
                            disabled={currentPage === 1}
                            onClick={() => handlePageChange(currentPage - 1)}
                            className="px-2 py-1 border rounded disabled:opacity-50"
                        >
                            <FaChevronLeft />
                        </button>

                        {[...Array(totalPages)].map((_, i) => {
                            const page = i + 1;
                            if (page >= currentPage - 1 && page <= currentPage + 1) {
                                return (
                                    <button
                                        key={page}
                                        onClick={() => handlePageChange(page)}
                                        className={`w-8 h-8 border rounded ${page === currentPage ? "bg-blue-600 text-white" : "bg-white hover:bg-blue-100"}`}
                                    >
                                        {page}
                                    </button>
                                );
                            }
                            return null;
                        })}

                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => handlePageChange(currentPage + 1)}
                            className="px-2 py-1 border rounded disabled:opacity-50"
                        >
                            <FaChevronRight />
                        </button>
                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => handlePageChange(totalPages)}
                            className="px-2 py-1 border rounded disabled:opacity-50"
                        >
                            <FaAngleDoubleRight />
                        </button>
                    </div>
                </div>
            </div>

            {selectedAuction && (
                <FormDelete
                    isOpen={true}
                    onClose={() => setSelectedAuction(null)}
                    onConfirm={deleteAuction}
                    message={`Bạn có chắc chắn muốn xóa phiên đấu giá của sản phẩm "${selectedAuction.variant?.product?.name
                        ? `${selectedAuction.variant.product.name} (${selectedAuction.variant.sku})`
                        : 'Không có tên sản phẩm'}" không?`}
                />
            )}
        </div>
    );
}

export default AuctionGetAll;