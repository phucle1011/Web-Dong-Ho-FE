import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import BreadcrumbCom from "../BreadcrumbCom";
import EmptyCardError from "../EmptyCardError";
import InputCom from "../Helpers/InputCom";
import PageTitle from "../Helpers/PageTitle";
import Layout from "../Partials/LayoutHomeThree";
import ProductsTable from "./ProductsTable";
import Constants from "../../../Constants";
import axios from "axios";
import { useLocation } from "react-router-dom";
import { notifyCartChanged } from "../Helpers/cart/cartEvents";

export default function CardPage({ cart = true }) {
  const [totalPrice, setTotalPrice] = useState(0);
  const [originalTotalPrice, setOriginalTotalPrice] = useState(0);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [discountInfo, setDiscountInfo] = useState(null);
  const [promoCode, setPromoCode] = useState("");
  const [error, setError] = useState("");
  const [activePromotions, setActivePromotions] = useState([]);
  const [selectedProductVariants, setSelectedProductVariants] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const location = useLocation();

  const [hasActiveAuction, setHasActiveAuction] = useState(false);

  useEffect(() => {
    localStorage.removeItem("selectedPromoCode");
    localStorage.removeItem("selectedVoucher");
    localStorage.removeItem("finalTotal");
    localStorage.removeItem("checkoutData");
    setPromoCode("");
    setSelectedVoucher(null);
    setDiscountInfo(null);
    setError("");
  }, []);

  useEffect(() => {
    const fetchActivePromotions = async () => {
      setIsLoading(true);

      try {
        const token = localStorage.getItem("token");

        if (!token) {
          setError("Vui lòng đăng nhập để xem mã giảm giá.");
          setActivePromotions([]);
          return;
        }

        if (totalPrice === 0) {
          setError("Vui lòng chọn sản phẩm trước khi áp dụng mã giảm giá.");
          setActivePromotions([]);
          return;
        }

        const response = await axios.get(`${Constants.DOMAIN_API}/promotions/active`, {
          params: { orderTotal: totalPrice },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setActivePromotions(response.data.data || []);
        setError("");
      } catch (err) {
        console.error('Error fetching active promotions:', err);
        setActivePromotions([]);
        if (err.response && err.response.status === 401) {
          setError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        } else {
          setError("Đã xảy ra lỗi khi lấy danh sách mã giảm giá.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivePromotions();
  }, [totalPrice]);

  useEffect(() => {
    let voucherDiscount = 0;
    if (selectedVoucher) {
      if (totalPrice < selectedVoucher.min_price_threshold) {
        setSelectedVoucher(null);
        setError(`Đơn hàng phải tối thiểu ${selectedVoucher.min_price_threshold.toLocaleString()}₫ để sử dụng voucher này.`);
        return;
      }
      if (selectedVoucher.discount_type === "shipping") {
        voucherDiscount = 0;
      } else if (selectedVoucher.discount_type === "percentage") {
        voucherDiscount = Math.min(
          (totalPrice * selectedVoucher.discount_value) / 100,
          selectedVoucher.max_price || Infinity
        );
      } else if (selectedVoucher.discount_type === "fixed") {
        voucherDiscount = Math.min(selectedVoucher.discount_value, totalPrice);
      }
    }

    setDiscountInfo((prev) => {
      const promoDiscount = prev?.promoDiscount || 0;
      const totalDiscount = Math.min(voucherDiscount + promoDiscount, totalPrice);
      return {
        ...prev,
        voucherDiscount,
        promoDiscount,
        discountAmount: totalDiscount,
        max_price: selectedVoucher?.max_price || prev?.max_price || 0,
      };
    });
  }, [selectedVoucher, totalPrice]);

  useEffect(() => {
    if (!promoCode) {
      setDiscountInfo((prev) => ({
        ...prev,
        promoDiscount: 0,
        discountAmount: prev?.voucherDiscount || 0,
        max_price: prev?.max_price || 0,
      }));
      setError("");
    }
  }, [promoCode]);

  const handleVoucherSelect = (voucher) => {
    if (selectedVoucher && selectedVoucher.id === voucher.id) {
      setSelectedVoucher(null);
      setError("");
    } else if (totalPrice >= voucher.min_price_threshold) {
      setSelectedVoucher(voucher);
      setError("");
    } else {
      setSelectedVoucher(null);
      setError(`Đơn hàng phải tối thiểu ${voucher.min_price_threshold.toLocaleString()}₫ để sử dụng voucher này.`);
    }
  };

  const handleApplyDiscount = async () => {
    setError("");
    if (!promoCode.trim()) {
      setError("Vui lòng nhập mã giảm giá.");
      return;
    }
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Vui lòng đăng nhập để áp dụng mã giảm giá.");
        return;
      }
      const res = await fetch(`${Constants.DOMAIN_API}/promotions/apply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          code: promoCode.trim(),
          orderTotal: totalPrice,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Có lỗi xảy ra khi áp dụng mã.");
      }
      if (!data.data) {
        throw new Error("Dữ liệu giảm giá không hợp lệ.");
      }
      const promoDiscount = data.data.discountAmount || 0;
      const promotionUserId = data.data.promotion_user_id || null;
      const voucherDiscount = discountInfo?.voucherDiscount || 0;
      const totalDiscount = Math.min(voucherDiscount + promoDiscount, totalPrice);

      setDiscountInfo((prev) => ({
        ...prev,
        ...data.data,
        promoDiscount,
        voucherDiscount,
        promoDiscount,
        discountAmount: totalDiscount,
        max_price: selectedVoucher?.max_price || data.data.max_price || 0,
        promotion_user_id: promotionUserId
      }));

      // localStorage.setItem(
      //   "selectedPromoCode",
      //   JSON.stringify({
      //     code: promoCode.trim(),
      //     discountAmount: promoDiscount,
      //     maxPrice: data.data.max_price,
      //     promotion_user_id: promotionUserId,
      //     appliedAt: Date.now(),
      //   })
      // );

      setError("");
    } catch (err) {
      setDiscountInfo((prev) => ({
        ...prev,
        promoDiscount: 0,
        discountAmount: prev?.voucherDiscount || 0,
      }));
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearPromoCode = () => {
    setPromoCode("");
    setError("");
  };

  const finalTotal = discountInfo ? totalPrice - discountInfo.discountAmount : totalPrice;

  useEffect(() => {
    if (selectedProductVariants.length > 0) {
      const checkoutData = {
        selectedProductVariants,
        cartItems: cartItems.filter((item) =>
          selectedProductVariants.includes(item.product_variant_id)
        ),
        totalPrice,
        originalTotalPrice,
        discountInfo,
        finalTotal,
        promotion_user_id: discountInfo?.promotion_user_id || null,
      };
      // localStorage.setItem("checkoutData", JSON.stringify(checkoutData));
    }
  }, [selectedProductVariants, cartItems, totalPrice, originalTotalPrice, discountInfo, finalTotal]);

  useEffect(() => {
    const savedVoucher = localStorage.getItem("selectedVoucher");
    if (savedVoucher) {
      const parsed = JSON.parse(savedVoucher);
      setSelectedVoucher(parsed);
    }
  }, []);

  const saveFinalTotalToLocalStorage = () => {
    const finalData = {
      label: discountInfo ? "Tổng sau giảm" : "Tổng cộng",
      amount: finalTotal,
      formattedAmount: Number(finalTotal).toLocaleString("vi-VN", { style: "currency", currency: "VND" }),
      hasDiscount: !!discountInfo,
      discountAmount: discountInfo?.discountAmount || 0,
      originalTotalPrice,
    };

    // localStorage.setItem("finalTotal", JSON.stringify(finalData));
  };

  useEffect(() => {
    saveFinalTotalToLocalStorage();
  }, [totalPrice, originalTotalPrice, discountInfo, finalTotal]);

  const handleTotalChange = (newTotal) => {
    setTotalPrice(newTotal.discountedTotal || newTotal);
    setOriginalTotalPrice(newTotal.originalTotal || newTotal);
  };

  return (
    <Layout childrenClasses={cart ? "pt-0 pb-0" : ""}>
      {cart === false ? (
        <div className="cart-page-wrapper w-full">
          <div className="container-x mx-auto">
            <BreadcrumbCom
              paths={[
                { name: "Trang chủ", path: "/" },
                { name: "Giỏ hàng", path: "/cart" },
              ]}
            />
            <EmptyCardError />
          </div>
        </div>
      ) : (
        <div className="cart-page-wrapper w-full bg-white pb-[60px]">
          <div className="w-full">
            <PageTitle
              title="Giỏ hàng của bạn"
              breadcrumb={[
                { name: "Trang chủ", path: "/" },
                { name: "Giỏ hàng", path: "/cart" },
              ]}
            />
          </div>
          <div className="w-full mt-[23px]">
            <div className="container-x mx-auto">
              <ProductsTable
                className="mb-[30px]"
                onTotalChange={handleTotalChange}
                onSelectedItemsChange={setSelectedProductVariants}
                onCartItemsChange={setCartItems}
                onHasActiveAuction={setHasActiveAuction}
              />

              <div className="flex flex-col lg:flex-row gap-6">
                <div className="lg:w-1/2 w-full">
                  {hasActiveAuction ? (
                    <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
                      Do là sản phẩm đấu giá không thể áp dụng mã giảm giá hoặc voucher.
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
                        <div className="relative w-[150px] h-[40px]">
                          <InputCom
                            inputWrapperClasses="rounded-lg"
                            inputClasses="px-4"
                            type="text"
                            placeholder="Mã giảm giá"
                            value={promoCode}
                            onChange={(e) => setPromoCode(e.target.value)}
                          />
                          {promoCode && (
                            <button
                              type="button"
                              onClick={handleClearPromoCode}
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                              aria-label="Xóa mã giảm giá"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={handleApplyDiscount}
                          className="w-[120px] h-[40px] black-btn rounded-lg"
                          disabled={isLoading}
                        >
                          <span className="text-sm font-semibold">{isLoading ? "Đang xử lý..." : "Áp dụng"}</span>
                        </button>
                      </div>

                      {error && (
                        <p className="text-red-500 text-sm mb-4">{error}</p>
                      )}

                      <div className="voucher-section mb-6 max-w-md max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                        <h3 className="text-[16px] font-semibold text-gray-800 mb-3">Chọn Voucher</h3>
                        {isLoading ? (
                          <p className="text-gray-500">Đang tải danh sách voucher...</p>
                        ) : activePromotions.length === 0 ? (
                          <p className="text-gray-500">Không có voucher khả dụng.</p>
                        ) : (
                          activePromotions.map((voucher) => {
                            const disabled = totalPrice < voucher.min_price_threshold;
                            const isSelected = selectedVoucher && selectedVoucher.id === voucher.id;
                            return (
                              <div
                                key={voucher.id}
                                className={`flex items-center justify-between p-3 border rounded-lg mb-2 cursor-pointer bg-white shadow-sm transition-all duration-200
                              ${isSelected ? "border-green-500 bg-green-50" : "border-gray-200 hover:bg-gray-50"} 
                              ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
                                onClick={() => !disabled && handleVoucherSelect(voucher)}
                                style={{ maxWidth: '400px' }}
                                role="button"
                                tabIndex={0}
                                aria-label={`Chọn voucher ${voucher.name}${disabled ? ", không khả dụng" : ""}`}
                                aria-selected={isSelected}
                                onKeyDown={(e) => {
                                  if ((e.key === "Enter" || e.key === " ") && !disabled) {
                                    handleVoucherSelect(voucher);
                                  }
                                }}
                              >
                                <div className="flex items-center flex-1 min-w-0">
                                  {voucher.discount_type === "shipping" && (
                                    <span className="bg-teal-500 text-white text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap mr-3">FREE SHIP</span>
                                  )}
                                  {voucher.discount_type !== "shipping" && (
                                    <span className="bg-green-500 text-white text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap mr-3">VOUCHER</span>
                                  )}
                                  <span className="text-sm flex-1 text-gray-700 flex-wrap">
                                    <strong>{voucher.name}</strong>{" "}
                                    {voucher.discount_type === 'percentage' && (
                                      <span className="text-gray-500"><br />
                                        Giảm {voucher.discount_value}% {voucher.max_price ? `, 
                                    Tối đa ${Number(voucher.max_price).toLocaleString("vi-VN", { style: "currency", currency: "VND" })}` : ''}
                                      </span>
                                    )}
                                    {voucher.discount_type === 'fixed' && (
                                      <span className="text-gray-500"><br />
                                        Giảm {Number(voucher.discount_value).toLocaleString("vi-VN", { style: "currency", currency: "VND" })}
                                      </span>
                                    )}
                                    <span className="text-gray-500"><br />
                                      Đơn tối thiểu {Number(voucher.min_price_threshold).toLocaleString("vi-VN", { style: "currency", currency: "VND" })}
                                    </span>
                                    {voucher.end_date && (
                                      <span className="text-gray-500"><br />
                                        Hết hạn: {new Date(voucher.end_date).toLocaleDateString("vi-VN", {
                                          day: "2-digit",
                                          month: "2-digit",
                                          year: "numeric",
                                        })}
                                      </span>
                                    )}
                                    <span className={"text-red-500"}>
                                      <br />
                                      Còn lại: {voucher.quantity} lượt sử dụng
                                    </span>
                                  </span>
                                </div>
                                {isSelected && (
                                  <span className="text-green-500 font-bold text-xl ml-3 flex-shrink-0">✓</span>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </>
                  )}
                </div>

                <div className="lg:w-1/2 w-full">
                  <div className="border border-[#EDEDED] px-[30px] py-[26px]">
                    <div className="sub-total mb-6">
                      {originalTotalPrice > totalPrice && (
                        <div className="flex justify-between mb-3">
                          <p className="text-[15px] font-medium text-qblack">Tổng giá gốc</p>
                          <p className="text-[15px] font-medium text-gray-400 line-through">
                            {Number(originalTotalPrice).toLocaleString("vi-VN", { style: "currency", currency: "VND" })}
                          </p>
                        </div>
                      )}
                      <div className="flex justify-between mb-3">
                        <p className="text-[15px] font-medium text-qblack">Tổng tiền (sau khuyến mãi sản phẩm)</p>
                        <p className="text-[15px] font-medium text-qred">
                          {Number(totalPrice).toLocaleString("vi-VN", { style: "currency", currency: "VND" })}
                        </p>
                      </div>
                      {discountInfo && (
                        <>
                          {discountInfo.promoDiscount > 0 && (
                            <div className="flex justify-between mb-3">
                              <p className="text-[15px] font-medium text-qblack">Giảm giá (Mã đặc biệt)</p>
                              <p className="text-[15px] font-medium text-green-600">
                                -{Number(discountInfo.promoDiscount).toLocaleString("vi-VN", { style: "currency", currency: "VND" })}
                              </p>
                            </div>
                          )}
                          {discountInfo.voucherDiscount > 0 && (
                            <div className="flex justify-between mb-3">
                              <p className="text-[15px] font-medium text-qblack">Giảm giá (Voucher)</p>
                              <p className="text-[15px] font-medium text-green-600">
                                -{Number(discountInfo.voucherDiscount).toLocaleString("vi-VN", { style: "currency", currency: "VND" })}
                              </p>
                            </div>
                          )}
                          {/* {discountInfo.max_price && (discountInfo.voucherDiscount > 0 || discountInfo.promoDiscount > 0) && (
                            <div className="flex justify-between mb-3">
                              <p className="text-[13px] text-qgraytwo italic">Giảm tối đa</p>
                              <p className="text-[13px] text-qgraytwo italic">
                                {Number(discountInfo.max_price).toLocaleString("vi-VN", { style: "currency", currency: "VND" })}
                              </p>
                            </div>
                          )} */}
                          <div className="flex justify-between mb-3">
                            <p className="text-[15px] font-medium text-qblack">Tổng sau giảm</p>
                            <p className="text-[15px] font-medium text-qred">
                              {Number(finalTotal).toLocaleString("vi-VN", { style: "currency", currency: "VND" })}
                            </p>
                          </div>
                        </>
                      )}
                      <div className="w-full h-[1px] bg-[#EDEDED]"></div>
                    </div>

                    {/* <button type="button" className="w-full mb-10">
                      <div className="w-full h-[50px] bg-[#F6F6F6] flex justify-center items-center">
                        <span className="text-sm font-semibold">Cập nhật giỏ hàng</span>
                      </div>
                    </button> */}

                    <div className="flex justify-between mb-3">
                      <p className="text-[18px] font-medium text-qblack">
                        {discountInfo ? "Tổng sau giảm" : "Tổng cộng"}
                      </p>
                      <p className="text-[18px] font-medium text-qred">
                        {Number(finalTotal).toLocaleString("vi-VN", { style: "currency", currency: "VND" })}
                      </p>
                    </div>

                    {selectedProductVariants.length > 0 ? (
                      <Link
                        to="/checkout" state={{
                          selectedProductVariants: selectedProductVariants,
                          cartItems: cartItems.filter((item) =>
                            selectedProductVariants.includes(item.product_variant_id)
                          ),
                          totalPrice,
                          originalTotalPrice,
                          discountInfo,
                          finalTotal,
                          selectedVoucher
                        }}
                      >
                        <div className="w-full h-[40px] black-btn flex justify-center items-center rounded-lg">
                          <span className="text-sm font-semibold">Tiến hành thanh toán</span>
                        </div>
                      </Link>
                    ) : (
                      <div className="w-full h-[40px] bg-gray-300 flex justify-center items-center cursor-not-allowed rounded-lg">
                        <span className="text-sm font-semibold text-gray-500">Tiến hành thanh toán</span>
                      </div>
                    )}
                    {selectedProductVariants.length === 0 && (
                      <p className="text-red-500 text-sm mt-2">Vui lòng chọn ít nhất một sản phẩm để thanh toán.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}