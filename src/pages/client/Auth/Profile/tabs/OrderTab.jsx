import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import React, { useEffect, useState } from "react";
import {
  FaChevronLeft,
  FaChevronRight,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaEye,
  FaEyeSlash,
  FaRedo,
  FaTrashAlt,
  FaTrophy
} from "react-icons/fa";
import Constants from "../../../../../Constants.jsx";
import { toast } from "react-toastify";
import { useParams, useNavigate } from "react-router-dom";
import { decodeToken } from "../../../Helpers/jwtDecode.jsx";
import Swal from 'sweetalert2';

export default function OrderTab() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const recordsPerPage = 10;
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeStatus, setActiveStatus] = useState('');
  const [statusCounts, setStatusCounts] = useState({
    all: 0,
    pending: 0,
    confirmed: 0,
    shipping: 0,
    completed: 0,
    delivered: 0,
    cancelled: 0,
  });
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [orderDetailsMap, setOrderDetailsMap] = useState({});
  const [confirmDeliveryOrder, setConfirmDeliveryOrder] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    orders.forEach(order => {
      if (!orderDetailsMap[order.id]) {
        fetchOrderDetails(order.id);
      }
    });
  }, [orders]);

  const translateStatus = (status) => {
    switch (status) {
      case "pending":
        return "Chờ xác nhận";
      case "confirmed":
        return "Đã xác nhận";
      case "shipping":
        return "Đang giao";
      case "completed":
        return "Hoàn thành";
      case "delivered":
        return "Đã giao hàng thành công";
      case "cancelled":
        return "Đã hủy";
      default:
        return status;
    }
  };

  function formatDateLocal(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const fetchStatusCounts = async () => {
    try {
      const res = await axios.get(`${Constants.DOMAIN_API}/orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setStatusCounts(res.data.statusCounts || statusCounts);
    } catch (error) {
      console.error("Lỗi khi tải statusCounts:", error);
      // toast.error("Lỗi tải số lượng trạng thái.");
    }
  };

  useEffect(() => {
    fetchStatusCounts();
  }, []);

  const fetchOrders = async (page = 1) => {
    try {
      const params = {
        page,
        limit: recordsPerPage,
      };

      if (statusFilter && statusFilter !== "all") {
        params.status = statusFilter;
      }

      if (searchTerm.trim()) {
        params.searchTerm = searchTerm;
      }

      if (startDate) {
        params.startDate = formatDateLocal(startDate);
      }
      if (endDate) {
        params.endDate = formatDateLocal(endDate);
      }

      const res = await axios.get(`${Constants.DOMAIN_API}/orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params,
      });

      setOrders(res.data.data || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
      if (!res.data.data.length) {
        // toast.info("Không tìm thấy đơn hàng nào.");
      }
    } catch (error) {
      console.error("Lỗi khi tải đơn hàng:", error);
      // toast.error("Lỗi tải dữ liệu từ máy chủ.");
    }
  };

  useEffect(() => {
    fetchOrders(currentPage);
  }, [currentPage, statusFilter]);

  const deleteOrder = async (reason) => {
    if (!selectedOrder || selectedOrder.isCanceling) return;

    try {
      setSelectedOrder({ ...selectedOrder, isCanceling: true });

      const paymentMethod = selectedOrder.payment_method?.toLowerCase();
      const isOnlinePayment = ["vnpay", "momo"].includes(paymentMethod);
      const hasWalletUsed = Number(selectedOrder.wallet_balance || 0) > 0;

      if (isOnlinePayment || hasWalletUsed) {
        const confirm = await Swal.fire({
          title: "Xác nhận hoàn tiền về ví",
          icon: "warning",
          text: "Số tiền mà bạn đã dùng trong ví sẽ được hoàn trực tiếp vào ví tiền của bạn.",
          showCancelButton: true,
          confirmButtonText: "Xác nhận",
          cancelButtonText: "Hủy",
        });

        if (!confirm.isConfirmed) {
          toast.info("Bạn đã huỷ thao tác hoàn tiền.");
          return;
        }

        await axios.post(`${Constants.DOMAIN_API}/wallets/request-refund`, {
          orderId: selectedOrder.id,
        }, {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        });
      }

      await axios.put(
        `${Constants.DOMAIN_API}/orders/cancel/${selectedOrder.id}`,
        { cancellation_reason: reason }
      );

      toast.success("Đơn hàng đã được hủy thành công.");
      fetchOrders(currentPage);
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Không thể hủy đơn hàng";
      toast.error(message);
    } finally {
      setSelectedOrder(null);
    }
  };

  useEffect(() => {
    if (!searchTerm.trim()) {
      fetchOrders(1);
    }
  }, [searchTerm]);

  const handleFilterClick = (status) => {
    setStatusFilter(status);
    setActiveStatus(status);
  };

  const handleReorder = async (orderId) => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("Bạn chưa đăng nhập.");
        return;
      }

      const decoded = decodeToken(token);
      const userId = decoded?.id;

      if (!userId) {
        toast.error("Không xác định được người dùng từ token.");
        return;
      }

      let items = [];

      if (!orderDetailsMap[orderId.id]) {
        const res = await axios.get(`${Constants.DOMAIN_API}/admin/orders/${orderId.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const orderDetails = res.data?.data?.orderDetails || [];
        setOrderDetailsMap((prev) => ({
          ...prev,
          [orderId.id]: orderDetails,
        }));

        items = [...orderDetails];
      } else {
        items = [...orderDetailsMap[orderId.id]];
      }

      if (items.length === 0) {
        toast.warning("Không có sản phẩm nào trong đơn hàng.");
        return;
      }

      for (const item of items) {
        const variantId = item.variant?.id;
        const quantity = item.quantity;
        if (!variantId || quantity <= 0) continue;

        const payload = { userId, productVariantId: variantId, quantity };
        console.log('[Reorder] Gửi payload:', payload);

        try {
          const res = await axios.post(
            `${Constants.DOMAIN_API}/add-to-carts`,
            payload,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          console.log('[Reorder] Status:', res.status, 'Data:', res.data);
        } catch (err) {
          console.error('[Reorder] Lỗi thêm vào giỏ:', err.response?.status, err.response?.data);
          return toast.error(`Không thể mua lại vì sản phẩm hiện đã hết hàng`);
        }
      }

      toast.success("Đã thêm lại sản phẩm từ đơn hàng bị hủy vào giỏ hàng.");
      navigate("/cart");
    } catch (error) {
      console.error("Lỗi khi mua lại đơn hàng:", error);
      toast.error("Không thể mua lại đơn hàng.");
    }
  };

  const fetchOrderDetails = async (orderId) => {
    if (!orderId) return;

    try {
      const res = await axios.get(`${Constants.DOMAIN_API}/admin/orders/${orderId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.data?.data) {
        const orderDetails = res.data.data.orderDetails || [];

        const processedDetails = orderDetails.map((detail) => ({
          ...detail,
          comment: detail.comments?.[0] || null,
        }));

        setOrderDetailsMap((prev) => ({
          ...prev,
          [orderId]: processedDetails,
        }));
      } else {
        setOrderDetailsMap((prev) => ({
          ...prev,
          [orderId]: [],
        }));
      }
    } catch (error) {
      console.error("Lỗi khi tải chi tiết đơn hàng:", error);
      // toast.error("Không thể tải chi tiết đơn hàng");
      setOrderDetailsMap((prev) => ({
        ...prev,
        [orderId]: [],
      }));
    }
  };

  const FormDelete = ({ isOpen, onClose, onConfirm, message = "Bạn có chắc chắn muốn xóa?" }) => {
    const [reason, setReason] = useState("");
    const [customReason, setCustomReason] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleConfirm = async () => {
      if (isLoading) return;

      setIsLoading(true);
      const finalReason = reason === "Khác" ? customReason : reason;

      try {
        await onConfirm(finalReason);
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
        <div className="bg-white p-6 rounded-md shadow-lg w-[400px]">
          <h3 className="text-lg font-semibold mb-4">{message}</h3>

          <label className="block mb-2">Lý do hủy:</label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full border rounded p-2 mb-4"
          >
            <option value="">-- Chọn lý do --</option>
            <option value="Không cần nữa">Không cần nữa</option>
            <option value="Thay đổi ý định">Thay đổi ý định</option>
            <option value="Giá quá cao">Giá quá cao</option>
            <option value="Giao hàng chậm">Giao hàng chậm</option>
            <option value="Khác">Khác</option>
          </select>

          {reason === "Khác" && (
            <>
              <label className="block mb-2 mt-4">Vui lòng nhập lý do khác:</label>
              <input
                type="text"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Nhập lý do hủy..."
                className="w-full border rounded p-2"
              />
            </>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            >
              Hủy
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading || reason === "" || (reason === "Khác" && customReason.trim() === "")}
              className={`px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 ${isLoading || (reason === "Khác" && !customReason.trim()) ? "opacity-50 cursor-not-allowed" : ""
                }`}
            >
              {isLoading ? "Đang xử lý..." : "Đồng ý"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const handleConfirmDelivery = async () => {
    const order = confirmDeliveryOrder;
    if (!order) return;

    try {
      await axios.put(`${Constants.DOMAIN_API}/orders/confirm-delivered/${order.id}`);
      toast.success("Xác nhận giao hàng thành công");
      fetchOrders(currentPage);
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Không thể xác nhận giao hàng";
      toast.error(message);
    } finally {
      setConfirmDeliveryOrder(null);
    }
  };

  const FormConfirmDelivery = ({ isOpen, onClose, onConfirm, orderCode }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
        <div className="bg-white p-6 rounded-md shadow-lg w-[400px]">
          <h3 className="text-lg font-semibold mb-4">
            Bạn có chắc chắn muốn xác nhận đã giao hàng thành công cho đơn hàng có mã "{orderCode}"?
          </h3>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            >
              Hủy
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Đồng ý
            </button>
          </div>
        </div>
      </div>
    );
  };

  const handleRefundRequest = async (orderId) => {
    const confirm = await Swal.fire({
      title: "Xác nhận hoàn tiền về ví",
      icon: "warning",
      text: "Vì bạn đã thanh toán online, số tiền sẽ được hoàn trực tiếp vào ví điện tử của bạn.",
      showCancelButton: true,
      confirmButtonText: "Xác nhận",
      cancelButtonText: "Hủy",
    });

    if (confirm.isConfirmed) {
      try {
        const res = await axios.post(`${Constants.DOMAIN_API}/wallets/request-refund`, {
          orderId,
        }, {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        });

        toast.success(res.data.message || "Đã gửi yêu cầu hoàn tiền");
        fetchOrders(currentPage);

      } catch (error) {
        const message =
          error.response?.data?.message || error.response?.data?.error || "Không thể gửi yêu cầu hoàn tiền";
        toast.error(message);
      }
    }
  };

  return (
    <div className="w-full p-2">
      <div className="bg-white p-4 shadow rounded-md">
        <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
          <h2 className="text-xl font-semibold whitespace-nowrap">Danh sách đơn hàng</h2>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <DatePicker
                selected={startDate}
                onChange={(date) => setStartDate(date)}
                dateFormat="yyyy-MM-dd"
                className="border px-3 py-1.5 rounded w-40"
                placeholderText="Chọn ngày bắt đầu"
              />
            </div>
            <div className="flex items-center gap-2">
              <DatePicker
                selected={endDate}
                onChange={(date) => setEndDate(date)}
                dateFormat="yyyy-MM-dd"
                className="border px-3 py-1.5 rounded w-40"
                placeholderText="Chọn ngày kết thúc"
              />
            </div>
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1.5 rounded mr-2"
              onClick={() => fetchOrders(1)}
            >
              Lọc theo ngày
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="w-full">
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent mb-4">
              <div className="flex gap-2 text-sm text-left text-gray-500 whitespace-nowrap ms-2" style={{ maxWidth: '100%', overflowX: 'auto' }}>
                {[
                  { key: "", label: "Tất cả", color: "bg-gray-800", textColor: "text-white", count: statusCounts.all },
                  { key: "pending", label: "Chờ xác nhận", color: "bg-amber-300", textColor: "text-amber-800", count: statusCounts.pending },
                  { key: "confirmed", label: "Đã xác nhận", color: "bg-yellow-300", textColor: "text-yellow-900", count: statusCounts.confirmed },
                  { key: "shipping", label: "Đang giao", color: "bg-blue-300", textColor: "text-blue-900", count: statusCounts.shipping },
                  { key: "completed", label: "Hoàn thành", color: "bg-emerald-300", textColor: "text-emerald-800", count: statusCounts.completed },
                  { key: "delivered", label: "Đã giao", color: "bg-green-300", textColor: "text-green-800", count: statusCounts.delivered },
                  { key: "cancelled", label: "Đã hủy", color: "bg-rose-300", textColor: "text-rose-800", count: statusCounts.cancelled },
                ].map(({ key, label, color, textColor, count }) => {
                  const isActive = activeStatus === key;
                  return (
                    <button
                      key={key}
                      onClick={() => handleFilterClick(key)}
                      className={`border px-2 py-1 text-xs whitespace-nowrap ${isActive ? 'bg-[#073272] text-white' : 'bg-white text-gray-700'}`}
                    >
                      <span>{label}</span>
                      <span className={`${color} ${textColor} rounded-full px-1 py-0.5 ms-1`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <table className="w-full text-sm text-left text-gray-500">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-center py-3 px-2 whitespace-nowrap">#</th>
                  <th className="text-center py-3 px-2 whitespace-nowrap">Mã đơn</th>
                  <th className="text-center py-3 px-2 whitespace-nowrap">Tên khách hàng</th>
                  <th className="text-center py-3 px-2 whitespace-nowrap">Ngày tạo</th>
                  <th className="text-center py-3 px-2 whitespace-nowrap">Trạng thái</th>
                  <th className="text-center py-3 px-2 whitespace-nowrap">Tổng tiền</th>
                  <th className="text-center py-3 px-2 whitespace-nowrap">Thanh toán</th>
                  <th className="text-center py-3 px-2 whitespace-nowrap">Xem chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order, index) => {
                  const details = orderDetailsMap[order.id] || [];

                  const isAuctionOrder = details.some(d => d.auction_id != null);

                  return (
                    <React.Fragment key={order.id}>
                      <tr className="bg-white border-b hover:bg-gray-50">
                        <td className="text-center py-4">{index + 1}</td>
                        <td className="text-center py-4">{order.order_code}</td>
                        <td className="text-center py-4">{order.user?.name || "N/A"}</td>
                        <td className="text-center py-4 px-2 whitespace-nowrap">
                          {new Date(order.created_at).toLocaleDateString("vi-VN")}
                        </td>
                        <td className="text-center py-4 px-2">
                          {order.status === "delivered" ? (
                            <button
                              onClick={() => setConfirmDeliveryOrder(order)}
                              className="inline-block whitespace-nowrap h-[32px] bg-green-500 hover:bg-green-600 text-white font-medium rounded text-sm px-2"
                              type="button"
                            >
                              Xác nhận hoàn thành
                            </button>
                          ) : (
                            translateStatus(order.status)
                          )}
                        </td>
                        <td className="text-center py-4 px-2 whitespace-nowrap">
                          {Number(order.total_price).toLocaleString("vi-VN", {
                            style: "currency",
                            currency: "VND",
                          })}
                        </td>
                        <td className="text-center py-4 px-2 whitespace-nowrap">{order.payment_method}</td>
                        <td className="py-4 text-center">
                          <div className="flex flex-wrap gap-2 justify-center">
                            <button
                              onClick={() => {
                                const isOpeningNew = expandedOrderId !== order.id;
                                if (isOpeningNew) fetchOrderDetails(order.id);
                                setExpandedOrderId(isOpeningNew ? order.id : null);
                              }}
                              className="w-8 h-8 bg-yellow-300 hover:bg-yellow-400 text-black rounded-full flex items-center justify-center shadow transition"
                              title={expandedOrderId === order.id ? "Ẩn chi tiết" : "Xem chi tiết"}
                              type="button"
                            >
                              {expandedOrderId === order.id ? (
                                <FaEyeSlash className="text-red-600" />
                              ) : (
                                <FaEye />
                              )}
                            </button>

                            {/* {order.status === "pending" && (
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow transition"
                              title="Huỷ đơn"
                              type="button"
                            >
                              <FaTrashAlt />
                            </button>
                          )} */}

                            {order.status === "pending" && !isAuctionOrder && (
                              <button
                                onClick={() => setSelectedOrder(order)}
                                className="w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow transition"
                                title="Huỷ đơn"
                                type="button"
                              >
                                <FaTrashAlt />
                              </button>
                            )}

                            {["cancelled", "completed"].includes(order.status) && (
                              <button
                                onClick={() => handleReorder(order)}
                                className="w-8 h-8 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center shadow transition"
                                title="Đặt lại đơn"
                                type="button"
                              >
                                <FaRedo />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {expandedOrderId === order.id && (
                        <tr>
                          <td colSpan="8" className="p-0">
                            <div className="bg-gray-50 p-4 border-t border-gray-200">
                              <h3 className="font-semibold mb-4 text-lg">Chi tiết đơn hàng</h3>
                              <div className="bg-white shadow-md rounded-md p-4 mb-6">
                                <h4 className="text-xl font-semibold mb-4">Thông tin khách hàng</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                                  <div>
                                    <span className="font-medium">Mã đơn:</span> {order.order_code || "—"}
                                  </div>
                                  <div>
                                    <span className="font-medium">Họ tên:</span> {order.user?.name || "—"}
                                  </div>
                                  <div>
                                    <span className="font-medium">Số điện thoại:</span> {order.user?.phone || "—"}
                                  </div>
                                  <div>
                                    <span className="font-medium">Email:</span> {order.user?.email || "—"}
                                  </div>
                                  <div>
                                    <span className="font-medium">Địa chỉ:</span> {order.shipping_address || "—"}
                                  </div>
                                  <div>
                                    <span className="font-medium">Phương thức thanh toán:</span> {order.payment_method || "—"}
                                  </div>
                                  <div>
                                    <span className="font-medium">Ngày đặt hàng:</span>{" "}
                                    {order.created_at
                                      ? new Date(order.created_at).toLocaleDateString()
                                      : "—"}
                                  </div>

                                  <div>
                                    <span className="font-medium">Ghi chú:</span> {order.note || "—"}
                                  </div>
                                </div>
                              </div>


                              <div className="bg-white shadow-md rounded-md p-4">
                                <h4 className="text-xl font-semibold mb-3">Sản phẩm</h4>
                                <table className="w-full border-collapse border text-center">
                                  <thead>
                                    <tr className="bg-gray-200">
                                      <th className="border p-2">Trạng thái</th>
                                      <th className="border p-2">Tên sản phẩm</th>
                                      <th className="border p-2">Số lượng</th>
                                      <th className="border p-2">Đơn giá</th>
                                      <th className="border p-2">Thành tiền</th>
                                      <th className="border p-2">Đánh giá</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {(orderDetailsMap[order.id] || []).length > 0 ? (
                                      <>
                                        {orderDetailsMap[order.id].map((item, idx) => (
                                          <tr key={idx} className="border-b">
                                            <td className="p-2">{translateStatus(order.status)}</td>
                                            <td className="p-2">{item.variant?.product?.name || "Không xác định"} ({item.variant?.sku})</td>
                                            <td className="p-2 text-center">{item.quantity}</td>
                                            <td className="p-2 text-right">
                                              {Number(item.price).toLocaleString("vi-VN", {
                                                style: "currency",
                                                currency: "VND",
                                              })}
                                            </td>
                                            <td className="p-2 text-right">
                                              {(item.quantity * item.price).toLocaleString("vi-VN", {
                                                style: "currency",
                                                currency: "VND",
                                              })}
                                            </td>
                                            <td className="p-2">
                                              {order.status === "completed" ? (
                                                <button
                                                  className="text-blue-500 hover:text-blue-900 transition-colors"
                                                  onClick={() => {
                                                    const product = item.variant?.product;
                                                    const productId = product?.id;
                                                    const deliveredAt = new Date(item.updated_at);
                                                    const currentDate = new Date();
                                                    const daysPassed = (currentDate - deliveredAt) / (1000 * 60 * 60 * 24);

                                                    if (daysPassed > 7) {
                                                      toast.error("Thời gian đánh giá đã hết. Vượt quá 7 ngày kể từ khi giao hàng.");
                                                      return;
                                                    }

                                                    const editedOnce = item.comment && Number(item.comment.edited) === 1;

                                                    if (item.comment) {
                                                      if (editedOnce) {
                                                        navigate(`/product#comment-${item.comment.id}`, {
                                                          state: { productId: product.id },
                                                        });
                                                      } else {
                                                        sessionStorage.setItem("pendingReviewOrderDetailId", item.id);
                                                        navigate(`/product#review`, {
                                                          state: { productId: product.id },
                                                        });
                                                      }
                                                    } else {
                                                      sessionStorage.setItem("pendingReviewOrderDetailId", item.id);
                                                      navigate(`/product#review`, {
                                                        state: { productId: product.id },
                                                      });
                                                    }
                                                  }}
                                                >
                                                  {item.comment ? (
                                                    Number(item.comment.edited) === 1 ? (
                                                      <span>Xem đánh giá</span>
                                                    ) : (
                                                      <span>Chỉnh sửa đánh giá</span>
                                                    )
                                                  ) : (
                                                    <span>Đánh giá</span>
                                                  )}
                                                </button>
                                              ) : (
                                                <span className="text-gray-400 italic">Chưa thể đánh giá</span>
                                              )}
                                            </td>
                                          </tr>
                                        ))}

                                        {isAuctionOrder && (
                                          <tr className="bg-gray-50">
                                            <td colSpan={5} className="text-right font-medium p-2 border-t"></td>
                                            <td className="text-right p-2 border-t">
                                              <span className="inline-flex items-center text-xs bg-purple-200 text-purple-700 px-2 py-1 rounded">
                                                <FaTrophy className="mr-1" />
                                                Đấu giá
                                              </span>
                                            </td>
                                          </tr>
                                        )}

                                        {Number(order.shipping_fee) > 0 && (
                                          <tr className="bg-gray-50">
                                            <td colSpan={5} className="text-right font-medium p-2 border-t">
                                              Phí vận chuyển:
                                            </td>
                                            <td className="text-right p-2 border-t font-medium">
                                              +{Number(order.shipping_fee).toLocaleString("vi-VN", {
                                                style: "currency",
                                                currency: "VND",
                                              })}
                                            </td>
                                          </tr>
                                        )}

                                        {Number(order.discount_amount) > 0 && (
                                          <tr className="bg-gray-50">
                                            <td colSpan={5} className="text-right font-medium p-2 border-t">
                                              Số tiền giảm giá:
                                            </td>
                                            <td className="text-right p-2 border-t text-red-600 font-medium">
                                              -{Number(order.discount_amount).toLocaleString("vi-VN", {
                                                style: "currency",
                                                currency: "VND",
                                              })}
                                            </td>
                                          </tr>
                                        )}

                                        {Number(order.special_discount_amount) > 0 && (
                                          <tr className="bg-gray-50">
                                            <td colSpan={5} className="text-right font-medium p-2 border-t">
                                              Giảm giá đặc biệt:
                                            </td>
                                            <td className="text-right p-2 border-t text-red-600 font-medium">
                                              -{Number(order.special_discount_amount).toLocaleString("vi-VN", {
                                                style: "currency",
                                                currency: "VND",
                                              })}
                                            </td>
                                          </tr>
                                        )}

                                        {Number(order.wallet_balance) > 0 && order.status !== "cancelled" && (
                                          <tr className="bg-gray-50">
                                            <td colSpan={5} className="text-right font-medium p-2 border-t">
                                              Ví tiền:
                                            </td>
                                            <td className="text-right p-2 border-t text-red-600 font-medium">
                                              -{Number(order.wallet_balance).toLocaleString("vi-VN", {
                                                style: "currency",
                                                currency: "VND",
                                              })}
                                            </td>
                                          </tr>
                                        )}

                                        <tr className="bg-gray-100 font-semibold">
                                          <td colSpan={5} className="text-right p-2 border-t border-b">Tổng tiền:</td>
                                          <td className="text-right p-2 border-t border-b text-blue-600">
                                            {Number(order.total_price).toLocaleString("vi-VN", {
                                              style: "currency",
                                              currency: "VND",
                                            })}
                                          </td>
                                        </tr>
                                      </>
                                    ) : (
                                      <tr>
                                        <td colSpan={6} className="border p-2 text-center text-gray-400">
                                          Không có sản phẩm nào trong đơn này.
                                        </td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>

                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan="8" className="text-center py-4">
                      Không có đơn hàng nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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
                    className={`px-3 py-1 border rounded ${page === currentPage
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

        {selectedOrder && (
          <FormDelete
            isOpen={true}
            onClose={() => setSelectedOrder(null)}
            onConfirm={deleteOrder}
            message={`Bạn có chắc chắn muốn hủy đơn hàng "${selectedOrder.order_code}"?`}
          />
        )}

        {/* Modal xác nhận giao hàng */}
        {confirmDeliveryOrder && (
          <FormConfirmDelivery
            isOpen={true}
            onClose={() => setConfirmDeliveryOrder(null)}
            onConfirm={handleConfirmDelivery}
            orderCode={confirmDeliveryOrder.order_code}
          />
        )}
      </div>
    </div>
  );
}