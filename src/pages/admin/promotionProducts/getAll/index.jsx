import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import Constants from "../../../../Constants.jsx";
import { Link, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FaAngleDoubleLeft,
  FaChevronLeft,
  FaChevronRight,
  FaAngleDoubleRight,
  FaTrashAlt,
  FaChevronDown,
  FaChevronUp,
  FaEdit,
} from "react-icons/fa";

const PromotionProductList = () => {
  const [promotionProducts, setPromotionProducts] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteItem, setDeleteItem] = useState({ id: null, name: "" });
  const dialogRef = useRef(null);
  const navigate = useNavigate();

  const getPromotionStatus = (startDate, endDate) => {
    if (!startDate || !endDate) return "inactive";
    const currentDate = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (currentDate < start) return "upcoming";
    if (currentDate <= end) return "active";
    return "expired";
  };

  const getStatusDisplayName = (status) =>
    ({
      active: "Đang diễn ra",
      upcoming: "Sắp diễn ra",
      expired: "Đã hết hạn",
      inactive: "Vô hiệu hóa",
    }[status] || "Vô hiệu hóa");

  const getStatusBadgeClass = (status) =>
    ({
      active: "bg-green-100 text-green-800",
      upcoming: "bg-blue-100 text-blue-800",
      expired: "bg-red-100 text-red-800",
      inactive: "bg-gray-200 text-gray-800",
    }[status] || "bg-gray-200 text-gray-800");

  const formatDiscountValue = (discountValue, discountType) => {
    if (!discountValue || discountValue === null || discountValue === undefined)
      return "-";
    return discountType === "percentage"
      ? `${parseFloat(discountValue).toFixed(2)}%`
      : `${parseFloat(discountValue).toLocaleString("vi-VN")} VNĐ`;
  };

  const fetchPromotions = async (page = 1, search = "") => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `${Constants.DOMAIN_API}/admin/promotion`,
        {
          params: { page, limit: pagination.limit, searchTerm: search },
        }
      );
      const data = Array.isArray(response.data?.data) ? response.data.data : [];

      if (!data.length) {
        console.warn("API trả về dữ liệu rỗng!");
      }

      // Group promotions by name to count unique promotions
      const grouped = {};
      data.forEach((item) => {
        if (item.promotion_id && item.product_variant_id) {
          const promoName = item.promotion?.name || "Không rõ tên";
          if (!grouped[promoName]) grouped[promoName] = [];
          grouped[promoName].push(item);
        }
      });

      // Calculate total number of unique promotions from API response
      const totalPromotions = response.data.pagination?.total || 0;

      setPromotionProducts(data);
      setPagination({
        total: totalPromotions,
        page: response.data.pagination?.page || page,
        limit: response.data.pagination?.limit || pagination.limit,
        totalPages:
          response.data.pagination?.totalPages ||
          Math.ceil(totalPromotions / pagination.limit) ||
          1,
      });
    } catch (err) {
      console.error("Lỗi khi lấy dữ liệu:", err);
      setError("Không thể tải danh sách khuyến mãi! Vui lòng thử lại.");
      toast.error("Không thể tải danh sách khuyến mãi!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions(1, "");
  }, []);

  useEffect(() => {
    if (showDeleteDialog && dialogRef.current) {
      dialogRef.current.focus();
    }
  }, [showDeleteDialog]);

  const handleSearch = () => {
    fetchPromotions(1, searchTerm.trim());
    setExpanded(null);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    fetchPromotions(1, "");
    setExpanded(null);
  };

  const handleDelete = (id, name) => {
    setDeleteItem({ id, name });
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(
        `${Constants.DOMAIN_API}/admin/promotions/${deleteItem.id}`
      );
      toast.success("Xóa biến thành công!");
      fetchPromotions(pagination.page, searchTerm);
      setExpanded(deleteItem.name); // Tự động mở lại phần mở rộng
    } catch (err) {
      console.error("Lỗi khi xóa:", err);
      toast.error(
        `Xóa thất bại: ${err.response?.data?.message || err.message}`
      );
    } finally {
      setShowDeleteDialog(false);
      setDeleteItem({ id: null, name: "" });
    }
  };

  const cancelDelete = () => {
    setShowDeleteDialog(false);
    setDeleteItem({ id: null, name: "" });
  };

  const handleDialogKeyDown = (e) => {
    if (e.key === "Escape") {
      cancelDelete();
    }
  };

  const toggleExpand = (promoName) => {
    setExpanded(expanded === promoName ? null : promoName);
  };

  const handleEditClick = (promotionId, promoName, quantity) => {
    if (quantity === 0) {
      toast.warn(`Khuyến mãi ${promoName} đã hết lượt sử dụng.`, {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }
    navigate(`/admin/promotion-products/edit/${promotionId}`);
  };

  const groupByPromotionName = (products) => {
    const grouped = {};
    products.forEach((item) => {
      if (item.promotion_id && item.product_variant_id) {
        const promoName = item.promotion?.name || "Không rõ tên";
        if (!grouped[promoName]) grouped[promoName] = [];
        grouped[promoName].push(item);
      }
    });

    return Object.entries(grouped).map(([name, items]) => {
      const variantCount = [
        ...new Set(items.map((item) => item.product_variant_id)),
      ].length;
      const promotionId = items[0]?.promotion?.id || null;
      const quantity = items[0]?.promotion?.quantity || 0;
      return [name, items, variantCount, promotionId, quantity];
    });
  };

  const groupedProducts = groupByPromotionName(promotionProducts).sort(
    ([, itemsA], [, itemsB]) => {
      const getSortIndex = (promo) => {
        const status = getPromotionStatus(promo.start_date, promo.end_date);
        return (
          {
            active: 0,
            upcoming: 1,
            expired: 2,
            inactive: 3,
          }[status] ?? 3
        );
      };

      const promoA = itemsA[0]?.promotion || {};
      const promoB = itemsB[0]?.promotion || {};
      return getSortIndex(promoA) - getSortIndex(promoB);
    }
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      fetchPromotions(page, searchTerm);
      setExpanded(null);
    }
  };

  const renderPagination = () => {
    const { page, totalPages } = pagination;

    return (
      <div className="flex justify-center mt-6">
        <div className="flex items-center space-x-1">
          <button
            disabled={page === 1}
            onClick={() => handlePageChange(1)}
            className="px-2 py-1 border rounded disabled:opacity-50"
          >
            <FaAngleDoubleLeft />
          </button>
          <button
            disabled={page === 1}
            onClick={() => handlePageChange(page - 1)}
            className="px-2 py-1 border rounded disabled:opacity-50"
          >
            <FaChevronLeft />
          </button>
          {[...Array(totalPages)].map((_, i) => {
            const pageNum = i + 1;
            if (pageNum >= page - 1 && pageNum <= page + 1) {
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`px-3 py-1 border rounded ${
                    pageNum === page
                      ? "bg-blue-600 text-white"
                      : "bg-white hover:bg-blue-100"
                  }`}
                >
                  {pageNum}
                </button>
              );
            }
            return null;
          })}
          <button
            disabled={page === totalPages}
            onClick={() => handlePageChange(page + 1)}
            className="px-2 py-1 border rounded disabled:opacity-50"
          >
            <FaChevronRight />
          </button>
          <button
            disabled={page === totalPages}
            onClick={() => handlePageChange(totalPages)}
            className="px-2 py-1 border rounded disabled:opacity-50"
          >
            <FaAngleDoubleRight />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4 bg-white shadow rounded">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Danh sách khuyến mãi</h2>
        <Link
          to="/admin/promotion-products/create"
          className="inline-block bg-[#073272] text-white px-4 py-2 rounded"
        >
          + Thêm khuyến mãi
        </Link>
      </div>

      <div className="mb-4 flex gap-2">
        <input
          type="text"
          className="border w-full py-2 px-3 text-gray-700 focus:outline-none"
          placeholder="Tìm kiếm theo tên, SKU, trạng thái..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearch();
          }}
        />
        <button
          onClick={handleSearch}
          className="bg-blue-900 hover:bg-blue-800 text-white px-4 py-1.5 rounded"
          title="Tìm kiếm"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1010.5 3a7.5 7.5 0 006.15 13.65z"
            />
          </svg>
        </button>
        {/* <button
          onClick={handleClearSearch}
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-1.5 rounded"
          title="Xóa tìm kiếm"
        >
          Xóa
        </button> */}
      </div>

      {loading && <div className="text-center py-4">Đang tải...</div>}
      {error && <div className="text-center py-4 text-red-600">{error}</div>}

      {!loading && !error && (
        <table className="w-full table-auto border border-collapse border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-center">#</th>
              <th className="border p-2">Tên khuyến mãi</th>
              <th className="border p-2">Phần trăm</th>
              <th className="border p-2">Ngày bắt đầu</th>
              <th className="border p-2">Ngày kết thúc</th>
              <th className="border p-2">Trạng thái</th>
              <th className="border p-2">Số lượng biến thể</th>
              <th className="border p-2">Tổng lượt áp dụng</th>
              <th className="border p-2"></th>
            </tr>
          </thead>
          <tbody>
            {groupedProducts.length > 0 ? (
              groupedProducts.map(
                (
                  [promoName, items, variantCount, promotionId, quantity],
                  index
                ) => {
                  const promo = items[0]?.promotion || {};
                  const isExpanded = expanded === promoName;
                  const status = getPromotionStatus(
                    promo.start_date,
                    promo.end_date
                  );
                  const stt =
                    (pagination.page - 1) * pagination.limit + index + 1;

                  return (
                    <React.Fragment key={promoName}>
                      <tr>
                        <td className="border p-2 text-center">{stt}</td>
                        <td className="border p-2 font-bold">{promoName}</td>
                        <td className="border p-2">
                          {formatDiscountValue(
                            promo.discount_value,
                            promo.discount_type
                          )}
                        </td>
                        <td className="border p-2">
                          {promo.start_date
                            ? new Date(promo.start_date).toLocaleDateString(
                                "vi-VN"
                              )
                            : "-"}
                        </td>
                        <td className="border p-2">
                          {promo.end_date
                            ? new Date(promo.end_date).toLocaleDateString(
                                "vi-VN"
                              )
                            : "-"}
                        </td>
                        <td className="border p-2 text-center">
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(
                              status
                            )}`}
                          >
                            {getStatusDisplayName(status)}
                          </span>
                        </td>
                        <td className="border p-2 text-center">
                          {variantCount}
                        </td>
                        <td className="border p-2 text-center">
                          {items.reduce(
                            (sum, item) => sum + (item.variant_quantity || 0),
                            0
                          )}
                        </td>

                        <td className="p-2 flex items-center justify-end space-x-2">
                          {promotionId ? (
                            <button
                              onClick={() =>
                                handleEditClick(
                                  promotionId,
                                  promoName,
                                  quantity
                                )
                              }
                              className="p-2 rounded w-8 h-8 inline-flex items-center justify-center bg-yellow-500 text-white hover:bg-yellow-600"
                              title="Sửa"
                            >
                              <FaEdit size={20} />
                            </button>
                          ) : (
                            <span
                              className="bg-gray-400 text-gray-200 py-1 px-3 rounded cursor-not-allowed"
                              title="Không thể sửa do thiếu ID khuyến mãi"
                            >
                              <FaEdit size={20} />
                            </span>
                          )}
                          <button
                            onClick={() => toggleExpand(promoName)}
                            className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
                          >
                            {isExpanded ? (
                              <FaChevronUp size={16} />
                            ) : (
                              <FaChevronDown size={16} />
                            )}
                          </button>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr>
                          <td colSpan={9}>
                            <table className="w-full table-auto border border-collapse border-gray-300">
                              <thead>
                                <tr>
                                  <th className="border p-2 text-center">#</th>
                                  <th className="border p-2">Tên sản phẩm</th>
                                  <th className="border p-2">Phần trăm</th>
                                  <th className="border p-2">SKU biến thể</th>
                                  <th className="border p-2">
                                    Tổng lượt áp dụng
                                  </th>

                                  <th className="border p-2">Trạng thái</th>
                                  <th className="border p-2"></th>
                                </tr>
                              </thead>
                              <tbody>
                                {items.map((item, subIndex) => {
                                  const itemStatus = getPromotionStatus(
                                    item.promotion?.start_date,
                                    item.promotion?.end_date
                                  );
                                  return (
                                    <tr key={item.id}>
                                      <td className="border p-2 text-center">
                                        {subIndex + 1}
                                      </td>
                                      <td className="border p-2">
                                        {item.variant?.product?.name ||
                                          item.product_name ||
                                          "-"}
                                      </td>
                                      <td className="border p-2">
                                        {formatDiscountValue(
                                          item.promotion?.discount_value,
                                          item.promotion?.discount_type
                                        )}
                                      </td>
                                      <td className="border p-2">
                                        {item.variant?.sku ||
                                          item.product_variant_id ||
                                          "-"}
                                      </td>
                                      <td className="border p-2 text-center">
                                        {item.variant_quantity === 0 ? (
                                          <span className="text-red-600 font-medium">
                                            Hết lượt
                                          </span>
                                        ) : (
                                          item.variant_quantity ?? "-"
                                        )}
                                      </td>

                                      <td className="border p-2 text-center">
                                        <span
                                          className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(
                                            itemStatus
                                          )}`}
                                        >
                                          {getStatusDisplayName(itemStatus)}
                                        </span>
                                      </td>
                                      <td className="border p-2 text-center">
                                        {(() => {
                                          const canDelete =
                                            itemStatus === "upcoming"; // CHỈ cho xóa khi sắp diễn ra
                                          const title = canDelete
                                            ? "Xóa"
                                            : itemStatus === "active"
                                            ? "Không thể xóa khi khuyến mãi đang diễn ra"
                                            : "Chỉ được xóa khi khuyến mãi sắp diễn ra";

                                          return (
                                            <button
                                              onClick={
                                                canDelete
                                                  ? () =>
                                                      handleDelete(
                                                        item.id,
                                                        promoName
                                                      )
                                                  : undefined
                                              }
                                              disabled={!canDelete}
                                              className={`p-2 rounded-full transition duration-200
          ${
            canDelete
              ? "bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
                                              title={title}
                                              aria-label={`Xóa ${promoName}`}
                                            >
                                              <FaTrashAlt size={20} />
                                            </button>
                                          );
                                        })()}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                }
              )
            ) : (
              <tr>
                <td colSpan={9} className="text-center py-4">
                  Không có dữ liệu
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {pagination.total > 0 && renderPagination()}

      {showDeleteDialog && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          role="dialog"
          aria-labelledby="delete-dialog-title"
          aria-modal="true"
          onKeyDown={handleDialogKeyDown}
          ref={dialogRef}
          tabIndex={-1}
        >
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
            <h3 id="delete-dialog-title" className="text-lg font-semibold mb-4">
              Xác nhận xóa
            </h3>
            <p className="mb-6 text-gray-700">
              Bạn có chắc chắn muốn xóa{" "}
              <strong>{deleteItem.name || "khuyến mãi"}</strong>?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                aria-label="Xác nhận xóa"
              >
                Xóa
              </button>
              <button
                onClick={cancelDelete}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                aria-label="Hủy xóa"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default PromotionProductList;
