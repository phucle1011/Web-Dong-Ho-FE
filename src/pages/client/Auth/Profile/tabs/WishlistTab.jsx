import React, { useEffect, useState } from "react";
import InputQuantityCom from "../../../Helpers/InputQuantityCom";
import axios from "axios";
import Constants from "../../../../../Constants";
import { decodeToken } from "../../../Helpers/jwtDecode";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { FaTrashAlt } from "react-icons/fa";

export default function WishlistTab({ className }) {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);

  const token = localStorage.getItem("token");
  let userId = null;
  if (token) {
    const decoded = decodeToken(token);
    if (decoded?.id) userId = decoded.id;
  }

  const fetchWishlist = async () => {
    if (!userId) return setLoading(false);
    try {
      const res = await axios.get(`${Constants.DOMAIN_API}/users/${userId}/wishlist`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWishlistItems(res.data.data || []);
      setSelectedItems([]);
    } catch (error) {
      console.error("Lỗi khi tải wishlist:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, [userId]);

  const handleRemove = async (wishlistItemId, productVariantId) => {
    if (!userId) return toast.error("Vui lòng đăng nhập.");
    const result = await Swal.fire({ title: "Xác nhận xóa", text: "Bạn có chắc muốn xóa?", icon: "warning", showCancelButton: true, confirmButtonColor: "#d33", cancelButtonText: "Hủy", confirmButtonText: "Xóa" });
    if (!result.isConfirmed) return;
    try {
      await axios.delete(`${Constants.DOMAIN_API}/users/${userId}/wishlist/${productVariantId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Đã xóa sản phẩm khỏi danh sách yêu thích.");
      fetchWishlist();
    } catch {
      toast.error("Không thể xóa sản phẩm.");
    }
  };

  const handleAddSingleToCart = async (productVariantId) => {
    if (!userId) return toast.error("Vui lòng đăng nhập.");
    try {
      await axios.post(`${Constants.DOMAIN_API}/wishlist/add-single-to-cart`, {
        userId, productVariantId, quantity: 1
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Đã thêm vào giỏ hàng và xoá khỏi yêu thích.");
      fetchWishlist();
    } catch (error) {
      toast.error(error.response?.data?.message || "Không thể thêm vào giỏ hàng.");
    }
  };

  const handleAddAllToCart = async () => {
    if (!userId || isProcessing || wishlistItems.length === 0) return;
    setIsProcessing(true);
    try {
      const response = await axios.post(`${Constants.DOMAIN_API}/users/${userId}/wishlist/add-to-cart`, wishlistItems.map(i => ({
        product_variant_id: i.product_variant_id, quantity: 1
      })), {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(response.data.message || "Đã thêm tất cả vào giỏ hàng!");
      fetchWishlist();
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi khi thêm vào giỏ.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddSelectedToCart = async () => {
    if (!userId || isProcessing || selectedItems.length === 0) return;
    setIsProcessing(true);
    try {
      const response = await axios.post(`${Constants.DOMAIN_API}/users/${userId}/wishlist/add-to-cart`, selectedItems.map(id => ({
        product_variant_id: id, quantity: 1
      })), {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(response.data.message || "Đã thêm các sản phẩm được chọn vào giỏ hàng!");
      fetchWishlist();
    } catch (error) {
      toast.error(error.response?.data?.message || "Không thể thêm vào giỏ hàng.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearWishlist = async () => {
    if (!userId || isProcessing || wishlistItems.length === 0) return;
    const result = await Swal.fire({ title: "Xác nhận xóa", text: "Bạn có chắc muốn xoá toàn bộ?", icon: "warning", showCancelButton: true, confirmButtonColor: "#d33", cancelButtonText: "Hủy", confirmButtonText: "Xóa" });
    if (!result.isConfirmed) return;
    setIsProcessing(true);
    try {
      await axios.delete(`${Constants.DOMAIN_API}/users/${userId}/wishlist`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Đã xoá toàn bộ danh sách yêu thích.");
      fetchWishlist();
    } catch {
      toast.error("Không thể xoá toàn bộ.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return <div>Đang tải dữ liệu...</div>;

  return (
    <>
      <div className={`w-full ${className || ""}`}>
        <div className="relative w-full overflow-x-auto border border-[#EDEDED]">
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead>
              <tr className="text-[13px] font-medium text-black bg-[#F6F6F6] uppercase border-b">
                <th className="py-4 pl-4 w-[50px]">
                  <input
                    type="checkbox"
                    checked={selectedItems.length === wishlistItems.length && wishlistItems.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedItems(wishlistItems.map(i => i.product_variant_id));
                      } else {
                        setSelectedItems([]);
                      }
                    }}
                  />
                </th>
                <th className="py-4 pl-10 w-[380px]">Sản phẩm</th>
                <th className="py-4 text-center">Tình trạng</th>
                <th className="py-4 text-center">Giá</th>
                <th className="py-4 text-center">Tổng</th>
                <th className="py-4 text-right pr-10"></th>
              </tr>
            </thead>
            <tbody>
              {wishlistItems.length === 0 ? (
                <tr><td colSpan={6} className="py-10 text-center text-gray-500">Danh sách yêu thích trống!</td></tr>
              ) : wishlistItems.map(item => {
                const variant = item.variant;
                const product = variant?.product || {};
                const price = variant?.price ? parseFloat(variant.price).toLocaleString("vi-VN") + "₫" : "N/A";
                const inStock = variant?.stock > 0;
                const imageUrl = variant?.images?.[0]?.image_url || product.thumbnail || "/default.jpg";

                return (
                  <tr key={item.id} className="bg-white border-b hover:bg-gray-50">
                    <td className="py-4 pl-4">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.product_variant_id)}
                        onChange={() => {
                          setSelectedItems(prev =>
                            prev.includes(item.product_variant_id)
                              ? prev.filter(id => id !== item.product_variant_id)
                              : [...prev, item.product_variant_id]
                          );
                        }}
                      />
                    </td>
                    <td className="pl-10 py-4">
                      <div className="flex space-x-6 items-center">
                        <div className="w-[80px] h-[80px] overflow-hidden flex justify-center items-center border border-[#EDEDED]">
                          <img src={imageUrl} alt={product.name} className="w-full h-full object-contain" />
                        </div>
                        <div className="flex-1 flex flex-col">
                          <p className="font-medium text-[15px] text-qblack">{product.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-center">{inStock ? "Còn hàng" : "Hết hàng"}</td>
                    <td className="py-4 text-center">{price}</td>
                    <td className="py-4 text-center">{price}</td>
                    <td className="py-4 text-right pr-10">
                      <button onClick={() => handleRemove(item.id, item.product_variant_id)} className="p-2 rounded-full bg-red-50 text-red-500 hover:bg-red-100">
                        <FaTrashAlt size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="w-full mt-[30px] flex sm:justify-end justify-start">
        <div className="sm:flex sm:space-x-[30px] items-center">
          <button onClick={handleClearWishlist} className="text-sm font-semibold text-qred">
            Xoá toàn bộ
          </button>
          <div className="w-[180px] h-[50px]">
            <button onClick={handleAddSelectedToCart} className="yellow-btn w-full h-full">
              Thêm đã chọn vào giỏ hàng
            </button>
          </div>
          <div className="w-[180px] h-[50px]">
            <button onClick={handleAddAllToCart} className="yellow-btn w-full h-full">
              Thêm tất cả vào giỏ hàng
            </button>
          </div>
        </div>
      </div>
    </>
  );
}