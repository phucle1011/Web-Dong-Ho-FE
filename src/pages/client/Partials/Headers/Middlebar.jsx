import Cart from "../../Cart";
import Compair from "../../Helpers/icons/Compair";
import ThinBag from "../../Helpers/icons/ThinBag";
import ThinLove from "../../Helpers/icons/ThinLove";
import ThinPeople from "../../Helpers/icons/ThinPeople";
import SearchBox from "../../Helpers/SearchBox";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import Constants from "../../../../Constants";
import Wishlist from "../../Helpers/Wishlist";
import { decodeToken } from "../../Helpers/jwtDecode";

export default function Middlebar({ className, type }) {
  const [count, setCount] = useState(0);
  const [compareCount, setCompareCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const navigate = useNavigate();

  // === Helper: load lại số lượng giỏ hàng ===
  const loadCartCount = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setCount(0);
      return;
    }
    try {
      const res = await axios.get(`${Constants.DOMAIN_API}/carts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCount(res?.data?.count ?? 0);
    } catch (e) {
      // bỏ qua lỗi
    }
  };

  // === Helper: load lại số lượng wishlist ===
  const loadWishlistCount = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setWishlistCount(0);
      return;
    }
    try {
      const decoded = decodeToken(token);
      const userId = decoded?.id;
      if (!userId) return;
      const response = await axios.get(
        `${Constants.DOMAIN_API}/users/${userId}/wishlist`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setWishlistCount(response?.data?.data?.length || 0);
    } catch (e) {
      // bỏ qua lỗi
    }
  };

  useEffect(() => {
    // Lần đầu vào trang
    loadCartCount();
    loadWishlistCount();
  }, []);

  useEffect(() => {
    // Đồng bộ so sánh từ localStorage
    const updateCompareCount = () => {
      const list = JSON.parse(localStorage.getItem("compareVariants") || "[]");
      setCompareCount(list.filter(Boolean).length);
    };
    updateCompareCount();
    window.addEventListener("storage", updateCompareCount);
    return () => window.removeEventListener("storage", updateCompareCount);
  }, []);

  useEffect(() => {
    // --- Lắng nghe sự kiện khi giỏ hàng thay đổi trong cùng TAB ---
    const onCartChanged = () => loadCartCount();
    window.addEventListener("cart:changed", onCartChanged);

    // --- Lắng nghe khi localStorage thay đổi (khác TAB / WINDOW) ---
    const onStorage = (e) => {
      if (e.key === "cartUpdatedAt") {
        loadCartCount();
      }
    };
    window.addEventListener("storage", onStorage);

    // --- Khi quay lại tab, tự refresh ---
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        loadCartCount();
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.removeEventListener("cart:changed", onCartChanged);
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const handleSearch = ({ keyword, brandIds, attributeValues, attributeIds }) => {
    const params = new URLSearchParams();
    if (keyword?.trim()) params.append("keyword", keyword.trim());
    if (brandIds?.length) params.append("brand_ids", brandIds.join(","));
    if (attributeValues?.length) params.append("attribute_values", attributeValues.join(","));
    if (attributeIds?.length) params.append("attribute_ids", attributeIds.join(","));
    navigate(`/all-products?${params.toString()}`);
  };

  return (
    <div className={`w-full h-[86px] bg-white ${className}`}>
      <div className="container-x mx-auto h-full">
        <div className="relative h-full">
          <div className="flex justify-between items-center h-full">
            {/* Logo */}
            <div>
              {type === 3 ? (
                <Link to="/"><img width="152" height="36" src='https://res.cloudinary.com/disgf4yl7/image/upload/v1755192506/l5p21sv5fnoobblwdwia.png' alt="logo" /></Link>
              ) : type === 4 ? (
                <Link to="/"><img width="152" height="36" src='https://res.cloudinary.com/disgf4yl7/image/upload/v1755192506/l5p21sv5fnoobblwdwia.png' alt="logo" /></Link>
              ) : (
                <Link to="/"><img width="152" height="36" src='https://res.cloudinary.com/disgf4yl7/image/upload/v1755192506/l5p21sv5fnoobblwdwia.png' alt="logo" /></Link>
              )}
            </div>

            {/* Search */}
            <div className="w-[517px] h-[44px]">
              <SearchBox type={type} className="search-com" onSearch={handleSearch} />
            </div>

            {/* Actions */}
            <div className="flex space-x-6 items-center">
              {/* So sánh */}
              <div className="compaire relative">
                <Link to="/products-compaire"><span><Compair /></span></Link>
                {compareCount > 0 && (
                  <span className={`w-[18px] h-[18px] rounded-full absolute -top-2.5 -right-2.5 flex justify-center items-center text-[9px] ${type === 3 ? "bg-qh3-blue text-white" : "bg-qyellow"}`}>
                    {compareCount}
                  </span>
                )}
              </div>


              {/* Wishlist */}
              <div className="cart-wrapper group relative py-4">
                <div className="cart relative cursor-pointer">
                  <Link to="/wishlist"><span><ThinLove /></span></Link>
                  <span className={`w-[18px] h-[18px] rounded-full absolute -top-2.5 -right-2.5 flex justify-center items-center text-[9px] ${type === 3 ? "bg-qh3-blue text-white" : "bg-qyellow"}`}>
                    {wishlistCount}
                  </span>
                </div>
                <Wishlist type={type} className="absolute -right-[45px] top-11 z-50 hidden group-hover:block" />
              </div>

              {/* Cart */}
              <div className="cart-wrapper group relative py-4">
                <div className="cart relative cursor-pointer">
                  <Link to="/cart"><span><ThinBag /></span></Link>
                  <span className={`w-[18px] h-[18px] rounded-full absolute -top-2.5 -right-2.5 flex justify-center items-center text-[9px] ${type === 3 ? "bg-qh3-blue text-white" : "bg-qyellow"}`}>
                    {count}
                  </span>
                </div>
                <Cart type={type} className="absolute -right-[45px] top-11 z-50 hidden group-hover:block" />
              </div>

              {/* Profile */}
              <div>
                <Link to="/profile"><span><ThinPeople /></span></Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
