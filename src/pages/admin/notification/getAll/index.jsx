import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import Constants from "../../../../Constants.jsx";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Link } from "react-router-dom";
import {
  FaChevronRight,
  FaChevronLeft,
  FaAngleDoubleRight,
  FaAngleDoubleLeft,
  FaEdit,
  FaTrashAlt,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";
import FormDelete from "../../../../components/formDelete";

const STATUS_VI = {
  1: "Hiển thị",
  0: "Ẩn",
};

const getStatusColor = (status) => {
  if (status === 1) return "bg-green-100 text-green-800";
  if (status === 0) return "bg-gray-200 text-gray-800";
  return "bg-gray-100 text-gray-700";
};

const NotificationList = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedRow, setExpandedRow] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteItem, setDeleteItem] = useState({});
  const dialogRef = useRef(null);

  const itemsPerPage = 5;

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${Constants.DOMAIN_API}/admin/flashSale`);
      setNotifications(res.data?.data || []);
    } catch (err) {
      setError("Không thể tải danh sách Flash Sale!");
      toast.error("Không thể tải danh sách Flash Sale!");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (item) => {
    setDeleteItem(item);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    try {
      const res = await axios.delete(
        `${Constants.DOMAIN_API}/admin/flashSale/${deleteItem.id}`
      );
      toast.success(res.data.message || "Xóa thành công");
      fetchNotifications();
    } catch (err) {
      console.error("Lỗi khi xóa:", err);
      toast.error("Xóa thất bại!");
    } finally {
      setShowDeleteDialog(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteDialog(false);
    setDeleteItem({});
  };

  const handleDialogKeyDown = (e) => {
    if (e.key === "Escape") {
      cancelDelete();
    }
  };

  const filteredNotifications = notifications.filter((noti) =>
    noti.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedNotifications = filteredNotifications.slice(
    startIndex,
    startIndex + itemsPerPage
  );
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="container mx-auto p-4 bg-white shadow rounded">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Quản lý slideshow</h2>
        <Link
          to="/admin/notification/create"
          className="inline-block bg-[#073272] text-white px-4 py-2 rounded"
        >
          + Thêm slideshow
        </Link>
      </div>

      <div className="mb-4 flex gap-2">
        <input
          type="text"
          placeholder="Tìm theo tiêu đề..."
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setSearchTerm(searchInput.trim());
              setCurrentPage(1);
            }
          }}
        />
        <button
          onClick={() => {
            setSearchTerm(searchInput.trim());
            setCurrentPage(1);
          }}
          className="bg-[#073272] text-white px-4 py-2 rounded"
        >
          <svg
            stroke="currentColor"
            fill="currentColor"
            stroke-width="0"
            viewBox="0 0 512 512"
            height="1em"
            width="1em"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M505 442.7L405.3 343c-4.5-4.5-10.6-7-17-7H372c27.6-35.3 44-79.7 44-128C416 93.1 322.9 0 208 0S0 93.1 0 208s93.1 208 208 208c48.3 0 92.7-16.4 128-44v16.3c0 6.4 2.5 12.5 7 17l99.7 99.7c9.4 9.4 24.6 9.4 33.9 0l28.3-28.3c9.4-9.4 9.4-24.6.1-34zM208 336c-70.7 0-128-57.2-128-128 0-70.7 57.2-128 128-128 70.7 0 128 57.2 128 128 0 70.7-57.2 128-128 128z"></path>
          </svg>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-6">...Đang tải</div>
      ) : error ? (
        <div className="text-center text-red-600 py-6">{error}</div>
      ) : paginatedNotifications.length === 0 ? (
        <div className="text-center text-gray-500 py-6">
          Không có slideshow.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full table-auto border border-collapse border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2 text-center">#</th>
                <th className="border p-2">Ảnh</th>
                <th className="border p-2">Tiêu đề</th>
                <th className="border p-2">Trạng thái</th>
                <th className="border p-2">Thời gian</th> {/* Thêm dòng này */}
                <th className="border p-2">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {paginatedNotifications.map((noti, idx) => {
                const isExpanded = expandedRow === noti.id;
                const status = noti.status;
                const stt = (currentPage - 1) * itemsPerPage + idx + 1;

                return (
                  <React.Fragment key={noti.id}>
                    <tr className="hover:bg-gray-50">
                      <td className="border p-2 text-center">{stt}</td>
                      <td className="border p-2 text-center">
                        {noti.thumbnail ? (
                          <img
                            src={noti.thumbnail}
                            alt="thumb"
                            className="w-12 h-12 object-cover rounded mx-auto"
                          />
                        ) : (
                          <span className="inline-block w-12 h-12 bg-gray-200 rounded" />
                        )}
                      </td>
                      <td className="border p-2 font-medium">{noti.title}</td>
                      <td className="border p-2 text-center">
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            status
                          )}`}
                        >
                          {STATUS_VI[status] || "Không xác định"}
                        </span>
                      </td>
                      <td className="border p-2 text-sm text-center text-blue-700">
                        {(() => {
                          const now = new Date();
                          const start = new Date(noti.start_date);
                          const end = new Date(noti.end_date);

                          if (now < start) {
                            const diff = Math.ceil(
                              (start - now) / (1000 * 60 * 60 * 24)
                            );
                            return `Còn ${diff} ngày nữa bắt đầu`;
                          } else if (now >= start && now <= end) {
                            const diff = Math.ceil(
                              (end - now) / (1000 * 60 * 60 * 24)
                            );
                            return `Còn ${diff} ngày nữa kết thúc`;
                          } else {
                            return "Đã kết thúc";
                          }
                        })()}
                      </td>

                      <td className="p-2 border">
                        <div className="flex gap-2 justify-center">
                          <Link
                            to={`/admin/notification/edit/${noti.id}`}
                            className="bg-yellow-500 text-white p-2 rounded w-8 h-8 inline-flex items-center justify-center"
                            title="Sửa slideshow"
                          >
                            <FaEdit size={20} className="font-bold" />
                          </Link>

                          {status === 0 && (
                            <button
                              onClick={() => handleDeleteClick(noti)}
                              className="p-2 rounded-full bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700 transition duration-200"
                              title="Xoá slideshow"
                            >
                              <FaTrashAlt size={20} className="font-bold" />
                            </button>
                          )}

                          <button
                            onClick={() =>
                              setExpandedRow(isExpanded ? null : noti.id)
                            }
                            className="bg-blue-500 text-white p-2 rounded w-8 h-8 inline-flex items-center justify-center hover:bg-blue-600"
                            title={isExpanded ? "Ẩn chi tiết" : "Xem thêm"}
                          >
                            {isExpanded ? (
                              <FaChevronUp size={16} />
                            ) : (
                              <FaChevronDown size={16} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr>
                        <td
                          colSpan={6}
                          className="p-2 bg-blue-50 border border-blue-300"
                        >
                          <table className="w-full table-auto border border-collapse border-blue-300 mt-2 text-sm">
                            <thead className="bg-blue-100 text-blue-900 font-semibold">
                              <tr>
                                <th className="p-2 border text-center">#</th>
                                <th className="p-2 border">Tên khuyến mãi</th>
                                <th className="p-2 border">Giảm giá</th>
                                <th className="p-2 border">Giá tối thiểu</th>
                                <th className="p-2 border">Số lượng áp dụng</th>
                                <th className="p-2 border">Thời gian</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Array.isArray(noti.notification_promotions) &&
                              noti.notification_promotions.length > 0 ? (
                                noti.notification_promotions.map((fs, i) => {
                                  const promo = fs.promotion;
                                  if (!promo) return null;

                                  const now = new Date();
                                  const start = new Date(promo.start_date);
                                  const end = new Date(promo.end_date);

                                  let timeStatus = "";
                                  if (now < start) {
                                    const diff = Math.ceil(
                                      (start - now) / (1000 * 60 * 60 * 24)
                                    );
                                    timeStatus = `Còn ${diff} ngày nữa bắt đầu`;
                                  } else if (now >= start && now <= end) {
                                    const diff = Math.ceil(
                                      (end - now) / (1000 * 60 * 60 * 24)
                                    );
                                    timeStatus = `Còn ${diff} ngày nữa kết thúc`;
                                  } else {
                                    timeStatus = `Đã kết thúc`;
                                  }

                                  return (
                                    <tr key={fs.id}>
                                      <td className="p-2 border text-center">
                                        {i + 1}
                                      </td>
                                      <td className="p-2 border">
                                        {promo.name || "Không tên"}
                                      </td>
                                      <td className="p-2 border">
                                        {promo.discount_value}
                                        {promo.discount_type === "percentage"
                                          ? "%"
                                          : "₫"}
                                      </td>
                                      <td className="p-2 border">
                                        {Number(
                                          promo.min_price_threshold || 0
                                        ).toLocaleString("vi-VN")}
                                        ₫
                                      </td>
                                      <td className="p-2 border text-center">
                                        {promo.quantity || 0}
                                      </td>
                                      <td className="p-2 border">
                                        {timeStatus}
                                      </td>
                                    </tr>
                                  );
                                })
                              ) : (
                                <tr>
                                  <td
                                    colSpan="6"
                                    className="text-center p-3 italic text-gray-500"
                                  >
                                    Không có khuyến mãi  nào trong slideshow này.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex justify-center items-center mt-4 gap-1 text-sm">
        <button
          disabled={currentPage === 1}
          onClick={() => handlePageChange(1)}
          className="px-2 py-1 border rounded disabled:opacity-50"
          title="Trang đầu"
        >
          <FaAngleDoubleLeft />
        </button>
        <button
          disabled={currentPage === 1}
          onClick={() => handlePageChange(currentPage - 1)}
          className="px-2 py-1 border rounded disabled:opacity-50"
          title="Trang trước"
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
                className={`px-3 py-1 border rounded ${
                  currentPage === page
                    ? "bg-blue-500 text-white"
                    : "bg-blue-100 text-black hover:bg-blue-200"
                }`}
              >
                {page}
              </button>
            );
          }
          return null;
        })}

        {currentPage < totalPages - 1 && (
          <>
            {currentPage < totalPages - 2 && (
              <span className="px-2 text-gray-500">...</span>
            )}
            <button
              onClick={() => handlePageChange(totalPages)}
              className="px-3 py-1 border rounded hover:bg-blue-200"
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          disabled={currentPage === totalPages}
          onClick={() => handlePageChange(currentPage + 1)}
          className="px-2 py-1 border rounded disabled:opacity-50"
          title="Trang sau"
        >
          <FaChevronRight />
        </button>
        <button
          disabled={currentPage === totalPages}
          onClick={() => handlePageChange(totalPages)}
          className="px-2 py-1 border rounded disabled:opacity-50"
          title="Trang cuối"
        >
          <FaAngleDoubleRight />
        </button>
      </div>

      {showDeleteDialog && deleteItem && (
        <FormDelete
          isOpen={true}
          onClose={cancelDelete}
          onConfirm={confirmDelete}
          message={`Bạn có chắc chắn muốn xoá "${
            deleteItem.title || "slideshow"
          }" không?`}
        />
      )}

      <ToastContainer position="top-right" autoClose={2000} />
    </div>
  );
};

export default NotificationList;
