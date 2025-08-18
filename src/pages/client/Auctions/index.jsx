import { useEffect, useState, useRef, useCallback } from "react";
import Layout from "../Partials/LayoutHomeThree";
import { FaGavel, FaBookOpen, FaChevronLeft, FaChevronRight, FaClock } from "react-icons/fa";
import axios from "axios";
import Constants from "../../../Constants";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

const MIN_BALANCE = 10_000_000;

function AuctionProductDetail() {
  const navigate = useNavigate();

  const [otpRequested, setOtpRequested] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const [upcomingAuctions, setUpcomingAuctions] = useState([]);
  const [loadingAuctions, setLoadingAuctions] = useState(true);
  const [showFullName, setShowFullName] = useState(false);

  const [endedAuctions, setEndedAuctions] = useState([]);
  const [loadingEnded, setLoadingEnded] = useState(true);

  const [expandedTitle, setExpandedTitle] = useState({ upcoming: {}, ended: {} });

  const [overflowTitle, setOverflowTitle] = useState({ upcoming: {}, ended: {} });

  const upcomingRef = useRef(null);
  const endedRef = useRef(null);

  const titleRefs = useRef({ upcoming: {}, ended: {} });

  const [upScroll, setUpScroll] = useState({ left: false, right: false });
  const [endScroll, setEndScroll] = useState({ left: false, right: false });

  const [activeAuction, setActiveAuction] = useState(null);

  const setTitleRef = (type, id) => (el) => {
    if (!titleRefs.current[type]) titleRefs.current[type] = {};
    if (el) titleRefs.current[type][id] = el;
  };

  const measureOverflow = useCallback((type) => {
    const nodes = titleRefs.current[type] || {};
    const map = {};
    Object.entries(nodes).forEach(([id, el]) => {

      map[id] = el.scrollHeight > el.clientHeight + 1;
    });
    setOverflowTitle((prev) => ({ ...prev, [type]: map }));
  }, []);

  useEffect(() => {
    if (!loadingAuctions) {
      setTimeout(() => measureOverflow("upcoming"), 0);
    }
  }, [loadingAuctions, upcomingAuctions, measureOverflow]);

  useEffect(() => {
    if (!loadingEnded) {
      setTimeout(() => measureOverflow("ended"), 0);
    }
  }, [loadingEnded, endedAuctions, measureOverflow]);

  useEffect(() => {
    const onResize = () => {
      measureOverflow("upcoming");
      measureOverflow("ended");
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [measureOverflow]);

  const toggleTitle = (type, id) =>
    setExpandedTitle((prev) => ({
      ...prev,
      [type]: { ...prev[type], [id]: !prev[type]?.[id] },
    }));

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchUpcomingAuctions();
  }, []);

  const fetchUpcomingAuctions = async () => {
    try {
      setLoadingAuctions(true);
      const res = await axios.get(`${Constants.DOMAIN_API}/admin/auctions`, {
        params: { status: "upcoming", limit: 6 },
      });
      setUpcomingAuctions(res.data.data || []);
    } catch (error) {
      console.error("Lỗi khi tải danh sách phiên đấu giá:", error);
      toast.error("Không thể tải danh sách phiên đấu giá.");
    } finally {
      setLoadingAuctions(false);
    }
  };

  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    return { Authorization: `Bearer ${token}` };
  };

  const handleEnterAuctionRoom = async () => {
    const headers = getAuthHeader();
    if (!headers) {
      toast.error("Vui lòng đăng nhập để vào phòng đấu giá.");
      return;
    }

    try {
      setLoading(true);
      const balanceRes = await axios.get(
        `${Constants.DOMAIN_API}/auctions/balance`,
        { headers }
      );
      const balance = Number(balanceRes.data.balance || 0);

      if (balance < MIN_BALANCE) {
        toast.warning(
          `Bạn cần ít nhất ${MIN_BALANCE.toLocaleString(
            "vi-VN"
          )} VNĐ trong ví để vào phòng đấu giá. Vui lòng vào ví tiền để nạp tiền vào để tiếp tục thực hiện đấu giá!`
        );
        return;
      }

      setSendingOtp(true);
      const otpRes = await axios.post(
        `${Constants.DOMAIN_API}/auctions/entry-otp`,
        {},
        { headers }
      );
      toast.success(
        otpRes.data?.message ||
        "Đã gửi OTP đến email của bạn. Vui lòng kiểm tra hộp thư."
      );
      setOtpRequested(true);
    } catch (error) {
      console.error("Lỗi khi kiểm tra số dư / gửi OTP:", error);
      const msg =
        error.response?.data?.message ||
        (error.response?.status === 401
          ? "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
          : "Có lỗi xảy ra. Vui lòng thử lại.");
      toast.error(msg);
    } finally {
      setSendingOtp(false);
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const headers = getAuthHeader();
    if (!headers) {
      toast.error("Vui lòng đăng nhập để xác thực.");
      return;
    }

    if (!otp.trim()) {
      toast.warning("Vui lòng nhập mã OTP.");
      return;
    }

    try {
      setVerifying(true);
      const verifyRes = await axios.post(
        `${Constants.DOMAIN_API}/auctions/entry-otp/verify`,
        { otp: otp.trim() },
        { headers }
      );

      toast.success(
        verifyRes.data?.message ||
        "Xác thực OTP thành công. Đang vào phòng đấu giá..."
      );
      setOtp("");
      setOtpRequested(false);
      navigate("/room");
    } catch (error) {
      console.error("Lỗi xác thực OTP:", error);
      const msg =
        error.response?.data?.message ||
        "Xác thực OTP thất bại. Vui lòng thử lại.";
      toast.error(msg);
    } finally {
      setVerifying(false);
    }
  };

  const handleCancelOtp = () => {
    setOtp("");
    setOtpRequested(false);
    toast.info("Đã hủy xác thực OTP.");
  };

  const fetchEndedAuctions = async () => {
    try {
      setLoadingEnded(true);
      const res = await axios.get(`${Constants.DOMAIN_API}/admin/auctions`, {
        params: { status: "ended", limit: 6 },
      });
      setEndedAuctions(res.data.data || []);
    } catch (error) {
      console.error("Lỗi khi tải danh sách phiên đấu giá đã kết thúc:", error);
      toast.error("Không thể tải danh sách phiên đấu giá đã kết thúc.");
    } finally {
      setLoadingEnded(false);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchUpcomingAuctions();
    fetchEndedAuctions();
  }, []);

  const sortUpcoming = (list) =>
    [...list].sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

  const sortEnded = (list) =>
    [...list].sort((a, b) => new Date(b.end_time || 0) - new Date(a.end_time || 0));

  const updateScrollButtons = (ref, setter) => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth - 1;
    setter({
      left: el.scrollLeft > 0,
      right: el.scrollLeft < max,
    });
  };

  const scrollByAmount = (ref, dir = 1) => {
    const el = ref.current;
    if (!el) return;
    const amount = Math.round(el.clientWidth * 0.98);
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  useEffect(() => {
    const el = upcomingRef.current;
    if (!el) return;
    const handler = () => updateScrollButtons(upcomingRef, setUpScroll);
    handler();
    el.addEventListener("scroll", handler);
    return () => el.removeEventListener("scroll", handler);
  }, [upcomingRef]);

  useEffect(() => {
    const el = endedRef.current;
    if (!el) return;
    const handler = () => updateScrollButtons(endedRef, setEndScroll);
    handler();
    el.addEventListener("scroll", handler);
    return () => el.removeEventListener("scroll", handler);
  }, [endedRef]);

  useEffect(() => {
    updateScrollButtons(endedRef, setEndScroll);
  }, [endedAuctions]);

  useEffect(() => {
    window.scrollTo(0, 0);
    axios
      .get(`${Constants.DOMAIN_API}/admin/auctions`, {
        params: { status: "active", limit: 1 },
      })
      .then((res) => {
        const a = res.data.data?.[0];
        setActiveAuction(a || null);
      });
  }, []);

  return (
    <Layout>
      <div className="flashsale-wrapper w-full">
        <div
          className="relative bg-cover bg-center rounded-b-[80px] pb-24 pt-12 text-white overflow-hidden mb-5"
          style={{
            backgroundImage: `url("https://res.cloudinary.com/disgf4yl7/image/upload/v1753806364/ayx4l3umypbc3cwswdza.avif")`,
          }}
        >
          <div className="container-x mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 px-4 max-w-4xl mx-auto -mt-16 z-10 relative">
              <Link to="/AuctionGuide">
                <div className="bg-white rounded-2xl p-6 text-center shadow-xl hover:shadow-2xl transition transform hover:-translate-y-1 cursor-pointer ring-1 ring-white/10">
                  <FaBookOpen className="text-blue-600 text-4xl mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-gray-800 mb-1">
                    HƯỚNG DẪN ĐẤU GIÁ
                  </h3>
                  <p className="text-gray-500 text-sm">
                    Xem cách tham gia đấu giá
                  </p>
                </div>
              </Link>

              <div
                className={`bg-white rounded-2xl p-6 text-center shadow-xl transition transform hover:-translate-y-1 cursor-pointer ring-1 ring-white/10 ${loading
                  ? "opacity-70 pointer-events-none"
                  : "hover:shadow-2xl"
                  }`}
                onClick={handleEnterAuctionRoom}
                title="Vào phòng đấu giá"
              >
                <FaGavel className="text-pink-600 text-4xl mx-auto mb-3" />
                <h3 className="text-lg font-bold text-gray-800 mb-1">
                  {sendingOtp ? "ĐANG GỬI OTP..." : "VÀO PHÒNG ĐẤU GIÁ"}
                </h3>
                <p className="text-gray-500 text-sm">
                  {sendingOtp
                    ? "Vui lòng chờ trong giây lát"
                    : "Tham gia và bắt đầu đấu giá"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* === PHIÊN ĐẤU GIÁ ĐANG DIỄN RA === */}
        {activeAuction && (
          <section className="container-x mx-auto px-4 mb-12 mt-5">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden h-full">
              <div className="relative w-full h-64">
                <img
                  src={activeAuction.variant?.images?.[0]?.image_url}
                  alt={activeAuction.variant?.product?.name}
                  className="w-full h-full object-cover"
                />
                <h2 className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-white bg-black/40">
                  <span className="blink">Phiên đấu giá đang diễn ra</span>
                </h2>
              </div>

              <div className="p-6 flex flex-col sm:flex-row gap-6">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mt-1">
                    {activeAuction.variant?.product?.name} ({activeAuction.variant?.sku})
                  </h3>
                </div>
                <div className="flex items-center gap-1 text-gray-600">
                  <FaClock />
                  <span className="text-sm">
                    Kết thúc sau:{' '}
                    {(activeAuction.end_time).replace("T", " ").substring(0, 19)}
                  </span>
                </div>
              </div>
              <div className="px-6 pb-6 text-center">
                <Link
                  to={{ pathname:  `/AcutionsDetail/${auction.variant?.product?.slug}` }}
                  state={{
                    productId: activeAuction.variant.product.id,
                    auctionId: activeAuction.id,
                  }}
                  className="inline-block w-max px-3 py-1 text-sm bg-gradient-to-r from-blue-500 to-indigo-600
                             text-white rounded-lg font-semibold shadow hover:from-blue-600 hover:to-indigo-700 transition">
                  Xem chi tiết
                </Link>
              </div>

            </div>

            {/* Animation CSS */}
            <style jsx>{`
              @keyframes blink {
                50% {
                  opacity: 0;
                }
              }
              .blink {
                animation: blink 1s step-start infinite;
              }
            `}</style>
          </section>
        )}

        <div className="container-x mx-auto">
          <h2 className="text-2xl font-bold my-6">Phiên đấu giá sắp diễn ra</h2>

          {loadingAuctions ? (
            <p className="text-center text-gray-500">Đang tải dữ liệu...</p>
          ) : upcomingAuctions.length === 0 ? (
            <div className="flex items-center justify-center min-h-[200px]">
              <p className="text-center inline-block px-6 py-4 bg-gradient-to-r from-blue-400 to-blue-600 text-white text-lg font-bold rounded-xl shadow-lg animate-bounce">
                Hiện không có phiên đấu giá nào sắp diễn ra.
              </p>
            </div>
          ) : (
            <div className="my-6 relative">

              <button
                aria-label="Cuộn trái"
                onClick={() => scrollByAmount(upcomingRef, -1)}
                className={`hidden lg:flex items-center justify-center absolute left-0 top-1/2 -translate-y-1/2 
                w-10 h-10 rounded-full bg-white shadow border z-10
                transition ${upScroll.left ? "opacity-100" : "opacity-0 pointer-events-none"}`}
              >
                <FaChevronLeft />
              </button>

              <div
                ref={upcomingRef}
                className="
                            flex gap-6 overflow-x-auto snap-x snap-mandatory pb-2
                            [scrollbar-width:none] [-ms-overflow-style:none]
                          "
                style={{ scrollbarWidth: "none" }}
                onLoad={() => updateScrollButtons(upcomingRef, setUpScroll)}
              >
                {sortUpcoming(upcomingAuctions).map((auction) => {
                  const expanded = !!expandedTitle.upcoming[auction.id];
                  return (
                    <div
                      key={auction.id}
                      className="
                      snap-start flex-none
                      w-[85%] sm:w-[55%] lg:w-[33.333%] xl:w-[33.333%]
                    "
                    >
                      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 transition hover:shadow-2xl">
                        <div className="relative">
                          <img
                            src={auction.variant?.images?.[0]?.image_url || "https://via.placeholder.com/300x200"}
                            alt={auction.variant?.product?.name}
                            className="w-full h-48 object-contain bg-gray-100 p-3"
                          />
                          <span className="absolute top-2 left-2 text-xs font-semibold px-2 py-1 rounded bg-green-100 text-green-600">
                            Sắp diễn ra
                          </span>
                          <button className="absolute bottom-2 right-2 bg-white p-2 rounded-full shadow text-pink-500">
                            <FaGavel className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="p-4">

                          <h3
                            ref={setTitleRef("upcoming", auction.id)}
                            className={`text-lg font-semibold text-gray-800 mb-2
                                          ${expanded ? "" : "line-clamp-2"}
                                          min-h-[3.25rem]  /* giữ chỗ ~2 dòng cho text-lg */
                                        `}
                          >
                            {auction.variant?.product?.name || "Không có tên sản phẩm"} ({auction.variant?.sku})
                          </h3>
                          <div className="min-h-[1.5rem]">
                            {overflowTitle.upcoming?.[auction.id] && (
                              <button
                                className="text-blue-500 text-sm mb-1"
                                onClick={() => toggleTitle("upcoming", auction.id)}
                              >
                                {expanded ? "Ẩn bớt" : "Xem thêm"}
                              </button>
                            )}
                          </div>
                          <div className="flex justify-between text-sm font-medium mb-2">
                            <div className="text-green-600">
                              Giá khởi điểm:{" "}
                              <strong>{Number(auction.variant.price || 0).toLocaleString("vi-VN")} ₫</strong>
                            </div>
                            <div className="text-pink-600">
                              Bước giá:{" "}
                              <strong>{Number(auction.priceStep || 0).toLocaleString("vi-VN")} ₫</strong>
                            </div>
                          </div>

                          <div className="text-gray-500 text-sm mb-4">
                            Thời gian bắt đầu:{" "}
                            <strong>{auction.start_time.replace("T", " ").substring(0, 19)}</strong>
                          </div>

                          <Link
                            to={{ pathname:  `/AcutionsDetail/${auction.variant?.product?.slug}` }}
                            state={{ productId: auction.variant?.product?.id, auctionId: auction.id }}
                            className="w-full block text-center py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-semibold shadow hover:from-blue-600 hover:to-indigo-700 transition"
                          >
                            Xem chi tiết
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                aria-label="Cuộn phải"
                onClick={() => scrollByAmount(upcomingRef, 1)}
                className={`hidden lg:flex items-center justify-center absolute right-0 top-1/2 -translate-y-1/2 
                w-10 h-10 rounded-full bg-white shadow border z-10
                transition ${upScroll.right ? "opacity-100" : "opacity-0 pointer-events-none"}`}
              >
                <FaChevronRight />
              </button>
            </div>
          )}

        </div>

        <div className="container-x mx-auto mt-10">
          <h2 className="text-2xl font-bold my-6">Phiên đấu giá đã kết thúc</h2>

          {loadingEnded ? (
            <p className="text-center text-gray-500">Đang tải dữ liệu...</p>
          ) : endedAuctions.length === 0 ? (
            <div className="flex items-center justify-center min-h-[200px]">
              <p className="text-center inline-block px-6 py-4 bg-gradient-to-r from-red-400 to-red-600 text-white text-lg font-bold rounded-xl shadow-lg animate-bounce">
                Hiện không có phiên đấu giá nào đã kết thúc.
              </p>
            </div>
          ) : (
            <div className="my-6 relative">

              <button
                aria-label="Cuộn trái"
                onClick={() => scrollByAmount(endedRef, -1)}
                className={`hidden lg:flex items-center justify-center absolute left-0 top-1/2 -translate-y-1/2 
                w-10 h-10 rounded-full bg-white shadow border z-10
                transition ${endScroll.left ? "opacity-100" : "opacity-0 pointer-events-none"}`}
              >
                <FaChevronLeft />
              </button>

              <div
                ref={endedRef}
                onScroll={() => updateScrollButtons(endedRef, setEndScroll)}
                className="
      flex gap-6 overflow-x-auto snap-x snap-mandatory pb-2
      [scrollbar-width:none] [-ms-overflow-style:none]
    "
                style={{ scrollbarWidth: "none" }}
                onLoad={() => updateScrollButtons(endedRef, setEndScroll)}
              >
                {sortEnded(endedAuctions).map((auction) => {
                  const expanded = !!expandedTitle.ended[auction.id];
                  return (
                    <div
                      key={auction.id}
                      className="
            snap-start flex-none
            w-[85%] sm:w-[55%] lg:w-[33.333%] xl:w-[33.333%]
          "
                    >
                      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 transition hover:shadow-2xl">
                        <div className="relative">
                          <img
                            src={auction.variant?.images?.[0]?.image_url || "https://via.placeholder.com/300x200"}
                            alt={auction.variant?.product?.name}
                            className="w-full h-48 object-contain bg-gray-100 p-3"
                          />
                          <span className="absolute top-2 left-2 text-xs font-semibold px-2 py-1 rounded bg-red-100 text-red-600">
                            ĐÃ KẾT THÚC
                          </span>
                        </div>

                        <div className="p-4">
                          <h3
                            ref={setTitleRef("ended", auction.id)}
                            className={`text-lg font-semibold text-gray-800 mb-2
                  ${expanded ? "" : "line-clamp-2"}
                  min-h-[3.55rem]
                `}
                          >
                            {auction.variant?.product?.name || "Không có tên sản phẩm"} ({auction.variant?.sku})
                          </h3>
                          <div className="min-h-[1.5rem]">
                            {overflowTitle.ended?.[auction.id] && (
                              <button
                                className="text-blue-500 text-sm mb-1"
                                onClick={() => toggleTitle("ended", auction.id)}
                              >
                                {expanded ? "Ẩn bớt" : "Xem thêm"}
                              </button>
                            )}
                          </div>
                          <div className="flex justify-between text-sm font-medium mb-2">
                            <div className="text-green-600">
                              Giá khởi điểm:{" "}
                              <strong>{Number(auction.variant?.price || 0).toLocaleString("vi-VN")} ₫</strong>
                            </div>
                            <div className="text-pink-600">
                              Bước giá:{" "}
                              <strong>{Number(auction.priceStep || 0).toLocaleString("vi-VN")} ₫</strong>
                            </div>
                          </div>

                          <div className="text-gray-500 text-sm mb-4">
                            Thời gian kết thúc:{" "}
                            <strong>
                              {auction.end_time
                                ? auction.end_time.replace("T", " ").substring(0, 19)
                                : "—"}
                            </strong>
                          </div>

                          <Link
                            to={{ pathname: `/AcutionsDetail/${auction.variant?.product?.slug}` }}
                            state={{ productId: auction.variant?.product?.id, auctionId: auction.id }}
                            className="w-full block text-center py-2 bg-gradient-to-r from-blue-500 to-indigo-600 
text-white rounded-lg font-semibold shadow hover:from-blue-600 hover:to-indigo-700 transition"
                          >
                            Xem chi tiết
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                aria-label="Cuộn phải"
                onClick={() => scrollByAmount(endedRef, 1)}
                className={`hidden lg:flex items-center justify-center absolute right-0 top-1/2 -translate-y-1/2 
                w-10 h-10 rounded-full bg-white shadow border z-10
                transition ${endScroll.right ? "opacity-100" : "opacity-0 pointer-events-none"}`}
              >
                <FaChevronRight />
              </button>
            </div>

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

        {otpRequested && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Xác thực OTP
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Mã OTP đã được gửi đến email của bạn. Vui lòng nhập mã để vào
                phòng đấu giá.
              </p>

              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="Nhập mã OTP (6 số)"
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                disabled={verifying}
              />

              <div className="flex items-center justify-end gap-3">
                <button
                  className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50"
                  onClick={handleCancelOtp}
                  disabled={verifying}
                >
                  Hủy
                </button>
                <button
                  className={`px-5 py-2 rounded-lg text-white ${verifying ? "bg-blue-300" : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  onClick={handleVerifyOtp}
                  disabled={verifying || !otp.trim()}
                >
                  {verifying ? "Đang xác thực..." : "Xác nhận"}
                </button>
              </div>

              <p className="text-xs text-gray-500 mt-3">
                * OTP có hiệu lực trong 10 phút. Nếu không nhận được email, hãy
                kiểm tra hộp thư rác (Spam).
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default AuctionProductDetail;
