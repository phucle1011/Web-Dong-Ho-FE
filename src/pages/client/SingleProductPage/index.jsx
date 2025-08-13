import { useRef, useState, useEffect, useCallback } from "react";
import BreadcrumbCom from "../BreadcrumbCom";
import ProductCardStyleOne from "../Helpers/Cards/ProductCardStyleOne";
import InputCom from "../Helpers/InputCom";
import Layout from "../Partials/LayoutHomeThree";
import ProductView from "./ProductView";
import ProductReviewSection from "./Reviews";
import SallerInfo from "./SallerInfo";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import Constants from "../../../Constants";
import { toast } from "react-toastify";

export default function SingleProductPage() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const productId = state?.productId;

  // Reviews (giữ nguyên các state bạn đang có)
  const [tab, setTab] = useState("des");
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [reviewLoading, setLoading] = useState(false);
  const reviewElement = useRef(null);
  const [report, setReport] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);

  // Mô tả + “Xem thêm”
  const MAX_HEIGHT = 300; // px
  const descriptionRef = useRef(null);
  const [description, setDescription] = useState(""); // <- nên dùng string thay vì []
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);

  // --- Fetch dữ liệu sản phẩm + sản phẩm tương tự ---
  useEffect(() => {
    if (!productId) {
      toast.error("Thiếu thông tin sản phẩm!");
      navigate("/all-products");
      return;
    }

    // Chi tiết / mô tả
    axios
      .get(`${Constants.DOMAIN_API}/products/${productId}/variants`)
      .then((res) => {
        // tuỳ API, bạn chọn đường đúng:
        const desc =
          res?.data?.product?.description ??
          res?.data?.data?.product?.description ??
          res?.data?.data?.description ??
          res?.data?.description ??
          "";
        setDescription(typeof desc === "string" ? desc : "");
      })
      .catch((err) => {
        console.error("Lỗi khi gọi API chi tiết sản phẩm:", err);
      });

    // Sản phẩm tương tự
    axios
      .get(`${Constants.DOMAIN_API}/products/${productId}/similar`)
      .then((res) => {
        setRelatedProducts(res?.data?.data ?? []);
      })
      .catch((err) => {
        console.error("Lỗi khi gọi API sản phẩm tương tự:", err);
      });
  }, [productId, navigate]);

  // --- Điều hướng review qua hash ---
  useEffect(() => {
    if (window.location.hash === "#review") {
      setTab("review");
      setTimeout(() => {
        const element = document.getElementById("review-section");
        element?.scrollIntoView({ behavior: "smooth" });
      }, 200);
    }
  }, []);

  useEffect(() => {
    if (window.location.hash.startsWith("#comment-")) {
      setTab("review");
      setTimeout(() => {
        const commentId = window.location.hash.replace("#", "");
        const element = document.getElementById(commentId);
        element?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 400);
    }
  }, []);

  useEffect(() => {
    if (tab === "review") {
      const element = document.getElementById("review-section");
      element?.scrollIntoView({ behavior: "smooth" });
    }
  }, [tab]);

  // --- Check overflow (kể cả khi ảnh trong mô tả load xong) ---
  const checkOverflow = useCallback(() => {
    const el = descriptionRef.current;
    if (!el) return;
    // scrollHeight là chiều cao full của nội dung
    setIsOverflowing(el.scrollHeight > MAX_HEIGHT + 1); // +1 để tránh sai số
  }, [MAX_HEIGHT]);

  // Kiểm tra khi mô tả cập nhật / tab đổi
  useEffect(() => {
    checkOverflow();
  }, [description, tab, checkOverflow]);

  // Lắng nghe load của ảnh + resize container
  useEffect(() => {
    const el = descriptionRef.current;
    if (!el) return;

    const imgs = el.querySelectorAll("img");
    imgs.forEach((img) => {
      // Nếu ảnh chưa load, lắng nghe
      if (!img.complete) {
        img.addEventListener("load", checkOverflow);
        img.addEventListener("error", checkOverflow);
      }
    });

    const ro = new ResizeObserver(() => checkOverflow());
    ro.observe(el);

    // cleanup
    return () => {
      imgs.forEach((img) => {
        img.removeEventListener("load", checkOverflow);
        img.removeEventListener("error", checkOverflow);
      });
      ro.disconnect();
    };
  }, [description, checkOverflow]);

  // Demo action review (giữ nguyên logic của bạn)
  const reviewAction = () => {
    setLoading(true);
    setTimeout(() => {
      if ((name, message, rating)) {
        // ... thêm review vào list (nếu bạn có list)
      }
      setLoading(false);
      setName("");
      setEmail("");
      setPhone("");
      setMessage("");
      setRating(0);
      setHover(0);
      if (reviewElement.current) {
        window.scrollTo({
          top: -reviewElement.current.getBoundingClientRect().top,
          left: 0,
          behavior: "smooth",
        });
      }
    }, 2000);
  };

  return (
    <>
      <Layout childrenClasses="pt-0 pb-0">
        <div className="single-product-wrapper w-full ">
          <div className="product-view-main-wrapper bg-white pt-[30px] w-full">
            <div className="breadcrumb-wrapper w-full ">
              <div className="container-x mx-auto">
                <BreadcrumbCom
                  paths={[
                    { name: "trang chủ", path: "/" },
                    { name: "trang sản phẩm", path: "/all-products" },
                  ]}
                />
              </div>
            </div>
            <div className="w-full bg-white pb-[60px]">
              <div className="container-x mx-auto">
                <ProductView reportHandler={() => setReport(!report)} />
              </div>
            </div>
          </div>

          <div
            className="product-des-wrapper w-full relative pb-[60px]"
            ref={reviewElement}
          >
            <div className="tab-buttons w-full mb-10 mt-5 sm:mt-0">
              <div className="container-x mx-auto">
                <ul className="flex space-x-12 ">
                  <li>
                    <span
                      onClick={() => setTab("des")}
                      className={`py-[15px] sm:text-[15px] text-sm sm:block border-b font-medium cursor-pointer ${
                        tab === "des"
                          ? "border-qyellow text-qblack "
                          : "border-transparent text-qgray"
                      }`}
                    >
                      Mô Tả
                    </span>
                  </li>
                  <li>
                    <span
                      onClick={() => setTab("review")}
                      className={`py-[15px] sm:text-[15px] text-sm sm:block border-b font-medium cursor-pointer ${
                        tab === "review"
                          ? "border-qyellow text-qblack "
                          : "border-transparent text-qgray"
                      }`}
                    >
                      Đánh Giá
                    </span>
                  </li>
                  {/* <li>
                    <span
                      onClick={() => setTab("info")}
                      className={`py-[15px] sm:text-[15px] text-sm sm:block border-b font-medium cursor-pointer ${
                        tab === "info"
                          ? "border-qyellow text-qblack "
                          : "border-transparent text-qgray"
                      }`}
                    >
                      Thông Tin Người Bán
                    </span>
                  </li> */}
                </ul>
              </div>
              <div className="w-full h-[1px] bg-[#E8E8E8] absolute left-0 sm:top-[50px] top-[36px] -z-10"></div>
            </div>
            <div className="tab-contents w-full min-h-[400px] ">
              <div className="container-x mx-auto">
                {tab === "des" && (
  <div data-aos="fade-up" className="w-full tab-content-item">
    <h6 className="text-[18px] font-medium text-qblack mb-2">
      MÔ TẢ
    </h6>

    <div className="relative">
      <div
        ref={descriptionRef}
        className="prose prose-img:rounded-md transition-all duration-300 overflow-hidden"
        style={{
          maxHeight: isExpanded ? "none" : `${MAX_HEIGHT}px`,
        }}
        dangerouslySetInnerHTML={{ __html: description }}
      ></div>

      {!isExpanded && isOverflowing && (
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[rgb(177, 167, 167)] to-transparent pointer-events-none z-10"></div>
      )}
    </div>

    {isOverflowing && (
      <div className="text-center mt-2 z-20 relative">
        <button
          className="text-blue-600 font-semibold"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? "Thu gọn" : "Xem thêm"}
        </button>
      </div>
    )}
  </div>
)}


                {tab === "review" && (
                  <div
                    id="review-section"
                    data-aos="fade-up"
                    className="w-full tab-content-item"
                  >
                    <h6 className="text-[18px] font-medium text-qblack mb-2">
                      ĐÁNH GIÁ SẢN PHẨM
                    </h6>
                    <div className="w-full">
                      <ProductReviewSection productId={productId} />
                    </div>
                  </div>
                )}

                {tab === "info" && (
                  <div data-aos="fade-up" className="w-full tab-content-item">
                    <SallerInfo products={data.products.slice(0, 8)} />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="related-product w-full bg-white">
            <div className="container-x mx-auto">
              <div className="w-full py-[60px]">
                <h1 className="sm:text-3xl text-xl font-600 text-qblacktext leading-none mb-[30px]">
                  Sản Phẩm Tương Tự
                </h1>
                <div
                  data-aos="fade-up"
                  className="grid xl:grid-cols-4 lg:grid-cols-3 sm:grid-cols-2 grid-cols-1 xl:gap-[30px] gap-5"
                >
                  {relatedProducts.map((item) => (
                    <div key={item.id}>
                      <ProductCardStyleOne datas={item} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        {report && (
          <div className="w-full h-full flex fixed left-0 top-0 justify-center z-50 items-center">
            <div
              onClick={() => setReport(!report)}
              className="w-full h-full fixed left-0 right-0 bg-black  bg-opacity-25"
            ></div>
            <div
              data-aos="fade-up"
              className="sm:w-[548px] sm:h-[509px] w-full h-full bg-white relative py-[40px] px-[38px]"
              style={{ zIndex: "999" }}
            >
              <div className="title-bar flex items-center justify-between mb-3">
                <h6 className="text-2xl font-medium">Report Products</h6>
                <span
                  className="cursor-pointer"
                  onClick={() => setReport(!report)}
                >
                  <svg
                    width="54"
                    height="54"
                    viewBox="0 0 54 54"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M26.9399 54.0001C12.0678 53.9832 -0.0210736 41.827 2.75822e-05 26.9125C0.0211287 12.0507 12.1965 -0.0315946 27.115 6.20658e-05C41.9703 0.0317188 54.0401 12.2153 54 27.1404C53.9599 41.9452 41.7972 54.0191 26.9399 54.0001ZM18.8476 16.4088C17.6765 16.4404 16.9844 16.871 16.6151 17.7194C16.1952 18.6881 16.3893 19.5745 17.1363 20.3258C19.0966 22.2906 21.0252 24.2913 23.0425 26.197C23.7599 26.8745 23.6397 27.2206 23.0045 27.8305C21.078 29.6793 19.2148 31.5956 17.3241 33.4802C16.9211 33.8812 16.5581 34.3012 16.4505 34.8857C16.269 35.884 16.6953 36.8337 17.5456 37.3106C18.4382 37.8129 19.5038 37.6631 20.3394 36.8421C22.3673 34.8435 24.3866 32.8365 26.3723 30.7999C26.8513 30.3082 27.1298 30.2871 27.6193 30.7915C29.529 32.7584 31.4851 34.6789 33.4201 36.6184C33.8463 37.0447 34.2831 37.4436 34.9098 37.5491C35.9184 37.7201 36.849 37.2895 37.3196 36.4264C37.7964 35.5548 37.6677 34.508 36.8912 33.7144C34.9731 31.756 33.0677 29.7806 31.0631 27.9149C30.238 27.1467 30.3688 26.7479 31.1031 26.0535C32.9896 24.266 34.8022 22.3982 36.6338 20.5516C37.7922 19.3845 37.8914 17.9832 36.9081 17.0293C35.9501 16.1007 34.5975 16.2146 33.4623 17.3416C31.5188 19.2748 29.5649 21.1995 27.6594 23.1664C27.1446 23.6983 26.8492 23.6962 26.3343 23.1664C24.4267 21.1974 22.4664 19.2811 20.5336 17.3374C19.9997 16.7971 19.4258 16.3666 18.8476 16.4088Z"
                      fill="#F34336"
                    />
                  </svg>
                </span>
              </div>

              <div className="inputs w-full">
                <div className="w-full mb-5">
                  <InputCom
                    label="Enter Report Ttile*"
                    placeholder="Reports Headline here"
                    type="email"
                    name="name"
                    inputClasses="h-[50px]"
                    labelClasses="text-[13px] font-600 leading-[24px] text-qblack"
                  />
                </div>
                <div className="w-full mb-[40px]">
                  <h6 className="input-label  capitalize text-[13px] font-600 leading-[24px] text-qblack block mb-2 ">
                    Enter Report Note*
                  </h6>
                  <textarea
                    name=""
                    id=""
                    cols="30"
                    rows="6"
                    className="w-full focus:ring-0 focus:outline-none py-3 px-4 border border-qgray-border  placeholder:text-sm text-sm"
                    placeholder="Type Here"
                  ></textarea>
                </div>

                <button type="button" className="w-full h-[50px] black-btn">
                  Submit Report
                </button>
              </div>
            </div>
          </div>
        )}
      </Layout>
    </>
  );
}
