import React, { useEffect, useState } from "react";
import axios from "axios";
import Constants from "../../../Constants";
import { toast } from "react-toastify";
import { decodeToken } from "../Helpers/jwtDecode";
import { FaTrashAlt } from "react-icons/fa";

export default function Wishlist({ className, type }) {
  const token = localStorage.getItem("token");
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    if (!token) {
    //   console.warn("Chưa đăng nhập, không thể tải danh sách yêu thích");
      return;
    }

    const decoded = decodeToken(token);
    const userId = decoded?.id;
    if (!userId) {
      // toast.error("Không thể xác định ID người dùng từ token.");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.get(`${Constants.DOMAIN_API}/users/${userId}/wishlist`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWishlistItems(res.data.data || []);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const newestItems = wishlistItems.slice(-3);

  const subtotal = newestItems.reduce((total, item) => {
    const variant = item.variant || {};
    const price = parseFloat(variant.price || 0);
    const quantity = item.quantity || 1;
    return total + price * quantity;
  }, 0);

  const handleRemove = async (wishlistItemId, productVariantId) => {
    const decoded = decodeToken(token);
    const userId = decoded?.id;
    if (!userId) {
      toast.error("Vui lòng đăng nhập.");
      return;
    }

    try {
      await axios.delete(`${Constants.DOMAIN_API}/users/${userId}/wishlist/${productVariantId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Đã xóa sản phẩm khỏi danh sách yêu thích!");
      fetchWishlist();
    } catch (error) {
      toast.error("Không thể xóa sản phẩm.");
    }
  };

  return (
    <div
      style={{ boxShadow: "0px 15px 50px 0px rgba(0, 0, 0, 0.14)" }}
      className={`w-[300px] bg-white border-t-[3px] ${type === 3 ? "border-qh3-blue" : "border-qyellow"} ${className || ""}`}
    >
      <div className="w-full h-full">
        <div className="product-items h-[310px] overflow-y-scroll">
          <ul>
            {loading ? (
              <li className="text-center">Đang tải...</li>
            ) : newestItems.length === 0 ? (
              <li className="text-center">Danh sách yêu thích trống.</li>
            ) : (
              newestItems.map((item) => {
                const variant = item.variant || {};
                const product = variant.product || {};
                const imageUrl = product.thumbnail || variant?.images?.[0]?.image_url || "/default-image.jpg";
                const price = parseFloat(variant.price || 0);
                const productName = product.name || variant.sku || "Sản phẩm không xác định";

                return (
                  <li key={item.id} className="w-full flex items-center p-2 border-b">
                    <div className="w-[60px] h-[60px] overflow-hidden flex justify-center items-center mr-2">
                      <img
                        src={imageUrl}
                        alt={productName}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <p className="text-[13px] font-medium text-qblack line-clamp-2">
                        {productName}
                      </p>
                      <p className="text-[12px] text-qred mt-1">
                        {price.toLocaleString("vi-VN", { style: "currency", currency: "VND" })}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemove(item.id, item.product_variant_id)}
                      className="p-1 rounded-full text-red-500 hover:bg-red-100 transition duration-200"
                      title="Xóa"
                    >
                      <FaTrashAlt size={14} />
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
        <div className="w-full px-4 mt-[20px] mb-[12px]">
          <div className="h-[1px] bg-[#F0F1F3]"></div>
        </div>
        <div className="product-actions px-4 mb-[30px]">
          <div className="total-equation flex justify-between items-center mb-[28px]">
            <span className="text-[15px] font-500 text-qblack">Tổng cộng</span>
            <span className="text-[15px] font-500 text-qred">
              {subtotal.toLocaleString("vi-VN", { style: "currency", currency: "VND" })}
            </span>
          </div>
          <div className="product-action-btn">
            <a href="/wishlist">
              <div className="gray-btn w-full h-[50px] mb-[10px]">
                <span>Xem danh sách yêu thích</span>
              </div>
            </a>
          </div>
        </div>
        <div className="w-full px-4 mt-[20px]">
          <div className="h-[1px] bg-[#F0F1F3]"></div>
        </div>
      </div>
    </div>
  );
}