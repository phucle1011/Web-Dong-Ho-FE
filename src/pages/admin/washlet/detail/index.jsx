import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Constants from "../../../../Constants";
import { toast } from "react-toastify";
import axios from "axios";
import {
    FaChevronLeft,
    FaChevronRight,
    FaAngleDoubleLeft,
    FaAngleDoubleRight,
} from "react-icons/fa";

const AccordionItem = ({ title, children }) => {
    const [open, setOpen] = useState(false);
    return (
        <div className="border border-gray-200 rounded mb-3 shadow-sm">
            <button
                className="w-full text-left px-4 py-3 bg-gray-100 hover:bg-gray-200 font-semibold text-sm rounded-t"
                onClick={() => setOpen(!open)}
            >
                {title}
            </button>
            {open && <div className="px-5 py-4 bg-white text-sm">{children}</div>}
        </div>
    );
};

function WalletUserDetail() {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const recordsPerPage = 10;
    const [withdraws, setWithdraws] = useState([]);
    const [refunds, setRefunds] = useState([]);
    const [totalWithdraws, setTotalWithdraws] = useState(0);
    const [totalRefunds, setTotalRefunds] = useState(0);
    const [loading, setLoading] = useState(false);
    const [topups, setTopups] = useState([]);
    const [totalTopups, setTotalTopups] = useState(0);

    // Tách riêng các effect để tránh xung đột state
    useEffect(() => {
        fetchRequests(currentPage);
    }, [currentPage]);

    useEffect(() => {
        fetchTopups(currentPage);
    }, [currentPage]);

    const fetchRequests = async (page) => {
        setLoading(true);
        try {
            const res = await axios.get(
                `${Constants.DOMAIN_API}/admin/wallets/user/${userId}?page=${page}&limit=${recordsPerPage}`
            );

            const responseData = res.data?.data || {};
            const pagination = res.data?.pagination || {};

            setWithdraws(responseData.withdraws || []);
            setRefunds(responseData.refunds || []);
            setTotalWithdraws(pagination.totalWithdraws || 0);
            setTotalRefunds(pagination.totalRefunds || 0);
            setTotalPages(pagination.totalPages || 1);
        } catch (err) {
            console.error("API Error:", err.response?.data || err.message);
            toast.error(err.response?.data?.message || "Không thể lấy dữ liệu người dùng.");
        } finally {
            setLoading(false);
        }
    };

    const fetchTopups = async (page) => {
        try {
            const res = await axios.get(
                `${Constants.DOMAIN_API}/admin/wallets/topups?page=${page}&limit=${recordsPerPage}&userId=${userId}`
            );

            const topupData = res.data?.data || [];
            const processedTopups = topupData.map(item => ({
                ...item,
                status: item.status || 'completed',
                created_at: item.created_at || new Date().toISOString()
            }));

            setTopups(processedTopups);
            setTotalTopups(res.data?.pagination?.total || processedTopups.length);

        } catch (err) {
            console.error("Topups error:", err);
            toast.error("Không thể tải lịch sử nạp tiền.");
            setTopups([]);
            setTotalTopups(0);
        }
    };

    const formatCurrency = (amount) => {
        if (!amount) return "0 ₫";
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(amount);
    };

    const translateStatus = (status) => {
        const statusMap = {
            pending: "Chờ duyệt",
            approved: "Đã duyệt",
            rejected: "Từ chối",
            completed: "Hoàn thành",
        };
        return statusMap[status] || status || "Không xác định";
    };

    if (loading) {
        return (
            <div className="container mx-auto p-4">
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4">
            <h2 className="text-xl font-bold mb-4">Lịch sử yêu cầu người dùng</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[{
                    label: "Rút tiền",
                    list: withdraws,
                    total: totalWithdraws,
                    type: "withdraw"
                }, {
                    label: "Hoàn tiền",
                    list: refunds,
                    total: totalRefunds,
                    type: "refund"
                }, {
                    label: "Nạp tiền",
                    list: topups,
                    total: totalTopups,
                    type: "topup"
                }].map(({ label, list, total, type }) => (
                    <div key={type} className="bg-white rounded-xl shadow-md border border-gray-200">
                        <div className="px-6 py-4 border-b">
                            <h3 className="text-lg font-semibold text-gray-800">
                                {label} ({total})
                            </h3>
                        </div>
                        <div className="divide-y">
                            {list.length === 0 ? (
                                <p className="text-gray-500 text-sm py-6 text-center">
                                    Không có lịch sử {label.toLowerCase()}
                                </p>
                            ) : (
                                list.map((item, idx) => {
                                    const stt = (currentPage - 1) * recordsPerPage + idx + 1;
                                    return (
                                        <AccordionItem
                                            key={`${type}-${item.id}-${idx}`}
                                            title={
                                                <div className="flex items-center justify-between text-sm font-medium">
                                                    <span className="text-gray-700">#{stt}</span>
                                                    <span className="text-gray-600">
                                                        {formatCurrency(item.amount)}
                                                    </span>
                                                    <span className={`px-2 py-1 rounded text-xs font-semibold ${!item.status ? "bg-gray-100 text-gray-700" :
                                                        item.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                                                            item.status === "approved" || item.status === "completed" ? "bg-green-100 text-green-700" :
                                                                item.status === "rejected" ? "bg-red-100 text-red-700" :
                                                                    "bg-gray-100 text-gray-700"
                                                        }`}>
                                                        {translateStatus(item.status || "completed")}
                                                    </span>
                                                </div>
                                            }
                                        >
                                            <div className="text-sm text-gray-700 space-y-2 mt-2">
                                                <p>
                                                    <strong>Ngày tạo:</strong>
                                                    {(() => {
                                                        const date = new Date(item.created_at);
                                                        const pad = (n) => String(n).padStart(2, '0');
                                                        const h = pad(date.getUTCHours());
                                                        const m = pad(date.getUTCMinutes());
                                                        const s = pad(date.getUTCSeconds());
                                                        const d = pad(date.getUTCDate());
                                                        const mo = pad(date.getUTCMonth() + 1);
                                                        const y = date.getUTCFullYear();
                                                        return `${h}:${m}:${s} ${d}/${mo}/${y}`;
                                                    })()}
                                                </p>
                                                {type === "withdraw" && (
                                                    <>
                                                        <p><strong>Tên người nhận:</strong> {item.receiver_name}</p>
                                                        <p><strong>Ngân hàng:</strong> {item.bank_name}</p>
                                                        <p><strong>Số tài khoản:</strong> {item.bank_account}</p>
                                                        {item.status === "rejected" && item.cancellation_reason && (
                                                            <p className="mt-1">
                                                                <strong>Lý do từ chối:  </strong>{item.cancellation_reason}
                                                            </p>
                                                        )}
                                                    </>
                                                )}
                                                {type === "refund" && (
                                                    <>
                                                        <p><strong>Mã đơn hàng:</strong> {item.order?.order_code || "—"}</p>
                                                        {item.order?.orderDetails?.map((d, i) => (
                                                            <p key={i}>
                                                                <strong>Sản phẩm:</strong> {d.variant?.product?.name || "—"} - <strong>SKU:</strong> {d.variant.sku || "—"}
                                                            </p>
                                                        ))}
                                                    </>
                                                )}
                                                {type === "topup" && (
                                                    <>
                                                        <p><strong>Phương thức:</strong> {item.method?.toUpperCase() || "—"}</p>
                                                    </>
                                                )}
                                            </div>
                                        </AccordionItem>
                                    );
                                })
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {totalPages && (
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
                            onClick={() => setCurrentPage((p) => p - 1)}
                            className="px-2 py-1 border rounded disabled:opacity-50"
                        >
                            <FaChevronLeft />
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter((page) => page >= currentPage - 2 && page <= currentPage + 2)
                            .map((page) => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`w-8 h-8 border rounded text-sm flex items-center justify-center ${page === currentPage
                                        ? "bg-blue-600 text-white"
                                        : "bg-white hover:bg-blue-100"
                                        }`}
                                >
                                    {page}
                                </button>
                            ))}
                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage((p) => p + 1)}
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
            )}

            <div className="mt-8">
                <button
                    onClick={() => navigate("/admin/washlets/getAll")}
                    className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 text-sm"
                >
                    Quay lại
                </button>
            </div>
        </div>
    );
}

export default WalletUserDetail;