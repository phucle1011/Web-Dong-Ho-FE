import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import ProductCardStyleOne from "../Helpers/Cards/ProductCardStyleOne";
import useCountDown from "../Helpers/CountDown";
import Layout from "../Partials/LayoutHomeThree";
import axios from "axios";
import Constants from "../../../Constants";

export default function FlashSale() {
  const location = useLocation();
  const notification = location.state?.notification || null;
  const notification_id = notification.id;
  const end_date = notification.end_date;

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(4);
  const [endDate, setEndDate] = useState("2025-12-31T23:59:59");
  const [bannerUrl, setBannerUrl] = useState("");

  const handleShowMore = () => {
    setVisibleCount((prev) => prev + 12);
  };

  useEffect(() => {
  // Vào trang là cuộn về đầu (tuỳ thích, có thể bỏ behavior nếu muốn nhảy ngay)
  window.scrollTo({ top: 0});

  async function fetchProducts() {
    if (!notification_id) return;
    setLoading(true);
    try {
      const res = await axios.get(
        `${Constants.DOMAIN_API}/client/flashSale/list/${notification_id}`
      );
      // Nếu API trả { data: [...] } thì lấy data, còn không thì lấy trực tiếp res.data
      const productsFromApi = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
        ? res.data
        : [];

      setProducts(productsFromApi);

      // Ưu tiên banner từ notification (nếu có), nếu không thì lấy từ sản phẩm đầu tiên
      const fallback =
        productsFromApi[0]?.thumbnail ||
        productsFromApi[0]?.product?.thumbnail ||
        productsFromApi[0]?.images?.[0]?.image_url ||
        `${process.env.REACT_APP_PUBLIC_URL}/assets/images/flash-sale-ads.png`;

      setBannerUrl(notification?.thumbnail || fallback);
      
      // Gán end date nếu có
      if (end_date) setEndDate(end_date);
    } catch (err) {
      console.error("Lỗi khi load sản phẩm:", err);
      setProducts([]);
      // Khi lỗi thì dùng banner mặc định
      setBannerUrl(`${process.env.REACT_APP_PUBLIC_URL}/assets/images/flash-sale-ads.png`);
    } finally {
      setLoading(false);
    }
  }

  fetchProducts();
}, [notification_id, end_date, notification]);


  const { showDate, showHour, showMinute, showSecound } = useCountDown(endDate);

  return (
    <Layout>
      <div className="flashsale-wrapper w-full">
        <div className="container-x mx-auto">
          <div className="w-full">
            <div
              data-aos="fade-right"
              className="flash-ad w-full h-[400px] flex sm:justify-end justify-center items-center mb-10 relative overflow-hidden rounded-md"
              style={{
                backgroundImage: bannerUrl ? `url("${bannerUrl}")` : "none",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                backgroundSize: "cover",
              }}
            >
              <div className="sm:mr-[75px]">
                <div className="countdown-wrapper w-full flex sm:space-x-6 space-x-3 sm:justify-between justify-evenly">
                  <CountCircle label="Ngày" value={showDate} color="#EB5757" />
                  <CountCircle label="Giờ" value={showHour} color="#2F80ED" />
                  <CountCircle
                    label="Phút"
                    value={showMinute}
                    color="#219653"
                  />
                  <CountCircle
                    label="Giây"
                    value={showSecound}
                    color="#EF5DA8"
                  />
                </div>
              </div>
            </div>

            <div className="products grid xl:grid-cols-4 lg:grid-cols-3 sm:grid-cols-2 grid-cols-1 xl:gap-[30px] gap-5">
              {loading ? (
                <p className="text-center col-span-4 text-gray-500 italic">
                  Đang tải khuyến mãi...
                </p>
              ) : products.length > 0 ? (
                products.slice(0, visibleCount).map((product) => (
                  <div key={product.id} className="item" data-aos="fade-up">
                    <ProductCardStyleOne datas={product} />
                  </div>
                ))
              ) : (
                <p className="text-center col-span-4 text-gray-500 italic">
                  Không có sản phẩm khuyến mãi
                </p>
              )}
            </div>

            {!loading && products.length > visibleCount && (
              <div className="w-full flex justify-center mt-8">
                <button
                  onClick={handleShowMore}
                  className="px-6 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 font-semibold shadow transition"
                >
                  Xem thêm
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

function CountCircle({ value, label, color }) {
  return (
    <div className="countdown-item">
      <div className="countdown-number sm:w-[100px] sm:h-[100px] w-[50px] h-[50px] rounded-full bg-white flex justify-center items-center">
        <span className={`font-700 sm:text-[30px] text-base`} style={{ color }}>
          {value}
        </span>
      </div>
      <p className="sm:text-[18px] text-xs font-500 text-center leading-8 text-white">
        {label}
      </p>
    </div>
  );
}
