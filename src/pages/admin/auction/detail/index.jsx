import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Constants from "../../../../Constants";
import Modal from "react-modal";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-toastify";
import Select from "react-select";
import moment from "moment-timezone";
import { FaAngleDoubleLeft, FaAngleDoubleRight, FaChevronLeft, FaChevronRight } from "react-icons/fa";

Modal.setAppElement("#root");

export default function AdminAuctionWinnerOnly() {

    const navigate = useNavigate();
    const { id } = useParams();
    const [auction, setAuction] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [timeUp, setTimeUp] = useState(false);

    const [showRetryModal, setShowRetryModal] = useState(false);
    const [form, setForm] = useState({
        product_variant_id: null,
        start_price: "",
        priceStep: "",
        start_time: null,
        end_time: null,
    });

    const [errors, setErrors] = useState({});
    const [creating, setCreating] = useState(false);
    const [products, setProducts] = useState([]);

    const canCreate = auction?.status === 'ended';

    const [winnerData, setWinnerData] = useState({
        winner: null,
        winningBid: null,
        allBids: [],
        orderStatus: null,
        paymentMethod: null,
        expiredPaymentWindow: false
    });

    const [bidPage, setBidPage] = useState(1);
    const bidsPerPage = 5;

    useEffect(() => {
        setBidPage(1);
    }, [winnerData.allBids]);

    const totalBidPages = Math.ceil((winnerData.allBids || []).length / bidsPerPage);
    const paginatedBids = (winnerData.allBids || []).slice(
        (bidPage - 1) * bidsPerPage,
        bidPage * bidsPerPage
    );

    const formatToMySQL = (date) => {
        return moment.tz(date, "Asia/Ho_Chi_Minh").format("YYYY-MM-DD HH:mm:ss");
    };

    const formatHHMMSS = (secs) => {
        const h = String(Math.floor(secs / 3600)).padStart(2, "0");
        const m = String(Math.floor((secs % 3600) / 60)).padStart(2, "0");
        const s = String(secs % 60).padStart(2, "0");
        return `${h}:${m}:${s}`;
    };

    function CountdownTimer({ endTime, onExpire }) {
        const [remaining, setRemaining] = useState(() => {
            const diff = Math.floor((new Date(endTime) - Date.now()) / 1000);
            return diff > 0 ? diff : 0;
        });
        useEffect(() => {
            if (remaining === 0) {
                onExpire?.();
                return;
            }

            const iv = setInterval(() => {
                setRemaining(r => {
                    if (r <= 1) {
                        clearInterval(iv);
                        onExpire?.();
                        return 0;
                    }
                    return r - 1;
                });
            }, 1000);
            return () => clearInterval(iv);
        }, [endTime, remaining, onExpire]);
        return remaining > 0
            ? <span className="font-mono ml-2">{formatHHMMSS(remaining)}</span>
            : <span className="text-red-600 ml-2">Hết hạn</span>;
    }

    const add24Hours = (isoEndTime) => {
        const t = Date.parse(isoEndTime) + 24 * 60 * 60 * 1000;
        return new Date(t)
            .toISOString()
            .replace("T", " ")
            .substring(0, 19);
    };

    const normalizeMoney = (v) => {
        if (v == null) return 0;
        if (typeof v === "number") return Math.trunc(v);
        const digits = String(v).replace(/\D/g, "");
        return digits === "" ? 0 : Math.trunc(Number(digits));
    };

    const handleRetrySubmit = async () => {
        if (!validate()) return;

        if (!canCreate) {
            toast.error('Phiên chưa kết thúc. Không thể tạo lại!');
            return;
        }

        setCreating(true);
        try {
            const payload = {
                product_variant_id: form.product_variant_id,
                start_price: normalizeMoney(form.start_price),
                priceStep: normalizeMoney(form.priceStep),
                start_time: formatToMySQL(form.start_time),
                end_time: formatToMySQL(form.end_time),
            };
            console.log("[AUCTION CREATE PAYLOAD]", payload);

            await axios.post(`${Constants.DOMAIN_API}/admin/auctions`, payload);
            toast.success("Tạo phiên mới thành công!");
            closeRetryModal();
            navigate("/admin/auctions/getAll");
        } catch (err) {
            toast.error(err.response?.data?.message || "Tạo lại thất bại");
        } finally {
            setCreating(false);
        }
    };

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await axios.get(
                    `${Constants.DOMAIN_API}/admin/auctions/winners/${id}`
                );
                const d = res.data.data;
                console.log("sjhdgfbwr", d);

                setAuction(d.auction);
                if (d.winner) {
                    setWinnerData({
                        winner: d.winner,
                        winningBid: d.winningBid,
                        orderStatus: d.orderStatus,
                        paymentMethod: d.paymentMethod,
                        expiredPaymentWindow: d.expiredPaymentWindow,
                        allBids: d.allBids,
                    });
                } else {
                    setWinnerData({
                        winner: null,
                        winningBid: null,
                        orderStatus: null,
                        paymentMethod: null,
                        expiredPaymentWindow: false,
                        allBids: [],
                    });
                }
            } catch (err) {
                console.error(err);
                setError("Không tải được dữ liệu");
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [id]);

    const scaleDown = (v) => {
        if (v == null) return 0;
        const n = typeof v === 'number' ? v : Number(String(v).replace(/\D/g, '') || 0);
        return Math.trunc(n / 100);
    };

    useEffect(() => {
        if (!auction) return;
        setForm({
            product_variant_id: auction.variant.id,
            start_price: scaleDown(auction.start_price ?? auction.priceStep),
            priceStep: scaleDown(auction.priceStep),
            start_time: null,
            end_time: null,
        });
    }, [auction]);

    // const openRetryModal = () => setShowRetryModal(true);
    const openRetryModal = () => {
        if (!canCreate) {
            toast.error('Chỉ được tạo lại khi phiên đấu giá đã kết thúc (status = ended)');
            return;
        }
        setShowRetryModal(true);
    };
    const closeRetryModal = () => setShowRetryModal(false);

    const handleDateChange = (key, date) => {
        setForm(f => ({ ...f, [key]: date }));
    };

    const validate = () => {
        const errs = {};
        if (!form.start_time) errs.start_time = "Chọn thời gian bắt đầu";
        if (!form.end_time) errs.end_time = "Chọn thời gian kết thúc";
        else if (form.end_time <= form.start_time)
            errs.end_time = "Kết thúc phải sau bắt đầu";
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    useEffect(() => {
        // Khi mở modal, load danh sách sản phẩm
        if (showRetryModal) {
            axios
                .get(`${Constants.DOMAIN_API}/admin/auction-products`)
                .then(res => {
                    // const opts = res.data.data.map(p => ({
                    //     value: p.id,
                    //     label: `${p.product?.name || "Không có sản phẩm"} (${p.sku}) - ${Number(p.price).toLocaleString("vi-VN")}₫`
                    // }));
                    // setProducts(opts);
                    const data = Array.isArray(res.data?.data) ? res.data.data : [];
                    const opts = data.length
                        ? data.map((p) => ({
                            value: p.id,
                            label: `${p.product?.name || "Không có sản phẩm"} (${p.sku}) - ${Number(p.price).toLocaleString("vi-VN")}₫`,
                        }))
                        : [
                            {
                                value: null,
                                label: "Không có sản phẩm đấu giá",
                                isDisabled: true,
                            },
                        ];
                    setProducts(opts);
                })
                .catch(() => toast.error("Lỗi khi tải sản phẩm"));
        }
    }, [showRetryModal]);

    if (loading) return <div className="p-4 text-center">Đang tải...</div>;
    if (error) return <div className="p-4 text-center text-red-600">{error}</div>;

    if (!winnerData.winner) {
        return (
            <div className="container mx-auto p-4">
                <h2 className="text-xl font-semibold mb-4">Phiên đấu giá #{id}</h2>
                {canCreate
                    ? <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
                        Không có người trả giá cho phiên đấu giá này
                    </div>
                    : (
                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
                            Phiên đấu giá chưa diễn ra
                        </div>
                    )}

                <div className="flex items-center gap-2 mt-4">
                    {/* <button
                        onClick={openRetryModal}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                        Tạo lại phiên đấu giá
                    </button> */}
                    {canCreate && (
                        <button
                            onClick={openRetryModal}
                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                        >
                            Tạo lại phiên đấu giá
                        </button>
                    )}
                    <button
                        onClick={() => navigate("/admin/auctions/getAll")}
                        className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                    >
                        Quay lại
                    </button>
                </div>

                {/*** Modal chỉ cho no-winner ***/}
                <Modal
                    isOpen={showRetryModal}
                    onRequestClose={closeRetryModal}
                    style={{
                        overlay: {
                            backgroundColor: "rgba(0,0,0,0.5)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 1000,
                        },
                        content: {
                            position: "relative",
                            inset: "auto",
                            padding: "1.5rem",
                            borderRadius: "0.5rem",
                            width: "40rem",
                            maxHeight: "90vh",
                            overflowY: "auto",
                        },
                    }}
                >
                    <button
                        onClick={closeRetryModal}
                        className="absolute top-0 right-3 text-red-500 hover:text-red-800 text-2xl"
                    >
                        ×
                    </button>
                    <h2 className="text-xl font-semibold mb-4">Tạo lại phiên đấu giá</h2>
                    <form
                        onSubmit={e => {
                            e.preventDefault();
                            handleRetrySubmit();
                        }}
                        className="space-y-4"
                    >
                        {/* --- Chọn sản phẩm --- */}
                        <div>
                            <label className="block mb-1 font-medium">
                                Sản phẩm đấu giá <span className="text-red-500">*</span>
                            </label>
                            <Select
                                options={products}
                                // value={products.find(o => o.value === form.product_variant_id) || null}
                                // onChange={opt => setForm(f => ({ ...f, product_variant_id: opt?.value }))}
                                value={
                                    products.find(o => o.value === form.product_variant_id)
                                    || (products.length === 1 && products[0].isDisabled ? products[0] : null)
                                }
                                onChange={opt => setForm(f => ({ ...f, product_variant_id: opt?.value ?? null }))}
                                isOptionDisabled={(opt) => !!opt.isDisabled}
                                isDisabled={products.length === 1 && products[0].isDisabled}
                            />
                            {errors.product_variant_id && (
                                <p className="text-red-500 text-sm mt-1">{errors.product_variant_id}</p>
                            )}
                        </div>

                        {/* --- Giá khởi điểm & Bước giá (read-only) --- */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block mb-1 font-medium">Giá khởi điểm</label>
                                <input
                                    readOnly
                                    value={Number(form.start_price).toLocaleString("vi-VN")}
                                    className="w-full px-3 py-2 border rounded bg-gray-100"
                                />
                            </div>
                            <div>
                                <label className="block mb-1 font-medium">Bước giá</label>
                                <input
                                    readOnly
                                    value={Number(form.priceStep).toLocaleString("vi-VN")}
                                    className="w-full px-3 py-2 border rounded bg-gray-100"
                                />
                            </div>
                        </div>

                        {/* --- Thời gian mới --- */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block mb-1 font-medium">
                                    Thời gian bắt đầu mới <span className="text-red-500">*</span>
                                </label>
                                <DatePicker
                                    selected={form.start_time}
                                    onChange={d => handleDateChange("start_time", d)}
                                    withPortal
                                    showTimeSelect
                                    timeFormat="HH:mm"
                                    timeIntervals={15}
                                    dateFormat="yyyy-MM-dd HH:mm:ss"
                                    className={`w-full px-3 py-2 border rounded ${errors.start_time ? "border-red-500" : ""}`}
                                />
                                {errors.start_time && (
                                    <p className="text-red-500 text-sm mt-1">{errors.start_time}</p>
                                )}
                            </div>
                            <div>
                                <label className="block mb-1 font-medium">
                                    Thời gian kết thúc mới <span className="text-red-500">*</span>
                                </label>
                                <DatePicker
                                    selected={form.end_time}
                                    onChange={d => handleDateChange("end_time", d)}
                                    withPortal
                                    showTimeSelect
                                    timeFormat="HH:mm"
                                    timeIntervals={15}
                                    dateFormat="yyyy-MM-dd HH:mm:ss"
                                    className={`w-full px-3 py-2 border rounded ${errors.end_time ? "border-red-500" : ""}`}
                                />
                                {errors.end_time && (
                                    <p className="text-red-500 text-sm mt-1">{errors.end_time}</p>
                                )}
                            </div>
                        </div>

                        {/* --- Nút hành động --- */}
                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={closeRetryModal}
                                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                className="bg-[#073272] text-white px-6 py-2 rounded hover:bg-[#052354] transition"
                                disabled={creating}
                            >
                                {creating ? "Đang tạo..." : "Tạo phiên mới"}
                            </button>
                        </div>
                    </form>
                </Modal>
            </div>
        );
    }

    const { winner, winningBid, orderStatus, paymentMethod, expiredPaymentWindow } = winnerData;

    let badgeText = "";
    let badgeColor = "";

    if (!paymentMethod) {
        badgeText = timeUp ? "Hết hạn thanh toán" : "Đang trong giỏ hàng";
        badgeColor = timeUp ? "bg-red-500" : "bg-blue-500";
    }
    else if (
        expiredPaymentWindow &&
        orderStatus !== "completed" &&
        orderStatus !== "cancelled"
    ) {
        badgeText = "Hết hạn thanh toán";
        badgeColor = "bg-red-500";
    }
    else if (paymentMethod === "COD") {
        if (orderStatus === "cancelled") {
            badgeText = "Đã hủy";
            badgeColor = "bg-red-500";
        } else if (orderStatus === "pending") {
            badgeText = "Đang chờ thanh toán";
            badgeColor = "bg-yellow-600";
        }
        else if (orderStatus === "confirmed") {
            badgeText = "Đang chờ thanh toán";
            badgeColor = "bg-yellow-600";
        }
        else if (orderStatus === "shipping") {
            badgeText = "Đang chờ thanh toán";
            badgeColor = "bg-yellow-600";
        }
        else if (orderStatus === "delivered") {
            badgeText = "Đang chờ thanh toán";
            badgeColor = "bg-yellow-600";
        }
        else if (orderStatus === "completed") {
            badgeText = "Đã thanh toán";
            badgeColor = "bg-green-600";
        } else {
            badgeText = "Đang trong giỏ hàng";
            badgeColor = "bg-blue-500";
        }
    } else if (["Momo", "VNPay"].includes(paymentMethod)) {
        if (orderStatus === "cancelled") {
            badgeText = "Đã hủy";
            badgeColor = "bg-red-500";
        } else {
            badgeText = "Đã thanh toán";
            badgeColor = "bg-green-600";
        }
    }

    const showRetry = ["Đã hủy", "Hết hạn thanh toán"].includes(
        badgeText
    );

    // const showRetry = canCreate;

    return (
        <div className="container mx-auto p-4">
            {!winnerData ? (
                <>
                    <h2 className="text-xl font-semibold mb-4">Phiên đấu giá #{id}</h2>
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
                        Không có người trả giá cho phiên đấu giá này
                    </div>
                    <div className="flex items-center gap-2 mt-4">
                        <button
                            onClick={openRetryModal}
                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                        >
                            Tạo lại phiên đấu giá
                        </button>
                        <button
                            onClick={() => navigate("/admin/auctions/getAll")}
                            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                        >
                            Quay lại
                        </button>
                    </div>
                </>
            ) : (
                <>
                    <h3 className="text-xl font-semibold mt-3 mb-3">Thông tin sản phẩm</h3>
                    {auction?.variant?.product && (
                        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded">
                            <p>
                                <strong>Sản phẩm:</strong> {auction.variant.product.name}{" "}
                                <span className="text-sm text-gray-600">({auction.variant.sku.trim()})</span>
                            </p>
                            <p>
                                <strong>Thời gian kết thúc:</strong>{" "}
                                {auction.end_time.replace("T", " ").substring(0, 19)}
                            </p>
                            <p>
                                <strong>Bước giá:</strong>{" "}
                                {Number(auction.priceStep).toLocaleString("vi-VN")}₫
                            </p>
                        </div>
                    )}

                    {/* ==== THÊM ĐOẠN NÀY THAY THẾ BLOCK HIỆN TẠI ==== */}
                    <div className="flex items-center gap-2 mb-4">
                        <span
                            className={`inline-block px-3 py-1 rounded-full text-white ${!paymentMethod
                                ? timeUp
                                    ? "bg-red-500"
                                    : "bg-blue-500"
                                : paymentMethod === "COD"
                                    ? orderStatus === "completed"
                                        ? "bg-green-600"
                                        : orderStatus === "cancelled"
                                            ? "bg-red-500"
                                            : "bg-yellow-600"
                                    : ["Momo", "VNPay"].includes(paymentMethod)
                                        ? orderStatus === "cancelled"
                                            ? "bg-red-500"
                                            : "bg-green-600"
                                        : ""
                                }`}
                        >
                            {!paymentMethod
                                ? timeUp
                                    ? "Hết hạn thanh toán"
                                    : "Đang trong giỏ hàng"
                                : paymentMethod === "COD"
                                    ? orderStatus === "completed"
                                        ? "Đã thanh toán"
                                        : orderStatus === "cancelled"
                                            ? "Đã hủy"
                                            : "Đang chờ thanh toán"
                                    : ["Momo", "VNPay"].includes(paymentMethod)
                                        ? orderStatus === "cancelled"
                                            ? "Đã hủy"
                                            : "Đã thanh toán"
                                        : ""}
                        </span>

                        {!paymentMethod && !timeUp && (
                            <span className="bg-red-500 text-white px-3 py-1 rounded-full hover:bg-red-500">
                                Còn lại:
                                <CountdownTimer
                                    endTime={add24Hours(auction.end_time)}
                                    onExpire={() => setTimeUp(true)}
                                />
                                {/* <CountdownTimer
                            endTime={ new Date(Date.now() + 5*1000).toISOString() }
                            onExpire={() => setTimeUp(true)}
                            /> */}
                            </span>
                        )}

                        {showRetry && (
                            <button className="bg-blue-500 text-white px-3 py-1 rounded-full hover:bg-blue-600" onClick={openRetryModal}>
                                Tạo lại phiên đấu giá
                            </button>
                        )}
                    </div>
                    {/* ==== END THÊM ==== */}

                    <h3 className="text-xl font-semibold mt-3 mb-3">Thông tin người chiến thắng</h3>
                    <table className="w-full border-collapse border text-center">
                        <thead>
                            <tr className="bg-gray-200">
                                <th className="border p-2">Tên người chiến thắng</th>
                                <th className="border p-2">Email</th>
                                <th className="border p-2">Số tiền thắng</th>
                                <th className="border p-2">Thời gian đặt giá</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="border px-4 py-2">{winner.name}</td>
                                <td className="border px-4 py-2">{winner.email}</td>
                                <td className="border px-4 py-2">{Number(winningBid.bidAmount).toLocaleString("vi-VN")}₫</td>
                                <td className="border px-4 py-2">{winningBid.bidTime.replace("T", " ").substring(0, 19)}</td>
                            </tr>
                        </tbody>
                    </table>

                    <h3 className="text-xl font-semibold mt-5 mb-3">Lịch sử tất cả lượt đặt giá</h3>
                    <table className="w-full border-collapse border text-center">
                        <thead>
                            <tr className="bg-gray-200">
                                <th className="border p-2">#</th>
                                <th className="border p-2">Tên người đặt</th>
                                <th className="border p-2">Email</th>
                                <th className="border p-2">Số tiền đặt giá</th>
                                <th className="border p-2">Thời gian đặt giá</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedBids.map((bid, idx) => (
                                <tr key={bid.id}>
                                    <td className="border px-4 py-2">       {(bidPage - 1) * bidsPerPage + idx + 1}</td>
                                    <td className="border px-4 py-2">{bid.user.name}</td>
                                    <td className="border px-4 py-2">{bid.user.email}</td>
                                    <td className="border px-4 py-2">
                                        {Number(bid.bidAmount).toLocaleString("vi-VN")}₫
                                    </td>
                                    <td className="border px-4 py-2">
                                        {bid.bidTime.replace("T", " ").substring(0, 19)}
                                    </td>
                                </tr>
                            ))}
                            {paginatedBids.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="border px-4 py-2 text-gray-500">
                                        Chưa có lượt đặt giá nào
                                    </td>
                                </tr>
                            )}
                        </tbody>

                    </table>

                    <div className="flex justify-center mt-6">
                        <div className="flex items-center space-x-1">
                            <button
                                disabled={bidPage === 1}
                                onClick={() => setBidPage(1)}
                                className="px-2 py-1 border rounded disabled:opacity-50"
                            >
                                <FaAngleDoubleLeft />
                            </button>
                            <button
                                disabled={bidPage === 1}
                                onClick={() => setBidPage(bidPage - 1)}
                                className="px-2 py-1 border rounded disabled:opacity-50"
                            >
                                <FaChevronLeft />
                            </button>

                            {[...Array(totalBidPages)].map((_, i) => {
                                const page = i + 1;
                                if (page >= bidPage - 1 && page <= bidPage + 1) {
                                    return (
                                        <button
                                            key={page}
                                            onClick={() => setBidPage(page)}
                                            className={`w-8 h-8 border rounded text-sm ${page === bidPage
                                                ? "bg-blue-600 text-white"
                                                : "bg-white hover:bg-blue-100"
                                                }`}
                                        >
                                            {page}
                                        </button>
                                    );
                                }
                                return null;
                            })}

                            <button
                                disabled={bidPage === totalBidPages}
                                onClick={() => setBidPage(bidPage + 1)}
                                className="px-2 py-1 border rounded disabled:opacity-50"
                            >
                                <FaChevronRight />
                            </button>
                            <button
                                disabled={bidPage === totalBidPages}
                                onClick={() => setBidPage(totalBidPages)}
                                className="px-2 py-1 border rounded disabled:opacity-50"
                            >
                                <FaAngleDoubleRight />
                            </button>
                        </div>
                    </div>

                    <div className="mt-4">
                        <button
                            onClick={() => navigate("/admin/auctions/getAll")}
                            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                        >
                            Quay lại
                        </button>
                    </div>
                </>
            )}
            <Modal
                isOpen={showRetryModal}
                onRequestClose={closeRetryModal}
                style={{
                    overlay: {
                        backgroundColor: "rgba(0,0,0,0.5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 1000,
                    },
                    content: {
                        position: "relative",
                        inset: "auto",
                        padding: "1.5rem",
                        borderRadius: "0.5rem",
                        width: "40rem",
                        maxHeight: "90vh",
                        overflowY: "auto",
                    },
                }}
            >
                <button
                    onClick={closeRetryModal}
                    className="absolute top-0 right-3 text-red-500 hover:text-red-800 text-2xl"
                >
                    ×
                </button>
                <h2 className="text-xl font-semibold mb-4">Tạo lại phiên đấu giá</h2>
                <form
                    onSubmit={e => {
                        e.preventDefault();
                        handleRetrySubmit();
                    }}
                    className="space-y-4"
                >
                    {/* Chọn sản phẩm */}
                    <div>
                        <label className="block mb-1 font-medium">Sản phẩm đấu giá <span className="text-red-500">*</span></label>
                        <Select
                            options={products}
                            value={products.find(o => o.value === form.product_variant_id) || null}
                            onChange={opt => setForm(f => ({ ...f, product_variant_id: opt?.value }))}
                        />
                        {errors.product_variant_id && (
                            <p className="text-red-500 text-sm mt-1">{errors.product_variant_id}</p>
                        )}
                    </div>

                    {/* Giá khởi điểm */}
                    <div>
                        <label className="block mb-1 font-medium">Giá khởi điểm <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            readOnly
                            value={Number(form.start_price).toLocaleString("vi-VN")}
                            className="w-full px-3 py-2 border rounded bg-gray-100"
                        />
                    </div>

                    {/* Bước giá */}
                    <div>
                        <label className="block mb-1 font-medium">Bước giá <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            readOnly
                            value={Number(form.priceStep).toLocaleString("vi-VN")}
                            className="w-full px-3 py-2 border rounded bg-gray-100"
                        />
                    </div>

                    {/* Thời gian bắt đầu & kết thúc */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block mb-1 font-medium">Thời gian bắt đầu mới <span className="text-red-500">*</span></label>
                            <DatePicker
                                selected={form.start_time}
                                onChange={d => setForm(f => ({ ...f, start_time: d }))}
                                withPortal
                                showTimeSelect
                                timeFormat="HH:mm"
                                timeIntervals={15}
                                dateFormat="yyyy-MM-dd HH:mm:ss"
                                className={`w-full px-3 py-2 border rounded ${errors.start_time ? "border-red-500" : ""}`}
                            />
                            {errors.start_time && (
                                <p className="text-red-500 text-sm mt-1">{errors.start_time}</p>
                            )}
                        </div>
                        <div>
                            <label className="block mb-1 font-medium">Thời gian kết thúc mới <span className="text-red-500">*</span></label>
                            <DatePicker
                                selected={form.end_time}
                                onChange={d => setForm(f => ({ ...f, end_time: d }))}
                                showTimeSelect
                                withPortal
                                timeFormat="HH:mm"
                                timeIntervals={15}
                                dateFormat="yyyy-MM-dd HH:mm:ss"
                                className={`w-full px-3 py-2 border rounded ${errors.end_time ? "border-red-500" : ""}`}
                            />
                            {errors.end_time && (
                                <p className="text-red-500 text-sm mt-1">{errors.end_time}</p>
                            )}
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={closeRetryModal}
                            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className="bg-[#073272] text-white px-6 py-2 rounded hover:bg-[#052354] transition"
                            disabled={creating}
                        >
                            {creating ? "Đang tạo..." : "Tạo phiên mới"}
                        </button>
                    </div>
                </form>
            </Modal>

        </div>

    );
}