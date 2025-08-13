import { useEffect, useState, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import PageTitle from "../Helpers/PageTitle";
import Layout from "../Partials/LayoutHomeThree";
import Constants from "../../../Constants";
import {
  FaChevronLeft,
  FaChevronRight,
  FaSearch,
} from "react-icons/fa";

const PAGE_SIZE = 4;

export default function Blogs() {
  const [blogs, setBlogs] = useState([]);
  const [hotBlogs, setHotBlogs] = useState([]);
  const [page, setPage] = useState(1);
  const [categories, setCategories] = useState([]);

  const [selectedDate, setSelectedDate] = useState("");
  const [tempDate, setTempDate] = useState("");

  const [categoryPage, setCategoryPage] = useState(1);
  const categoriesPerPage = 5;

  const location = useLocation();
  const navigate = useNavigate();

  const params = new URLSearchParams(location.search);
  const categorySlug = params.get("category");

  const totalCategoryPages = Math.ceil(categories.length / categoriesPerPage);
  const pagedCategories = categories.slice(
    (categoryPage - 1) * categoriesPerPage,
    categoryPage * categoriesPerPage
  );

  // ----- Lấy danh sách bài viết -----
  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        let url = categorySlug
          ? `${Constants.DOMAIN_API}/blogs?category=${categorySlug}`
          : `${Constants.DOMAIN_API}/blogs`;

        const response = await fetch(url);
        const data = await response.json();
        let filteredBlogs = data.blogs || [];

        if (selectedDate) {
          filteredBlogs = filteredBlogs.filter((blog) => {
            const blogDate = new Date(blog.created_at).toISOString().split("T")[0];
            return blogDate === selectedDate;
          });
        }

        setBlogs(filteredBlogs);
        setPage(1);
      } catch (error) {
        console.error("Lỗi khi tải danh sách blog:", error);
      }
    };

    fetchBlogs();
  }, [categorySlug, selectedDate]);

  // ----- Hàm lấy bài viết hot -----
  const fetchHotBlogs = useCallback(async () => {
    try {
      const response = await fetch(`${Constants.DOMAIN_API}/blogs/hot?limit=5`);
      const data = await response.json();
      setHotBlogs(data.blogs || []);
    } catch (error) {
      console.error("Lỗi khi tải hot blogs:", error);
    }
  }, []);

  useEffect(() => {
    fetchHotBlogs();
  }, [fetchHotBlogs]);

  // ----- Lấy danh mục -----
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(
          `${Constants.DOMAIN_API}/admin/blogcategory/list?status=1&limit=1000`
        );
        const data = await res.json();
        setCategories(data.data || []);
      } catch (err) {
        console.error("Lỗi khi tải danh mục:", err);
      }
    };

    fetchCategories();
  }, []);

  const handleCategoryClick = (slug) => {
    if (categorySlug === slug) {
      navigate("/blogs");
    } else {
      navigate(`/blogs?category=${slug}`);
    }
  };

  // Lọc theo ngày chỉ khi nhấn nút tìm
  const handleSearchByDate = () => {
    setSelectedDate(tempDate);
  };

  const totalPages = Math.ceil(blogs.length / PAGE_SIZE);
  const pagedBlogs = blogs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const formatDateVN = (d) => {
    const date = new Date(d);
    const weekday = [
      "Chủ Nhật",
      "Thứ Hai",
      "Thứ Ba",
      "Thứ Tư",
      "Thứ Năm",
      "Thứ Sáu",
      "Thứ Bảy",
    ];
    return `${weekday[date.getDay()]}, ${date.toLocaleDateString("vi-VN")}`;
  };

  const goToPage = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Tăng view khi click bài viết
  const handleBlogClick = async (id) => {
    try {
      await fetch(`${Constants.DOMAIN_API}/blogs/${id}/view`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      fetchHotBlogs();
    } catch (error) {
      console.error("Lỗi khi tăng view:", error);
    }
  };

  return (
    <Layout childrenClasses="pt-0 pb-0">
      <div className="blogs-wrapper w-full-width">
        <div className="title-bar">
          <PageTitle
            title="Tin Tức"
            breadcrumb={[
              { name: "trang chủ", path: "/" },
              { name: "tin tức", path: "/blogs" },
            ]}
          />
        </div>
      </div>

      <div className="w-full py-[60px] bg-white">
        {/* Nới rộng container để đủ chỗ cho 4 card với kích cỡ hiện tại */}
        <div className="mx-auto w-full max-w-[1600px] px-4">
          <div className="flex flex-col xl:flex-row gap-8">
            {/* Sidebar bên trái (đẩy sát trái, gọn) */}
            <aside className="w-full xl:w-[220px] flex-shrink-0">
              <div className="mb-7">
                <h3 className="text-[15px] font-bold mb-2">DANH MỤC TIN TỨC</h3>
                <ul className="border-b pb-3 mb-3">
                  {pagedCategories.map((cat) => (
                    <li key={cat.id} className="mb-1">
                      <button
                        onClick={() => handleCategoryClick(cat.slug)}
                        className={`w-full text-left text-[15px] py-1 px-2 rounded hover:bg-gray-100 ${
                          categorySlug === cat.slug ? "bg-gray-200 font-semibold" : ""
                        }`}
                        title={cat.name}
                      >
                        {cat.name.length > 20 ? cat.name.slice(0, 20) + "..." : cat.name}
                      </button>
                    </li>
                  ))}
                </ul>

                {/* Phân trang danh mục (2 mũi tên) */}
                <div className="flex justify-center items-center gap-2 mb-4">
                  <button
                    onClick={() => setCategoryPage((prev) => Math.max(prev - 1, 1))}
                    disabled={categoryPage === 1}
                    className="p-1 border rounded disabled:opacity-50"
                    title="Trang trước (danh mục)"
                  >
                    <FaChevronLeft />
                  </button>
                  <button
                    onClick={() =>
                      setCategoryPage((prev) => Math.min(prev + 1, totalCategoryPages))
                    }
                    disabled={categoryPage === totalCategoryPages}
                    className="p-1 border rounded disabled:opacity-50"
                    title="Trang sau (danh mục)"
                  >
                    <FaChevronRight />
                  </button>
                </div>

                {/* Lọc theo ngày (nhấn Tìm mới lọc) */}
                <div className="mb-6">
                  <h4 className="text-xs font-bold uppercase text-gray-700 mb-2">
                    Lọc theo ngày
                  </h4>
                  <div className="flex gap-2 items-stretch">
                    <input
                      type="date"
                      value={tempDate}
                      onChange={(e) => setTempDate(e.target.value)}
                      className="w-full border px-2 py-[6px] rounded text-sm"
                    />
                    <button
                      className="bg-blue-500 text-white px-3 rounded flex items-center justify-center"
                      title="Tìm kiếm"
                      onClick={handleSearchByDate}
                    >
                      <FaSearch />
                    </button>
                  </div>
                </div>
              </div>
            </aside>

            {/* Nội dung chính giữa (mở rộng để đủ 4 card) */}
            <main className="flex-1 min-w-0">
              <div className="w-full">
                {/* 4 cột ở xl, giữ nguyên style card nên kích cỡ không bị nhỏ lại */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-8 xl:gap-10">
                  {pagedBlogs.map((blog) => (
                    <Link
                      to={`/blogs/${blog.id}`}
                      key={blog.id}
                      onClick={() => handleBlogClick(blog.id)}
                      className="block group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden"
                    >
                      {/* Ảnh vuông ở trên */}
                      <div className="relative aspect-square overflow-hidden">
                        <img
                          src={blog.image_url}
                          alt={blog.title}
                          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      </div>

                      {/* Phần chữ tách dưới ảnh */}
                      <div className="p-4 md:p-5">
                        <div className="flex items-center gap-2 text-[13px] text-gray-500">
                          <span>{formatDateVN(blog.created_at)} | {blog.user_name}</span>
                          
                        </div>

                        <h3 className="mt-1.5 md:mt-2 text-lg md:text-xl font-semibold text-gray-900 line-clamp-2 group-hover:text-primary transition-colors">
                          {blog.title}
                        </h3>

                        <p className="mt-1 text-sm text-gray-600 leading-relaxed line-clamp-3">
                          {
                            (() => {
                              const raw = blog.meta_description || blog.content || "";
                              const plainText = raw.replace(/<\/?[^>]+(>|$)/g, "");
                              const textArea = document.createElement("textarea");
                              textArea.innerHTML = plainText;
                              const decoded = textArea.value;
                              return decoded.length > 130 ? decoded.slice(0, 130) + "..." : decoded;
                            })()
                          }
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Phân trang bài viết (2 mũi tên) */}
              <div className="flex justify-center gap-2 mt-10">
                <button
                  disabled={page === 1}
                  onClick={() => goToPage(page - 1)}
                  className="px-2 py-1 border rounded disabled:opacity-50"
                  title="Trang trước"
                >
                  <FaChevronLeft />
                </button>
                <button
                  disabled={page === totalPages}
                  onClick={() => goToPage(page + 1)}
                  className="px-2 py-1 border rounded disabled:opacity-50"
                  title="Trang sau"
                >
                  <FaChevronRight />
                </button>
              </div>
            </main>

            {/* Sidebar phải (đẩy sát phải) */}
            <aside className="w-full xl:w-[240px] flex-shrink-0">
              <div className="mb-7">
                <h4 className="font-bold text-xs text-gray-700 uppercase mb-3">
                  Chủ đề hot
                </h4>
                <ul>
                  {hotBlogs.map((blog) => (
                    <li key={blog.id} className="flex gap-2 mb-4">
                      <Link
                        to={`/blogs/${blog.id}`}
                        onClick={() => handleBlogClick(blog.id)}
                        className="flex gap-2 group"
                      >
                        <img
                          src={blog.image_url}
                          alt={blog.title}
                          className="w-[60px] h-[50px] object-cover rounded-md flex-shrink-0"
                          loading="lazy"
                        />
                        <div>
                          <div className="text-[13px] font-semibold leading-snug line-clamp-2 group-hover:text-primary">
                            {blog.title}
                          </div>
                          <div className="text-[12px] text-gray-400 mt-1 flex items-center gap-1">
                            <span>{formatDateVN(blog.created_at)}</span>
                            <span className="text-[13px] text-gray-400 font-normal">|</span>
                            <span>{blog.user_name}</span>
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </Layout>
  );
}
