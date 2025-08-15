import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { decodeToken } from "../../Helpers/jwtDecode";
import Constants from "../../../../Constants";
import Compair from "../icons/Compair";
import QuickViewIco from "../icons/QuickViewIco";
import ThinLove from "../icons/ThinLove";
import ReactDOM from "react-dom";
import { FiShoppingCart } from "react-icons/fi";
import StarRating from "../StarRating";
import { notifyCartChanged } from "../cart/cartEvents";

export default function ProductCardStyleOne({ datas, type, onProductClick }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const dialogRef = useRef();
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedImage, setSelectedImage] = useState("");
  const [variantImages, setVariantImages] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [avgRating, setAvgRating] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);
  const navigate = useNavigate();

  const formatDiscountPercent = (original, sale) => {
    if (!original || sale >= original) return 0;
    const p = ((original - sale) / original) * 100;
    return p > 0 && p < 1 ? Number(p.toFixed(1)) : Math.round(p);
  };

  const getVariantLabel = (variant) => {
    if (!variant) return "";
    const byName = variant.name?.trim();
    const bySku = variant.sku?.trim();
    const byAttrs = Array.isArray(variant.attributeValues)
      ? variant.attributeValues
          .map((av) => av?.value)
          .filter(Boolean)
          .join(" / ")
      : "";
    return byName || bySku || byAttrs || "";
  };
  // thêm trên cùng file (cùng scope với component)
  const hydrateSelectedVariant = async (productId, variantId) => {
    try {
      const res = await axios.get(
        `${Constants.DOMAIN_API}/products/${productId}/variants`
      );
      const full = res.data?.product?.variants?.find((v) => v.id === variantId);
      return full || null;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  // Memoize product and variants
  const product = useMemo(() => datas || {}, [datas]);

  const representativeVariant = useMemo(() => {
    return product.representativeVariant || {};
  }, [product.representativeVariant]);

  const variants = useMemo(() => {
    return product.variants || [];
  }, [product.variants]);

  // Chỉ giữ biến thể KHÔNG đấu giá
  const visibleVariants = useMemo(
    () =>
      variants.filter(
        (v) =>
          !(v.isInAuction || v.isAuctionOnly === 1 || v.is_auction_only === 1)
      ),
    [variants]
  );

  useEffect(() => {
    if (variantImages.length > 0) {
      const safeIndex = Math.max(
        0,
        Math.min(currentImageIndex, variantImages.length - 1)
      );
      setSelectedImage(
        variantImages[safeIndex]?.image_url || "/images/no-image.jpg"
      );
    }
  }, [currentImageIndex, variantImages]);

  useEffect(() => {
    if (!product.id) return;

    // Initialize data from props
    // const sortedVariants = [...variants].sort((a, b) => {
    const sortedVariants = [...visibleVariants].sort((a, b) => {
      const aInAuc = !!a.isInAuction;
      const bInAuc = !!b.isInAuction;
      if (aInAuc !== bInAuc) {
        return aInAuc ? 1 : -1;
      }
      const aDisc = a.promotion?.discount_percent || 0;
      const bDisc = b.promotion?.discount_percent || 0;
      return bDisc - aDisc;
    });

    setVariantImages(sortedVariants[0]?.images || []);
    setSelectedImage(
      product.thumbnail ||
        sortedVariants[0]?.images[0]?.image_url ||
        "/images/no-image.jpg"
    );
    setAvgRating(parseFloat(product.averageRating) || 0);
    setRatingCount(parseInt(product.ratingCount) || 0);

    if (sortedVariants.length > 0) {
      const validVariants = sortedVariants.filter(
        (variant) =>
          parseInt(variant.stock) > 0 && parseFloat(variant.price) > 0
      );
      const firstValidVariant = validVariants[0] || sortedVariants[0];
      setSelectedVariant(firstValidVariant);
      setVariantImages(firstValidVariant.images || []);
      setSelectedImage(
        firstValidVariant.images[0]?.image_url ||
          product.thumbnail ||
          "/images/no-image.jpg"
      );
      setAvgRating(parseFloat(firstValidVariant.averageRating) || 0);
      setRatingCount(parseInt(firstValidVariant.ratingCount) || 0);
      checkWishlistStatus(firstValidVariant.id);
    } else {
      // Không có biến thể bán thường -> reset
      setSelectedVariant(null);
      setVariantImages([]);
      setSelectedImage(product.thumbnail || "/images/no-image.jpg");
    }
  }, [product, visibleVariants]);

  useEffect(() => {
    if (selectedVariant) {
      setAvgRating(parseFloat(selectedVariant.averageRating) || 0);
      setRatingCount(parseInt(selectedVariant.ratingCount) || 0);
      setVariantImages(selectedVariant.images || []);
      setSelectedImage(
        selectedVariant.images[0]?.image_url ||
          product.thumbnail ||
          "/images/no-image.jpg"
      );
    } else {
      setAvgRating(parseFloat(product.averageRating) || 0);
      setRatingCount(parseInt(product.ratingCount) || 0);
      setVariantImages([]);
      setSelectedImage(product.thumbnail || "/images/no-image.jpg");
    }
  }, [selectedVariant, product]);

  const totalStock = useMemo(
    () =>
      parseInt(product.total_stock) ||
      variants.reduce(
        (sum, variant) => sum + (parseInt(variant.stock) || 0),
        0
      ),
    [product, variants]
  );

  // Tổng tồn kho CÓ THỂ MUA (chỉ tính biến thể không đấu giá)
  const purchasableStock = useMemo(
    () => visibleVariants.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0),
    [visibleVariants]
  );

  const validVariants = useMemo(
    () =>
      visibleVariants.filter(
        (variant) =>
          parseInt(variant.stock) > 0 && parseFloat(variant.price) > 0
      ),
    [visibleVariants]
  );

  const priceInfo = useMemo(() => {
    const safe = (v) => {
      const n = parseFloat(v);
      return isNaN(n) ? 0 : n;
    };

    const original =
      safe(selectedVariant?.price) ||
      safe(representativeVariant?.price) ||
      safe(product.price) ||
      0;

    const sale =
      safe(selectedVariant?.final_price) ||
      safe(selectedVariant?.promotion?.discounted_price) ||
      safe(representativeVariant?.final_price) ||
      safe(representativeVariant?.promotion?.discounted_price) ||
      safe(product.promotion?.discounted_price) ||
      original;

    const discountAmount = Math.max(0, original - sale);
    const percentExact = original > 0 ? (discountAmount / original) * 100 : 0;

    // Hiển thị: nếu <1% thì giữ 1 số thập phân, còn lại làm tròn số nguyên
    const discountPercentDisplay =
      percentExact > 0 && percentExact < 1
        ? Number(percentExact.toFixed(1))
        : Math.round(percentExact);

    // const hasStock = totalStock > 0;
    const hasStock = purchasableStock > 0;
    const discountType =
      selectedVariant?.promotion?.discount_type ||
      representativeVariant?.promotion?.discount_type ||
      product?.promotion?.discount_type ||
      null;

    return {
      displayOriginalPrice: original,
      displayPrice: sale,
      hasStock,
      discountAmount,
      discountPercent: discountPercentDisplay, // <— dùng cái này để render
      discountType,
    };
  }, [selectedVariant, representativeVariant, product, totalStock]);

  const {
    displayPrice,
    displayOriginalPrice,
    hasStock,
    discountPercent,
    discountAmount,
    discountType,
  } = priceInfo;

  // sau các useMemo variants/visibleVariants/validVariants
const activeVariant = useMemo(
  () => selectedVariant || validVariants[0] || visibleVariants[0] || null,
  [selectedVariant, validVariants, visibleVariants]
);

useEffect(() => {
  if (!product.id) return;

  // Không còn biến thể bán thường → reset & thoát
  if (visibleVariants.length === 0) {
    setSelectedVariant(null);
    setVariantImages([]);
    setSelectedImage(product.thumbnail || "/images/no-image.jpg");
    return;
  }

  // Nếu selectedVariant không còn hợp lệ (vì bị lọc đấu giá), set sang biến thể khả dụng đầu tiên
  if (!selectedVariant || !visibleVariants.some(v => v.id === selectedVariant.id)) {
    const preferred = validVariants[0] || visibleVariants[0];
    setSelectedVariant(preferred);
    setVariantImages(preferred?.images || []);
    setSelectedImage(
      preferred?.images?.[0]?.image_url ||
      product.thumbnail ||
      "/images/no-image.jpg"
    );
    setAvgRating(parseFloat(preferred?.averageRating) || 0);
    setRatingCount(parseInt(preferred?.ratingCount) || 0);
    if (preferred?.id) checkWishlistStatus(preferred.id);
  }
}, [product.id, visibleVariants, validVariants, selectedVariant]);



  const thumbnail =
    selectedImage || product.thumbnail?.trim() || "/images/no-image.jpg";
  const productName =
    product.name?.trim() || product.title?.trim() || "Sản phẩm không tên";

  // sau dòng: const productName = product.name?.trim() || ...
  const variantLabel = useMemo(
    () => getVariantLabel(selectedVariant),
    [selectedVariant]
  );
  // Giới hạn độ dài tên sản phẩm khi hiển thị kèm biến thể
  const shortenText = (text, maxLength) => {
    if (!text) return "";
    return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
  };

  // Nếu có biến thể thì cắt ngắn tên sản phẩm, ví dụ chỉ giữ 40 ký tự
  const displayName = variantLabel
    ? `${shortenText(productName, 20)} - ${variantLabel}`
    : productName;

  const maxStock = 5;
  const stockPercentage =
    totalStock > 0 ? Math.min((totalStock / maxStock) * 100, 100) : 0;

  const handleAddToCart = async (variantId, quantity) => {
    if (selectedVariant?.isInAuction) {
      toast.error(
        "Sản phẩm đang trong phiên đấu giá, không thể thêm vào giỏ hàng."
      );
      return;
    }
    if (!variantId) {
      toast.error("Bạn chưa chọn biến thể sản phẩm.");
      return;
    }

    const token = localStorage.getItem("token");
    const decoded = decodeToken(token);
    const userId = decoded?.id;

    if (!token || !userId) {
      toast.error("Bạn cần đăng nhập để thêm sản phẩm vào giỏ hàng.");
      return;
    }

    try {
      const response = await axios.post(
        `${Constants.DOMAIN_API}/add-to-carts`,
        {
          userId,
          productVariantId: variantId,
          quantity,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      notifyCartChanged();
      toast.success("Đã thêm vào giỏ hàng thành công!");
    } catch (error) {
      if (error.response?.status === 400) {
        const message = error.response.data?.message || "";
        if (message.includes("Số lượng vượt quá tồn kho")) {
          const match = message.match(/\((\d+)\)/);
          const stock = match ? parseInt(match[1], 10) : null;
          toast.error(
            stock
              ? `Bạn đã có một số sản phẩm trong giỏ. Hiện chỉ còn ${stock} sản phẩm trong kho.`
              : message
          );
        } else {
          toast.error(message);
        }
      } else {
        toast.error("Có lỗi xảy ra khi thêm sản phẩm vào giỏ hàng.");
      }
    }
  };

  const addToCart = () => {
    const isAuction = selectedVariant?.isInAuction;
    if (visibleVariants.length > 0 && !selectedVariant) {
      toast.error("Vui lòng chọn biến thể trước khi thêm vào giỏ hàng");
      return;
    }
    if (quantity > (selectedVariant?.stock || totalStock)) {
      toast.error(
        `Chỉ còn ${selectedVariant?.stock || totalStock} sản phẩm trong kho`
      );
      return;
    }
    const variantToAdd =
      selectedVariant || (validVariants.length > 0 ? validVariants[0] : null);
    if (variantToAdd) {
      if (variantToAdd && !isAuction)
        handleAddToCart(variantToAdd.id, quantity);
    } else {
      toast.error("Không có biến thể hợp lệ để thêm vào giỏ hàng.");
    }
  };

  const description = product.description || "Không có mô tả";
  const maxLength = 80;
  const isLongDescription = description.length > maxLength;
  const truncatedDescription =
    isLongDescription && !isExpanded
      ? description.slice(0, maxLength) + "..."
      : description;

  // cập nhật handleVariantSelect để nếu thiếu attributeValues thì tự hydrate
  const handleVariantSelect = async (variant) => {
    if (!variant || selectedVariant?.id === variant.id || variant.stock <= 0)
      return;

    // nếu variant thiếu dữ liệu, gọi API để lấy đủ
    let next = variant;
    const needHydrate =
      !Array.isArray(variant.attributeValues) ||
      variant.attributeValues.length === 0;
    if (needHydrate) {
      const full = await hydrateSelectedVariant(product.id, variant.id);
      if (full) next = { ...variant, ...full };
    }

    setSelectedVariant(next);
    const newImages = next.images || [];
    setVariantImages(newImages);
    setSelectedImage(
      newImages.length > 0
        ? newImages[0].image_url || product.thumbnail
        : product.thumbnail
    );
    setAvgRating(parseFloat(next.averageRating || 0));
    setRatingCount(parseInt(next.ratingCount || 0));
    checkWishlistStatus(next.id);
    setCurrentImageIndex(0);
  };

  const checkWishlistStatus = async (variantId) => {
    const token = localStorage.getItem("token");
    const decoded = decodeToken(token);
    const userId = decoded?.id;

    if (!token || !userId) {
      setIsInWishlist(false);
      return;
    }

    try {
      const response = await axios.get(
        `${Constants.DOMAIN_API}/users/${userId}/wishlist`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const isInWishlist = response.data.data.some(
        (item) => item.product_variant_id === variantId
      );
      setIsInWishlist(isInWishlist);
    } catch (error) {
      setIsInWishlist(false);
      toast.error("Không thể kiểm tra trạng thái danh sách yêu thích.");
    }
  };

  const handleAddToWishlist = async () => {
    if (!selectedVariant) {
      toast.error("Vui lòng chọn biến thể sản phẩm.");
      return;
    }

    const token = localStorage.getItem("token");
    const decoded = decodeToken(token);
    const userId = decoded?.id;

    if (!token || !userId) {
      toast.error(
        "Bạn cần đăng nhập để thêm sản phẩm vào danh sách yêu thích."
      );
      return;
    }

    try {
      const response = await axios.post(`${Constants.DOMAIN_API}/wishlist`, {
        userId,
        productVariantId: selectedVariant.id,
      });
      toast.success(
        response.data.message || "Đã thêm vào danh sách yêu thích!"
      );
      setIsInWishlist(true);
      await checkWishlistStatus(selectedVariant.id);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        "Lỗi khi thêm vào danh sách yêu thích.";
      toast.error(errorMessage);
    }
  };

  const handleRemoveFromWishlist = async () => {
    if (!selectedVariant) {
      toast.error("Vui lòng chọn biến thể sản phẩm.");
      return;
    }

    const token = localStorage.getItem("token");
    const decoded = decodeToken(token);
    const userId = decoded?.id;

    if (!token || !userId) {
      toast.error(
        "Bạn cần đăng nhập để xóa sản phẩm khỏi danh sách yêu thích."
      );
      return;
    }

    try {
      const response = await axios.delete(
        `${Constants.DOMAIN_API}/users/${userId}/wishlist/${selectedVariant.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.info(response.data.message || "Đã xóa khỏi danh sách yêu thích!");
      setIsInWishlist(false);
      await checkWishlistStatus(selectedVariant.id);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        "Lỗi khi xóa khỏi danh sách yêu thích.";
      toast.error(errorMessage);
    }
  };

  function decodeHtml(html) {
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
  }

  const [expanded, setExpanded] = useState(false);
  const attributes = selectedVariant?.attributeValues || [];

  // cái này để lấy thuộc tính ra dialog
  // khi mở dialog: nếu selectedVariant chưa có attributeValues thì hydrate
  useEffect(() => {
    (async () => {
      if (!isQuickViewOpen || !product?.id || !selectedVariant?.id) return;
      const hasAttrs =
        Array.isArray(selectedVariant.attributeValues) &&
        selectedVariant.attributeValues.length > 0;
      if (hasAttrs) return;

      const full = await hydrateSelectedVariant(product.id, selectedVariant.id);
      if (full) {
        setSelectedVariant((prev) => ({ ...prev, ...full }));
        setVariantImages(full.images || []);
        setSelectedImage(
          full.images?.[0]?.image_url ||
            product.thumbnail ||
            "/images/no-image.jpg"
        );
        setAvgRating(parseFloat(full.averageRating || 0));
        setRatingCount(parseInt(full.ratingCount || 0));
      }
    })();
  }, [isQuickViewOpen, product?.id, selectedVariant?.id]);

  const QuickViewDialog = () =>
    isQuickViewOpen &&
    ReactDOM.createPortal(
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center min-h-screen z-50"
        onClick={() => setIsQuickViewOpen(false)}
      >
        <div
          ref={dialogRef}
          className="bg-white p-4 rounded-lg max-w-[600px] w-full max-h-[500px] relative grid grid-cols-2 gap-4 shadow-xl border border-gray-200 overflow-y-auto"
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "linear-gradient(135deg, #fff 0%, #f9f9f9 100%)",
            zIndex: 1000,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setIsQuickViewOpen(false)}
            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
          <div className="overflow-hidden mt-5 relative">
            <div className="w-full h-64 relative">
              <img
                src={thumbnail}
                alt={productName}
                className="w-full h-full object-contain rounded-lg shadow-sm transition-transform duration-300"
              />
              {variantImages.length > 1 && (
                <button
                  onClick={() =>
                    setCurrentImageIndex((prev) =>
                      prev === 0 ? variantImages.length - 1 : prev - 1
                    )
                  }
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/70 hover:bg-white text-gray-800 rounded-full p-1 shadow z-10"
                >
                  ◀
                </button>
              )}
              {variantImages.length > 1 && (
                <button
                  onClick={() =>
                    setCurrentImageIndex((prev) =>
                      prev === variantImages.length - 1 ? 0 : prev + 1
                    )
                  }
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/70 hover:bg-white text-gray-800 rounded-full p-1 shadow z-10"
                >
                  ▶
                </button>
              )}
            </div>
            {displayOriginalPrice > displayPrice && (
              <span className="absolute top-2 right-2 text-white text-xs font-semibold bg-qred px-2 py-1 rounded z-10">
                {discountType === "percentage"
                  ? `-${discountPercent}%`
                  : `-${Number(discountAmount).toLocaleString("vi-VN")}₫`}
              </span>
            )}

            <div className="grid grid-cols-4 gap-1.5 mt-5 max-h-28 overflow-y-auto">
              {variantImages.map((img) => (
                <div
                  key={img.id || img.image_url}
                  onClick={() => setSelectedImage(img.image_url)}
                  className={`w-[60px] h-[60px] p-1 border rounded-md cursor-pointer ${
                    selectedImage === img.image_url
                      ? "border-blue-500"
                      : "border-gray-200"
                  } hover:border-blue-400 transition-colors`}
                >
                  <img
                    src={img.image_url}
                    alt=""
                    className="w-full h-full object-contain"
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col space-y-3">
            <h2 className="text-lg font-semibold text-gray-800 line-clamp-2">
              {displayName}
            </h2>

            <div className="flex items-center gap-2 mb-2">
              <StarRating rating={avgRating} readOnly />
              <span className="text-sm text-gray-600"></span>
            </div>
            {visibleVariants.length > 0 && (
              <div>
                <span className="block text-xs font-medium text-gray-600 mb-1">
                  Biến thể:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {visibleVariants.map((variant) => {
                    const name = variant.name || variant.sku || "Unnamed";

                    // TÍNH GIÁ TRƯỚC
                    const originalPrice = Number(variant.price || 0);
                    const salePrice = Number(
                      variant.final_price ||
                        variant.promotion?.discounted_price ||
                        originalPrice
                    );

                    // SAU ĐÓ MỚI TÍNH KIỂU GIẢM VÀ %
                    const discountTypeOfVariant =
                      variant.promotion?.discount_type;
                    const percentOfVariant = formatDiscountPercent(
                      originalPrice,
                      salePrice
                    );

                    const inStock = variant.stock > 0;
                    const inAuction = variant.isInAuction;
                    const isSelected = selectedVariant?.id === variant.id;

                    return (
                      <button
                        key={variant.id}
                        className={`border rounded-md p-2 text-xs text-center transition relative ${
                          !inStock || inAuction
                            ? "border-gray-300 opacity-50 cursor-not-allowed text-gray-500"
                            : isSelected
                            ? "border-blue-500 bg-blue-50 text-gray-800"
                            : "border-gray-300 hover:bg-gray-100 text-gray-800"
                        }`}
                        onClick={() => {
                          if (inStock && !inAuction)
                            handleVariantSelect(variant);
                        }}
                        disabled={!inStock || inAuction}
                        title={
                          inAuction
                            ? "Biến thể đang trong phiên đấu giá"
                            : undefined
                        }
                      >
                        <p className="font-medium">{name}</p>
                        <p className="text-qred font-semibold">
                          {salePrice.toLocaleString("vi-VN")}₫
                        </p>

                        {salePrice < originalPrice && (
                          <div className="flex items-center justify-center space-x-1">
                            <p className="text-qgray line-through text-[10px]">
                              {originalPrice.toLocaleString("vi-VN")}₫
                            </p>
                            <span className="text-white text-[10px] font-semibold bg-qred px-1 rounded">
                              {discountTypeOfVariant === "percentage"
                                ? `-${percentOfVariant}%`
                                : `-${(
                                    originalPrice - salePrice
                                  ).toLocaleString("vi-VN")}₫`}
                            </span>
                          </div>
                        )}

                        <p className="text-[10px] font-medium">
                          {inAuction
                            ? "Sản phẩm đang trong phiên đấu giá"
                            : inStock
                            ? `Còn: ${variant.stock}`
                            : "Hết hàng"}
                        </p>
                      </button>
                    );
                  })}
                </div>
                {attributes.length > 0 && (
                  <div className="mt-2">
                    <span className="block text-xs font-medium text-gray-600 mb-1">
                      Thuộc tính biến thể đã chọn
                    </span>

                    <table className="w-full text-[12px] border border-gray-200 rounded">
                      <tbody>
                        {(expanded ? attributes : attributes.slice(0, 4)).map(
                          (av, i) => (
                            <tr key={i} className="border-t">
                              <td className="px-2 py-1 text whitespace-nowrap">
                                <b>{av?.attribute?.name || "-"}</b>
                              </td>
                              <td className="px-2 py-1  break-words">
                                {av?.value || "-"}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>

                    {attributes.length > 4 && (
                      <button
                        className="mt-1 text-dark-600 hover:underline text-[12px]"
                        onClick={() => setExpanded((v) => !v)}
                      >
                        {expanded
                          ? "Thu gọn"
                          : `Xem thêm ${attributes.length - 4}`}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center space-x-2">
              {hasStock ? (
                <div className="price-container flex flex-col gap-1">
                  <span className="text-qred font-semibold text-[18px]">
                    {displayPrice.toLocaleString("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    })}
                  </span>
                  {displayOriginalPrice > displayPrice && (
                    <span className="text-qgray line-through text-[16px]">
                      {displayOriginalPrice.toLocaleString("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      })}
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-qred font-600 text-[16px]">
                  Sản phẩm hết hàng
                </p>
              )}
            </div>
            {hasStock && (
              <div className="flex items-center space-x-2">
                <button
                  className="px-1.5 py-0.5 bg-gray-200 rounded text-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    const scrollTop = dialogRef.current?.scrollTop;
                    setQuantity((prev) => Math.max(1, prev - 1));
                    setTimeout(() => {
                      if (dialogRef.current)
                        dialogRef.current.scrollTop = scrollTop;
                    }, 0);
                  }}
                  disabled={quantity <= 1 || !hasStock}
                >
                  -
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => {
                    const scrollTop = dialogRef.current?.scrollTop;
                    setQuantity(
                      Math.max(
                        1,
                        Math.min(
                          selectedVariant?.stock || totalStock,
                          Number(e.target.value)
                        )
                      )
                    );
                    setTimeout(() => {
                      if (dialogRef.current)
                        dialogRef.current.scrollTop = scrollTop;
                    }, 0);
                  }}
                  className="w-12 text-center border border-gray-300 rounded text-sm"
                  min="1"
                  max={selectedVariant?.stock || totalStock}
                  disabled={!hasStock}
                  onClick={(e) => e.stopPropagation()}
                />
                <button
                  className="px-1.5 py-0.5 bg-gray-200 rounded text-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    const scrollTop = dialogRef.current?.scrollTop;
                    setQuantity((prev) =>
                      Math.min(selectedVariant?.stock || totalStock, prev + 1)
                    );
                    setTimeout(() => {
                      if (dialogRef.current)
                        dialogRef.current.scrollTop = scrollTop;
                    }, 0);
                  }}
                  disabled={
                    quantity >= (selectedVariant?.stock || totalStock) ||
                    !hasStock
                  }
                >
                  +
                </button>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={addToCart}
                className={`flex-1 py-2 bg-blue-600 text-white text-sm font-medium rounded uppercase tracking-wide hover:bg-blue-700 transition-colors duration-200 ${
                  !hasStock ||
                  (visibleVariants.length > 0 && !selectedVariant) ||
                  selectedVariant?.isInAuction
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
                disabled={
                  !hasStock ||
                  (visibleVariants.length > 0 && !selectedVariant) ||
                  selectedVariant?.isInAuction
                }
                title={
                  selectedVariant?.isInAuction
                    ? "Biến thể đang trong phiên đấu giá"
                    : undefined
                }
              >
                <FiShoppingCart size={18} className="inline mr-2" />
                Thêm giỏ hàng
              </button>
              <button
                onClick={
                  isInWishlist ? handleRemoveFromWishlist : handleAddToWishlist
                }
                className="px-3 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                <ThinLove
                  className="w-5 h-5 inline"
                  fill={isInWishlist ? "#FF0000" : "none"}
                  stroke={isInWishlist ? "#FF0000" : "#000000"}
                />
              </button>
            </div>
          </div>
        </div>
      </div>,
      document.body
    );

  // Ẩn hoàn toàn card nếu không có biến thể bán thường
  if (!product.id || visibleVariants.length === 0) {
    return null;
  }

  const handleNavigate = (e) => {
    if (!product.id) {
      e.preventDefault();
      toast.error("Sản phẩm không hợp lệ!");
      return;
    }
    navigate("/product", {
      state: {
        productId: product.id,
      },
    });
  };

  return (
    <div
      className="product-card-one w-full h-full bg-white relative group overflow-hidden"
      style={{ boxShadow: "0px 15px 64px 0px rgba(0, 0, 0, 0.05)" }}
    >
      <div className="product-card-img w-full h-[300px] overflow-hidden relative">
        <div className="w-full h-full flex items-center justify-center">
          <img
            src={thumbnail}
            alt={displayName}
            className="max-w-full max-h-full object-contain"
          />
        </div>
        {discountPercent > 0 && displayOriginalPrice > displayPrice && (
          <span className="absolute top-2 right-2 text-white text-xs font-semibold bg-qred px-2 py-1 rounded z-10 sm:text-sm sm:px-3 sm:py-1.5">
            {discountType === "percentage"
              ? `-${discountPercent}%`
              : `-${Number(discountAmount).toLocaleString("vi-VN")}₫`}
          </span>
        )}
      </div>
      <div className="product-card-details px-[30px] pb-[30px] relative min-h-[150px]">
        <div className="absolute w-full h-10 px-[30px] left-0 top-40 group-hover:top-[85px] transition-all duration-300 ease-in-out z-10"></div>
        <div className="absolute w-full h-10 px-[30px] left-0 top-40 group-hover:top-[85px] transition-all duration-300 ease-in-out z-10">
          <button
            type="button"
            className={`bg-blue-600 hover:bg-blue-700 text-white w-full h-full flex items-center justify-center gap-2 ${
              !hasStock ||
              (visibleVariants.length > 0 && !selectedVariant) ||
              selectedVariant?.isInAuction
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
            disabled={
              !hasStock ||
              (visibleVariants.length > 0 && !selectedVariant) ||
              selectedVariant?.isInAuction
            }
            title={
              selectedVariant?.isInAuction
                ? "Biến thể đang trong phiên đấu giá, không thể thêm vào giỏ hàng"
                : undefined
            }
            onClick={addToCart}
          >
            <FiShoppingCart size={18} />
            THÊM GIỎ HÀNG
          </button>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <StarRating rating={avgRating} readOnly />
          <span className="text-sm text-gray-600"></span>
        </div>

        <p
          className="title mb-2 text-[15px] font-600 text-qblack leading-[24px] line-clamp-2 hover:text-blue-600 cursor-pointer"
          onClick={handleNavigate}
        >
          {displayName.replace(/ - /, " (") +
            (displayName.includes(" - ") ? ")" : "")}
        </p>

        <div className="price-container-wrapper group-hover:hidden transition-opacity duration-300">
          {hasStock ? (
            <div className="price-container flex flex-col gap-1">
              <div className="price flex items-center space-x-2">
                <span
                  className={`${
                    displayOriginalPrice > displayPrice
                      ? "text-qred"
                      : "text-qblack"
                  } font-600 text-[18px]`}
                >
                  {Number(displayPrice).toLocaleString("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  })}
                </span>
                {displayOriginalPrice > displayPrice && (
                  <div className="flex flex-col">
                    <span className="text-qgray line-through font-600 text-[16px]">
                      {Number(displayOriginalPrice).toLocaleString("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-qred font-600 text-[16px]">Sản phẩm hết hàng</p>
          )}
        </div>
      </div>
      <div className="quick-access-btns flex flex-col space-y-2 absolute group-hover:right-4 -right-10 top-20 transition-all duration-300 ease-in-out">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setIsQuickViewOpen(true);
          }}
        >
          <span className="w-10 h-10 flex justify-center items-center bg-primarygray rounded">
            <QuickViewIco className="w-5 h-5" />
          </span>
        </a>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            isInWishlist ? handleRemoveFromWishlist() : handleAddToWishlist();
          }}
        >
          <span className="w-10 h-10 flex justify-center items-center bg-primarygray rounded">
            <ThinLove
              className="w-5 h-5"
              fill={isInWishlist ? "#FF0000" : "none"}
              stroke={isInWishlist ? "#FF0000" : "#000000"}
            />
          </span>
        </a>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            const allVariants = variants.map((variant) => ({
              productId: product.id,
              productName: product.name,
              productDescription: product.description,
              productThumbnail: product.thumbnail,
              brand: product.brand?.name || "-",
              averageRating: product.averageRating,
              ratingCount: product.ratingCount,
              variantId: variant.id,
              price: variant.price,
              stock: variant.stock,
              sku: variant.sku,
              images: variant.images,
              attributeValues: variant.attributeValues,
            }));
            const clickedVariant = allVariants.find(
              (v) =>
                v.productId === product.id &&
                v.variantId === (selectedVariant?.id || variants?.[0]?.id)
            );
            if (!clickedVariant) {
              toast.error("Sản phẩm không có biến thể hợp lệ để so sánh.");
              return;
            }
            const current =
              JSON.parse(localStorage.getItem("compareList")) || [];
            const exists = current.find(
              (item) => item.variantId === clickedVariant.variantId
            );
            if (!exists) {
              const updated = [...current, clickedVariant].slice(0, 4);
              localStorage.setItem("compareList", JSON.stringify(updated));
              toast.success("Đã thêm sản phẩm vào so sánh!");
            } else {
              toast.info("Sản phẩm đã có trong danh sách so sánh!");
            }
            navigate("/products-compaire");
          }}
        >
          <span className="w-10 h-10 flex justify-center items-center bg-primarygray rounded">
            <Compair className="w-5 h-5" />
          </span>
        </a>
      </div>
      <QuickViewDialog />
    </div>
  );
}
