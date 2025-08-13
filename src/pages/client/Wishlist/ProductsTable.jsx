import React, { useState, useEffect, useMemo } from "react";
import { FaTrashAlt } from "react-icons/fa";
import axios from "axios";
import Constants from "../../../Constants";
import { decodeToken } from "../Helpers/jwtDecode";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

export default function ProductsTable({ products = [], onWishlistChange, onSelectItems }) {
  const token = localStorage.getItem("token");
  let userId = null;
  if (token) {
    const decoded = decodeToken(token);
    if (decoded && decoded.id) userId = decoded.id;
  }

  const [selectedItems, setSelectedItems] = useState([]);
  const [expandedRows, setExpandedRows] = useState({});

  useEffect(() => {
    onSelectItems(selectedItems);
  }, [selectedItems, onSelectItems]);

  useEffect(() => {
    const validSelected = selectedItems.filter((id) =>
      products.some((item) => item.product_variant_id === id)
    );
    setSelectedItems(validSelected);
  }, [products]);

  const handleCheckboxChange = (productVariantId) => {
    setSelectedItems((prev) =>
      prev.includes(productVariantId)
        ? prev.filter((id) => id !== productVariantId)
        : [...prev, productVariantId]
    );
  };

  const handleRemove = async (wishlistItemId, productVariantId) => {
    if (!userId) {
      toast.error("Vui lòng đăng nhập để xóa sản phẩm khỏi danh sách yêu thích.");
      return;
    }
    const result = await Swal.fire({
      title: "Xác nhận xóa",
      text: "Bạn có chắc muốn xóa sản phẩm này khỏi danh sách yêu thích?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
    });
    if (!result.isConfirmed) return;
    try {
      const response = await axios.delete(
        `${Constants.DOMAIN_API}/users/${userId}/wishlist/${productVariantId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(response.data.message || "Đã xóa sản phẩm khỏi danh sách yêu thích!");
      if (onWishlistChange) onWishlistChange();
      setSelectedItems((prev) => prev.filter((id) => id !== productVariantId));
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Lỗi khi xóa sản phẩm khỏi danh sách yêu thích.";
      toast.error(errorMessage);
    }
  };

  const toggleRow = (rowId) => {
    setExpandedRows((prev) => ({ ...prev, [rowId]: !prev[rowId] }));
  };

  return (
    <div className={`w-full ${products.length === 0 ? "text-center" : ""}`}>
      {products.length === 0 ? (
        <p className="py-10 text-gray-500">Không có sản phẩm nào trong wishlist.</p>
      ) : (
        <div className="relative w-full overflow-x-auto border border-[#EDEDED]">
          <table className="w-full text-sm text-left text-gray-500">
            <thead>
              <tr className="text-[13px] font-medium text-black bg-[#F6F6F6] uppercase border-b">
                <th className="py-4 pl-4 w-[50px]">
                  <input
                    type="checkbox"
                    checked={selectedItems.length === products.length && products.length > 0}
                    onChange={(e) => {
                      const allIds = products.map((item) => item.product_variant_id);
                      setSelectedItems(e.target.checked ? allIds : []);
                    }}
                  />
                </th>
                <th className="py-4 pl-10 w-[380px]">Sản phẩm</th>
                <th className="py-4 text-center">Thuộc tính</th>
                <th className="py-4 text-center">Giá</th>
                <th className="py-4 text-center whitespace-nowrap">Tồn kho</th>
                <th className="py-4 text-center">Tổng</th>
                <th className="py-4 text-right pr-10"></th>
              </tr>
            </thead>
            <tbody>
              {products.map((item) => {
                const product = item.variant?.product || {};
                const price = item.variant?.price
                  ? parseFloat(item.variant.price).toLocaleString("vi-VN") + "₫"
                  : "N/A";
                const avs = item.variant?.attributeValues || [];
                const isExpanded = expandedRows[item.id];
                const displayAVs = useMemo(() => {
                  return isExpanded ? avs : avs.slice(0, 3);
                }, [avs, isExpanded]);
                const imageUrl =
                  item.variant?.images?.[0]?.image_url ||
                  product.thumbnail ||
                  "/default-image.jpg";

                return (
                  <tr key={item.id} className="bg-white border-b hover:bg-gray-50">
                    <td className="py-4 pl-4">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.product_variant_id)}
                        onChange={() => handleCheckboxChange(item.product_variant_id)}
                      />
                    </td>
                    <td className="pl-10 py-4 w-[380px]">
                      <div className="flex space-x-6 items-center">
                        <div className="w-[80px] h-[80px] flex justify-center items-center border">
                          <img
                            src={imageUrl}
                            alt={product.name || "Sản phẩm"}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-[15px] text-qblack">
                            {product.name || "Sản phẩm không xác định"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-left">
                      <ul className="list-inside space-y-1">
                        {displayAVs.map((av) => {
                          const name = av.attribute?.name || "Thuộc tính";
                          const val = av.value;
                          const isColor = /^#([0-9A-F]{3}){1,2}$/i.test(val) || CSS.supports("color", val);
                          return (
                            <li key={av.id} className="flex items-center">
                              <strong className="mr-1">{name}:</strong>
                              {isColor ? (
                                <>
                                  <span
                                    className="inline-block w-5 h-5 rounded border mr-2 transition-transform hover:scale-110"
                                    style={{ backgroundColor: val }}
                                    title={`Mã màu: ${val}`}
                                  />
                                  <span>{val}</span>
                                </>
                              ) : (
                                <span>{val}</span>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                      {avs.length > 3 && (
                        <button
                          onClick={() => toggleRow(item.id)}
                          className="mt-1 flex items-center text-blue-600 hover:text-blue-800 transition text-sm"
                        >
                          {isExpanded ? (
                            <>
                              <span className="mr-1">Thu gọn</span>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                              </svg>
                            </>
                          ) : (
                            <>
                              <span className="mr-1">Xem thêm ({avs.length - 3})</span>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                              </svg>
                            </>
                          )}
                        </button>
                      )}
                    </td>
                    <td className="py-4 text-center">{price}</td>
                    <td className="py-4 text-center">{item.variant?.stock ?? "—"}</td>
                    <td className="py-4 text-center">{price}</td>
                    <td className="py-4 text-right pr-10">
                      <button
                        onClick={() => handleRemove(item.id, item.product_variant_id)}
                        type="button"
                        className="p-2 rounded-full bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700 transition"
                        title="Xóa khỏi danh sách yêu thích"
                      >
                        <FaTrashAlt size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}