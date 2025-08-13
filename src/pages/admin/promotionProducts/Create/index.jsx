import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Constants from "../../../../Constants.jsx";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Select from "react-select";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const PromotionProductForm = ({ onSuccess }) => {
  const navigate = useNavigate();
  const [promotions, setPromotions] = useState([]);
  const [productVariants, setProductVariants] = useState([]);
  const [usedVariantIds, setUsedVariantIds] = useState([]);
  const [usedPromotionIds, setUsedPromotionIds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [selectedPromotionId, setSelectedPromotionId] = useState(null);
  const [selectedPromotion, setSelectedPromotion] = useState(null);
  const [selectedVariantIds, setSelectedVariantIds] = useState([]);
  const [variantQuantities, setVariantQuantities] = useState({});
  const [maxDiscountValue, setMaxDiscountValue] = useState(0);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    trigger,
    formState: { errors },
  } = useForm();

  // Số lượt còn lại của khuyến mãi đang chọn
  const remainingQty = selectedPromotion?.quantity ? Number(selectedPromotion.quantity) : 0;

  // Hết lượt thì báo và khóa chọn biến thể
  useEffect(() => {
    if (!selectedPromotion) return;
    if (remainingQty <= 0) {
      setSelectedVariantIds([]);
      setValue("product_variant_id", []);
      setVariantQuantities({});
      toast.warning("Khuyến mãi đã hết lượt sử dụng. Vui lòng chọn khuyến mãi khác!");
    }
  }, [selectedPromotion, remainingQty, setValue]);

  const getPromotionStatus = (startDate, endDate) => {
    if (!startDate || !endDate)
      return { status: "Không xác định", className: "text-gray-500" };
    const currentDate = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (currentDate < start) {
      return { status: "Sắp bắt đầu", className: "text-blue-500" };
    }
    if (currentDate <= end) {
      return { status: "Đang diễn ra", className: "text-green-500" };
    }
    return { status: "Đã kết thúc", className: "text-gray-500" };
  };

  const fetchPromotions = async () => {
    try {
      const res = await axios.get(`${Constants.DOMAIN_API}/admin/promotions/ss/all`);
      const data = Array.isArray(res.data.data) ? res.data.data : [];
      setPromotions(data);
    } catch (error) {
      console.error("Lỗi khi tải danh sách promotion:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      toast.error("Không thể tải danh sách khuyến mãi!");
    }
  };

  const fetchProductVariants = async () => {
    try {
      const res = await axios.get(`${Constants.DOMAIN_API}/admin/product-variants`);
      setProductVariants(res.data.data || []);
    } catch (error) {
      console.error("Lỗi khi tải danh sách biến thể sản phẩm:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      toast.error("Không thể tải danh sách biến thể sản phẩm!");
    }
  };

  const fetchUsedVariantsAndPromotions = async () => {
    try {
      const res = await axios.get(`${Constants.DOMAIN_API}/admin/promotion`, {
        params: { limit: 1000 },
      });
      const promotionProducts = Array.isArray(res.data.data)
        ? res.data.data
        : [];
      const usedVariantIds = [
        ...new Set(
          promotionProducts
            .filter(
              (item) =>
                item.product_variant_id && !isNaN(item.product_variant_id)
            )
            .map((item) => item.product_variant_id)
        ),
      ];
      const usedPromotionIds = [
        ...new Set(
          promotionProducts
            .filter((item) => item.promotion_id && !isNaN(item.promotion_id))
            .map((item) => item.promotion_id)
        ),
      ];

      setUsedVariantIds(usedVariantIds);
      setUsedPromotionIds(usedPromotionIds);
    } catch (error) {
      console.error(
        "Lỗi khi tải danh sách biến thể hoặc khuyến mãi đã sử dụng:",
        {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
        }
      );
      toast.error("Không thể tải danh sách đã sử dụng!");
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      setIsFetching(true);
      try {
        await Promise.all([
          fetchPromotions(),
          fetchProductVariants(),
          fetchUsedVariantsAndPromotions(),
        ]);
      } catch (error) {
        console.error("Lỗi khi khởi tạo dữ liệu:", error);
      }
      setIsFetching(false);
    };
    initializeData();
  }, []);

  const onSubmit = async (data) => {
    if (isLoading) return; // Ngăn gửi trùng lặp

    const selectedPromotion = promotions.find(
      (p) => p.id === parseInt(data.promotion_id)
    );
    if (!selectedPromotion) {
      toast.error("Khuyến mãi không hợp lệ!");
      return;
    }

    const totalVariants = data.product_variant_id.length;
    if (totalVariants > selectedPromotion.quantity) {
      toast.error(
        `Không thể thêm ${totalVariants} biến thể. Khuyến mãi chỉ còn ${selectedPromotion.quantity} lượt khả dụng.`
      );
      return;
    }

    const overStockVariants = data.product_variant_id.filter((id) => {
      const variant = productVariants.find((v) => v.id === parseInt(id));
      const quantity = parseInt(variantQuantities[id]) || 1;
      return variant && quantity > (variant.stock || 0);
    });

    if (overStockVariants.length > 0) {
      const names = overStockVariants
        .map((id) => {
          const variant = productVariants.find((v) => v.id === parseInt(id));
          return `${variant?.sku || "N/A"} (${variant?.product?.name || "Không rõ"})`;
        })
        .join(", ");
      toast.error(`Số lượng vượt tồn kho cho: ${names}`);
      return;
    }

    const usedVariants = data.product_variant_id.filter((id) =>
      usedVariantIds.includes(parseInt(id))
    );

    if (usedVariants.length > 0) {
      const variantDetails = usedVariants
        .map((id) => {
          const variant = productVariants.find((v) => v.id === parseInt(id));
          return variant
            ? `${variant.sku} (${variant.product?.name || "Tên không xác định"})`
            : id;
        })
        .join(", ");
      toast.error(
        `Không thể thêm các biến thể sau vì chúng đã được sử dụng trong khuyến mãi khác: ${variantDetails}.`
      );
      return;
    }

    const payload = {
      promotion_id: parseInt(data.promotion_id),
      product_variant_id: data.product_variant_id.map((id) => parseInt(id)),
      variant_quantity: data.product_variant_id.map(
        (id) => parseInt(variantQuantities[id]) || 1
      ),
    };

    setIsLoading(true);
    try {
      const response = await axios.post(
        `${Constants.DOMAIN_API}/admin/promotion-products`,
        payload
      );

      toast.success("Thêm sản phẩm khuyến mãi thành công!");

      // Cập nhật lại dữ liệu
      await Promise.all([fetchPromotions(), fetchUsedVariantsAndPromotions()]);

      // Cập nhật danh sách đã sử dụng
      setUsedVariantIds((prev) => [
        ...new Set([...prev, ...data.product_variant_id.map((id) => parseInt(id))]),
      ]);
      setUsedPromotionIds((prev) => [
        ...new Set([...prev, parseInt(data.promotion_id)]),
      ]);

      reset();
      setSelectedPromotionId(null);
      setSelectedVariantIds([]);
      setVariantQuantities({});
      setSelectedPromotion(null);
      setValue("promotion_id", "");
      setValue("product_variant_id", []);

      if (onSuccess) onSuccess();
      setTimeout(() => {
        navigate("/admin/promotion-products/getAll");
      }, 1000);
    } catch (err) {
      console.error("Error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        payload,
      });
      let errorMessage = "Lỗi khi thêm sản phẩm khuyến mãi!";
      if (err.response?.status === 400) {
        errorMessage = err.response.data.error || "Dữ liệu không hợp lệ!";
      } else if (err.response?.status === 409) {
        errorMessage =
          err.response.data.error || "Cặp promotion-product đã tồn tại!";
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      }
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const availablePromotions = promotions.filter(
    (promo) => !usedPromotionIds.includes(promo.id) && promo.quantity > 0
  );

  const availableVariants = productVariants
    .filter((variant) => {
      if (usedVariantIds.includes(variant.id) || selectedVariantIds.includes(variant.id.toString())) {
        return false;
      }

      if (
        selectedPromotion?.min_price_threshold &&
        parseFloat(variant.price) < parseFloat(selectedPromotion.min_price_threshold)
      ) {
        return false;
      }

      if (selectedPromotion) {
        const price = parseFloat(variant.price);
        let finalPrice = price;
        if (selectedPromotion.discount_type === "percentage") {
          finalPrice = price * (1 - selectedPromotion.discount_value / 100);
        } else if (selectedPromotion.discount_type === "fixed") {
          finalPrice = price - selectedPromotion.discount_value;
        }
        if (finalPrice <= 0) {
          return false;
        }
      }

      return true;
    })
    .map((variant) => ({
      value: variant.id.toString(),
      label: `${variant.sku} (${variant.product?.name}) – ${parseFloat(
        variant.price
      ).toLocaleString("vi-VN")}₫`,
      price: parseFloat(variant.price) || 0,
    }));

  useEffect(() => {
    if (selectedPromotion?.discount_type === "percentage") {
      const prices = availableVariants.map((v) => v.price);
      const discountAmounts = prices.map(
        (price) => price * (selectedPromotion.discount_value / 100)
      );
      const maxDiscount = discountAmounts.length > 0 ? Math.max(...discountAmounts) : 0;
      setMaxDiscountValue(maxDiscount);
    } else {
      setMaxDiscountValue(
        selectedPromotion?.discount_type === "fixed"
          ? parseFloat(selectedPromotion.discount_value) || 0
          : 0
      );
    }
  }, [availableVariants, selectedPromotion]);

  const CustomOption = ({ innerProps, label, data }) => (
    <div
      {...innerProps}
      className="flex items-center px-2 py-1 hover:bg-gray-100 cursor-pointer"
    >
      <span>{data.name}</span>
      <span className={`ml-2 ${data.statusClass}`}>{data.status}</span>
      <span className="ml-2 text-gray-500">(Còn: {data.quantity})</span>
    </div>
  );

  const CustomSingleValue = ({ innerProps, label, data }) => (
    <div {...innerProps} className="flex items-center">
      <span>{data.name}</span>
      <span className={`ml-2 ${data.statusClass}`}>{data.status}</span>
      <span className="ml-2 text-gray-500">(Còn: {data.quantity})</span>
    </div>
  );

  const promotionOptions = availablePromotions.map((promo) => {
    const { status, className } = getPromotionStatus(
      promo.start_date,
      promo.end_date
    );
    return {
      value: promo.id,
      label: `${promo.name} (${status}, Còn: ${promo.quantity})`,
      name: promo.name,
      status,
      statusClass: className,
      quantity: promo.quantity,
    };
  });

  return (
    <div className="font mb-4">
      <style>
        {`
          .select__control {
            min-height: 48px;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            max-height: 120px;
            overflow-y: auto;
          }
          .select__multi-value {
            background-color: #e6f3ff;
            border-radius: 4px;
            color: #1a202c;
            font-size: 14px;
            margin: 2px;
            padding: 4px 8px;
          }
          .select__multi-value__remove {
            color: #e53e3e;
            cursor: pointer;
            margin-left: 4px;
          }
          .select__multi-value__remove:hover {
            color: #c53030;
          }
          .select__menu {
            z-index: 1000;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            max-height: 300px;
            width: 100% !important;
          }
          .select__option {
            padding: 10px;
            font-size: 14px;
          }
          .select__option--is-focused {
            background-color: #e6f3ff;
            color: #1a202c;
          }
          .select__option--is-selected {
            background-color: #bee3f8;
            font-weight: 500;
          }
        `}
      </style>
      <h4>Thêm khuyến mãi</h4>
      {isFetching && <div className="text-center">Đang tải dữ liệu...</div>}
      {isLoading && <div className="text-center">Đang xử lý...</div>}
      {!isFetching && (
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-3">
            <label className="form-label block text-sm font-medium text-gray-700 mb-1">
              Khuyến mãi *
            </label>
            <Select
              options={promotionOptions}
              className="basic-single-select"
              classNamePrefix="select"
              components={{
                Option: CustomOption,
                SingleValue: CustomSingleValue,
              }}
              onChange={(opt) => {
                const promo = promotions.find((p) => p.id === opt?.value) || null;
                setSelectedPromotionId(promo?.id || null);
                setValue("promotion_id", promo?.id || "");
                trigger("promotion_id");
                setSelectedVariantIds([]);
                setValue("product_variant_id", []);
                setSelectedPromotion(promo);
              }}
              placeholder="Chọn khuyến mãi..."
              isClearable
              isDisabled={promotionOptions.length === 0}
            />
            <input
              type="hidden"
              {...register("promotion_id", {
                required: "Vui lòng chọn khuyến mãi",
                validate: (value) =>
                  !isNaN(value) || "ID khuyến mãi không hợp lệ",
              })}
            />
            {errors.promotion_id && (
              <small className="text-danger text-red-600 text-sm">
                {errors.promotion_id.message}
              </small>
            )}
            {promotionOptions.length === 0 && (
              <small className="text-warning text-yellow-600 text-sm">
                Không có khuyến mãi nào khả dụng. Vui lòng tạo khuyến mãi mới
                hoặc kiểm tra các khuyến mãi đã sử dụng.
              </small>
            )}
            {selectedPromotion && (
              <div className="mt-2 text-sm text-gray-600">
                <p>
                  Số tiền giảm tối đa:{" "}
                  <strong>{maxDiscountValue.toLocaleString("vi-VN")}₫</strong>
                </p>
              </div>
            )}
          </div>

          <div className="mb-4">
            <label className="form-label block text-sm font-medium text-gray-700 mb-2">
              Chọn các biến thể sản phẩm * (Tìm kiếm và chọn liên tục nhiều biến thể)
            </label>
            <Select
              isMulti
              closeMenuOnSelect={false}
              options={availableVariants}
              className="basic-multi-select"
              classNamePrefix="select"
              onChange={(selectedOptions) => {
                const selectedIds = selectedOptions
                  ? selectedOptions.map((opt) => opt.value)
                  : [];
                const selectedPromotion = promotions.find(
                  (p) => p.id === parseInt(selectedPromotionId)
                );
                if (
                  selectedPromotion &&
                  selectedIds.length > selectedPromotion.quantity
                ) {
                  toast.error(
                    `Không thể chọn ${selectedIds.length} biến thể. Khuyến mãi chỉ còn ${selectedPromotion.quantity} lượt khả dụng.`
                  );
                  return;
                }
                setSelectedVariantIds(selectedIds);
                setValue("product_variant_id", selectedIds);
                trigger("product_variant_id");
                const newQuantities = {};
                selectedIds.forEach((id) => {
                  newQuantities[id] = variantQuantities[id] || 1;
                });
                setVariantQuantities(newQuantities);
              }}
              isDisabled={!selectedPromotionId || remainingQty <= 0}
              placeholder="Tìm kiếm và chọn liên tục nhiều biến thể (nhập SKU hoặc tên sản phẩm)..."
            />
            <input
              type="hidden"
              {...register("product_variant_id", {
                required: "Vui lòng chọn ít nhất một biến thể sản phẩm",
                validate: (value) =>
                  value && value.length > 0 && value.every((id) => !isNaN(id))
                    ? true
                    : "Vui lòng chọn ít nhất một biến thể sản phẩm hợp lệ",
              })}
            />
            {errors.product_variant_id && (
              <small className="text-danger text-red-600 text-sm mt-1">
                {errors.product_variant_id.message}
              </small>
            )}
            {availableVariants.length === 0 && selectedPromotionId && (
              <small className="text-warning text-yellow-600 text-sm mt-1">
                Không có biến thể nào khả dụng. Tất cả biến thể đã được sử dụng
                hoặc không đáp ứng yêu cầu giá tối thiểu.
              </small>
            )}
            <p className="text-xs text-gray-600 mt-2">
              Tìm kiếm bằng SKU hoặc tên sản phẩm để chọn liên tục nhiều biến thể. Nhấn vào tùy chọn để thêm hoặc xóa. Các biến thể đã chọn sẽ hiển thị bên dưới để nhập số lượng.{" "}
              {selectedPromotionId &&
                `Số lượng biến thể tối đa: ${remainingQty}`}
            </p>
          </div>

          {selectedVariantIds.length > 0 && (
            <div className="mt-6">
              <label className="form-label block mb-2 text-lg font-semibold text-gray-700">
                Nhập số lượng áp dụng cho từng biến thể:
              </label>
              <div className="overflow-x-auto border rounded shadow-sm">
                <table className="w-full table-auto text-sm text-left text-gray-800">
                  <thead className="bg-gray-100 sticky top-0 z-0">
                    <tr>
                      <th className="px-4 py-2 border text-center">#</th>
                      <th className="px-4 py-2 border">SKU</th>
                      <th className="px-4 py-2 border">Tên sản phẩm</th>
                      <th className="px-4 py-2 border text-center">Tồn kho</th>
                      <th className="px-4 py-2 border text-center">
                        Số lượng áp dụng
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedVariantIds.map((id, index) => {
                      const variant = productVariants.find(
                        (v) => v.id === parseInt(id)
                      );
                      const stock = variant?.stock || 1;

                      return (
                        <tr
                          key={id}
                          className="bg-white hover:bg-gray-50 transition"
                        >
                          <td className="px-4 py-2 border text-center">
                            {index + 1}
                          </td>
                          <td className="px-4 py-2 border">{variant?.sku || "N/A"}</td>
                          <td className="px-4 py-2 border">
                            {variant?.product?.name || "Tên SP không xác định"}
                          </td>
                          <td className="px-4 py-2 border text-center">
                            {stock}
                          </td>
                          <td className="px-4 py-2 border text-center">
                            <input
                              type="number"
                              min="1"
                              max={stock}
                              value={variantQuantities[id] || 1}
                              onWheel={(e) => e.target.blur()}
                              onKeyDown={(e) => {
                                const currentVal = variantQuantities[id] || 1;
                                if (e.key === "ArrowUp") {
                                  if (currentVal >= stock) {
                                    e.preventDefault();
                                    toast.warning(
                                      `Số lượng không được vượt quá tồn kho (${stock})!`
                                    );
                                  } else {
                                    setVariantQuantities((prev) => ({
                                      ...prev,
                                      [id]: currentVal + 1,
                                    }));
                                    e.preventDefault();
                                  }
                                }
                                if (e.key === "ArrowDown") {
                                  if (currentVal <= 1) {
                                    e.preventDefault();
                                    toast.warning("Số lượng tối thiểu là 1!");
                                  } else {
                                    setVariantQuantities((prev) => ({
                                      ...prev,
                                      [id]: currentVal - 1,
                                    }));
                                    e.preventDefault();
                                  }
                                }
                              }}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10);
                                if (isNaN(val) || val <= 0) {
                                  setVariantQuantities((prev) => ({
                                    ...prev,
                                    [id]: 1,
                                  }));
                                  toast.warning("Số lượng tối thiểu là 1!");
                                } else if (val > stock) {
                                  setVariantQuantities((prev) => ({
                                    ...prev,
                                    [id]: stock,
                                  }));
                                  toast.warning(
                                    `Số lượng không được vượt quá tồn kho (${stock})!`
                                  );
                                } else {
                                  setVariantQuantities((prev) => ({
                                    ...prev,
                                    [id]: val,
                                  }));
                                }
                              }}
                              className="border px-2 py-1 w-24 rounded text-center"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="mt-8 flex items-center gap-1">
            <button
              type="submit"
              disabled={isLoading || remainingQty <= 0}
              className={`bg-[#073272] text-white px-6 py-2 rounded hover:bg-[#052354] transition ${
                isLoading || remainingQty <= 0 ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isLoading ? "Đang thêm..." : "Thêm mới"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/admin/promotion-products/getAll")}
              className="bg-gray-200 text-gray-800 px-6 py-2 rounded hover:bg-gray-300 transition"
            >
              Quay lại
            </button>
          </div>
        </form>
      )}
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default PromotionProductForm;