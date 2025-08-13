import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import Constants from "../../../../Constants.jsx";
import FormDelete from "../../../../components/formDelete";
import {
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaChevronLeft,
  FaChevronRight,
  FaEye,
  FaTrashAlt,
  FaTrash,
  FaEdit,
  FaPlus,
} from "react-icons/fa";
import Select from "react-select";
import { useForm } from "react-hook-form";

const AdminProductList = () => {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [brands, setBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState(""); // dùng để lưu input tạm thời
  const recordsPerPage = 10;
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [publicationStatus, setPublicationStatus] = useState("published");
  const [publishedCount, setPublishedCount] = useState(0);
  const [draftCount, setDraftCount] = useState(0);
  const [auctionCount, setAuctionCount] = useState(0);
  const {
    register,
    handleSubmit,
    setValue,
    trigger,
    formState: { errors },
  } = useForm();
  const brandOptions = brands.map((brand) => ({
    value: brand.id,
    label: brand.name,
  }));
  const categoryOptions = categories.map((cat) => ({
    label: cat.name,
    value: cat.id,
  }));

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const res = await axios.get(`${Constants.DOMAIN_API}/admin/product/get-brand`);
        setBrands(res.data.data || []);
      } catch (error) {
        console.error("Lỗi khi lấy danh sách thương hiệu:", error);
      }
    };
    fetchBrands();
  }, []);

  // Gọi API lấy danh mục
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(
          `${Constants.DOMAIN_API}/admin/product/get-category`
        );
        setCategories(res.data.data || []);
      } catch (error) {
        console.error("Lỗi khi lấy danh mục:", error);
      }
    };
    fetchCategories();
  }, []);
  useEffect(() => {
    const hasSearch = searchTerm || selectedCategory || selectedBrand;

    if (hasSearch) {
      searchProducts(
        currentPage,
        searchTerm,
        selectedCategory?.value || "",
        selectedBrand?.value || "", // thêm kiểm tra null
        publicationStatus
      );
    } else {
      fetchProducts(currentPage, searchTerm);
    }
  }, [
    currentPage,
    searchTerm,
    selectedCategory,
    selectedBrand,
    publicationStatus,
  ]);

  // Tách hàm search riêng
  const searchProducts = async (page, search, categoryId = "", brandId = "", status = "") => {
  try {
    const isAuction = status === "auction";
    const url = isAuction
      ? `${Constants.DOMAIN_API}/admin/published-auction-products`
      : `${Constants.DOMAIN_API}/admin/products/productList/search`;

    const params = {
      page,
      limit: recordsPerPage,
      ...(search && { searchTerm: search }),
      ...(categoryId && { categoryId }),
      ...(brandId && { brandId }),
      ...(!isAuction && status && { publicationStatus: status }),
    };

    const [resMain, resPublished, resDraft, resAuction] = await Promise.all([
      axios.get(url, { params }),
      axios.get(`${Constants.DOMAIN_API}/admin/products/published`, { params: { page: 1, limit: 1 } }),
      axios.get(`${Constants.DOMAIN_API}/admin/products/draft`, { params: { page: 1, limit: 1 } }),
      axios.get(`${Constants.DOMAIN_API}/admin/published-auction-products`, { params: { page: 1, limit: 1 } }),
    ]);

    setPublishedCount(resPublished.data.pagination?.totalProducts || 0);
    setDraftCount(resDraft.data.pagination?.totalProducts || 0);
    setAuctionCount(resAuction.data.pagination?.totalProducts || 0);

    setProducts(resMain.data.data);
    setTotalPages(resMain.data.pagination?.totalPages || 1);
  } catch (error) {
    console.error("Lỗi khi tìm kiếm sản phẩm:", error);
    setProducts([]);
    setTotalPages(1);
  }
};


  const deleteProduct = async () => {
  if (!selectedProduct) return;

  try {
    await axios.delete(
      `${Constants.DOMAIN_API}/admin/products/${selectedProduct.id}`
    );
    toast.success("Xóa sản phẩm thành công");
    if (products.length === 1 && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    } else {
      fetchProducts(currentPage, searchTerm);
    }
  } catch (error) {
    console.error("Lỗi khi xóa sản phẩm:", error);
    if (
      error.response?.data?.error?.includes("foreign key constraint fails")
    ) {
      toast.error("Không thể xóa vì dữ liệu liên quan không thể xóa.");
    } else {
      toast.error("Xóa thất bại. Vui lòng thử lại.");
    }
  } finally {
    setSelectedProduct(null);
  }
};


const fetchProducts = async (page, search = "") => {
  try {
    const params = { page, limit: 10 };
    let url = "";
    const isAuction = publicationStatus === "auction";

    // gắn filter chung (nếu có)
    const categoryId = selectedCategory?.value;
    const brandId = selectedBrand?.value;
    if (categoryId) params.categoryId = categoryId;
    if (brandId) params.brandId = brandId;

    if (search) {
      if (isAuction) {
        url = `${Constants.DOMAIN_API}/admin/published-auction-products`;
        params.searchTerm = search;
      } else {
        url = `${Constants.DOMAIN_API}/admin/products/productList/search`;
        params.searchTerm = search;
        if (publicationStatus) params.publicationStatus = publicationStatus;
      }
    } else {
      url =
        publicationStatus === "published"
          ? `${Constants.DOMAIN_API}/admin/products/published`
          : publicationStatus === "draft"
          ? `${Constants.DOMAIN_API}/admin/products/draft`
          : `${Constants.DOMAIN_API}/admin/published-auction-products`; // auction
    }

    const [resMain, resPublished, resDraft, resAuction] = await Promise.all([
      axios.get(url, { params }),
      axios.get(`${Constants.DOMAIN_API}/admin/products/published`, { params: { page: 1, limit: 1 } }),
      axios.get(`${Constants.DOMAIN_API}/admin/products/draft`, { params: { page: 1, limit: 1 } }),
      axios.get(`${Constants.DOMAIN_API}/admin/published-auction-products`, { params: { page: 1, limit: 1 } }),
    ]);

    setPublishedCount(resPublished.data.pagination?.totalProducts || 0);
    setDraftCount(resDraft.data.pagination?.totalProducts || 0);
    setAuctionCount(resAuction.data.pagination?.totalProducts || 0);

    setProducts(resMain.data.data);
    setTotalPages(resMain.data.pagination?.totalPages || 1);
  } catch (error) {
    console.error("Lỗi khi lấy sản phẩm:", error);
    setProducts([]);
    setTotalPages(1);
  }
};



  const handleSearchInputChange = (e) => {
    setSearchInput(e.target.value);
  };

  const handleSearchSubmit = async () => {
  const trimmedSearch = (searchInput || "").trim();
  setCurrentPage(1);

  const categoryId = selectedCategory?.value || "";
  const brandId = selectedBrand?.value || "";
  const isAuction = publicationStatus === "auction";

  if (!trimmedSearch && !categoryId && !brandId) {
    setSearchTerm("");
    fetchProducts(1, "");
    return;
  }

  try {
    const url = isAuction
      ? `${Constants.DOMAIN_API}/admin/published-auction-products`
      : `${Constants.DOMAIN_API}/admin/products/productList/search`;

    const params = {
      page: 1,
      limit: recordsPerPage,
      ...(trimmedSearch && { searchTerm: trimmedSearch }),
      ...(categoryId && { categoryId }),
      ...(brandId && { brandId }),
      ...(!isAuction && publicationStatus && { publicationStatus }),
    };

    const res = await axios.get(url, { params });
    setProducts(res.data.data);
    setTotalPages(res.data.pagination?.totalPages || 1);
    setSearchTerm(trimmedSearch);
  } catch (error) {
    console.error("Lỗi khi tìm kiếm sản phẩm:", error);
    setProducts([]);
    setTotalPages(1);
  }
};


  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  const handlePublish = async (productId) => {
    try {
      await axios.put(`${Constants.DOMAIN_API}/admin/products/${productId}`, {
        publication_status: "published", // gửi trạng thái mới
      });
      toast.success("Đã xuất bản sản phẩm");
      fetchProducts();
    } catch (error) {
      toast.error("Lỗi khi xuất bản sản phẩm");
      console.error(error);
    }
  };

  return (
    <div className="container mx-auto p-2">
      <div className="bg-white p-4 shadow rounded-md">
        {/* Tiêu đề + nút nằm cùng hàng */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          {/* Tiêu đề và lọc theo trạng thái */}
          <div className="flex flex-wrap items-center gap-4">
            <h2 className="text-xl font-semibold">Danh sách sản phẩm</h2>
            <div className="flex items-center gap-2">
              {[
                
                  {
                    key: "published",
                    label: "Đã đăng",
                    color: "bg-green-300",
                    textColor: "text-green-800",
                    count: publishedCount,
                  },
                  {
                    key: "draft",
                    label: "Nháp",
                    color: "bg-yellow-300",
                    textColor: "text-yellow-800",
                    count: draftCount,
                  },
                  {
                    key: "auction",
                    label: "Đấu giá",
                    color: "bg-purple-300",
                    textColor: "text-purple-800",
                    count: auctionCount, // bạn có thể thêm đếm nếu muốn
                  },
                
              ].map(({ key, label, color, textColor, count }) => (
                <button
                  key={key}
                  onClick={() => {
                    setPublicationStatus(key);
                    setCurrentPage(1);
                  }}
                  className={`flex items-center gap-2 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-semibold transition ${
                    publicationStatus === key
                      ? "bg-blue-900 text-white"
                      : "bg-white text-gray-700"
                  }`}
                >
                  <span>{label}</span>
                  <span
                    className={`${color} ${textColor} rounded-md px-2 py-0.5 text-xs font-semibold leading-none`}
                  >
                    {count || 0}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Nhóm nút */}
          <div className="flex gap-2">
            <Link
              to="/admin/products/create"
              className="inline-block bg-[#073272] text-white px-4 py-2 rounded"
            >
              + Thêm sản phẩm
            </Link>

            <Link
              to="/admin/attribute/getall"
              className="bg-indigo-500 text-white py-2 px-3 rounded hover:bg-indigo-600 transition flex items-center"
              title="Danh sách thuộc tính"
            >
              <i className="fa-solid fa-list mr-1"></i>
              <span>Danh sách thuộc tính</span>
            </Link>
          </div>
        </div>

        {/* Ô tìm kiếm */}
        <div className="mb-3 flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={handleSearchInputChange}
            placeholder="Tìm kiếm theo tên sản phẩm..."
            className="flex-grow border border-gray-300 rounded py-2 px-4 text-gray-700 leading-tight focus:ring-2 focus:ring-blue-500"
            onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
          />
          <Select
            options={categoryOptions}
            className="basic-single-select"
            classNamePrefix="select"
            value={selectedCategory}
            onChange={(selectedOption) => {
              setSelectedCategory(selectedOption);
              setValue("category_id", selectedOption?.value || "");
              trigger("category_id");
            }}
            placeholder="Chọn danh mục..."
            isClearable
            isSearchable
            menuPortalTarget={document.body}
            styles={{
              menuPortal: (base) => ({ ...base, zIndex: 9999 }),
            }}
          />

          <Select
            options={brandOptions}
            className="basic-single-select"
            classNamePrefix="select"
            value={selectedBrand}
            onChange={(selectedOption) => {
              setSelectedBrand(selectedOption); // ✅ Lưu lại đối tượng đã chọn
              setValue("brand_id", selectedOption?.value || ""); // Gán vào react-hook-form nếu cần
              trigger("brand_id");
            }}
            placeholder="Chọn thương hiệu..."
            isClearable
            isSearchable
            menuPortalTarget={document.body}
            styles={{
              menuPortal: (base) => ({ ...base, zIndex: 9999 }),
            }}
          />

          <button
            onClick={handleSearchSubmit}
            className="bg-blue-900 hover:bg-blue-800 text-white px-4 py-1.5 rounded"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1010.5 3a7.5 7.5 0 006.15 13.65z"
              />
            </svg>
          </button>
        </div>

        {/* Bảng danh sách sản phẩm */}
        <table className="w-full border-collapse border border-gray-500 mt-3">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-2 border whitespace-nowrap">#</th>
              <th className="p-2 border whitespace-nowrap">Tên</th>
              <th className="p-2 border whitespace-nowrap">Ảnh</th>
              <th className="p-2 border whitespace-nowrap">Trạng thái</th>
              <th className="p-2 border whitespace-nowrap">Danh mục</th>
              <th className="p-2 border whitespace-nowrap">Thương hiệu</th>
              <th className="p-2 border whitespace-nowrap">Biến thể</th>
              <th className="p-2 border whitespace-nowrap">Kho</th>
              {publicationStatus === "draft" && (
                <th className="p-2 border whitespace-nowrap">Xuất bản</th>
              )}
              <th className="p-2 border whitespace-nowrap">Hành động</th>
            </tr>
          </thead>

          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan="9" className="p-4 text-center">
                  Không có sản phẩm nào.
                </td>
              </tr>
            ) : (
              products.map((product, index) => (
                <tr key={product.id} className="border-b">
                  <td className="p-2 border">
                    {(currentPage - 1) * recordsPerPage + index + 1}
                  </td>
                  <td className="p-2 border">{product.name}</td>
                  <td className="p-2 border">
                    <img
                      src={product.thumbnail || ""}
                      alt={product.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                  </td>
                  <td className="p-2 border text-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        product.status === 1
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {product.status === 1 ? "Hiển thị" : "Ẩn"}
                    </span>
                  </td>
                  <td className="p-2 border">
                    {product.category?.name || "Không có"}
                  </td>
                  <td className="p-2 border">
                    {product.brand?.name || "Không có"}
                  </td>
                  <td className="p-2 border text-center">
                    {product.variantCount ?? product.variants?.length ?? 0}
                  </td>
                  <td className="p-2 border text-center">
                    {product.variants
                      ? product.variants.reduce(
                          (sum, variant) => sum + (variant.stock || 0),
                          0
                        )
                      : 0}
                  </td>

                  {/* Nếu là nháp thì hiển thị cột Xuất bản */}
                  {publicationStatus === "draft" && (
                    <td className="p-2 border text-center">
                      <button
                        onClick={() => handlePublish(product.id)}
                        className="bg-green-500 text-white px-2 py-1 rounded text-xs"
                      >
                        Xuất bản
                      </button>
                    </td>
                  )}

                  <td className="p-2 border">
                    <div className="flex gap-2 justify-center">
                      <Link
                        to={`/admin/products/detail/${product.id}`}
                        className="bg-blue-500 text-white p-2 rounded"
                        title="Xem chi tiết"
                      >
                        <FaEye size={16} className="font-bold" />
                      </Link>

                      <Link
                        to={`/admin/products/addVariant/${product.id}`}
                        className="bg-yellow-500 text-white p-2 rounded w-8 h-8 inline-flex items-center justify-center"
                        title="Thêm biến thể"
                      >
                        <FaPlus size={20} className="font-bold" />
                      </Link>

                      {product.canDelete && (
                        <button
                          onClick={() => setSelectedProduct(product)}
                          className="p-2 rounded-full bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700 transition duration-200"
                          title="Xoá sản phẩm"
                        >
                          <FaTrashAlt size={20} className="font-bold" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Phân trang */}
        <div className="flex justify-center mt-4">
          <div className="flex items-center space-x-1">
            <button
              disabled={currentPage === 1}
              onClick={() => handlePageChange(1)}
              className="px-2 py-1 border rounded disabled:opacity-50"
            >
              <FaAngleDoubleLeft />
            </button>
            <button
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
              className="px-2 py-1 border rounded disabled:opacity-50"
            >
              <FaChevronLeft />
            </button>

            {currentPage > 2 && (
              <>
                <button
                  onClick={() => handlePageChange(1)}
                  className="px-3 py-1 border rounded"
                >
                  1
                </button>
                {currentPage > 3 && <span className="px-2">...</span>}
              </>
            )}

            {[...Array(totalPages)].map((_, i) => {
              const page = i + 1;
              if (page >= currentPage - 1 && page <= currentPage + 1) {
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-1 border rounded ${
                      currentPage === page
                        ? "bg-blue-500 text-white"
                        : "bg-blue-100 text-black hover:bg-blue-200"
                    }`}
                  >
                    {page}
                  </button>
                );
              }
              return null;
            })}

            {currentPage < totalPages - 1 && (
              <>
                {currentPage < totalPages - 2 && (
                  <span className="px-2">...</span>
                )}
                <button
                  onClick={() => handlePageChange(totalPages)}
                  className="px-3 py-1 border rounded"
                >
                  {totalPages}
                </button>
              </>
            )}

            <button
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
              className="px-2 py-1 border rounded disabled:opacity-50"
            >
              <FaChevronRight />
            </button>
            <button
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(totalPages)}
              className="px-2 py-1 border rounded disabled:opacity-50"
            >
              <FaAngleDoubleRight />
            </button>
          </div>
        </div>
      </div>

      {/* Modal xác nhận xoá sản phẩm */}
      {selectedProduct && (
        <FormDelete
          isOpen={true}
          onClose={() => setSelectedProduct(null)}
          onConfirm={deleteProduct}
          message={`Bạn có chắc chắn muốn xóa sản phẩm "${selectedProduct.name}" không?`}
        />
      )}
    </div>
  );
};

export default AdminProductList;
