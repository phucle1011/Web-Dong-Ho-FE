import { useState, useEffect } from "react";
import axios from "axios";
import Constants from "../../../Constants";
import BreadcrumbCom from "../BreadcrumbCom";
import ProductCardStyleOne from "../Helpers/Cards/ProductCardStyleOne";
import DataIteration from "../Helpers/DataIteration";
import Layout from "../Partials/LayoutHomeThree";
import ProductsFilter from "./ProductsFilter";
import {
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";

export default function AllProductPage() {
  const [products, setProducts] = useState([]);
  const [categoryFilters, setCategoryFilters] = useState({});
  const [brandFilters, setBrandFilters] = useState({});
  



  const [pagination, setPagination] = useState({
    currentPage: 1,
    limit: 12,
    totalProducts: 0,
  });
  const [filters, setFilter] = useState({
    mobileLaptop: false,
    gaming: false,
    imageVideo: false,
    vehicles: false,
    furnitures: false,
    sport: false,
    foodDrinks: false,
    fashion: false,
    toilet: false,
    makeupCorner: false,
    babyItem: false,
  });
  const navigate = useNavigate();
  const [volume, setVolume] = useState([0, 1000000000]);
  const [filterToggle, setToggle] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [brandList, setBrandList] = useState([]);
  const location = useLocation();
  const brandId = location.state?.brandId;
  const categoryId = location.state?.categoryId;

   const searchParams = new URLSearchParams(location.search);
  const keyword = searchParams.get("keyword") || "";
  const searchBrandIds = searchParams.get("brand_ids") || "";
  const searchAttrVals = searchParams.get("attribute_values") || "";
  const searchAttrIds = searchParams.get("attribute_ids") || "";

  useEffect(() => {
    async function fetchBrands() {
      try {
        const res = await axios.get(`${Constants.DOMAIN_API}/brands/active`, {
          params: { page: 1, limit: 100 },
        });
        if (Array.isArray(res.data.data)) {
          setBrandList(res.data.data);
          const updatedFilters = { ...filters };
          res.data.data.forEach((brand) => {
            updatedFilters[brand.id.toString()] = false;
          });
          setFilter(updatedFilters);
        }
      } catch (error) {
        console.error("Lỗi khi lấy danh sách thương hiệu:", error);
      }
    }
    fetchBrands();
  }, []);

  const checkboxHandler = (e) => {
    const { name } = e.target;
    setFilter((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const volumeHandler = (newVolume) => {
    setVolume(Array.isArray(newVolume) ? newVolume : [0, 1000000000]);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const resetFilters = () => {
    setFilter({
      mobileLaptop: false,
      gaming: false,
      imageVideo: false,
      vehicles: false,
      furnitures: false,
      sport: false,
      foodDrinks: false,
      fashion: false,
      toilet: false,
      makeupCorner: false,
      babyItem: false,
    });
    setVolume([0, 1000000000]);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const applyFilters = ({ filters, volume }) => {
    setFilter(filters);
    setVolume(volume);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const selectedCategoryIds = Object.keys(categoryFilters || {}).filter(
          (key) => categoryFilters[key]
        );
        const selectedBrandIds = Object.keys(brandFilters || {}).filter(
          (key) => brandFilters[key]
        );

        const isFiltering =
          selectedCategoryIds.length > 0 ||
          selectedBrandIds.length > 0 ||
          volume[0] !== 0 ||
          volume[1] !== 1000000000;


        // NEW: Nhánh tìm kiếm theo từ khóa / thuộc tính nếu có query trên URL
        const hasSearchQuery =
          (keyword && keyword.trim() !== "") ||
          (searchAttrVals && searchAttrVals.trim() !== "") ||
          (searchAttrIds && searchAttrIds.trim() !== "");

        if (hasSearchQuery) {
          const res = await axios.get(
            `${Constants.DOMAIN_API}/products/search`,
            {
              params: {
                keyword: keyword || undefined,
                attribute_values: searchAttrVals || undefined,
                attribute_ids: searchAttrIds || undefined,
                page: pagination.currentPage,
                limit: pagination.limit,
              },
              headers: { "Cache-Control": "no-cache" },
            }
          );

          setProducts(Array.isArray(res.data.data) ? res.data.data : []);
          setPagination((prev) => ({
            ...prev,
            totalProducts:
              res.data.pagination?.totalItems ??
              res.data.pagination?.totalProducts ??
              (Array.isArray(res.data.data) ? res.data.data.length : 0),
          }));
          setError(null);
          return; // dừng để không rơi xuống nhánh /products
        }


        // 👉 Nếu có brandId từ location và chưa lọc gì khác, ưu tiên gọi riêng
        if (brandId && !isFiltering) {
          const res = await axios.get(`${Constants.DOMAIN_API}/products`, {
            params: { brand_id: brandId },
            headers: { "Cache-Control": "no-cache" },
          });


          setProducts(res.data.data || []);
          setPagination((prev) => ({
            ...prev,
            totalProducts: res.data.pagination?.totalProducts || 0,
          }));
          setError(null);
          return; // 🛑 dừng tại đây để không gọi thêm lần nữa
        }
        if (categoryId && !isFiltering) {
          const res = await axios.get(`${Constants.DOMAIN_API}/products`, {
            params: { category_id: categoryId },
            headers: { "Cache-Control": "no-cache" },
          });


          setProducts(res.data.data || []);
          setPagination((prev) => ({
            ...prev,
            totalProducts: res.data.pagination?.totalProducts || 0,
          }));
          setError(null);
          return; // 🛑 dừng tại đây để không gọi thêm lần nữa
        }

        const params = {
          page: pagination.currentPage,
          limit: pagination.limit,
          min_price: volume[0] !== 0 ? volume[0] : undefined,
          max_price: volume[1] !== 1000000000 ? volume[1] : undefined,
          category_id: selectedCategoryIds.join(",") || undefined,
          brand_id: selectedBrandIds.join(",") || undefined,
        };
        

        const res = await axios.get(`${Constants.DOMAIN_API}/products`, {
          params,
          headers: { "Cache-Control": "no-cache" },
        });

        setProducts(Array.isArray(res.data.data) ? res.data.data : []);
        setPagination((prev) => ({
          ...prev,
          totalProducts: res.data.pagination?.totalProducts || 0,
        }));
        navigate(location.pathname, { replace: true }); // Xóa state
        window.scrollTo({ top: 0, behavior: "instant" }); // hoặc "smooth"

        setError(null);
      } catch (error) {
        console.error("API Error:", error.response?.data || error.message);

        let errorMessage =
          "Không thể tải danh sách sản phẩm. Vui lòng thử lại hoặc thay đổi bộ lọc.";
        if (error.response?.status === 400) {
          errorMessage =
            "Tham số bộ lọc không hợp lệ. Vui lòng kiểm tra lại các bộ lọc.";
        } else if (error.response?.status === 500) {
          errorMessage = "Lỗi máy chủ. Vui lòng thử lại sau.";
        }

        setProducts([]);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [
    pagination.currentPage,
    categoryFilters,
    brandFilters,
    volume,
    brandId,
    brandList, location.state,
    keyword,
    searchAttrIds,
    searchAttrVals,
  ]);


  const handlePageChange = (newPage) => {
    const totalPages = Math.ceil(pagination.totalProducts / pagination.limit);
    if (newPage >= 1 && newPage <= totalPages) {
      setPagination((prev) => ({ ...prev, currentPage: newPage }));
    } else {
      console.warn("Invalid page change attempt:", { newPage, totalPages });
      if (newPage > totalPages) {
        alert(`Không thể chuyển sang trang ${newPage}. Chỉ có ${totalPages} trang.`);
      }
    }
  };



  const renderPagination = () => {
    const { currentPage, limit, totalProducts } = pagination;
    const totalPages = Math.ceil(totalProducts / limit);
    const showPreviousPage = currentPage > 1;
    const showNextPage = currentPage < totalPages;

    return (
      <div className="flex justify-center mt-6">
        <div className="flex items-center space-x-2">
          {/* Nút "First" */}
          <button
            disabled={!showPreviousPage}
            onClick={() => handlePageChange(1)}
            className="px-3 py-1.5 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
            aria-label="Trang đầu"
          >
            <FaAngleDoubleLeft className="text-gray-600" />
          </button>
          {/* Nút "Previous" */}
          <button
            disabled={!showPreviousPage}
            onClick={() => handlePageChange(currentPage - 1)}
            className="px-3 py-1.5 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
            aria-label="Trang trước"
          >
            <FaChevronLeft className="text-gray-600" />
          </button>

          {/* Các nút trang */}
          {[...Array(totalPages)].map((_, i) => {
            const pageNum = i + 1;
            // Hiển thị tối đa 5 trang: trang hiện tại, 2 trang trước, 2 trang sau
            if (
              (pageNum >= currentPage - 2 && pageNum <= currentPage + 2) &&
              pageNum <= totalPages
            ) {
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`px-4 py-1.5 border border-gray-300 rounded-md transition-colors ${pageNum === currentPage
                    ? "bg-blue-500 text-white"
                    : "bg-white text-gray-700 hover:bg-blue-50"
                    }`}
                  aria-label={`Trang ${pageNum}`}
                >
                  {pageNum}
                </button>
              );
            }
            return null;
          })}

          {/* Nút "Next" */}
          <button
            disabled={!showNextPage}
            onClick={() => handlePageChange(currentPage + 1)}
            className="px-3 py-1.5 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
            aria-label="Trang tiếp theo"
          >
            <FaChevronRight className="text-gray-600" />
          </button>
          {/* Nút "Last" */}
          <button
            disabled={!showNextPage}
            onClick={() => handlePageChange(totalPages)}
            className="px-3 py-1.5 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
            aria-label="Trang cuối"
          >
            <FaAngleDoubleRight className="text-gray-600" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div className="products-page-wrapper w-full py-10">
        <div className="container-x mx-auto max-w-7xl">
          <BreadcrumbCom />
          <div className="w-full lg:flex lg:gap-8">
            <div className="lg:w-[270px] mb-8 lg:mb-0">
              <ProductsFilter
                filterToggle={filterToggle}
                filterToggleHandler={() => setToggle(!filterToggle)}
                volume={volume}
                volumeHandler={volumeHandler}
                onApplyFilters={({ categoryFilters, brandFilters, volume }) => {
                  setCategoryFilters(categoryFilters);
                  setBrandFilters(brandFilters);
                  setVolume(volume);
                  setPagination((prev) => ({ ...prev, currentPage: 1 }));
                }}
              />
              <div className="w-full hidden lg:block h-[295px] overflow-hidden rounded-lg">
                {/* <img
                  src={`${process.env.REACT_APP_PUBLIC_URL}/assets/images/bannera-5.png`}
                  alt="Banner"
                  className="w-full h-full object-cover"
                /> */}
              </div>
            </div>

            <div className="flex-1 ">
              <div className="products-sorting w-full bg-white h-auto md:h-[70px] flex flex-col md:flex-row md:items-center justify-between p-6 mb-10 rounded-lg shadow-sm">
                <div className="w-full flex justify-center">
                  <p className="font-medium text-sm text-gray-600 ">
                    Hiển thị{" "}
                    {products.length > 0
                      ? `${(pagination.currentPage - 1) * pagination.limit + 1}–${Math.min(
                        pagination.currentPage * pagination.limit,
                        pagination.totalProducts
                      )}`
                      : "0"}{" "}
                    và {pagination.totalProducts} kết quả
                  </p>
                </div>
                {/* <div className="flex items-center gap-3">
                  <span className="font-medium text-sm text-gray-600">
                    Sắp xếp theo:
                  </span>
                  <div className="flex items-center gap-2 border-b border-gray-300">
                    <span className="font-medium text-sm text-gray-600">
                      Mặc định
                    </span>
                    <svg
                      width="10"
                      height="6"
                      viewBox="0 0 10 6"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M1 1L5 5L9 1" stroke="#9A9A9A" />
                    </svg>
                  </div>
                </div> */}
                <button
                  onClick={() => setToggle(!filterToggle)}
                  type="button"
                  className="w-10 h-10 rounded flex justify-center items-center border border-yellow-500 text-yellow-500 lg:hidden"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293.707L3.293 7.293A1 1 0 013 6.586V4z"
                    />
                  </svg>
                </button>
              </div>

              {loading && <p className="text-center">Đang tải...</p>}
              {error && <p className="text-center text-red-500">{error}</p>}
              {!loading && products.length === 0 && !error && (
                <p className="text-center text-gray-600">
                  Không có dữ liệu ...
                </p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                {products.length > 0 && (
                  <DataIteration
                    datas={products}
                    startLength={0}
                    endLength={products.length}
                  >
                    {({ datas }) => (
                      <div data-aos="fade-up" key={datas.id}>
                        <ProductCardStyleOne datas={datas} type={3} />
                      </div>
                    )}
                  </DataIteration>
                )}
              </div>
              {products.length > 0 && renderPagination()}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}