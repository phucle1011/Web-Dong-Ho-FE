import { useEffect, useRef, useState, useLayoutEffect } from "react";
import { useLocation, useParams, Link } from "react-router-dom";
import axios from "axios";
import Layout from "../../Partials/LayoutHomeThree";
import { FaGavel, FaBookOpen, FaAngleDoubleLeft, FaAngleDoubleRight, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { Star, StarHalf, Star as StarOutline } from "lucide-react";
import Constants from "../../../../Constants";


export default function AuctionsDetail() {
  const { state } = useLocation();
  // const { productId: productIdFromState } = state || {};
  // const { productId: productIdFromParams } = useParams();
  // const { productId: productIdFromState, auctionId } = state || {};
  // const productId = productIdFromState || productIdFromParams;

  const { productId: productIdFromState, auctionId: auctionIdFromState } = state || {};
  const {
    productId: productIdFromParams,
    auctionId: auctionIdFromParams,
  } = useParams();

  const productId = productIdFromState || productIdFromParams;
  const auctionId = auctionIdFromState || auctionIdFromParams;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [productData, setProductData] = useState(null);
  const [variants, setVariants] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);

  const [selectedImage, setSelectedImage] = useState("");
  const [variantImages, setVariantImages] = useState([]);

  const [showFullShortDesc, setShowFullShortDesc] = useState(false);
  const SHORT_DESC_LIMIT = 30;

  const [avgRating, setAvgRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  const descriptionRef = useRef(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const MAX_HEIGHT = 420;

  const shortDescription = productData?.short_description || "";
  const longDescriptionHTML = productData?.description || "";

  const [auction, setAuction] = useState(null);

  const [winnerData, setWinnerData] = useState({
    winner: null,
    winningBid: null,
    allBids: [],
    orderStatus: null,
    paymentMethod: null,
    expiredPaymentWindow: false,
  });

  const renderStars = (avg) => {
    const fullStars = Math.floor(avg);
    const hasHalfStar = avg % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    return (
      <>
        {Array(fullStars)
          .fill(0)
          .map((_, i) => (
            <Star key={`full-${i}`} className="text-yellow-400 w-4 h-4" />
          ))}
        {hasHalfStar && <StarHalf className="text-yellow-400 w-4 h-4" />}
        {Array(emptyStars)
          .fill(0)
          .map((_, i) => (
            <StarOutline key={`empty-${i}`} className="text-gray-300 w-4 h-4" />
          ))}
      </>
    );
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!productId) return;

    async function fetchProduct() {
      try {
        setLoading(true);
        setError("");

        const res = await axios.get(
          `${Constants.DOMAIN_API}/products/${productId}/auction-variants`
        );
        const { product } = res.data || {};

        if (!product) {
          setError("Không tìm thấy sản phẩm.");
          return;
        }

        setProductData(product);
        setVariants(product.variants || []);

        if (auctionId) {
          const matchVar = product.variants.find(v =>
            Array.isArray(v.auctions) && v.auctions.some(a => a.id === auctionId)
          );
          if (matchVar) {
            setSelectedVariant(matchVar);
            const imgs = matchVar.images || [];
            setVariantImages(imgs);
            setSelectedImage(imgs[0]?.image_url || product.thumbnail || "");
            return;
          }
        }

        if (product.variants.length > 0) {
          const firstVariant = product.variants[0];
          setSelectedVariant(firstVariant);
          const imgs = firstVariant.images || [];
          setVariantImages(imgs);
          setSelectedImage(imgs[0]?.image_url || product.thumbnail || "");
        }

        setAvgRating(parseFloat(product.averageRating || 0));
        setTotalReviews(product.ratingCount || 0);

      } catch (err) {
        setError(
          err?.response?.data?.message || err.message || "Lỗi tải dữ liệu"
        );
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [productId, auctionId]);

  useLayoutEffect(() => {
    const el = descriptionRef.current;
    if (!el || !longDescriptionHTML) return;

    const measure = () => {
      if (isExpanded) {
        setIsOverflowing(false);
        return;
      }
      setIsOverflowing(el.scrollHeight > MAX_HEIGHT);
    };

    measure();
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    const imgs = Array.from(el.querySelectorAll("img"));
    const onImgLoad = () => measure();
    imgs.forEach((img) =>
      img.addEventListener("load", onImgLoad, { once: true })
    );

    return () => {
      ro.disconnect();
      imgs.forEach((img) => img.removeEventListener("load", onImgLoad));
    };
  }, [longDescriptionHTML, isExpanded]);

  const thumbList = (
    variantImages?.length > 0 ? variantImages.map((i) => i.image_url) : []
  ).concat(
    productData?.thumbnail && variantImages.length === 0
      ? [productData.thumbnail]
      : []
  );

  const selectedAuction = selectedVariant?.auctions?.find(a => a.id === auctionId);

  const [allBids, setAllBids] = useState([]);
  const [bidPage, setBidPage] = useState(1);
  const bidsPerPage = 5;

  useEffect(() => {
    if (selectedAuction) {
      setAllBids(selectedAuction.bids || []);
      setBidPage(1);
    }
  }, [selectedAuction]);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await axios.get(
          `${Constants.DOMAIN_API}/admin/auctions/winners/${auctionId}`
        );
        const d = res.data.data;

        setAuction(d.auction);
        if (d.winner) {
          setWinnerData({
            winner: d.winner,
            winningBid: d.winningBid,
            orderStatus: d.orderStatus,
            paymentMethod: d.paymentMethod,
            expiredPaymentWindow: d.expiredPaymentWindow,
            allBids: d.allBids,
          });

          setAllBids(d.allBids || []);
        } else {
          setWinnerData({
            winner: null,
            winningBid: null,
            orderStatus: null,
            paymentMethod: null,
            expiredPaymentWindow: false,
            allBids: [],
          });
        }
      } catch (err) {
        console.error(err);
        setError("Không tải được dữ liệu");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [auctionId]);

  const totalBidPages = Math.ceil(allBids.length / bidsPerPage);
  const paginatedBids = allBids.slice(
    (bidPage - 1) * bidsPerPage,
    bidPage * bidsPerPage
  );

  return (
    <Layout>
      <div
        className="relative bg-cover bg-center rounded-b-[80px] pb-24 pt-12 text-white overflow-hidden"
        style={{
          backgroundImage:
            'url("https://res.cloudinary.com/disgf4yl7/image/upload/v1753806364/ayx4l3umypbc3cwswdza.avif")',
        }}
      >
        <div className="container-x mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 px-4 max-w-4xl mx-auto -mt-16 z-10 relative">
            <div className="bg-white rounded-2xl p-6 text-center shadow-xl hover:shadow-2xl transition transform hover:-translate-y-1 cursor-pointer ring-1 ring-white/10">
              <Link to="/AuctionGuide">
                <FaBookOpen className="text-blue-600 text-4xl mx-auto mb-3" />
                <h3 className="text-lg font-bold text-gray-800 mb-1">
                  HƯỚNG DẪN ĐẤU GIÁ
                </h3>
                <p className="text-gray-500 text-sm">
                  Xem cách tham gia đấu giá
                </p>
              </Link>
            </div>
            <div
              to="/room"
              className="bg-white rounded-2xl p-6 text-center shadow-xl transition transform ring-1 ring-white/10 block
              opacity-50 pointer-events-none"
            >
              <FaGavel className="text-pink-600 text-4xl mx-auto mb-3" />
              <h3 className="text-lg font-bold text-gray-800 mb-1">
                VÀO PHÒNG ĐẤU GIÁ
              </h3>
              <p className="text-gray-500 text-sm">
                Tham gia và bắt đầu đấu giá
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Hiển thị thông tin người thắng nếu đã kết thúc */}
      {(() => {
        const selectedAuction = selectedVariant?.auctions?.find(
          (a) => a.id === auctionId
        );

        if (!selectedAuction) {
          return (
            <p className="text-red-500"></p>
          );
        }

        if (selectedAuction.status !== "ended") {
          return null;
        }

        if (!selectedAuction.winner) {
          return (
            <div className="mt-8 mx-auto max-w-3xl p-6 bg-yellow-50 border border-yellow-300 rounded-2xl shadow-md text-center">
              <p className="text-lg font-medium text-yellow-800">
                Phiên đã kết thúc nhưng không có người trả giá.
              </p>
            </div>
          );
        }

        return (
          <div className="mt-12 mx-auto max-w-7xl px-6 py-8 bg-blue-50/60 border border-blue-200 rounded-2xl shadow-lg">
            <h4 className="text-center text-2xl font-extrabold text-blue-800 mb-10 tracking-wide">
              Kết quả phiên đấu giá
            </h4>

            <div className="grid grid-cols-1 lg:grid-cols-10 gap-10">
              {/* Người chiến thắng */}
              <div className="bg-white p-8 rounded-2xl shadow-md lg:col-span-4">
                <h5 className="text-xl font-semibold text-gray-800 mb-6 border-b pb-2 text-center">
                  Thông tin người chiến thắng
                </h5>

                {/* 4 phần hiển thị gọn đẹp */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                  <div className="rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">Họ và tên</p>
                    <p className="font-semibold text-gray-800 break-words border border-gray-100 bg-gray-50">
                      {selectedAuction.winner.user_name}
                    </p>
                  </div>
                  <div className="rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">Email</p>
                    <p className="font-semibold text-gray-800 break-words border border-gray-100 bg-gray-50">
                      {winnerData.winner?.email
                        || selectedAuction.winner?.email
                        || selectedAuction.winner?.user?.email
                        || "—"}
                    </p>
                  </div>
                  <div className="rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">Số tiền</p>
                    <p className="font-semibold text-green-600 whitespace-nowrap border border-gray-100 bg-gray-50">
                      {Number(selectedAuction.winner.bidAmount).toLocaleString("vi-VN")}₫
                    </p>
                  </div>
                  <div className="rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">Kết thúc lúc</p>
                    <p className="font-semibold text-gray-800 whitespace-nowrap border border-gray-100 bg-gray-50">
                      {selectedAuction.endTime.replace("T", " ").substring(0, 19)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Lịch sử đặt giá */}
             <div className="bg-white p-8 rounded-2xl shadow-md lg:col-span-6">
                <h5 className="text-xl font-semibold text-gray-800 mb-6 border-b pb-2">
                  Lịch sử đặt giá
                </h5>

                <div className="overflow-x-auto rounded-xl ring-1 ring-gray-100">
                  <table className="min-w-full table-fixed bg-white">
                    <thead className="bg-gray-100/70">
                      <tr>
                        {["#", "Tên người đặt", "Email", "Số tiền", "Thời gian"].map((title) => (
                          <th
                            key={title}
                            className="px-4 py-3 text-left text-sm font-medium text-gray-700"
                          >
                            {title}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {paginatedBids.length > 0 ? (
                        paginatedBids.map((bid, idx) => (
                          <tr key={bid.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 text-sm text-gray-700">
                              {(bidPage - 1) * bidsPerPage + idx + 1}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              {bid.user.name}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700 break-words">
                              {bid.user.email}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-green-600 whitespace-nowrap">
                              {Number(bid.bidAmount).toLocaleString("vi-VN")}₫
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                              {bid.bidTime.replace("T", " ").substring(0, 19)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-4 py-6 text-center text-gray-500"
                          >
                            Chưa có lượt đặt giá nào
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Giữ nguyên cụm phân trang của bạn ở dưới */}
                <div className="flex justify-center mt-6">
                  <div className="flex items-center space-x-1">
                    <button
                      disabled={bidPage === 1}
                      onClick={() => setBidPage(1)}
                      className="px-2 py-1 border rounded disabled:opacity-50"
                    >
                      <FaAngleDoubleLeft />
                    </button>
                    <button
                      disabled={bidPage === 1}
                      onClick={() => setBidPage(bidPage - 1)}
                      className="px-2 py-1 border rounded disabled:opacity-50"
                    >
                      <FaChevronLeft />
                    </button>

                    {[...Array(totalBidPages)].map((_, i) => {
                      const page = i + 1;
                      if (page >= bidPage - 1 && page <= bidPage + 1) {
                        return (
                          <button
                            key={page}
                            onClick={() => setBidPage(page)}
                            className={`w-8 h-8 border rounded text-sm ${page === bidPage
                                ? "bg-blue-600 text-white"
                                : "bg-white hover:bg-blue-100"
                              }`}
                          >
                            {page}
                          </button>
                        );
                      }
                      return null;
                    })}

                    <button
                      disabled={bidPage === totalBidPages}
                      onClick={() => setBidPage(bidPage + 1)}
                      className="px-2 py-1 border rounded disabled:opacity-50"
                    >
                      <FaChevronRight />
                    </button>
                    <button
                      disabled={bidPage === totalBidPages}
                      onClick={() => setBidPage(totalBidPages)}
                      className="px-2 py-1 border rounded disabled:opacity-50"
                    >
                      <FaAngleDoubleRight />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      <div className="container-x mx-auto py-10">
        {loading ? (
          <div className="text-center text-gray-600">Đang tải dữ liệu...</div>
        ) : error ? (
          <div className="text-center text-red-600">{error}</div>
        ) : !productData ? (
          <div className="text-center text-gray-600">
            Không có dữ liệu sản phẩm.
          </div>
        ) : (
          <>
            <div className="product-view w-full lg:flex justify-between">
              <div className="lg:w-1/2 xl:mr-[70px] lg:mr-[50px]">
                <div className="w-full">
                  <div className="w-full h-[600px] border border-gray-300 flex justify-center items-center overflow-hidden relative mb-3">
                    {selectedImage ? (
                      <img
                        src={selectedImage}
                        alt="Selected"
                        className="object-contain"
                      />
                    ) : (
                      <div className="text-gray-400">Chưa có ảnh</div>
                    )}
                  </div>

                  {thumbList.length > 0 && (
                    <div className="overflow-x-auto">
                      <div className="flex gap-2 flex-nowrap">
                        {thumbList.map((img, idx) => (
                          <div
                            key={`${img}-${idx}`}
                            onClick={() => setSelectedImage(img)}
                            className={`w-[110px] h-[110px] p-[15px] border border-gray-300 cursor-pointer flex-shrink-0 ${selectedImage !== img
                              ? ""
                              : "ring-2 ring-blue-500"
                              }`}
                            title="Xem ảnh"
                          >
                            <img
                              src={img}
                              alt="thumb"
                              className={`w-full h-full object-contain ${selectedImage !== img
                                ? "opacity-70 hover:opacity-100"
                                : ""
                                }`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-1">
                <div className="product-details w-full mt-10 lg:mt-0">
                  <span className="text-gray-500 text-xs font-normal uppercase tracking-wider mb-2 inline-block">
                    Danh mục: {productData?.category?.name || "—"}
                  </span>

                  <p className="text-xl font-medium text-black mb-2">
                    {productData?.name || "—"} ({selectedVariant?.sku || "—"})
                  </p>

                  <div className="mb-4 text-sm text-gray-600">
                    {showFullShortDesc ||
                      shortDescription.length <= SHORT_DESC_LIMIT
                      ? shortDescription
                      : shortDescription.slice(0, SHORT_DESC_LIMIT) + "..."}
                    {shortDescription.length > SHORT_DESC_LIMIT && (
                      <button
                        onClick={() => setShowFullShortDesc((p) => !p)}
                        className="ml-2 text-blue-600 font-medium"
                      >
                        {showFullShortDesc ? "Thu gọn" : "Xem thêm"}
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex">{renderStars(avgRating)}</div>
                  </div>

                  {selectedVariant && (
                    <div className="mb-4">
                      <label className="block text-sm text-gray-700 mb-1">
                        Biến thể:
                      </label>
                      <div className="px-3 py-1.5 rounded border text-sm bg-gray-100 text-gray-800">
                        {selectedVariant.sku || "—"}
                      </div>
                    </div>
                  )}

                  <div className="mt-4">
                    <h4 className="font-semibold mb-2">Thông tin biến thể</h4>
                    <table className="w-full text-left border border-gray-300 rounded overflow-hidden text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="p-2 border">Tên thuộc tính</th>
                          <th className="p-2 border">Giá trị</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(selectedVariant?.attributeValues || []).map((av) => {
                          const attrName = av?.attribute?.name || "";
                          const isColor =
                            attrName.trim().toLowerCase() === "màu sắc" ||
                            attrName.trim().toLowerCase() === "color";
                          return (
                            <tr key={av.id}>
                              <td className="p-2 border">{attrName || "—"}</td>
                              <td className="p-2 border">
                                {isColor ? (
                                  <div className="flex items-center">
                                    <div
                                      className="w-6 h-6 rounded border border-gray-400"
                                      style={{ backgroundColor: av.value }}
                                    />
                                  </div>
                                ) : (
                                  <span>{av.value || "—"}</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                        {(!selectedVariant?.attributeValues ||
                          selectedVariant.attributeValues.length === 0) && (
                            <tr>
                              <td
                                colSpan={2}
                                className="p-2 text-gray-500 italic"
                              >
                                Chưa có thuộc tính cho biến thể này.
                              </td>
                            </tr>
                          )}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-6 text-sm text-gray-700">
                    <p>
                      <strong>Danh mục:</strong>{" "}
                      {productData?.category?.name || "—"}
                    </p>
                    <p>
                      <strong>Thương hiệu:</strong>{" "}
                      {productData?.brand?.name || "—"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* {selectedVariant?.auction && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-700 mb-2">Thông tin phiên đấu giá</h4>
                <p><strong>ID phiên:</strong> {selectedVariant.auction.id}</p>
                <p><strong>Trạng thái:</strong> {
                  selectedVariant.auction.status === 'ended'
                    ? 'Đã kết thúc'
                    : selectedVariant.auction.status === 'active'
                      ? 'Đang diễn ra'
                      : 'Sắp diễn ra'
                }</p>
                <p><strong>Bắt đầu:</strong> {new Date(selectedVariant.auction.startTime).toLocaleString('vi-VN')}</p>
                <p><strong>Kết thúc:</strong> {new Date(selectedVariant.auction.endTime).toLocaleString('vi-VN')}</p>
              </div>
            )} */}

            {!!longDescriptionHTML && (
              <div className="mt-10 relative">
                <div className="relative">
                  <div
                    ref={descriptionRef}
                    className="prose prose-img:rounded-md transition-all duration-300 overflow-hidden"
                    style={{
                      maxHeight: isExpanded ? "none" : `${MAX_HEIGHT}px`,
                    }}
                    dangerouslySetInnerHTML={{ __html: longDescriptionHTML }}
                  />
                  {!isExpanded && isOverflowing && (
                    <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none z-10" />
                  )}
                </div>

                {(isOverflowing || isExpanded) && (
                  <div className="text-center mt-2 z-20 relative">
                    <button
                      className="text-blue-600 font-semibold"
                      onClick={() => setIsExpanded((p) => !p)}
                    >
                      {isExpanded ? "Thu gọn" : "Xem thêm"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <div className="bg-[#f5f7ff] py-12 px-4 sm:px-10 rounded-2xl shadow-md my-10">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-800">
            Các Bước Tham Gia Đấu Giá
          </h2>
          <p className="text-gray-500 mt-2">3 bước đơn giản</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-center">
          <div className="flex flex-col items-center">
            <img
              src="https://res.cloudinary.com/disgf4yl7/image/upload/v1753802825/sdsl1yjzz8lkbamzuhpj.png"
              alt="Đăng ký"
              className="w-24 h-24 mb-4"
            />
            <h3 className="text-xl font-semibold text-gray-800">
              Đăng ký tài khoản
            </h3>
            <p className="text-gray-500 mt-1">Tài khoản đăng ký</p>
          </div>
          <div className="flex flex-col items-center">
            <img
              src="https://res.cloudinary.com/disgf4yl7/image/upload/v1753802875/hol0im8itaz2ui8yxxg4.png"
              alt="Đăng ký tài sản"
              className="w-24 h-24 mb-4"
            />
            <h3 className="text-xl font-semibold text-gray-800">
              Đăng ký tài sản
            </h3>
            <p className="text-gray-500 mt-1">
              Lựa chọn tài sản mong muốn đăng ký đấu giá
            </p>
          </div>
          <div className="flex flex-col items-center">
            <img
              src="https://res.cloudinary.com/disgf4yl7/image/upload/v1753802913/he80cgvjuqoorjakl7gq.png"
              alt="Đấu giá"
              className="w-24 h-24 mb-4"
            />
            <h3 className="text-xl font-semibold text-gray-800">Đấu giá</h3>
            <p className="text-gray-500 mt-1">Đặt giá và chiến thắng</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
