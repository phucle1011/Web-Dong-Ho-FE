import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Constants from "../../../../Constants.jsx";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Select from "react-select";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const PromotionProductEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [productVariants, setProductVariants] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [usedVariantIds, setUsedVariantIds] = useState([]);
  const [existingVariantIds, setExistingVariantIds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [customFormState, setCustomFormState] = useState({
    product_variant_id: [],
  });
  const [variantPromotions, setVariantPromotions] = useState({});
  const [selectedPromotion, setSelectedPromotion] = useState(null);
  const [selectedVariantIds, setSelectedVariantIds] = useState([]);
  const [variantQuantities, setVariantQuantities] = useState({});
  const [maxDiscountValue, setMaxDiscountValue] = useState(0);
  const [isPromotionExpired, setIsPromotionExpired] = useState(false);
  // SỬA: Thêm state để theo dõi tổng số lượt và số lượt còn lại
  const [totalQuantities, setTotalQuantities] = useState(0);
  const [remainingQuota, setRemainingQuota] = useState(0);

  const {
    register,
    handleSubmit,
    setValue,
    trigger,
    formState: { errors },
  } = useForm();

  const getPromotionStatus = (startDate, endDate) => {
    if (!startDate || !endDate) return "Không xác định";
    try {
      const currentDate = new Date();
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return "Không xác định";
      }
      if (currentDate < start) return "Sắp bắt đầu";
      if (currentDate <= end) return "Đang diễn ra";
      return "Đã kết thúc";
    } catch (err) {
      console.error("Lỗi khi tính trạng thái khuyến mãi:", err);
      return "Không xác định";
    }
  };

  const getStatusDisplayName = (status) =>
    ({
      "Đang diễn ra": "Đang diễn ra",
      "Sắp bắt đầu": "Sắp bắt đầu",
      "Đã kết thúc": "Đã hết hạn",
      "Không xác định": "Vô hiệu hóa",
    }[status] || "Vô hiệu hóa");

  const getStatusBadgeClass = (status) =>
    ({
      "Đang diễn ra": "bg-green-100 text-green-800",
      "Sắp bắt đầu": "bg-blue-100 text-blue-800",
      "Đã kết thúc": "bg-red-100 text-red-800",
      "Không xác định": "bg-gray-200 text-gray-800",
    }[status] || "bg-gray-200 text-gray-800");

  const formatDiscountValue = (discountValue, discountType) => {
    if (discountValue === null || discountValue === undefined) return "-";
    try {
      const value = parseFloat(discountValue);
      if (isNaN(value)) return "-";
      return discountType === "percentage"
        ? `${value.toFixed(2)}%`
        : `${value.toLocaleString("vi-VN")} VNĐ`;
    } catch (err) {
      console.error("Lỗi khi định dạng discountValue:", err);
      return "-";
    }
  };

  const truncateProductName = (name, maxLength = 30) => {
    if (!name || typeof name !== "string") return "Không xác định";
    if (name.length <= maxLength) return name;
    return `${name.substring(0, maxLength)}...`;
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (!id || isNaN(id)) {
          throw new Error("ID khuyến mãi không hợp lệ!");
        }

        const [promoRes, variantRes, promotionProductsRes] = await Promise.all([
          axios.get(`${Constants.DOMAIN_API}/admin/promotions/ss/all`),
          axios.get(`${Constants.DOMAIN_API}/admin/product-variants`),
          axios.get(`${Constants.DOMAIN_API}/admin/promotion`),
        ]);

        const promoData = Array.isArray(promoRes.data.data)
          ? promoRes.data.data
          : [];
        if (!promoData.length) {
          throw new Error("Dữ liệu khuyến mãi không hợp lệ");
        }
        const sortedPromotions = promoData.sort((a, b) => {
          const statusA = getPromotionStatus(a.start_date, a.end_date);
          const statusB = getPromotionStatus(b.start_date, b.end_date);
          const order = {
            "Đang diễn ra": 1,
            "Sắp bắt đầu": 2,
            "Đã kết thúc": 3,
            "Không xác định": 4,
          };
          return order[statusA] - order[statusB];
        });
        setPromotions(sortedPromotions);

        const variants = Array.isArray(variantRes.data.data)
          ? variantRes.data.data
          : [];
        if (!variants.length) {
          throw new Error("Dữ liệu biến thể sản phẩm không hợp lệ");
        }
        setProductVariants(variants);

        const promotionProducts = Array.isArray(promotionProductsRes.data.data)
          ? promotionProductsRes.data.data
          : [];
        const usedIds = [
          ...new Set(
            promotionProducts
              .filter(
                (item) =>
                  item.product_variant_id && !isNaN(item.product_variant_id)
              )
              .map((item) => item.product_variant_id)
          ),
        ];
        setUsedVariantIds(usedIds);

        const promotionsByVariant = {};
        promotionProducts.forEach((item) => {
          if (item.product_variant_id && item.promotion) {
            promotionsByVariant[item.product_variant_id] = {
              promotion_id: item.promotion_id,
              name: item.promotion.name || "Không rõ tên",
              start_date: item.promotion.start_date,
              end_date: item.promotion.end_date,
              status: getPromotionStatus(
                item.promotion.start_date,
                item.promotion.end_date
              ),
              discount_value: item.promotion.discount_value,
              discount_type: item.promotion.discount_type,
            };
          }
        });
        variants.forEach((variant) => {
          if (!promotionsByVariant[variant.id]) {
            promotionsByVariant[variant.id] = null;
          }
        });
        setVariantPromotions(promotionsByVariant);
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu ban đầu:", err);
        setError(
          err.message || "Không thể tải dữ liệu ban đầu! Vui lòng thử lại."
        );
        toast.error(
          err.message || "Không thể tải dữ liệu ban đầu! Vui lòng thử lại."
        );
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  useEffect(() => {
    if (productVariants.length === 0 || !id || isNaN(id)) return;

    const fetchDetail = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await axios.get(
          `${Constants.DOMAIN_API}/admin/promotion?promotion_id=${id}`
        );
        const data = Array.isArray(res.data.data) ? res.data.data : [];

        if (!data.length) {
          throw new Error("Không tìm thấy dữ liệu khuyến mãi!");
        }

        const variantIds = data
          .filter((item) => item.product_variant_id)
          .map((item) => item.product_variant_id.toString());
        const quantities = {};
        data.forEach((item) => {
          if (item.product_variant_id) {
            const raw = item.variant_quantity;
            const val =
              raw === undefined || raw === null ? 0 : parseInt(raw, 10);
            quantities[item.product_variant_id] = Number.isNaN(val) ? 0 : val;
          }
        });

        setSelectedVariantIds(variantIds);
        setVariantQuantities(quantities);
        setExistingVariantIds(variantIds);
        setCustomFormState({ product_variant_id: variantIds });
        setValue("product_variant_id", variantIds);

        const promotion =
          promotions.find((p) => p.id === parseInt(id)) || data[0]?.promotion;
        if (!promotion) {
          throw new Error(`Không tìm thấy khuyến mãi với ID ${id}`);
        }

        const status = getPromotionStatus(
          promotion.start_date,
          promotion.end_date
        );
        setIsPromotionExpired(status === "Đã kết thúc");
        setSelectedPromotion({
          ...promotion,
          variant_count: promotion.variant_count || 0,
          min_price_threshold: parseFloat(promotion.min_price_threshold) || 0,
        });
        setValue("promotion_id", id.toString());

        // SỬA: Tính tổng số lượt và số lượt còn lại
        const total = Object.values(quantities).reduce(
          (sum, qty) => sum + (Number.isInteger(qty) ? qty : 0),
          0
        );
        setTotalQuantities(total);
        setRemainingQuota(
          promotion.quantity !== null && promotion.quantity !== undefined
            ? Math.max(0, promotion.quantity - total)
            : Infinity
        );

        trigger("product_variant_id");
      } catch (err) {
        console.error("Lỗi khi tải chi tiết khuyến mãi:", err);
        let errorMessage = "Không thể tải thông tin khuyến mãi!";
        if (err.response?.status === 404) {
          errorMessage = "Không tìm thấy dữ liệu khuyến mãi!";
        } else if (err.response?.status === 500) {
          errorMessage = "Lỗi server. Vui lòng thử lại!";
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        }
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetail();
  }, [productVariants, setValue, id, trigger, promotions]);

  useEffect(() => {
    if (
      existingVariantIds.length !== customFormState.product_variant_id.length ||
      existingVariantIds.some(
        (id, i) => id !== customFormState.product_variant_id[i]
      )
    ) {
      setCustomFormState({ product_variant_id: existingVariantIds });
      setValue("product_variant_id", existingVariantIds);
      trigger("product_variant_id");
    }
  }, [existingVariantIds, setValue, trigger]);

  // SỬA: Cập nhật totalQuantities và remainingQuota khi variantQuantities thay đổi
  useEffect(() => {
    const total = Object.values(variantQuantities).reduce(
      (sum, qty) => sum + (Number.isInteger(qty) ? qty : 0),
      0
    );
    setTotalQuantities(total);
    setRemainingQuota(
      selectedPromotion?.quantity !== null &&
        selectedPromotion?.quantity !== undefined
        ? Math.max(0, selectedPromotion.quantity - total)
        : Infinity
    );
  }, [variantQuantities, selectedPromotion]);

  const availableVariants = productVariants
    .filter((variant) => {
      if (existingVariantIds.includes(variant.id.toString())) {
        return true;
      }
      if (isPromotionExpired) {
        return false;
      }
      if (usedVariantIds.includes(variant.id)) {
        return false;
      }
      if (
        selectedPromotion?.min_price_threshold &&
        parseFloat(variant.price) <
          parseFloat(selectedPromotion.min_price_threshold)
      ) {
        return false;
      }
      if (selectedPromotion) {
        const price = parseFloat(variant.price) || 0;
        let finalPrice = price;
        if (selectedPromotion.discount_type === "percentage") {
          finalPrice =
            price * (1 - (selectedPromotion.discount_value || 0) / 100);
        } else if (selectedPromotion.discount_type === "fixed") {
          finalPrice = price - (selectedPromotion.discount_value || 0);
        }
        if (finalPrice <= 0) {
          return false;
        }
      }
      return true;
    })
    .map((variant) => ({
      value: variant.id.toString(),
      label: `${variant.sku || "N/A"} (${
        variant.product?.name || "Không xác định"
      }) – ${parseFloat(variant.price || 0).toLocaleString("vi-VN")}₫`,
      _price: parseFloat(variant.price) || 0,
    }));

  useEffect(() => {
    if (selectedPromotion?.discount_type === "percentage") {
      const prices = availableVariants.map((v) => v._price);
      const discountAmounts = prices.map(
        (price) => price * ((selectedPromotion.discount_value || 0) / 100)
      );
      const maxDiscount =
        discountAmounts.length > 0 ? Math.max(...discountAmounts) : 0;
      setMaxDiscountValue(maxDiscount);
    } else {
      setMaxDiscountValue(
        selectedPromotion?.discount_type === "fixed"
          ? parseFloat(selectedPromotion.discount_value) || 0
          : 0
      );
    }
  }, [availableVariants, selectedPromotion]);

  const onSubmit = async (formData) => {
    if (isPromotionExpired) {
      toast.error(
        "Khuyến mãi đã hết hạn sử dụng, không thể cập nhật khuyến mãi!"
      );
      return;
    }

    const selectedVariants = formData.product_variant_id || [];
    if (!selectedVariants.length) {
      toast.error("Vui lòng chọn ít nhất một biến thể sản phẩm!");
      return;
    }

    const selectedPromotion = promotions.find(
      (p) => p.id === parseInt(formData.promotion_id)
    );
    if (!selectedPromotion) {
      toast.error("Không tìm thấy thông tin khuyến mãi!");
      return;
    }

    const totalVariants = selectedVariants.length;
    if (
      selectedPromotion.quantity !== null &&
      selectedPromotion.quantity !== undefined &&
      totalVariants > selectedPromotion.quantity
    ) {
      toast.error(
        `Không thể chọn ${totalVariants} biến thể. Khuyến mãi chỉ cho phép tối đa ${selectedPromotion.quantity} biến thể.`
      );
      return;
    }

    // SỬA: Kiểm tra tổng variantQuantities trước khi gửi
    if (
      selectedPromotion.quantity !== null &&
      selectedPromotion.quantity !== undefined &&
      totalQuantities > selectedPromotion.quantity
    ) {
      toast.error(
        `Tổng số lượt áp dụng (${totalQuantities}) vượt quá giới hạn khuyến mãi (${selectedPromotion.quantity}).`
      );
      return;
    }

    const invalid = selectedVariantIds.filter((id) => {
      const q = parseInt(variantQuantities[id] ?? 0, 10);
      return Number.isNaN(q) || q < 0;
    });
    if (invalid.length) {
      const invalidNames = invalid
        .map((id) => {
          const variant = productVariants.find((v) => v.id === parseInt(id));
          return variant?.sku || id;
        })
        .join(", ");
      toast.error(
        `Vui lòng nhập số lượng hợp lệ (≥ 0) cho biến thể: ${invalidNames}`
      );
      return;
    }

    const usedVariantsInOther = selectedVariants.filter(
      (variantId) =>
        !existingVariantIds.includes(variantId) &&
        usedVariantIds.includes(parseInt(variantId))
    );

    if (usedVariantsInOther.length > 0) {
      const variantDetails = usedVariantsInOther
        .map((id) => {
          const variant = productVariants.find((v) => v.id === parseInt(id));
          return variant
            ? `${variant.sku || "N/A"} (${
                variant.product?.name || "Tên không xác định"
              })`
            : id;
        })
        .join(", ");
      const confirmAdd = window.confirm(
        `Các biến thể sau đã được sử dụng trong khuyến mãi khác: ${variantDetails}. Bạn có muốn xóa chúng khỏi các khuyến mãi khác và thêm vào khuyến mãi này không?`
      );
      if (!confirmAdd) return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const payload = {
        promotion_id: parseInt(id, 10),
        products: selectedVariantIds.map((variantId) => {
          const q = parseInt(variantQuantities[variantId] ?? 0, 10);
          return {
            product_variant_id: parseInt(variantId, 10),
            variant_quantity: Number.isNaN(q) ? 0 : q,
          };
        }),
      };

      console.log("Payload gửi đi:", payload);

      await axios.put(`${Constants.DOMAIN_API}/admin/promotion/${id}`, payload);

      setExistingVariantIds(selectedVariants);
      setCustomFormState({ product_variant_id: selectedVariants });
      setValue("product_variant_id", selectedVariants);

      toast.success("Cập nhật khuyến mãi thành công!");
      setTimeout(() => {
        navigate("/admin/promotion-products/getAll");
      }, 1000);
    } catch (err) {
      console.error("Lỗi khi gửi dữ liệu:", err);
      console.error("Response payload:", err.response?.data);
      let errorMessage = "Lỗi khi cập nhật khuyến mãi!";
      if (err.response?.status === 400) {
        errorMessage =
          err.response.data.message ||
          "Dữ liệu không hợp lệ! Vui lòng kiểm tra lại.";
      } else if (err.response?.status === 404) {
        errorMessage = "Không tìm thấy khuyến mãi để chỉnh sửa!";
      } else if (err.response?.status === 409) {
        errorMessage =
          "Một hoặc nhiều biến thể đã được sử dụng trong khuyến mãi khác!";
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card p-4">
      <style>
        {`
          .truncate-text {
            max-width: 200px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            position: relative;
          }
          .tooltip {
            visibility: hidden;
            background-color: #333;
            color: #fff;
            text-align: center;
            border-radius: 4px;
            padding: 8px;
            position: absolute;
            z-index: 10;
            top: 100%;
            left: 0;
            min-width: 200px;
            opacity: 0;
            transition: opacity 0.2s;
          }
          .truncate-text:hover .tooltip {
            visibility: visible;
            opacity: 1;
          }
          .react-select__control {
            min-height: 48px;
            border-radius: 8px;
            border: 2px solid #e2e8f0;
          }
          .react-select__multi-value {
            background-color: #e6f3ff;
            border-radius: 4px;
          }
          .react-select__multi-value__label {
            color: #1a202c;
          }
          .react-select__multi-value__remove {
            color: #e53e3e;
            cursor: pointer;
          }
          .react-select__multi-value__remove:hover {
            color: #c53030;
            background-color: #fed7d7;
          }
          .react-select__menu {
            z-index: 1000;
          }
        `}
      </style>
      <h4 className="text-xl font-semibold mb-4">Cập nhật khuyến mãi</h4>
      {isLoading && (
        <div className="text-center text-gray-600">Đang tải...</div>
      )}
      {error && (
        <div className="alert alert-danger bg-red-100 text-red-800 p-4 rounded mb-4">
          {error}
          <button
            className="btn btn-secondary ms-2 bg-gray-200 text-gray-800 px-4 py-2 rounded ml-2"
            onClick={() => navigate("/admin/promotion-products/getAll")}
          >
            Quay lại
          </button>
        </div>
      )}
      {!isLoading && !error && (
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-4">
            <label className="form-label block text-sm font-medium text-gray-700 mb-1">
              Khuyến mãi *
            </label>
            <select
              className="form-select w-full p-2 border rounded"
              {...register("promotion_id", {
                required: "Vui lòng chọn chương trình khuyến mãi",
              })}
              disabled
              value={id}
            >
              <option value="">-- Chọn khuyến mãi --</option>
              {promotions.map((promo) => (
                <option key={promo.id} value={promo.id.toString()}>
                  {promo.name} (
                  {getPromotionStatus(promo.start_date, promo.end_date)})
                </option>
              ))}
            </select>
            {errors.promotion_id && (
              <small className="text-danger text-red-600 text-sm">
                {errors.promotion_id.message}
              </small>
            )}
            {selectedPromotion && (
              <div className="mt-2 text-sm text-gray-600">
                <p>
                  Tên khuyến mãi:{" "}
                  <strong>{selectedPromotion.name || "Không xác định"}</strong>{" "}
                  (Trạng thái:{" "}
                  <span
                    className={`px-2 py-1 rounded ${getStatusBadgeClass(
                      getPromotionStatus(
                        selectedPromotion.start_date,
                        selectedPromotion.end_date
                      )
                    )}`}
                  >
                    {getStatusDisplayName(
                      getPromotionStatus(
                        selectedPromotion.start_date,
                        selectedPromotion.end_date
                      )
                    )}
                  </span>
                  )
                </p>
                <p>
                  Giảm giá:{" "}
                  <strong>
                    {formatDiscountValue(
                      selectedPromotion.discount_value,
                      selectedPromotion.discount_type
                    )}
                  </strong>
                </p>
                <p>
                  Số tiền giảm tối đa:{" "}
                  <strong>{maxDiscountValue.toLocaleString("vi-VN")}₫</strong>
                </p>
                <p>
                  Số lượng biến thể tối đa:{" "}
                  <strong>
                    {selectedPromotion.quantity === null ||
                    selectedPromotion.quantity === undefined
                      ? "Không giới hạn"
                      : selectedPromotion.quantity}
                  </strong>
                </p>
                {/* SỬA: Hiển thị số lượt còn lại */}
                <p>
                  Số lượt áp dụng còn lại:{" "}
                  <strong>
                    {remainingQuota === Infinity
                      ? "Không giới hạn"
                      : remainingQuota}
                  </strong>
                </p>
              </div>
            )}
            {isPromotionExpired && (
              <div className="alert alert-danger bg-red-100 text-red-800 p-4 rounded mt-3">
                Khuyến mãi đã hết hạn sử dụng, không thể cập nhật khuyến mãi!
              </div>
            )}
          </div>

          <div className="mb-4">
            <label className="form-label block text-sm font-medium text-gray-700 mb-2">
              Chọn các biến thể sản phẩm * (Tìm kiếm và chọn liên tục nhiều biến
              thể)
            </label>
            <Select
              isMulti
              closeMenuOnSelect={false}
              options={availableVariants}
              className="basic-multi-select"
              classNamePrefix="react-select"
              onChange={(selectedOptions) => {
                if (isPromotionExpired) return;
                const selectedIds = selectedOptions
                  ? selectedOptions.map((opt) => opt.value)
                  : [];
                if (
                  selectedPromotion &&
                  selectedPromotion.quantity !== null &&
                  selectedPromotion.quantity !== undefined &&
                  selectedIds.length > selectedPromotion.quantity
                ) {
                  toast.error(
                    `Không thể chọn ${selectedIds.length} biến thể. Khuyến mãi chỉ cho phép tối đa ${selectedPromotion.quantity} biến thể.`
                  );
                  return;
                }
                console.log("Selected Variant IDs:", selectedIds);
                setCustomFormState({ product_variant_id: selectedIds });
                setSelectedVariantIds(selectedIds);
                const newQuantities = {};
                selectedIds.forEach((id) => {
                  newQuantities[id] = Number.isInteger(variantQuantities[id])
                    ? variantQuantities[id]
                    : 0;
                });
                setVariantQuantities(newQuantities);
                setValue("product_variant_id", selectedIds);
                trigger("product_variant_id");
              }}
              value={availableVariants.filter((opt) =>
                selectedVariantIds.includes(opt.value)
              )}
              placeholder="Tìm kiếm và chọn liên tục nhiều biến thể (nhập SKU hoặc tên sản phẩm)..."
              formatOptionLabel={(opt) => (
                <div
                  style={{
                    opacity: opt.isDisabled ? 0.5 : 1,
                    display: "flex",
                    alignItems: "center",
                    padding: "4px",
                  }}
                >
                  <span style={{ flex: 1 }}>{opt.label}</span>
                  {usedVariantIds.includes(+opt.value) &&
                    !existingVariantIds.includes(opt.value) && (
                      <em className="ml-2 text-sm text-red-500">
                        (Đã dùng trong khuyến mãi khác)
                      </em>
                    )}
                  {opt._price <
                    (selectedPromotion?.min_price_threshold || 0) && (
                    <em className="ml-2 text-sm text-blue-500">
                      (Giá &lt;{" "}
                      {(
                        selectedPromotion?.min_price_threshold || 0
                      ).toLocaleString("vi-VN")}
                      ₫)
                    </em>
                  )}
                </div>
              )}
              isOptionDisabled={(opt) =>
                usedVariantIds.includes(+opt.value) &&
                !existingVariantIds.includes(opt.value)
              }
              isDisabled={isPromotionExpired}
              noOptionsMessage={() => "Không có biến thể nào khả dụng"}
              styles={{
                control: (base) => ({
                  ...base,
                  minHeight: "48px",
                  borderRadius: "8px",
                  border: errors.product_variant_id
                    ? "2px solid #e53e3e"
                    : "2px solid #e2e8f0",
                  "&:hover": {
                    borderColor: errors.product_variant_id
                      ? "#e53e3e"
                      : "#cbd5e0",
                  },
                }),
                multiValue: (base) => ({
                  ...base,
                  backgroundColor: "#e6f3ff",
                  borderRadius: "4px",
                }),
                multiValueLabel: (base) => ({
                  ...base,
                  color: "#1a202c",
                }),
                multiValueRemove: (base) => ({
                  ...base,
                  color: "#e53e3e",
                  ":hover": {
                    color: "#c53030",
                    backgroundColor: "#fed7d7",
                  },
                }),
                menu: (base) => ({
                  ...base,
                  zIndex: 1000,
                }),
              }}
            />
            {errors.product_variant_id && (
              <small className="text-danger text-red-600 text-sm mt-1">
                {errors.product_variant_id.message}
              </small>
            )}
            {availableVariants.length === 0 && !isPromotionExpired && (
              <small className="text-warning text-yellow-600 text-sm mt-1">
                Không có biến thể nào khả dụng. Tất cả biến thể đã được sử dụng
                hoặc không đáp ứng yêu cầu giá tối thiểu.
              </small>
            )}
            {availableVariants.length === 0 && isPromotionExpired && (
              <small className="text-warning text-yellow-600 text-sm mt-1">
                Khuyến mãi đã hết hạn, chỉ hiển thị các biến thể đã sử dụng
                trước đó.
              </small>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Tìm kiếm bằng SKU hoặc tên sản phẩm để chọn liên tục nhiều biến
              thể. Nhấn vào tùy chọn để thêm hoặc xóa. Các biến thể đã chọn sẽ
              hiển thị bên dưới để nhập số lượng.{" "}
              {selectedPromotion?.quantity !== null &&
              selectedPromotion?.quantity !== undefined
                ? `Số lượng biến thể tối đa: ${selectedPromotion.quantity}`
                : "Số lượng biến thể không giới hạn"}
            </p>
          </div>

          {selectedVariantIds.length > 0 && (
            <div className="mt-6">
              <label className="form-label block mb-2 text-lg font-semibold text-gray-700">
                Số lượng áp dụng cho từng biến thể:
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
                      const stock = variant?.stock || 0;
                      // SỬA: Tính max cho input dựa trên stock và remainingQuota
                      const maxInputValue = Math.min(
                        stock,
                        remainingQuota === Infinity
                          ? stock
                          : remainingQuota +
                              (Number.isInteger(variantQuantities[id])
                                ? variantQuantities[id]
                                : 0)
                      );

                      return (
                        <tr
                          key={id}
                          className="bg-white hover:bg-gray-50 transition"
                        >
                          <td className="px-4 py-2 border text-center">
                            {index + 1}
                          </td>
                          <td className="px-4 py-2 border">
                            {variant?.sku || "N/A"}
                          </td>
                          <td className="px-4 py-2 border">
                            <div className="truncate-text">
                              {truncateProductName(
                                variant?.product?.name ||
                                  "Tên SP không xác định"
                              )}
                              <span className="tooltip">
                                {variant?.product?.name ||
                                  "Tên SP không xác định"}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-2 border text-center">
                            {stock}
                          </td>
                          <td className="px-4 py-2 border text-center">
                            <input
                              type="number"
                              min="0"
                              max={maxInputValue} // SỬA: Thêm max dựa trên stock và remainingQuota
                              value={
                                Number.isInteger(variantQuantities[id])
                                  ? variantQuantities[id]
                                  : 0
                              }
                              onWheel={(e) => e.target.blur()}
                              onKeyDown={(e) => {
                                if (isPromotionExpired) {
                                  e.preventDefault();
                                  return;
                                }
                                const currentVal = Number.isInteger(
                                  variantQuantities[id]
                                )
                                  ? variantQuantities[id]
                                  : 0;
                                if (e.key === "ArrowUp") {
                                  const newVal = currentVal + 1;
                                  if (newVal > stock) {
                                    e.preventDefault();
                                    toast.warning(
                                      `Số lượng không được vượt quá tồn kho (${stock})!`
                                    );
                                  } else if (
                                    totalQuantities - currentVal + newVal >
                                    selectedPromotion.quantity
                                  ) {
                                    e.preventDefault();
                                    toast.warning(
                                      `Số lượt áp dụng không được vượt quá giới hạn khuyến mãi (${
                                        selectedPromotion.quantity
                                      })! Còn lại: ${remainingQuota} lượt.`
                                    );
                                  } else {
                                    setVariantQuantities((prev) => ({
                                      ...prev,
                                      [id]: newVal,
                                    }));
                                    e.preventDefault();
                                  }
                                }
                                if (e.key === "ArrowDown") {
                                  if (currentVal <= 0) {
                                    e.preventDefault();
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
                                if (isPromotionExpired) return;
                                const raw = e.target.value;
                                const val = raw === "" ? 0 : parseInt(raw, 10);
                                if (Number.isNaN(val) || val < 0) {
                                  setVariantQuantities((prev) => ({
                                    ...prev,
                                    [id]: 0,
                                  }));
                                } else {
                                  const otherQuantities = Object.entries(
                                    variantQuantities
                                  ).reduce(
                                    (sum, [vid, qty]) =>
                                      vid !== id && Number.isInteger(qty)
                                        ? sum + qty
                                        : sum,
                                    0
                                  );
                                  const newTotal = otherQuantities + val;
                                  if (
                                    selectedPromotion.quantity !== null &&
                                    selectedPromotion.quantity !== undefined &&
                                    newTotal > selectedPromotion.quantity
                                  ) {
                                    const maxAllowed = Math.max(
                                      0,
                                      selectedPromotion.quantity -
                                        otherQuantities
                                    );
                                    setVariantQuantities((prev) => ({
                                      ...prev,
                                      [id]: maxAllowed,
                                    }));
                                    toast.warning(
                                      `Số lượt áp dụng không được vượt quá giới hạn khuyến mãi (${
                                        selectedPromotion.quantity
                                      })! Đã đặt số lượng tối đa khả dụng: ${maxAllowed}.`
                                    );
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
                                }
                              }}
                              className="border px-2 py-1 w-24 rounded text-center"
                              disabled={isPromotionExpired}
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

          <div className="mt-8 flex items-center gap-2">
            <button
              type="submit"
              disabled={isLoading || isPromotionExpired}
              className={`bg-[#073272] text-white px-6 py-2 rounded hover:bg-[#052354] transition ${
                isLoading || isPromotionExpired
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
            >
              {isLoading ? "Đang cập nhật..." : "Cập nhật"}
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

export default PromotionProductEdit;