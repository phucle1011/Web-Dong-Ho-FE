import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Constants from "../../../../Constants.jsx";
import { toast } from "react-toastify";
import FormDelete from "../../../../components/formDelete";
import {
    FaChevronLeft,
    FaChevronRight,
    FaAngleDoubleLeft,
    FaAngleDoubleRight,
    FaTrashAlt,
    FaEdit,
    FaEye
} from "react-icons/fa";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import PromotionOrderListModal from "../Promotiondetail/index.jsx";
import { useNavigate } from "react-router-dom";

function PromotionGetAll() {
    const navigate = useNavigate();
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [appliedOrders, setAppliedOrders] = useState([]);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [promotions, setPromotions] = useState([]);
    const [selectedPromotion, setSelectedPromotion] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [statusCounts, setStatusCounts] = useState({
        all: 0,
        active: 0,
        upcoming: 0,
        expired: 0,
        inactive: 0,
        exhausted: 0,
        special: 0,
    });

    const exportToExcel = () => {
        if (promotions.length === 0) {
            toast.info("Không có dữ liệu để xuất.");
            return;
        }
        const data = promotions.map((promo, index) => ([
            (currentPage - 1) * perPage + index + 1,
            promo.name,
            promo.discount_type === "percentage"
                ? `${promo.discount_value}%`
                : `${promo.discount_value.toLocaleString()}đ`,
            promo.quantity > 0 ? promo.quantity : "Hết lượt",
            formatDate(promo.start_date),
            formatDate(promo.end_date),
            {
                active: "Đang diễn ra",
                upcoming: "Sắp diễn ra",
                expired: "Đã hết hạn",
                inactive: "Vô hiệu hóa",
                exhausted: "Hết lượt sử dụng",
            }[promo.status],
            // promo.special_promotion ? "Có" : "Không",
        ]));

        const worksheet = XLSX.utils.aoa_to_sheet([
            [
                "#",
                "Tên khuyến mãi",
                "% Giảm",
                "Lượt",
                "Ngày bắt đầu",
                "Ngày kết thúc",
                "Trạng thái",
                "Khách đặc biệt",
            ],
            ...data,
        ]);
        worksheet["!cols"] = [
            { wpx: 40 },
            { wpx: 200 },
            { wpx: 80 },
            { wpx: 70 },
            { wpx: 120 },
            { wpx: 120 },
            { wpx: 100 },
            { wpx: 100 },
        ];
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Khuyến mãi");
        const excelBuffer = XLSX.write(workbook, {
            bookType: "xlsx",
            type: "array",
        });
        const blob = new Blob([excelBuffer], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
        });
        saveAs(blob, `danh_sach_khuyen_mai_${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    const perPage = 10;

    useEffect(() => {
        if (filterStatus === "used") {
            getUsedPromotions();
        } else {
            getPromotions(currentPage, searchTerm, filterStatus, startDate, endDate);
        }
    }, [currentPage, filterStatus]);

    const getUsedPromotions = async () => {
        try {
            const res = await axios.get(`${Constants.DOMAIN_API}/admin/promotions/applied`);
            const usedPromos = res.data.data || [];
            setPromotions(usedPromos);
            setTotalPages(1);
            setStatusCounts(prev => ({ ...prev, used: usedPromos.length }));
        } catch (error) {
            console.error("Lỗi khi lấy khuyến mãi đã sử dụng:", error);
            toast.error("Không thể tải khuyến mãi đã sử dụng.");
        }
    };

    const getPromotions = async (page = 1, search = "", status = "", start = "", end = "") => {
        try {
            const params = {
                page,
                limit: perPage,
                searchTerm: search,
                startDate: start,
                endDate: end,
            };

            if (status === "special") {
                params.special_promotion = "true";
            } else {
                params.status = status;
            }

            const res = await axios.get(`${Constants.DOMAIN_API}/admin/promotions/list`, { params });

            let filtered = res.data.data || [];

            if (status === "special") {
                const now = new Date();
                filtered = filtered.filter(promo =>
                    promo.special_promotion &&
                    promo.status === "active" &&
                    new Date(promo.start_date) <= now &&
                    new Date(promo.end_date) >= now &&
                    promo.quantity > 0
                );
            }

            setPromotions(filtered);
            setTotalPages(res.data.pagination?.totalPages || 1);
            setStatusCounts(res.data.statusCounts || {});

            if (search && filtered.length === 0) {
                toast.info("Không tìm thấy khuyến mãi nào.");
            }

        } catch (error) {
            console.error("Lỗi khi tải khuyến mãi:", error);
            toast.error("Không thể tải danh sách khuyến mãi.");
        }
    };

       const deletePromotion = async () => {
        if (!selectedPromotion) return;
        try {
            await axios.delete(`${Constants.DOMAIN_API}/admin/promotion/${selectedPromotion.id}`);
            toast.success("Xóa khuyến mãi thành công");
            getPromotions(currentPage, searchTerm, filterStatus, startDate, endDate);
        } catch (error) {
            toast.error(error.response?.data?.message || "Xóa thất bại. Vui lòng thử lại.");
        } finally {
            setSelectedPromotion(null);
        }
    };

    const handleFilterByDate = () => {
        setCurrentPage(1);
        getPromotions(1, searchTerm, filterStatus, startDate, endDate);
    };

    const formatDate = (dateString) => new Date(dateString).toLocaleDateString("vi-VN");

    const statusList = [
        { key: "all", label: "Tất cả", color: "bg-gray-800", textColor: "text-white" },
        { key: "active", label: "Đang diễn ra", color: "bg-green-300", textColor: "text-green-800" },
        { key: "upcoming", label: "Sắp diễn ra", color: "bg-blue-300", textColor: "text-blue-900" },
        { key: "expired", label: "Đã hết hạn", color: "bg-red-300", textColor: "text-red-800" },
        { key: "inactive", label: "Vô hiệu hóa", color: "bg-gray-300", textColor: "text-gray-800" },
        { key: "exhausted", label: "Hết lượt", color: "bg-yellow-300", textColor: "text-yellow-800" },
        { key: "special", label: "Mã giảm đặc biệt", color: "bg-purple-300", textColor: "text-purple-800" },
    ];

    return (
        <div className="container mx-auto p-4 bg-white shadow-md rounded">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">Danh sách khuyến mãi</h2>
                <Link to="/admin/promotions/create" className="bg-[#073272] hover:bg-[#05224f] text-white px-4 py-2 rounded shadow">
                    + Thêm khuyến mãi
                </Link>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
                <DatePicker
                    selected={startDate}
                    onChange={(date) => setStartDate(date)}
                    selectsStart
                    startDate={startDate}
                    endDate={endDate}
                    placeholderText="Chọn ngày bắt đầu"
                    className="shadow border rounded py-2 px-3 text-sm"
                    dateFormat="yyyy-MM-dd"
                />
                <DatePicker
                    selected={endDate}
                    onChange={(date) => setEndDate(date)}
                    selectsEnd
                    startDate={startDate}
                    endDate={endDate}
                    minDate={startDate}
                    placeholderText="Chọn ngày kết thúc"
                    className="shadow border rounded py-2 px-3 text-sm ml-2"
                    dateFormat="yyyy-MM-dd"
                />
                <button
                    onClick={handleFilterByDate}
                    className="bg-[#073272] hover:bg-[#05224f] text-white px-4 py-2 text-sm rounded ml-2"
                >
                    Lọc theo ngày
                </button>
                <button
                    onClick={exportToExcel}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm rounded ml-2"
                >
                    Xuất Excel
                </button>
                <button
                    onClick={() => {
                        setFilterStatus("used");
                        setCurrentPage(1);
                        getUsedPromotions();
                    }}
                    className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 text-sm rounded ml-2"
                >
                    Đã sử dụng
                </button>
            </div>

            <div className="overflow-x-auto">
                <div className="flex gap-2 mb-4 whitespace-nowrap">
                    {statusList.map(({ key, label, color, textColor }) => (
                        <button
                            key={key}
                            onClick={() => {
                                setFilterStatus(key === "all" ? "" : key);
                                setCurrentPage(1);
                                getPromotions(1, searchTerm, key === "all" ? "" : key, startDate, endDate);
                            }}
                            className={`flex items-center gap-2 border px-3 py-1.5 rounded-md text-sm transition-all 
                    ${filterStatus === (key === "all" ? "" : key)
                                    ? "bg-[#073272] text-white"
                                    : "bg-white text-gray-700"
                                }`}
                        >
                            {label}
                            <span className={`px-2 py-0.5 rounded ${color} ${textColor} text-xs font-semibold`}>
                                {statusCounts[key] ?? 0}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-4 items-stretch sm:items-center flex-wrap">
                <input
                    type="text"
                    className="flex-grow border border-gray-300 rounded py-2 px-4 text-gray-700 leading-tight focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập tên khuyến mãi..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            setCurrentPage(1);
                            getPromotions(1, searchTerm, filterStatus, startDate, endDate);
                        }
                    }}
                />
                <button
                    onClick={() => {
                        setCurrentPage(1);
                        getPromotions(1, searchTerm, filterStatus, startDate, endDate);
                    }}
                    className="bg-blue-900 hover:bg-blue-800 text-white px-4 py-1.5 rounded flex items-center justify-center"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1010.5 3a7.5 7.5 0 006.15 13.65z" />
                    </svg>
                </button>
            </div>


            <div className="overflow-x-auto">
                <table className="min-w-full text-sm border border-collapse border-gray-300">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="border p-2">#</th>
                            <th className="border p-2">Tên</th>
                            <th className="border p-2">% Giảm</th>
                            <th className="border p-2">Lượt</th>
                            <th className="border p-2">Bắt đầu</th>
                            <th className="border p-2">Kết thúc</th>
                            <th className="border p-2">Áp dụng</th>
                            <th className="border p-2">Trạng thái</th>
                            {/* <th className="border p-2">Khách đặc biệt</th> */}
                            <th className="border p-2">Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {promotions.map((promo, index) => (
                            <tr key={promo.id} className="hover:bg-gray-50">
                                <td className="border p-2 text-center">{(currentPage - 1) * perPage + index + 1}</td>
                                <td className="border p-2">{promo.name}</td>
                                <td className="border p-2 text-center">
                                    {promo.discount_type === "percentage"
                                        ? `${promo.discount_value}%`
                                        : `${Number(promo.discount_value).toLocaleString("vi-VN", {
                                            style: "currency",
                                            currency: "VND",
                                        })}`}
                                </td>
                                <td className="border p-2 text-center">{promo.quantity > 0 ? promo.quantity : "Hết lượt"}</td>
                                <td className="border p-2 text-center">{formatDate(promo.start_date)}</td>
                                <td className="border p-2 text-center">{formatDate(promo.end_date)}</td>
                                <td className="border p-2 text-center">
                                    {promo.applicable_to === "order" ? "Đơn hàng" : <span className="font-bold">Sản phẩm</span>}
                                </td>
                                <td className="border p-2 text-center">
                                    <span
                                        className={`px-2 py-1 rounded-full text-xs font-medium ${promo.status === "expired"
                                            ? "bg-red-100 text-red-800"
                                            : promo.status === "inactive"
                                                ? "bg-gray-200 text-gray-800"
                                                : promo.status === "upcoming"
                                                    ? "bg-blue-100 text-blue-800"
                                                    : promo.status === "exhausted"
                                                        ? "bg-yellow-100 text-yellow-800"
                                                        : "bg-green-100 text-green-800"}`}
                                    >
                                        {{
                                            active: "Đang diễn ra",
                                            upcoming: "Sắp diễn ra",
                                            expired: "Đã hết hạn",
                                            inactive: "Vô hiệu hóa",
                                            exhausted: "Hết lượt sử dụng",
                                        }[promo.status]}
                                    </span>
                                </td>
                                {/* <td className="border p-2 text-center">
                                    {promo.special_promotion ? "Có" : "Không"}
                                </td> */}
                                <td className="border p-2 text-center space-x-2">
                                    {filterStatus === "used" ? (
                                        <button
                                            onClick={() => navigate(`/admin/promotions/applied/${promo.id}`)}
                                            className="bg-blue-500 text-white p-2 rounded w-8 h-8 inline-flex items-center justify-center"
                                        >
                                            <FaEye size={20} />
                                        </button>
                                    ) : (
                                        <>
                                            <Link
                                                to={`/admin/promotions/edit/${promo.id}`}
                                                className="bg-yellow-500 text-white p-2 rounded w-8 h-8 inline-flex items-center justify-center"
                                            >
                                                <FaEdit size={20} className="font-bold" />
                                            </Link>
                                            <button
                                                onClick={() => {
                                                    setSelectedPromotion(promo);
                                                    setShowDeleteDialog(true);
                                                }}
                                                className="p-2 rounded-full bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700 transition duration-200"
                                            >
                                                <FaTrashAlt size={20} className="font-bold" />
                                            </button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-center mt-6">
                <div className="flex items-center space-x-1">
                    <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(1)}
                        className="px-2 py-1 border rounded disabled:opacity-50"
                    >
                        <FaAngleDoubleLeft />
                    </button>
                    <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((prev) => prev - 1)}
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
                                    onClick={() => setCurrentPage(page)}
                                    className={`px-3 py-1 border rounded ${page === currentPage ? "bg-blue-600 text-white" : "bg-white hover:bg-blue-100"}`}
                                >
                                    {page}
                                </button>
                            );
                        }
                        return null;
                    })}
                    <button
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((prev) => prev + 1)}
                        className="px-2 py-1 border rounded disabled:opacity-50"
                    >
                        <FaChevronRight />
                    </button>
                    <button
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(totalPages)}
                        className="px-2 py-1 border rounded disabled:opacity-50"
                    >
                        <FaAngleDoubleRight />
                    </button>
                </div>
            </div>
            <FormDelete
                isOpen={showDeleteDialog}
                onClose={() => {
                    setShowDeleteDialog(false);
                    setSelectedPromotion(null);
                }}
                onConfirm={() => {
                    deletePromotion();
                    setShowDeleteDialog(false);
                }}
                message={`Bạn có chắc muốn xóa khuyến mãi "${selectedPromotion?.name}"?`}
                Id={selectedPromotion?.id}
            />
            {/* {showOrderModal && (
                <PromotionOrderListModal
                    orders={appliedOrders}
                    onClose={() => setShowOrderModal(false)}
                />
            )} */}
        </div>
    );
}

export default PromotionGetAll;