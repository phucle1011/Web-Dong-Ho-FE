import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Arrow from "../../Helpers/icons/Arrow";
import axios from "axios";
import Constants from "../../../../Constants";

export default function Navbar({ className, type }) {
  const [categoryToggle, setToggle] = useState(false);
  const [elementsSize, setSize] = useState("0px");
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [wishlistCount, setWishlistCount] = useState(0);


  const handler = () => {
    setToggle(!categoryToggle);
  };

  const fetchWishlistCount = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setWishlistCount(0);
        return;
      }
      const decoded = decodeToken(token);
      const userId = decoded?.id;
      if (!userId) {
        setWishlistCount(0);
        return;
      }
      const res = await axios.get(
        `${Constants.DOMAIN_API}/users/${userId}/wishlist`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const list = Array.isArray(res.data?.data) ? res.data.data : [];
      setWishlistCount(list.length);
    } catch (e) {
      setWishlistCount(0);
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${Constants.DOMAIN_API}/category/list`);
        if (Array.isArray(res.data.data)) {
          setCategories(res.data.data);
        } else {
          setCategories([]);
          setError("Dữ liệu danh mục không hợp lệ");
        }
      } catch (error) {
        console.error("Lỗi khi lấy danh mục:", error);
        setError("Không thể tải danh mục");
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
    fetchWishlistCount();

    const onWLChanged = () => fetchWishlistCount();
    window.addEventListener("wishlist:changed", onWLChanged);

    const onStorage = (e) => {
      if (e.key === "wishlistUpdatedAt") fetchWishlistCount();
    };
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("wishlist:changed", onWLChanged);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    if (categoryToggle) {
      const totalItems = categories.length + 1;
      setSize(`${42 * totalItems}px`);
    } else {
      setSize("0px");
    }
  }, [categoryToggle, categories]);

  return (
    <div
      className={`nav-widget-wrapper w-full h-[60px] relative z-30 ${type === 3 ? "bg-qh3-blue" : "bg-qyellow"
        } ${className || ""}`}
    >
      <div className="container-x mx-auto h-full">
        <div className="w-full h-full relative">
          <div className="w-full h-full flex justify-between items-center">
            <div className="category-and-nav flex xl:space-x-7 space-x-3 items-center">
              <div className="category w-[270px] h-[43px] bg-white px-5 rounded-t-md mt-[6px] relative">
                <button
                  onClick={handler}
                  type="button"
                  className="w-full h-full flex justify-between items-center"
                >
                  <div className="flex space-x-3 items-center">
                    <span>
                      <svg
                        className="fill-current"
                        width="14"
                        height="9"
                        viewBox="0 0 14 9"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <rect width="14" height="1" />
                        <rect y="8" width="14" height="1" />
                        <rect y="4" width="10" height="1" />
                      </svg>
                    </span>
                    <span className="text-sm font-600 text-qblacktext">
                      Tất cả danh mục
                    </span>
                  </div>
                  <div>
                    <Arrow
                      width="5.78538"
                      height="1.28564"
                      className="fill-current text-qblacktext"
                    />
                  </div>
                </button>

                {categoryToggle && (
                  <div
                    className="fixed top-0 left-0 w-full h-full -z-10"
                    onClick={handler}
                  ></div>
                )}

                <div
                  className="category-dropdown w-full absolute left-0 top-[53px] overflow-hidden z-50"
                  style={{ height: elementsSize }}
                >
                  <ul className="categories-list">
                    {loading && (
                      <li className="text-sm text-qblack">Đang tải...</li>
                    )}
                    {error && <li className="text-sm text-red-500">{error}</li>}
                    {!loading && categories.length === 0 && (
                      <li className="text-sm text-qblack">
                        Không có danh mục nào
                      </li>
                    )}
                    {categories.map((category) => (
                      <li key={category.id} className="category-item">
                        <Link to="/all-products" state={{ categoryId: category.id }}>
                          <div
                            className={`flex justify-between items-center px-5 h-10 bg-white transition-all duration-300 ease-in-out cursor-pointer text-qblack ${type === 3
                                ? "hover:bg-qh3-blue hover:text-white"
                                : "hover:bg-qyellow"
                              }`}
                          >
                            <span className="text-sm font-600 text-qblacktext">
                              {category.name}
                            </span>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="nav">
                <ul className="nav-wrapper flex xl:space-x-10 space-x-5">
                  <li>
                    <Link
                      to="/"
                      className={`text-sm font-600 ${type === 3 ? "text-white" : "text-qblacktext"
                        }`}
                    >
                      Trang chủ
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/all-products"
                      className={`text-sm font-600 ${type === 3 ? "text-white" : "text-qblacktext"
                        }`}
                    >
                      Sản phẩm
                    </Link>
                  </li>
                  <li className="relative">
                    <Link
                      to="#"
                      className={`flex items-center text-sm font-600 cursor-pointer ${type === 3 ? "text-white" : "text-qblacktext"
                        }`}
                    >
                      Trang
                      <span className="ml-1.5 flex items-center">
                        <Arrow className="fill-current" />
                      </span>
                    </Link>
                    <div className="sub-menu w-[220px] absolute left-0 top-[60px]">
                      <div
                        className="w-full bg-white"
                        style={{
                          boxShadow: "0px 15px 50px 0px rgba(0, 0, 0, 0.14)",
                        }}
                      >
                        <div className="p-5">
                          <ul className="flex flex-col space-y-2">
                            <li>
                              <Link to="/privacy-policy">
                                <span
                                  className={`text-qgray text-sm font-400 hover:text-qyellow`}
                                >
                                  Chính sách bảo mật
                                </span>
                              </Link>
                            </li>
                            <li>
                              <Link to="/terms-condition">
                                <span
                                  className={`text-qgray text-sm font-400 hover:text-qyellow`}
                                >
                                  Điều khoản - Điều kiện
                                </span>
                              </Link>
                            </li>
                            <li>
                              <Link to="/faq">
                                <span
                                  className={`text-qgray text-sm font-400 hover:text-qyellow`}
                                >
                                  Câu hỏi thường gặp
                                </span>
                              </Link>
                            </li>
                            <li>
                              <Link to="/all-products">
                                <span
                                  className={`text-qgray text-sm font-400 hover:text-qyellow`}
                                >
                                  Sản phẩm
                                </span>
                              </Link>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </li>
                  <li>
                    <Link to="/about">
                      <span
                        className={`text-sm font-600 ${type === 3 ? "text-white" : "text-qblacktext"
                          }`}
                      >
                        Về chúng tôi
                      </span>
                    </Link>
                  </li>
                  <li>
                    <Link to="/blogs">
                      <span
                        className={`text-sm font-600 ${type === 3 ? "text-white" : "text-qblacktext"
                          }`}
                      >
                        Tin tức
                      </span>
                    </Link>
                  </li>
                  <li>
                    <Link to="/contact">
                      <span
                        className={`text-sm font-600 ${type === 3 ? "text-white" : "text-qblacktext"
                          }`}
                      >
                        Liên hệ
                      </span>
                    </Link>
                  </li>
                  <li>
                    <Link to="/Auctions">
                      <span
                        className={`text-sm font-600 ${type === 3 ? "text-white" : "text-qblacktext"
                          }`}
                      >
                        Đấu giá
                      </span>
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
