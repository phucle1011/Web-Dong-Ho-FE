import { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import PageTitle from "../../Helpers/PageTitle";
import Layout from "../../Partials/LayoutHomeThree";
import Constants from "../../../../Constants";
import { FaChevronLeft, FaChevronRight, FaSearch } from "react-icons/fa";

export default function Blog() {

  const { id } = useParams();
  const navigate = useNavigate();

  const [blog, setBlog] = useState(null);
  const [allBlogs, setAllBlogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [hotBlogs, setHotBlogs] = useState([]);


  const [categoryPage, setCategoryPage] = useState(1);
  const categoriesPerPage = 5;


  const [tempDate, setTempDate] = useState("");


  const [currentSlide, setCurrentSlide] = useState(0);
  const slideIntervalRef = useRef(null);


  const formatDateVN = (date) =>
    new Date(date).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });


  const fetchHotBlogs = async () => {
    try {
      const res = await axios.get(`${Constants.DOMAIN_API}/blogs/hot?limit=5`);
      setHotBlogs(res.data.blogs || []);
    } catch (error) {
      console.error("Lỗi khi tải hot blogs:", error);
    }
  };
  
useEffect(() => {
  const fetchBlog = async () => {
    try {
      const res = await axios.get(`${Constants.DOMAIN_API}/blogs/${id}`);
      setBlog(res.data);

      try {
        await axios.post(`${Constants.DOMAIN_API}/blogs/${id}/view`, {});
        fetchHotBlogs();
      } catch (err) {
        console.error("Lỗi khi tăng view:", err);
      }
    } catch (error) {
      console.error("Lỗi khi tải blog:", error);
    }
  };

  if (id) {
    fetchBlog();
    
    window.scrollTo({ top: 50, behavior: "smooth" });
  }
}, [id]);



  useEffect(() => {
    const fetchAllBlogs = async () => {
      try {
        const res = await axios.get(`${Constants.DOMAIN_API}/blogs`);
        setAllBlogs(res.data.blogs || []);
      } catch (error) {
        console.error("Lỗi khi tải danh sách blog:", error);
      }
    };
    fetchAllBlogs();
  }, [id]);


  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(
          `${Constants.DOMAIN_API}/admin/blogcategory/list?status=1&limit=1000`
        );
        setCategories(res.data.data || []);
      } catch (error) {
        console.error("Lỗi khi tải danh mục:", error);
      }
    };
    fetchCategories();
  }, []);


  useEffect(() => {
    fetchHotBlogs();
  }, []);


  const totalCategoryPages = Math.ceil(categories.length / categoriesPerPage);
  const pagedCategories = categories.slice(
    (categoryPage - 1) * categoriesPerPage,
    categoryPage * categoriesPerPage
  );


  const suggestions = (() => {
    const others = (allBlogs || []).filter((b) => String(b.id) !== String(id));
    const shuffled = [...others].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 5);
  })();

  useEffect(() => {
    if (suggestions.length <= 1) return;
    slideIntervalRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % suggestions.length);
    }, 4000);
    return () => {
      if (slideIntervalRef.current) clearInterval(slideIntervalRef.current);
    };
  }, [suggestions.length]);


  useEffect(() => {
    setCurrentSlide(0);
  }, [id, allBlogs.length]);


  const handleCategoryClick = (slug) => {
    navigate(`/blogs?category=${slug}`);
  };

  const handleSearchByDate = () => {
    if (!tempDate) return;
    navigate(`/blogs?date=${tempDate}`);
  };

  const goPrev = () => {
    if (!suggestions.length) return;
    setCurrentSlide((prev) => (prev - 1 + suggestions.length) % suggestions.length);
  };

  const goNext = () => {
    if (!suggestions.length) return;
    setCurrentSlide((prev) => (prev + 1) % suggestions.length);
  };

  // ===== Render =====
  return (
    <Layout childrenClasses="pt-0 pb-0">
      <div className="w-full bg-white">
        {/* Tiêu đề breadcrumb */}
        <div className="title-area mb-[30px]">
          <PageTitle
            title="Chi tiết tin tức"
            breadcrumb={[
              { name: "trang chủ", path: "/" },
              { name: "tin tức", path: "/blogs" },

            ]}
          />
        </div>

        <div className="container-x mx-auto py-6">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* === SIDEBAR TRÁI: Danh mục + Lọc theo ngày === */}
            <aside className="w-full lg:w-[230px] flex-shrink-0">
              <div className="mb-7">
                <h3 className="text-[15px] font-bold mb-2">DANH MỤC TIN TỨC</h3>
                <ul className="border-b pb-3 mb-3">
                  {pagedCategories.map((cat) => (
                    <li key={cat.id} className="mb-1">
                      <button
                        onClick={() => handleCategoryClick(cat.slug)}
                        className="w-full text-left text-[15px] py-1 px-2 rounded hover:bg-gray-100 no-underline"

                        title={cat.name}
                      >
                        {cat.name?.length > 20 ? cat.name.slice(0, 20) + "..." : cat.name}
                      </button>
                    </li>
                  ))}
                </ul>

                {/* Phân trang danh mục (2 mũi tên) */}
                <div className="flex justify-center items-center gap-2 mb-5">
                  <button
                    onClick={() => setCategoryPage((p) => Math.max(p - 1, 1))}
                    disabled={categoryPage === 1}
                    className="p-1 border rounded disabled:opacity-50"
                    title="Trang trước (danh mục)"
                  >
                    <FaChevronLeft />
                  </button>
                  <button
                    onClick={() =>
                      setCategoryPage((p) => Math.min(p + 1, totalCategoryPages))
                    }
                    disabled={categoryPage === totalCategoryPages}
                    className="p-1 border rounded disabled:opacity-50"
                    title="Trang sau (danh mục)"
                  >
                    <FaChevronRight />
                  </button>
                </div>
                <div className="mb-6">
                  <h4 className="text-xs font-bold uppercase text-gray-700 mb-2">
                    Lọc theo ngày
                  </h4>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={tempDate}
                      onChange={(e) => setTempDate(e.target.value)}
                      className="w-full border px-2 py-1 rounded text-sm"
                    />
                    <button
                      className="bg-blue-500 text-white px-3 py-1 rounded"
                      title="Tìm kiếm"
                      onClick={handleSearchByDate}
                    >
                      <FaSearch />
                    </button>
                  </div>
                </div>
              </div>
            </aside>

            {/* === NỘI DUNG CHÍNH === */}
            <main className="flex-[1.4] min-w-0">
              {!blog ? (
                <div className="w-full py-16 text-center text-gray-500">Đang tải...</div>
              ) : (
                <>

                  {/* Tiêu đề */}
                  <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-snug mb-4 text-center max-w-3xl mx-auto">
                    {blog.title}
                  </h1>
                  <h3 className="text-center text-base text-gray-600 mt-4 mb-8">
                    {new DOMParser().parseFromString(blog.meta_description.replace(/<[^>]*>?/gm, ""), "text/html").body.textContent}
                  </h3>



                  <article className="mb-10">
                    {/* Ảnh đại diện */}
                    <img
                      src={blog.image_url || "/assets/images/default.jpg"}
                      alt={blog.title}
                      className="w-full max-h-[460px] object-cover rounded-xl mb-5"
                    />

                    {/* Meta */}
                    <div className="text-sm text-gray-500 mb-2 flex flex-wrap items-center gap-2">
                      <span className="font-medium">{blog.user_name || "Tác giả"}</span>
                      <span className="text-gray-300">•</span>
                      <span>{formatDateVN(blog.created_at)}</span>
                      {blog.blog_category && (
                        <>
                          <span className="text-gray-300">•</span>
                          <button
                            onClick={() => handleCategoryClick(blog.blog_category_slug)}
                            className="hover:text-primary"
                            title={blog.blog_category}
                          >
                            {blog.blog_category}
                          </button>
                        </>
                      )}
                    </div>



                    {/* Nội dung - căn đều */}
                    <div
                      className="prose max-w-none text-justify leading-7 md:leading-8 text-[17px] md:text-[18px] text-gray-800"
                      dangerouslySetInnerHTML={{ __html: blog.content }}
                    />
                  </article>


                  <section className="mt-10 w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] bg-white">
                    <div className="max-w-[1280px] mx-auto">
                      <h2 className="px-8 text-2xl md:text-3xl font-bold mb-6">
                        Có thể bạn quan tâm
                      </h2>

                      {/* Grid full width 4 bài */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 px-8">
                        {suggestions.slice(0, 4).map((b) => (
                          <Link
                            key={b.id}
                            to={`/blogs/${b.id}`}
                            className="block rounded-2xl overflow-hidden shadow hover:shadow-2xl transition bg-white"
                          >
                            {/* Ảnh giảm tiếp 20% chiều cao */}
                            <div className="h-[179px] md:h-[205px] overflow-hidden">
                              <img
                                src={b.image_url}
                                alt={b.title}
                                className="w-full h-full object-cover hover:scale-105 transition duration-300"
                              />
                            </div>

                            {/* Nội dung */}
                            <div className="p-5">
                              <div className="text-sm text-gray-500 mb-2">
                                {formatDateVN(b.created_at)} <span className="text-gray-300">|</span>{" "}
                                {b.user_name || "Tác giả"}
                              </div>
                              <h3 className="text-lg md:text-xl font-semibold text-gray-800 line-clamp-2 mb-3">
                                {b.title}
                              </h3>
                              <p className="text-base text-gray-600 line-clamp-3">
                                {(() => {
                                  const decodeHtml = (html) => {
                                    const txt = document.createElement("textarea");
                                    txt.innerHTML = html;
                                    return txt.value;
                                  };

                                  const raw = b.meta_description || b.content || "";
                                  const decodedOnce = decodeHtml(raw); 
                                  const noHtml = decodedOnce.replace(/<[^>]+>/g, ""); 
                                  return decodeHtml(noHtml).slice(0, 150) + "..."; 
                                })()}
                              </p>
                            </div>

                          </Link>
                        ))}
                      </div>
                    </div>
                  </section>




                </>
              )}
            </main>

            {/* === SIDEBAR PHẢI: Chủ đề hot (lấy từ /blogs/hot?limit=5) === */}
            <aside className="w-full lg:w-[250px] flex-shrink-0">
              <div className="mb-7">
                <h4 className="font-bold text-xs text-gray-700 uppercase mb-3">
                  Chủ đề hot
                </h4>
                <ul>
                  {hotBlogs.map((hb) => (
                    <li key={hb.id} className="flex gap-2 mb-4">
                      <Link to={`/blogs/${hb.id}`} className="flex gap-2 group">
                        <img
                          src={hb.image_url}
                          alt={hb.title}
                          className="w-[60px] h-[50px] object-cover rounded-md flex-shrink-0"
                        />
                        <div>
                          <div className="text-[13px] font-semibold leading-snug line-clamp-2 group-hover:text-primary">
                            {hb.title}
                          </div>
                          <div className="text-[12px] text-gray-400 mt-1 flex items-center gap-1">
                            <span>{formatDateVN(hb.created_at)}</span>
                            <span className="text-[13px] text-gray-400 font-normal">|</span>
                            <span>{hb.user_name || "Tác giả"}</span>
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
