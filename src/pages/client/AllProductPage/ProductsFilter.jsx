import Checkbox from '../Helpers/Checkbox';
import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import Constants from '../../../Constants';
import { useLocation } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

export default function ProductsFilter({
  className,
  filterToggle,
  filterToggleHandler,
  onApplyFilters = () => {},
}) {
  const location = useLocation();
  const categoryIdFromNav = location.state?.categoryId;

  const [tempVolume] = useState([0, 1000000000]);
  const [categoryList, setCategoryList] = useState([]);
  const [categoryPagination, setCategoryPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    limit: 10,
  });

  const [categoryFilters, setCategoryFilters] = useState({});
  const [brandFilters, setBrandFilters] = useState({});
  const [brandList, setBrandList] = useState([]);
  const [brandPagination, setBrandPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    limit: 20,
  });

  // 🔒 Giữ ref cho onApplyFilters để không đưa vào deps
  const onApplyFiltersRef = useRef(onApplyFilters);
  useEffect(() => {
    onApplyFiltersRef.current = onApplyFilters;
  }, [onApplyFilters]);

  useEffect(() => {
    if (categoryIdFromNav) {
      setCategoryFilters((prev) => ({
        ...prev,
        [categoryIdFromNav]: true,
      }));
    }
    // chỉ chạy 1 lần khi mount hoặc khi thay categoryIdFromNav
  }, [categoryIdFromNav]);

  const handleCategoryChange = (e) => {
    const { name, checked } = e.target;
    setCategoryFilters((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleBrandChange = (e) => {
    const { name, checked } = e.target;
    setBrandFilters((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  // ✅ Chỉ phụ thuộc vào dữ liệu filter, không phụ thuộc vào onApplyFilters
  useEffect(() => {
    const payload = {
      categoryFilters,
      brandFilters,
      volume: tempVolume,
    };
    onApplyFiltersRef.current(payload);
  }, [categoryFilters, brandFilters, tempVolume]);

  // Lấy tất cả thương hiệu (không phân trang)
  const fetchAllBrands = async () => {
    try {
      const res = await axios.get(`${Constants.DOMAIN_API}/brand/list`, {
        params: {
          limit: 1000,
          status: 'active',
          hasProduct: true,
        },
      });

      if (Array.isArray(res.data?.data)) {
        setBrandList(res.data.data);
        // Không cần phân trang brand nữa
        setBrandPagination((prev) => ({
          ...prev,
          totalPages: 1,
          currentPage: 1,
        }));
      } else {
        setBrandList([]);
      }
    } catch (error) {
      console.error('Error fetching brands:', error);
      setBrandList([]);
    }
  };

  useEffect(() => {
    fetchAllBrands();
  }, []);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await axios.get(`${Constants.DOMAIN_API}/category/list`, {
          params: {
            page: categoryPagination.currentPage,
            limit: categoryPagination.limit,
          },
        });
        if (Array.isArray(res.data?.data)) {
          setCategoryList(res.data.data);
          setCategoryPagination((prev) => ({
            ...prev,
            totalPages: res.data.pagination?.totalPages || 1,
            currentPage: res.data.pagination?.currentPage || 1,
          }));
        } else {
          setCategoryList([]);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        setCategoryList([]);
      }
    }
    fetchCategories();
  }, [categoryPagination.currentPage, categoryPagination.limit]);

  const handleCategoryPageChange = (newPage) => {
    if (newPage >= 1 && newPage <= categoryPagination.totalPages) {
      setCategoryPagination((prev) => ({ ...prev, currentPage: newPage }));
    }
  };

  return (
    <div
      className={`filter-widget w-full fixed lg:relative left-0 top-0 h-screen z-10 lg:h-auto overflow-y-scroll lg:overflow-y-auto bg-white px-[30px] pt-[40px] ${className || ''} ${filterToggle ? 'block' : 'hidden lg:block'}`}
    >
      {/* Danh mục */}
      <div className="filter-subject-item pb-10 border-b border-qgray-border">
        <div className="subject-title mb-[30px]">
          <h1 className="text-black text-base font-500">Danh mục sản phẩm</h1>
        </div>
        <div className="filter-items">
          <ul>
            {categoryList.map((cat) => (
              <li key={cat.id} className="item flex justify-between items-center mb-5">
                <div className="flex space-x-[14px] items-center">
                  <Checkbox
                    id={`cat-${cat.id}`}
                    name={cat.id.toString()}
                    handleChange={handleCategoryChange}
                    checked={!!categoryFilters[cat.id]}
                  />
                  <label htmlFor={`cat-${cat.id}`} className="text-xs font-black font-400 capitalize">
                    {cat.name}
                  </label>
                </div>
              </li>
            ))}
          </ul>

          {categoryPagination.totalPages > 1 && (
            <div className="flex justify-center mt-4 space-x-2">
              <button
                onClick={() => handleCategoryPageChange(categoryPagination.currentPage - 1)}
                disabled={categoryPagination.currentPage === 1}
                className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-full text-gray-500 hover:bg-gray-100 disabled:opacity-40"
                title="Trang trước"
              >
                <FaChevronLeft size={12} />
              </button>

              <button
                onClick={() => handleCategoryPageChange(categoryPagination.currentPage + 1)}
                disabled={categoryPagination.currentPage === categoryPagination.totalPages}
                className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-full text-gray-500 hover:bg-gray-100 disabled:opacity-40"
                title="Trang sau"
              >
                <FaChevronRight size={12} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Thương hiệu */}
      <div className="filter-subject-item pb-10 border-b border-qgray-border mt-10">
        <div className="subject-title mb-[30px]">
          <h1 className="text-black text-base font-500">Thương hiệu</h1>
        </div>
        <div className="filter-items">
          <ul>
            {brandList.length > 0 ? (
              brandList.map((brand) => (
                <li key={brand.id} className="item flex justify-between items-center mb-5">
                  <div className="flex space-x-[14px] items-center">
                    <Checkbox
                      id={`brand-${brand.id}`}
                      name={brand.id.toString()}
                      handleChange={handleBrandChange}
                      checked={!!brandFilters[brand.id?.toString()]}
                    />
                    <label htmlFor={`brand-${brand.id}`} className="text-xs font-black font-400 capitalize">
                      {brand.name}
                    </label>
                  </div>
                </li>
              ))
            ) : (
              <li className="text-xs text-qblack font-400">Không có thương hiệu nào</li>
            )}
          </ul>
        </div>
      </div>

      <div className="w-full hidden lg:block h-[295px]">
        <img
          src="https://res.cloudinary.com/disgf4yl7/image/upload/v1755329037/kbf31cpkz45velmk5hxe.jpg"
          alt="Quảng cáo"
          className="w-full h-full object-contain"
        />
      </div>

      <button
        onClick={filterToggleHandler}
        type="button"
        className="w-10 h-10 fixed top-5 right-5 z-50 rounded lg:hidden flex justify-center items-center border border-qred text-qred"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  );
}
