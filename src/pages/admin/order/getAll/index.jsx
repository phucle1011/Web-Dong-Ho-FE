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
  FaMapMarkerAlt,
  FaClock,
  FaCheckCircle,
  FaTruck,
  FaCheckDouble,
  FaBoxOpen,
  FaTimesCircle,
  FaListUl
} from "react-icons/fa";
import Constants from "../../../../Constants.jsx";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";

function OrderGetAll() {
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [trackingInfoMap, setTrackingInfoMap] = useState({});
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

  const [showReasonModal, setShowReasonModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");

  const translateStatus = (status) => {
    switch (status) {
      case "pending":
        return "Chờ xác nhận";
      case "confirmed":
        return "Đã xác nhận";
      case "shipping":
        return "Đang giao";
      case "delivered":
        return "Đã giao hàng thành công";
      case "completed":
        return "Hoàn thành";
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

      const res = await axios.get(`${Constants.DOMAIN_API}/admin/orders/list`, {
        params,
      });

      setOrders(res.data.data || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
      setStatusCounts(res.data.statusCounts || statusCounts);

      if (!res.data.data.length) {
        toast.info("Không tìm thấy đơn hàng nào.");
      }
    } catch (error) {
      console.error("Lỗi khi tải đơn hàng:", error);
      toast.error("Lỗi tải dữ liệu từ máy chủ.");
    }
  };

  useEffect(() => {
    fetchOrders(currentPage);
  }, [currentPage, statusFilter]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      fetchOrders(1);
    }
  }, [searchTerm]);

  const getStatusesForOrder = (currentStatus) => {
    switch (currentStatus) {
      case "pending":
        return ["pending", "confirmed", "cancelled"];
      case "confirmed":
        return ["confirmed", "shipping", "cancelled"];
      case "shipping":
        return ["shipping", "delivered"];
      case "delivered":
        return ["delivered", "completed"];
      case "completed":
        return ["completed"];
      case "cancelled":
        return ["cancelled"];
      default:
        return ["pending", "confirmed", "shipping", "delivered", "completed", "cancelled"];
    }
  };

  const handleChangeStatus = async (orderId, newStatus) => {
    try {
      let reasonToSend = "";
      if (newStatus === "cancelled") {
        if (!reason) {
          toast.warning("Vui lòng chọn lý do hủy đơn.");
          return;
        }
        reasonToSend = reason === "Khác" ? customReason : reason;
      }
      await axios.put(
        `${Constants.DOMAIN_API}/admin/orders/edit/${orderId}`,
        {
          status: newStatus,
          cancellation_reason: reasonToSend,
        }
      );
      toast.success("Cập nhật trạng thái thành công");
      fetchOrders(currentPage);
    } catch (error) {
      toast.error("Lỗi khi cập nhật trạng thái");
      console.error("Lỗi cập nhật:", error);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterClick = (status) => {
    setStatusFilter(status);
    setActiveStatus(status);
  };

  const handleSearchSubmit = async () => {
    if (searchTerm.trim() === '') {
      toast.warning("Vui lòng nhập tên khách hàng hoặc mã đơn hàng.");
      return;
    }
    setStatusFilter("all");
    setCurrentPage(1);
    fetchOrders(1);
  };

  const handleExcelExport = async () => {
    if (!startDate || !endDate) {
      toast.error("Vui lòng chọn đầy đủ khoảng thời gian.");
      return;
    }

    const formatDateVN = (date) => {
      const offset = date.getTimezoneOffset() * 60000;
      return new Date(date.getTime() - offset).toISOString().split("T")[0];
    };
    const start = formatDateVN(startDate);
    const end = formatDateVN(endDate);

    try {
      const res = await axios.get(
        `${Constants.DOMAIN_API}/admin/orders/export-excel`,
        {
          params: { start_date: start, end_date: end },
          responseType: "blob",
        }
      );
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `DonHang_${start}_den_${end}.xlsx`);
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      console.error("Lỗi khi xuất Excel:", error);
    }
  };

  const handleTrackOrder = async (orderCode) => {
    if (orderCode === "ORD012") {
      setTrackingInfoMap((prev) => ({
        ...prev,
        [orderCode]: {
          orderCode,
          status: "Đã giao",
          location: "Cần Thơ",
          locations: [
            {
              time: new Date().toISOString(),
              location: "Kho Cần Thơ",
              status: "Đã giao hàng thành công",
              note: "Đã rời kho ở Bình Thủy",
            },
            {
              time: new Date(Date.now() - 3600 * 1000).toISOString(),
              location: "Kho Hồ Chí Minh",
              status: "Xuất kho",
              note: "Chuẩn bị vận chuyển",
            },
          ],
        },
      }));
      return;
    }

    try {
      const res = await axios.get(
        `${Constants.DOMAIN_API}/admin/orders/track/${orderCode}`
      );
      const data = res.data.data;

      setTrackingInfoMap((prev) => ({
        ...prev,
        [orderCode]: {
          orderCode,
          status: data.status,
          location:
            data.locations && data.locations.length > 0
              ? data.locations[0].location
              : "Không có thông tin vị trí",
          locations: data.locations || [],
        },
      }));
    } catch (error) {
      console.error("Lỗi khi theo dõi đơn hàng:", error);
      toast.error("Không thể theo dõi đơn hàng");
      setTrackingInfoMap((prev) => {
        const newMap = { ...prev };
        delete newMap[orderCode];
        return newMap;
      });
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="container mx-auto p-2">
      <div className="bg-white p-4 shadow rounded-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Danh sách đơn hàng</h2>

          <div className="flex items-center gap-3">
            <span className="italic text-gray-600">Chọn khoảng thời gian:</span>
            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              dateFormat="yyyy-MM-dd"
              className="border px-3 py-2 rounded w-40"
              placeholderText="Ngày bắt đầu"
            />
            <DatePicker
              selected={endDate}
              onChange={(date) => setEndDate(date)}
              dateFormat="yyyy-MM-dd"
              className="border px-3 py-2 rounded w-40"
              placeholderText="Ngày kết thúc"
            />
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
              onClick={() => fetchOrders(1)}
            >
              Lọc theo ngày
            </button>
            <button
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
              onClick={handleExcelExport}
            >
              Xuất Excel
            </button>
          </div>
        </div>


        <div className="flex flex-nowrap items-center gap-6 border-b border-gray-200 px-6 py-4 overflow-x-auto mb-4 whitespace-nowrap">
          {[
            { key: "", label: "Tất cả", icon: <FaListUl />, color: "bg-gray-800", textColor: "text-white", count: statusCounts.all },
            { key: "pending", label: "Chờ xác nhận", icon: <FaClock className="mr-1" />, color: "bg-amber-300", textColor: "text-amber-800", count: statusCounts.pending },
            { key: "confirmed", label: "Đã xác nhận", icon: <FaCheckCircle className="mr-1" />, color: "bg-yellow-300", textColor: "text-yellow-900", count: statusCounts.confirmed },
            { key: "shipping", label: "Đang giao", icon: <FaTruck className="mr-1" />, color: "bg-blue-300", textColor: "text-blue-900", count: statusCounts.shipping },
            { key: "completed", label: "Hoàn thành", icon: <FaCheckDouble className="mr-1" />, color: "bg-emerald-300", textColor: "text-emerald-800", count: statusCounts.completed },
            { key: "delivered", label: "Đã giao", icon: <FaBoxOpen className="mr-1" />, color: "bg-green-300", textColor: "text-green-800", count: statusCounts.delivered },
            { key: "cancelled", label: "Đã hủy", icon: <FaTimesCircle className="mr-1" />, color: "bg-rose-300", textColor: "text-rose-800", count: statusCounts.cancelled },
          ].map(({ key, label, color, textColor, count, icon }) => {
            const isActive = activeStatus === key;
            return (
              <button
                key={key}
                onClick={() => handleFilterClick(key)}
                className={`border px-3 py-1.5 text-xs flex items-center gap-1 whitespace-nowrap ${isActive ? 'bg-[#073272] text-white' : 'bg-white text-gray-700'
                  }`}
              >
                <span className="inline-flex items-center gap-1"> {icon && icon} {label}</span>
                <span className={`${color} ${textColor} rounded-pill px-2 py-0.5 text-nowrap ms-2`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mb-6 flex items-center gap-2">
          <input
            type="text"
            className="flex-grow border border-gray-300 rounded py-2 px-4 text-gray-700 leading-tight focus:ring-2 focus:ring-blue-500"
            placeholder="Nhập tên khách hàng..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
          <button
            type="button"
            className="bg-blue-900 hover:bg-blue-800 text-white px-4 py-1.5 rounded"
            onClick={() => fetchOrders(1)}
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
                <th className="text-center py-3 px-2 whitespace-nowrap">Mã đơn</th>
                <th className="text-center py-3 px-2 whitespace-nowrap">Tên khách hàng</th>
                <th className="text-center py-3 px-2 whitespace-nowrap">Ngày tạo</th>
                <th className="text-center py-3 px-2 whitespace-nowrap">Tổng tiền</th>
                <th className="text-center py-3 px-2 whitespace-nowrap">Trạng thái</th>
                <th className="text-center py-3 px-2 whitespace-nowrap">Thanh toán</th>
                <th className="text-center py-3 px-2 whitespace-nowrap"></th>
              </tr>
            </thead>
            <tbody>
              {orders.length > 0 ? (
                orders.map((order, index) => (
                  <React.Fragment key={order.id}>
                    <tr>
                      <td className="p-2 border border-gray-300 text-center">{index + 1}</td>
                      <td className="p-2 border border-gray-300 text-center">{order.order_code}</td>
                      <td className="p-2 border border-gray-300 text-center">{order.user?.name || "N/A"}</td>
                      <td className="p-2 border border-gray-300 text-center">
                        {(order.created_at).replace("T", " ").substring(0, 19)}
                      </td>
                      <td className="p-2 border border-gray-300 text-center">
                        {Number(order.total_price).toLocaleString("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        })}
                      </td>
                      <td className="p-2 border border-gray-300 text-center capitalize">
                        {["completed", "cancelled"].includes(order.status) ? (
                          <div className="px-2 py-1 inline-block bg-gray-100 rounded text-gray-700 font-medium">
                            {translateStatus(order.status)}
                          </div>
                        ) : (
                          <select
                            value={order.status}
                            onChange={(e) => {
                              if (e.target.value === "cancelled") {
                                setSelectedOrderId(order.id);
                                setShowReasonModal(true);
                              } else {
                                handleChangeStatus(order.id, e.target.value);
                              }
                            }}
                            className="capitalize border rounded px-2 py-1"
                          >
                            {getStatusesForOrder(order.status).map((status) => (
                              <option key={status} value={status}>
                                {translateStatus(status)}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="p-2 border border-gray-300 text-center">{order.payment_method}</td>
                      <td className="p-2 border border-gray-300 flex gap-2 text-center">
                        <Link
                          to={`/admin/orders/detail/${order.id}`}
                          className="bg-blue-500 text-white p-2 rounded"
                          title="Xem chi tiết"
                        >
                          <FaEye size={16} className="font-bold" />
                        </Link>

                        {/* <button
                          onClick={() => handleTrackOrder(order.order_code)}
                          className="bg-green-600 hover:bg-green-500 text-white p-2 rounded"
                          title="Theo dõi"
                        >
                          <FaMapMarkerAlt size={16} className="font-bold" />
                        </button> */}
                      </td>
                    </tr>

                    {trackingInfoMap[order.order_code] && (
                      <tr>
                        <td colSpan={8} className="p-4">
                          <div className="bg-yellow-100 p-4 rounded-lg w-full">
                            <h2 className="text-lg font-semibold mb-2">Thông tin theo dõi đơn hàng</h2>
                            <p className="mb-1">
                              <span className="font-semibold">Mã đơn hàng:</span>{" "}
                              <span className="text-blue-600 font-medium">
                                {order.order_code}
                              </span>
                            </p>
                            <p className="mb-4">
                              <span className="font-semibold">Trạng thái hiện tại:</span>{" "}
                              <span className="text-green-600 font-medium">
                                {translateStatus(order.status)}
                              </span>
                            </p>
                            <div className="relative ml-4 border-l-4 border-blue-500">
                              {trackingInfoMap[order.order_code].locations.map(
                                (value, i) => (
                                  <div key={i} className="relative pl-6 mb-6">
                                    <div className="absolute -left-2 top-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-white z-10"></div>
                                    <div className="bg-white rounded-md shadow-sm border border-gray-200 p-3">
                                      <p className="text-sm mb-1">
                                        <span className="font-semibold">Thời gian:</span>{" "}
                                        {new Date(value.time).toLocaleString("vi-VN", {
                                          hour12: false,
                                        })}
                                      </p>
                                      <p className="text-sm mb-1">
                                        <span className="font-semibold">Vị trí:</span>{" "}
                                        {value.location}
                                      </p>
                                      {/* <p className="text-sm mb-1">
                                        <span className="font-semibold">Trạng thái:</span>{" "}
                                        {value.status}
                                      </p> */}
                                      {value.note && (
                                        <p className="text-sm">
                                          <span className="font-semibold">Ghi chú:</span>{" "}
                                          {value.note}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                            <button
                              onClick={() => {
                                const updated = { ...trackingInfoMap };
                                delete updated[order.order_code];
                                setTrackingInfoMap(updated);
                              }}
                              className="mt-2 bg-red-500 text-white py-1 px-3 rounded"
                            >
                              Đóng
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-4 text-gray-500">
                    Không có đơn hàng nào.
                  </td>
                </tr>
              )}
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
                    className={`px-3 py-1 border rounded ${page === currentPage ? "bg-blue-600 text-white" : "bg-white hover:bg-blue-100"
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
      </div>
      {showReasonModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow-md w-[400px] relative">

            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-red-600 text-xl font-bold mr-2"
              onClick={() => setShowReasonModal(false)}
            >
              ×
            </button>

            <h2 className="text-lg font-semibold mb-4">Lý do hủy đơn hàng</h2>

            <label className="block mb-2">Chọn lý do:</label>
            <select
              className="w-full border rounded p-2 mb-4"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
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
                <label className="block mb-2">Lý do cụ thể:</label>
                <input
                  className="w-full border rounded p-2 mb-4"
                  type="text"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Nhập lý do cụ thể"
                />
              </>
            )}

            <div className="flex justify-end">
              <button
                className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-md mr-2"
                onClick={() => setShowReasonModal(false)}
              >
                Hủy
              </button>
              <button
                className="bg-red-600 hover:bg-red-800 text-white px-4 py-2 rounded-md"
                onClick={() => {
                  const finalReason = reason === "Khác" ? customReason : reason;
                  handleChangeStatus(selectedOrderId, "cancelled", finalReason);
                  setShowReasonModal(false);
                }}
              >
                Xác nhận hủy
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default OrderGetAll;