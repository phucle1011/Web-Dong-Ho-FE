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
  const [isLoadingAttributes, setIsLoadingAttributes] = useState(false);
  const navigate = useNavigate();




  // Cache theo khóa `${productId}:${variantId}`
const hydrateCacheRef = useRef(new Map());
// Theo dõi request đang bay để dedupe/hủy
const inflightRef = useRef(new Map());
// Chống spam toast lỗi hydrate
const lastHydrateErrorAtRef = useRef(0);

// sleep util
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));


  const product = useMemo(() => datas || {}, [datas]);
  const representativeVariant = useMemo(() => {
    return product.representativeVariant || {};
  }, [product.representativeVariant]);

  const variants = useMemo(() => {
    return product.variants || [];
  }, [product.variants]);

  const visibleVariants = useMemo(
    () =>
      variants.filter(
        (v) =>
          !(v.isInAuction || v.isAuctionOnly === 1 || v.is_auction_only === 1)
      ),
    [variants]
  );

  // Ưu tiên rating của variant, nếu thiếu thì lấy của product
  const resolveRatings = (variant, product) => {
    const vAvg = Number(variant?.averageRating);
    const vCnt = Number(variant?.ratingCount);
    const pAvg = Number(product?.averageRating);
    const pCnt = Number(product?.ratingCount);

    const avg =
      Number.isFinite(vAvg) && vAvg > 0
        ? vAvg
        : Number.isFinite(pAvg) && pAvg > 0
        ? pAvg
        : 0;
    const cnt =
      Number.isFinite(vCnt) && vCnt > 0
        ? vCnt
        : Number.isFinite(pCnt) && pCnt > 0
        ? pCnt
        : 0;

    return { avg, cnt };
  };

  useEffect(() => {
    (async () => {
      if (!product?.id || !selectedVariant?.id) return;

      // Nếu variant đang chọn chưa có rating hoặc = 0, thì hydrate
      const noVariantRatings =
        !(
          Number.isFinite(Number(selectedVariant.averageRating)) &&
          Number(selectedVariant.averageRating) > 0
        ) ||
        !(
          Number.isFinite(Number(selectedVariant.ratingCount)) &&
          Number(selectedVariant.ratingCount) > 0
        );

      if (noVariantRatings) {
        const full = await hydrateSelectedVariant(
          product.id,
          selectedVariant.id
        );
        if (full) {
          setSelectedVariant((prev) => ({ ...prev, ...full }));
          // Đồng bộ ảnh/thumbnail nếu cần
          setVariantImages(full.images || []);
          setSelectedImage(
            full.images?.[0]?.image_url ||
              product.thumbnail ||
              "/images/no-image.jpg"
          );
          // Cập nhật rating cho card
          const { avg, cnt } = resolveRatings(full, product);
          setAvgRating(avg);
          setRatingCount(cnt);
        } else {
          // Fallback về rating cấp sản phẩm để card vẫn có số sao
          const { avg, cnt } = resolveRatings(selectedVariant, product);
          setAvgRating(avg);
          setRatingCount(cnt);
        }
      } else {
        // Variant đã có rating -> set luôn cho card
        const { avg, cnt } = resolveRatings(selectedVariant, product);
        setAvgRating(avg);
        setRatingCount(cnt);
      }
    })();
  }, [product?.id, selectedVariant?.id]);

  const formatDiscountPercent = (original, sale) => {
    const o = Number(original) || 0;
    const s = Number(sale) || 0;
    if (o <= 0 || s >= o) return 0;
    const exact = ((o - s) / o) * 100;
    if (exact < 1) {
      const oneDecimal = Math.round(exact * 10) / 10;
      return oneDecimal === 0 ? 0.1 : oneDecimal;
    }
    return Math.round(exact);
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

const hydrateSelectedVariant = async (productId, variantId) => {
  if (!productId || !variantId) {
    // Không toast ở đây để tránh spam
    return null;
  }

  const key = `${productId}:${variantId}`;
  // Cache hit
  if (hydrateCacheRef.current.has(key)) {
    return hydrateCacheRef.current.get(key);
  }
  // Dedupe: nếu đã có request đang chạy, chờ nó
  if (inflightRef.current.has(key)) {
    try {
      return await inflightRef.current.get(key);
    } catch {
      return null;
    }
  }

  // Tạo abort controller để hủy khi variant thay đổi
  const controller = new AbortController();

  const run = (async () => {
    const MAX_ATTEMPTS = 3;
    // Tăng dần timeout: 5s -> 7.5s -> 10s
    const baseTimeouts = [5000, 7500, 10000];

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${Constants.DOMAIN_API}/products/getallnew`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          timeout: baseTimeouts[attempt - 1],
          signal: controller.signal,
        });

        const responseProduct = res.data?.data?.find((p) => p.id === productId);
        const variant = responseProduct?.variants?.find((v) => v.id === variantId);

        if (!responseProduct || !variant) {
          // Không cache null; kết thúc sớm
          return null;
        }

        const fullVariant = {
          ...variant,
          attributeValues: Array.isArray(variant.attributeValues)
            ? variant.attributeValues.map((av) => ({
                value: av.value || "",
                attribute: { name: av.attribute?.name || "", ...av.attribute },
              }))
            : [],
          images: Array.isArray(variant.images) ? variant.images : [],
          price: parseFloat(variant.price) || 0,
          stock: parseInt(variant.stock) || 0,
          averageRating: parseFloat(variant.averageRating) || 0,
          ratingCount: parseInt(variant.ratingCount) || 0,
          promotion: variant.promotion || null,
        };

        // Cache kết quả tốt
        hydrateCacheRef.current.set(key, fullVariant);
        return fullVariant;
      } catch (e) {
        // Nếu bị abort do state đổi, dừng luôn
        if (axios.isCancel?.(e) || e?.name === "CanceledError") return null;

        const isTimeout =
          e?.code === "ECONNABORTED" ||
          e?.message?.toLowerCase?.().includes("timeout");

        // Attempt tiếp theo với backoff
        if (attempt < MAX_ATTEMPTS && (isTimeout || e?.response?.status >= 500)) {
          await sleep(250 * attempt); // backoff nhẹ
          continue;
        }

        // Chỉ hiển thị toast nếu lần lỗi cuối cùng cách >= 4s để tránh spam
        const now = Date.now();
        if (now - lastHydrateErrorAtRef.current > 4000) {
          lastHydrateErrorAtRef.current = now;
          toast.error("Không thể tải thông tin biến thể, sẽ dùng dữ liệu mặc định.");
        }

        return null;
      }
    }
    return null;
  })();

  inflightRef.current.set(key, run);

  const result = await run.finally(() => {
    inflightRef.current.delete(key);
  });

  return result;
};


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

    const sortedVariants = [...visibleVariants].sort((a, b) => {
      const aInAuc = !!a.isInAuction;
      const bInAuc = !!b.isInAuction;
      if (aInAuc !== bInAuc) return aInAuc ? 1 : -1;
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

      // Dùng resolveRatings thay vì set thủ công
      const { avg, cnt } = resolveRatings(firstValidVariant, product);
      setAvgRating(avg);
      setRatingCount(cnt);

      checkWishlistStatus(firstValidVariant.id);
    } else {
      setSelectedVariant(null);
      setVariantImages([]);
      setSelectedImage(product.thumbnail || "/images/no-image.jpg");
    }
  }, [product, visibleVariants]);

  useEffect(() => {
    if (selectedVariant) {
    const { avg, cnt } = resolveRatings(selectedVariant, product);
setAvgRating(avg);
setRatingCount(cnt);

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

  const toNum = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const computePricing = (variant) => {
    const original = Math.max(0, toNum(variant?.price));
    const pm = variant?.promotion || null;

    const finalFromVariant = toNum(variant?.final_price);
    const discountedFromPm = toNum(pm?.discounted_price);
    const discountType = pm?.discount_type || pm?.type || null;

    let sale;

    if (finalFromVariant > 0 && original > 0) {
      sale = finalFromVariant;
    } else if (discountedFromPm > 0 && original > 0) {
      sale = discountedFromPm;
    } else if (pm && original > 0) {
      if (discountType === "percentage" || discountType === "percent") {
        const pct = Math.max(
          0,
          Math.min(
            100,
            toNum(pm?.discount_percent ?? pm?.discountPercent ?? pm?.percentage)
          )
        );
        sale = original * (1 - pct / 100);
      } else if (
        discountType === "amount" ||
        discountType === "fixed" ||
        discountType === "fixed_amount" ||
        discountType === "currency"
      ) {
        sale =
          original -
          Math.max(0, toNum(pm?.discount_amount ?? pm?.amount ?? pm?.value));
      } else {
        sale = original;
      }
    } else {
      sale = original;
    }

    sale = Math.max(0, Math.min(sale, original));
    const discountAmount = Math.max(0, original - sale);
    const percentExact = original > 0 ? (discountAmount / original) * 100 : 0;

    let discountPercent;
    if (percentExact <= 0) discountPercent = 0;
    else if (percentExact < 1) {
      const one = Math.round(percentExact * 10) / 10;
      discountPercent = one === 0 ? 0.1 : one;
    } else {
      discountPercent = Math.round(percentExact);
    }

    return {
      original,
      sale,
      discountAmount,
      discountPercent,
      discountType,
    };
  };

  const betterDeal = (a, b) => {
  if (!a) return b;
  if (!b) return a;
  const pa = computePricing(a);
  const pb = computePricing(b);
  if (pa.discountPercent !== pb.discountPercent) {
    return pa.discountPercent > pb.discountPercent ? a : b;
  }
  if (pa.discountAmount !== pb.discountAmount) {
    return pa.discountAmount > pb.discountAmount ? a : b;
  }
  if (pa.sale !== pb.sale) {
    return pa.sale < pb.sale ? a : b;
  }
  const aStock = parseInt(a.stock) || 0;
  const bStock = parseInt(b.stock) || 0;
  return aStock >= bStock ? a : b;
};

const bestDealVariant = useMemo(() => {
  if (validVariants.length === 0) return null;
  return validVariants.reduce((best, v) => betterDeal(best, v), null);
}, [validVariants]);

const hasAutoPickedRef = useRef(false);
useEffect(() => {
  // Reset khóa khi đổi product
  hasAutoPickedRef.current = false;
}, [product?.id]);


  const priceInfo = useMemo(() => {
    const baseVariant = selectedVariant || representativeVariant || {};
    const { original, sale, discountAmount, discountType, discountPercent } =
      computePricing(baseVariant);
    const hasStock = purchasableStock > 0;

    return {
      displayOriginalPrice: original,
      displayPrice: sale,
      hasStock,
      discountAmount,
      discountPercent,
      discountType,
    };
  }, [selectedVariant, representativeVariant, purchasableStock]);

  const {
    displayPrice,
    displayOriginalPrice,
    hasStock,
    discountPercent,
    discountAmount,
    discountType,
  } = priceInfo;

  const activeVariant = useMemo(
    () => selectedVariant || validVariants[0] || visibleVariants[0] || null,
    [selectedVariant, validVariants, visibleVariants]
  );

useEffect(() => {
  if (!product.id) return;

  if (visibleVariants.length === 0) {
    setSelectedVariant(null);
    setVariantImages([]);
    setSelectedImage(product.thumbnail || "/images/no-image.jpg");
    const { avg, cnt } = resolveRatings(null, product);
    setAvgRating(avg);
    setRatingCount(cnt);
    return;
  }

  // Ảnh cover nhẹ
  const coverImages = bestDealVariant?.images || visibleVariants[0]?.images || [];
  setVariantImages(coverImages);
  setSelectedImage(
    product.thumbnail ||
      coverImages?.[0]?.image_url ||
      "/images/no-image.jpg"
  );

  // Chỉ auto-pick 1 lần cho mỗi product
  if (!selectedVariant && !hasAutoPickedRef.current) {
    hasAutoPickedRef.current = true;
    const toPick = bestDealVariant || validVariants[0] || visibleVariants[0];
    setSelectedVariant(toPick);
    const { avg, cnt } = resolveRatings(toPick, product);
    setAvgRating(avg);
    setRatingCount(cnt);
    if (toPick?.id) checkWishlistStatus(toPick.id);
  }
}, [product, visibleVariants, validVariants, bestDealVariant, selectedVariant]);


  const shortenText = (text, maxLength) => {
    if (!text) return "";
    return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
  };

  

const thumbnail =
  selectedImage || product.thumbnail?.trim() || "/images/no-image.jpg";

const productName =
  product.name?.trim() || product.title?.trim() || "Sản phẩm không tên";

const variantLabel = useMemo(() => getVariantLabel(selectedVariant), [selectedVariant]);

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
          headers: { Authorization: `Bearer ${token}` },
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
    if (variantToAdd && !isAuction) {
      handleAddToCart(variantToAdd.id, quantity);
    } else {
      toast.error("Không có biến thể hợp lệ để thêm vào giỏ hàng.");
    }
  };

  const handleVariantSelect = async (variant) => {
    if (!variant || selectedVariant?.id === variant.id || variant.stock <= 0)
      return;

    let next = variant;
    const needHydrate =
      !Array.isArray(variant.attributeValues) ||
      variant.attributeValues.length === 0;

    if (needHydrate) {
      setIsLoadingAttributes(true);
      const full = await hydrateSelectedVariant(product.id, variant.id);
      setIsLoadingAttributes(false);
      if (full) next = { ...variant, ...full };
      else return;
    }

    setSelectedVariant(next);
    const newImages = next.images || [];
    setVariantImages(newImages);
    setSelectedImage(
      newImages.length > 0
        ? newImages[0].image_url || product.thumbnail
        : product.thumbnail
    );

    // Dùng resolveRatings để đồng bộ rating
    const { avg, cnt } = resolveRatings(next, product);
    setAvgRating(avg);
    setRatingCount(cnt);

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

  const attributes = selectedVariant?.attributeValues || [];

  useEffect(() => {
    (async () => {
      if (!isQuickViewOpen || !product?.id || !selectedVariant?.id) return;
      const hasAttrs =
        Array.isArray(selectedVariant.attributeValues) &&
        selectedVariant.attributeValues.length > 0;
      if (hasAttrs) return;

      setIsLoadingAttributes(true);
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
      setIsLoadingAttributes(false);
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
                <>
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
                </>
              )}
            </div>
            {displayOriginalPrice > displayPrice && (
              <span className="absolute top-2 right-2 text-white text-xs font-semibold bg-qred px-2 py-1 rounded z-10">
                {discountType === "percentage" || discountType === "percent"
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
              <span className="text-sm text-gray-600">
                {ratingCount > 0 ? `(${ratingCount} đánh giá)` : ""}
              </span>
            </div>
            {visibleVariants.length > 0 && (
              <div>
                <span className="block text-xs font-medium text-gray-600 mb-1">
                  Biến thể:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {visibleVariants.map((variant) => {
                    const {
                      original,
                      sale,
                      discountAmount,
                      discountPercent,
                      discountType,
                    } = computePricing(variant);
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
                        <p className="font-medium">
                          {variant.name || variant.sku || "Unnamed"}
                        </p>
                        <p className="text-qred font-semibold">
                          {sale.toLocaleString("vi-VN")}₫
                        </p>
                        {sale < original && (
                          <div className="flex items-center justify-center space-x-1">
                            <p className="text-qgray line-through text-[10px]">
                              {original.toLocaleString("vi-VN")}₫
                            </p>
                            <span className="text-white text-[10px] font-semibold bg-qred px-1 rounded">
                              {discountType === "percentage" ||
                              discountType === "percent"
                                ? `-${discountPercent}%`
                                : `-${discountAmount.toLocaleString("vi-VN")}₫`}
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
                {isLoadingAttributes ? (
                  <div className="mt-2 text-gray-600 text-sm">
                    Đang tải thuộc tính...
                  </div>
                ) : attributes.length > 0 ? (
                  <div className="mt-2">
                    <span className="block text-xs font-medium text-gray-600 mb-1">
                      Thuộc tính biến thể đã chọn
                    </span>
                    <table className="w-full text-[12px] border border-gray-200 rounded">
                      <tbody>
                        {(isExpanded ? attributes : attributes.slice(0, 4)).map(
                          (av, i) => (
                            <tr key={i} className="border-t">
                              <td className="px-2 py-1 text whitespace-nowrap">
                                <b>{av?.attribute?.name || "-"}</b>
                              </td>
                              <td className="px-2 py-1 break-words">
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
                        onClick={() => setIsExpanded((v) => !v)}
                      >
                        {isExpanded
                          ? "Thu gọn"
                          : `Xem thêm ${attributes.length - 4}`}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="mt-2 text-gray-600 text-sm">
                    Không có thuộc tính biến thể
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

  if (!product.id || visibleVariants.length === 0) {
    return null;
  }

  const handleNavigate = (e) => {
    if (!product.id) {
      e.preventDefault();
      toast.error("Sản phẩm không hợp lệ!");
      return;
    }
    navigate(`/product/${product.slug}`, { state: { productId: product.id } });
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
            {discountType === "percentage" || discountType === "percent"
              ? `-${Number(discountPercent).toString()}%`
              : `-${Number(discountAmount).toLocaleString("vi-VN")}₫`}
          </span>
        )}
      </div>
      <div className="product-card-details px-[30px] pb-[30px] relative min-h-[150px]">
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
          <span className="text-sm text-gray-600">
            {ratingCount > 0 ? `(${ratingCount})` : ""}
          </span>
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
                  <span className="text-qgray line-through font-600 text-[16px]">
                    {Number(displayOriginalPrice).toLocaleString("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    })}
                  </span>
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
