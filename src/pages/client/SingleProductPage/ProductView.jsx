import { useState, useEffect } from "react";
import Selectbox from "../Helpers/Selectbox";
import axios from "axios";
import { useParams } from "react-router-dom";
import { Star, StarHalf, Star as StarOutline } from "lucide-react";
import { decodeToken } from "../Helpers/jwtDecode";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import Constants from "../../../Constants";
import { notifyCartChanged } from "../Helpers/cart/cartEvents";
import StarRating from "../../client/Helpers/StarRating";

import { useLocation, useNavigate } from "react-router-dom";
export default function ProductView({ className, reportHandler }) {
  const [productData, setProductData] = useState(null);
  const [variants, setVariants] = useState([]);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [variantImages, setVariantImages] = useState([]);
  const [allVariants, setAllVariants] = useState([]);
  const [filteredVariants, setFilteredVariants] = useState([]);
  const [selectedImage, setSelectedImage] = useState("");
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [avgRating, setAvgRating] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);
  const { state } = useLocation();
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // useEffect(() => {
  //   if (!state?.productId) {
  //     navigate("/all-products");
  //   }
  // }, [state]);
  const { productId } = state || {};
  const [showFullShortDesc, setShowFullShortDesc] = useState(false);
  const SHORT_DESC_LIMIT = 30;
const { slug } = useParams();

  useEffect(() => {
    if (variantImages.length > 0) {
      const safeIndex = Math.max(
        0,
        Math.min(currentImageIndex, variantImages.length - 1)
      );
      setSelectedImage(variantImages[safeIndex]?.image_url || "");
    }
  }, [currentImageIndex, variantImages]);

  useEffect(() => {
  window.scrollTo(0, 0);
  async function fetchProduct() {
    try {
      setLoading(true);
      const res = await axios.get(
        `${Constants.DOMAIN_API}/products/${slug}/variants`
      );
      const { product } = res.data;

      setProductData(product);
      setVariants(product.variants);
      setImages(product.variantImages);
      setAllVariants(product.variants);

      if (product.variants.length > 0) {
        const firstVariant = product.variants[0];
        setSelectedVariant(firstVariant);
        setFilteredVariants([firstVariant]);
        const firstImages = firstVariant.images || [];
        setVariantImages(firstImages);

        if (firstImages.length > 0) {
          setSelectedImage(firstImages[0].image_url);
        } else if (product.thumbnail) {
          setSelectedImage(product.thumbnail);
        }

        await checkWishlistStatus(firstVariant.id);
      }

      const firstImage = product.thumbnail;
      if (firstImage) setSelectedImage(firstImage);
    } catch (err) {
  const msg =
    err.response?.data?.message || // lấy message từ BE
    err.message || 
    "Không thể tải thông tin sản phẩm";
  setError(msg);
} finally {
  setLoading(false);
}

  }
  fetchProduct();
}, [slug]);


  useEffect(() => {
    if (selectedVariant) {
      checkWishlistStatus(selectedVariant.id);
    }
  }, [selectedVariant]);

  useEffect(() => {
    if (selectedVariant) {
      const avg = selectedVariant.averageRating || 0;

      const count = parseInt(selectedVariant.ratingCount || 0);
      setAvgRating(avg);
      setRatingCount(count);
    }
  }, [selectedVariant]);

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
      console.error("Lỗi khi kiểm tra trạng thái wishlist:", error);
      toast.error("Không thể kiểm tra trạng thái danh sách yêu thích.");
    }
  };

  const getAttrValue = (variant, attrName) => {
    const attr = variant.attributeValues.find(
      (a) => a.attribute.name === attrName
    );
    return attr ? attr.value : null;
  };

  const increment = () => {
    if (quantity < selectedVariant?.stock) {
      setQuantity((q) => q + 1);
    } else {
      toast.info("Không thể tăng thêm vì đã đạt số lượng tối đa trong kho");
    }
  };

  const decrement = () => setQuantity((q) => Math.max(1, q - 1));

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
      setIsInWishlist(true); // Cập nhật ngay lập tức
      await checkWishlistStatus(selectedVariant.id); // Xác nhận lại từ API
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
      toast.error("Bạn cần đăng nhập để xóa sản phẩm khỏi danh sách yêu thích.");
      return;
    }

    try {
      const response = await axios.delete(
        `${Constants.DOMAIN_API}/users/${userId}/wishlist/${selectedVariant.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(response.data.message || "Đã xóa khỏi danh sách yêu thích!");
      setIsInWishlist(false);
      await checkWishlistStatus(selectedVariant.id);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Lỗi khi xóa khỏi danh sách yêu thích.";
      toast.error(errorMessage);
    }
  };

  const handleAddToCart = async (variantId, quantity) => {
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

  if (loading) return <div>Đang tải sản phẩm...</div>;
  if (error) return <div>Lỗi: {error}</div>;
  if (!productData) return null;

  const changeImgHandler = (url) => {
    const index = variantImages.findIndex((img) => img.image_url === url);
    setCurrentImageIndex(index >= 0 ? index : 0);
  };

  const handleVariantSelect = (variant) => {
    if (!variant || selectedVariant?.id === variant.id) {
      return;
    }
    const newFiltered = variants.filter((v) => v.id === variant.id);
    setFilteredVariants(newFiltered);
    const newImages = newFiltered.flatMap((v) => v.images || []);
    setVariantImages(newImages);
    if (newImages.length > 0) {
      setSelectedImage(newImages[0].image_url);
    }
    setSelectedVariant(variant);
  };

  const renderStars = (avgRating) => {
    const fullStars = Math.floor(avgRating);
    const hasHalfStar = avgRating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    return (
      <>
        {Array(fullStars)
          .fill()
          .map((_, i) => (
            <Star key={`full-${i}`} className="text-yellow-400 w-4 h-4" />
          ))}
        {hasHalfStar && <StarHalf className="text-yellow-400 w-4 h-4" />}
        {Array(emptyStars)
          .fill()
          .map((_, i) => (
            <StarOutline key={`empty-${i}`} className="text-gray-300 w-4 h-4" />
          ))}
      </>
    );
  };

  return (
    <div
      className={`product-view w-full lg:flex justify-between ${className || ""
        }`}
    >
      <div data-aos="fade-right" className="lg:w-1/2 xl:mr-[70px] lg:mr-[50px]">
        <div className="w-full">
          <div className="w-full h-[600px] border border-qgray-border flex justify-center items-center overflow-hidden relative mb-3">
            <img
              src={selectedImage}
              alt=""
              className="max-h-full max-w-full object-contain"
            />

            {/* Nút trái */}
            {variantImages.length > 1 && (
              <button
                onClick={() =>
                  setCurrentImageIndex((prev) =>
                    prev === 0 ? variantImages.length - 1 : prev - 1
                  )
                }
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/70 hover:bg-white text-gray-800 rounded-full p-2 shadow z-10"
              >
                ◀
              </button>
            )}

            {/* Nút phải */}
            {variantImages.length > 1 && (
              <button
                onClick={() =>
                  setCurrentImageIndex((prev) =>
                    prev === variantImages.length - 1 ? 0 : prev + 1
                  )
                }
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/70 hover:bg-white text-gray-800 rounded-full p-2 shadow z-10"
              >
                ▶
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <div className="flex gap-2 flex-nowrap">
              {(selectedVariant ? variantImages : images).map((img) => (
                <div
                  onClick={() => changeImgHandler(img.image_url)}
                  key={img.id}
                  className="w-[110px] h-[110px] p-[15px] border border-qgray-border cursor-pointer flex-shrink-0"
                >
                  <img
                    src={img.image_url}
                    alt=""
                    className={`w-full h-full object-contain ${selectedImage !== img.image_url ? "opacity-50" : ""
                      }`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="flex-1">
        <div className="product-details w-full mt-10 lg:mt-0">
          <span
            data-aos="fade-up"
            className="text-qgray text-xs font-normal uppercase tracking-wider mb-2 inline-block"
          >
            Đồng hồ
          </span>
          <p
            data-aos="fade-up"
            className="text-xl font-medium text-qblack mb-2"
          >
            {productData.name}
          </p>

          {productData.short_description && (
            <div className="mb-4 text-sm text-gray-600">
              {showFullShortDesc ||
                productData.short_description.length <= SHORT_DESC_LIMIT
                ? productData.short_description
                : productData.short_description.slice(0, SHORT_DESC_LIMIT) +
                "..."}
              {productData.short_description.length > SHORT_DESC_LIMIT && (
                <button
                  onClick={() => setShowFullShortDesc(!showFullShortDesc)}
                  className="ml-2 text-blue-600 font-medium "
                >
                  {showFullShortDesc ? "Thu gọn" : "Xem thêm"}
                </button>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 mb-4">
            <StarRating rating={avgRating} />
            <span className="text-sm text-gray-600">
              {ratingCount} đánh giá
            </span>
          </div>

          <span className="block text-sm font-semibold uppercase text-gray-600 mb-4 mt-8">
            Biến thể
          </span>
          <div
            className="flex flex-wrap gap-4"
            style={{
              transform: "translate3d(0px, 0px, 0px)",
              transition: "all",
              width: "100%",
            }}
          >
            {variants.map((variant) => {
              const name = variant.name || variant.sku || "Không tên";
              const originalPrice = Number(variant.price || 0);
              const salePrice = Number(variant.final_price || 0);
              const inStock = variant.stock > 0;
              const isSelected = selectedVariant?.id === variant.id;
              return (
                <div
                  key={variant.id}
                  className={`border rounded-xl px-4 py-2 min-w-[150px] text-center transition
                    ${inStock
                      ? "cursor-pointer hover:shadow"
                      : "opacity-50 cursor-not-allowed"
                    }
                    ${isSelected ? "border-blue-600 ring-2 ring-blue-300" : ""
                    }`}
                  onClick={() => {
                    if (inStock) {
                      handleVariantSelect(variant);
                      changeImgHandler(variant.images?.[0]?.image_url || "");
                    }
                  }}
                >
                  <p className="font-semibold uppercase">{name}</p>
                  {salePrice > 0 && salePrice < originalPrice ? (
                    <div className="text-red-600 font-bold text-lg">
                      <span>{salePrice.toLocaleString("vi-VN")}₫</span>
                      <span className="text-gray-500 line-through ml-2 text-sm font-normal">
                        {originalPrice.toLocaleString("vi-VN")}₫
                      </span>
                    </div>
                  ) : (
                    <p className="text-red-600 font-bold text-lg">
                      {originalPrice.toLocaleString("vi-VN")}₫
                    </p>
                  )}
                  <p>{inStock ? `Còn lại: ${variant.stock}` : "Hết hàng"}</p>
                </div>
              );
            })}
          </div>
          {selectedVariant && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Thuộc tính của biến thể:</h4>
              <table className="w-full text-left border border-gray-300 rounded overflow-hidden text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 border border-gray-300">
                      Tên thuộc tính
                    </th>
                    <th className="p-2 border border-gray-300 w-1/2">
                      Giá trị
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {selectedVariant.attributeValues.map((attr, index) => (
                    <tr key={index}>
                      <td className="p-2 border border-gray-300">
                        <b>{attr.attribute?.name || "Không xác định"}</b>
                      </td>

                      <td className="p-2 border border-gray-300">
                        {attr.attribute?.name.toLowerCase() === "màu sắc" ? (
                          <div className="flex items-center gap-2">
                            <div
                              className="w-6 h-6 rounded border border-gray-400"
                              style={{ backgroundColor: attr.value }}
                              title={attr.value}
                            ></div>
                          </div>
                        ) : (
                          attr.value || "N/A"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div data-aos="fade-up" className="product-size mb-[30px]"></div>
          <div
            data-aos="fade-up"
            className="quantity-card-wrapper w-full flex items-center h-[50px] space-x-[10px] mb-[30px]"
          >
            <div className="w-[120px] h-full px-[26px] flex items-center border border-qgray-border">
              <div className="flex justify-between items-center w-full">
                <button
                  onClick={decrement}
                  type="button"
                  className="text-base text-qgray"
                >
                  -
                </button>
                <span className="text-qblack">{quantity}</span>
                <button
                  onClick={increment}
                  type="button"
                  className="text-base text-qgray"
                >
                  +
                </button>
              </div>
            </div>
            <div className="w-[60px] h-full flex justify-center items-center border border-qgray-border">
              <button
                type="button"
                onClick={isInWishlist ? handleRemoveFromWishlist : handleAddToWishlist}
                title={
                  isInWishlist
                    ? "Xóa khỏi danh sách yêu thích"
                    : "Thêm vào danh sách yêu thích"
                }
              >
                <span>
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill={isInWishlist ? "#FF0000" : "none"}
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M17 1C14.9 1 13.1 2.1 12 3.7C10.9 2.1 9.1 1 7 1C3.7 1 1 3.7 1 7C1 13 12 22 12 22C12 22 23 13 23 7C23 3.7 20.3 1 17 1Z"
                      stroke={isInWishlist ? "#FF0000" : "#D5D5D5"}
                      strokeWidth="2"
                      strokeMiterlimit="10"
                      strokeLinecap="square"
                    />
                  </svg>
                </span>
              </button>
            </div>
            <div className="flex-1 h-full">
              {selectedVariant?.stock > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (!selectedVariant) {
                      toast.error(
                        "Vui lòng chọn biến thể trước khi thêm vào giỏ hàng"
                      );
                      return;
                    }
                    if (quantity > selectedVariant.stock) {
                      toast.error(
                        `Chỉ còn ${selectedVariant.stock} sản phẩm trong kho`
                      );
                      return;
                    }
                    handleAddToCart(selectedVariant.id, quantity);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold w-full h-full"
                >
                  THÊM GIỎ HÀNG
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  className="bg-gray-300 text-gray-500 text-sm font-semibold w-full h-full cursor-not-allowed"
                >
                  HẾT HÀNG
                </button>
              )}
            </div>
          </div>
          <div data-aos="fade-up" className="mb-[20px]">
            <p className="text-[13px] text-qgray leading-7">
              <span className="text-qblack">Danh mục :</span>{" "}
              {productData.category}
            </p>
            <p className="text-[13px] text-qgray leading-7">
              <span className="text-qblack">Thương hiệu :</span>{" "}
              {productData.brand}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
