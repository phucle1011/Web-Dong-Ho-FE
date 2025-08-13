import { useEffect, useState, useRef } from "react";
import axios from "axios";
import Constants from "../../../../Constants";
import {
  FaSearch,
  FaAngleDoubleLeft,
  FaChevronLeft,
  FaChevronRight,
  FaAngleDoubleRight,
  FaEye,
  FaEdit,
  FaTrashAlt,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import FormDelete from "../../../../components/formDelete";
import { toast } from "react-toastify";
function BlogList() {
  const [blogs, setBlogs] = useState([]);
  const [limit] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedIdToDelete, setSelectedIdToDelete] = useState(null);
  const navigate = useNavigate();
  const debounceTimer = useRef(null);
  const [expandedTitles, setExpandedTitles] = useState({});
  const toggleExpanded = (id) => {
    setExpandedTitles((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };
  const decodeHtml = (html) => {
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
  };

  const fetchBlogs = async (page = 1, search = "") => {
    try {
      const response = await axios.get(`${Constants.DOMAIN_API}/admin/blog/list`, {
        params: { page, limit, search },
      });
      setBlogs(response.data.data);
      setTotalPages(response.data.pagination.totalPages);
      setCurrentPage(response.data.pagination.currentPage);
    } catch (error) {
      console.error("Lỗi khi tải bài viết:", error);
    }
  };

  useEffect(() => {
    fetchBlogs(currentPage, searchTerm);
  }, [currentPage]);

  const handleSearchClick = () => {
  setCurrentPage(1);
  fetchBlogs(1, searchTerm);
};

  const confirmDelete = (id) => {
    setSelectedIdToDelete(id);
    setShowDeleteModal(true);
  };
const handleConfirmDelete = async ({ id }) => {
  try {
    await axios.delete(`${Constants.DOMAIN_API}/admin/blog/${id}`);
    setShowDeleteModal(false);
    toast.success("Bài viết đã được xóa.");
    fetchBlogs(currentPage, searchTerm);
  } catch (error) {
    setShowDeleteModal(false);
    toast.error("Không thể xóa bài viết.");
    console.error(error);
  }
};


  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12 d-flex align-items-stretch">
          <div className="card w-100">
            <div className="card-body p-4">
              <div className="d-flex justify-between items-center mb-4">
                <h5 className="card-title fw-semibold">Danh sách bài viết</h5>
                <button
                  className="inline-block bg-[#073272] text-white px-4 py-2 rounded"
                  onClick={() => navigate("/admin/blog/add")}
                >
                  + Thêm bài viết
                </button>
              </div>

              <div className="mb-4 d-flex" style={{ maxWidth: "100%" }}>
                <input
                  type="text"
                  className="flex-grow shadow border border-gray-300 rounded py-2 px-4 text-gray-700"
                  placeholder="Tìm theo tiêu đề..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button
                  className="bg-blue-900 hover:bg-blue-800 text-white px-4 py-1.5 rounded ms-2"
                  onClick={handleSearchClick}
                >
                  <FaSearch />
                </button>
              </div>

              <div className="table-responsive">

                <table className="w-full table-auto border border-collapse border-gray-300 text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border p-2 text-center">#</th>
                      <th className="border p-2 text-left">Tiêu đề</th>
                      <th className="border p-2 text-center">Hình ảnh</th>
                      <th className="border p-2 text-left">Nội dung</th>
                      <th className="border p-2 text-center">Người viết</th>
                      <th className="border p-2 text-center">Danh mục</th>
                      <th className="border p-2 text-center"></th>
                    </tr>
                  </thead>


                  <tbody>
                    {blogs.length > 0 ? (
                      blogs.map((blog, index) => (
                        <tr key={blog.id}>
                          <td>{(currentPage - 1) * limit + index + 1}</td>
                          <td className="max-w-[400px] whitespace-pre-wrap">
                            {(() => {
                              const maxLength = 50;
                              const isLongTitle = blog.title.length > maxLength;
                              const shortTitle = blog.title.slice(0, maxLength);

                              const isExpanded = expandedTitles[blog.id];

                              return (
                                <>
                                  {isExpanded || !isLongTitle ? (
                                    <>
                                      {blog.title}
                                      {isLongTitle && (
                                        <button
                                          onClick={() => toggleExpanded(blog.id)}
                                          className="text-blue-500  ml-1"
                                        >
                                          Thu gọn
                                        </button>
                                      )}
                                    </>
                                  ) : (
                                    <>
                                      {shortTitle}...
                                      <button
                                        onClick={() => toggleExpanded(blog.id)}
                                        className="text-blue-500  ml-1"
                                      >
                                        Xem thêm
                                      </button>
                                    </>
                                  )}
                                </>
                              );
                            })()}
                          </td>

                          <td>
                            <img
                              src={blog.image_url}
                              alt={blog.title}
                              style={{ width: "100px", height: "auto" }}
                            />
                          </td>
                          <td>
                            {decodeHtml(
                              blog.content
                                .replace(/<[^>]*>?/gm, '')
                                .slice(0, 50)
                            ) + "..."}
                          </td>

                          <td>{blog.user?.name || "Không xác định"}</td>
                          <td>{blog.category?.name || "Không rõ"}</td>

                          <td>
                            <div className="d-flex gap-2">
                              <button
                                className="bg-blue-500 text-white p-2 rounded"
                                onClick={() => navigate(`/admin/blog/detail/${blog.id}`)}
                              >
                                <FaEye size={16} />
                              </button>
                              <button
                                className="btn btn-warning btn-sm"
                                onClick={() => navigate(`/admin/blog/edit/${blog.id}`)}
                              >
                                <FaEdit />
                              </button>
                              <button
                                className="p-2 rounded-full bg-red-50 text-red-500"
                                onClick={() => confirmDelete(blog.id)}
                              >
                                <FaTrashAlt size={20} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="text-center text-muted">
                          Không có bài viết nào.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-center mt-4 items-center">
                <div className="flex items-center space-x-1">
                  <button disabled={currentPage === 1} onClick={() => handlePageChange(1)}>
                    <FaAngleDoubleLeft />
                  </button>
                  <button disabled={currentPage === 1} onClick={() => handlePageChange(currentPage - 1)}>
                    <FaChevronLeft />
                  </button>
                  {[...Array(totalPages)].map((_, i) => {
                    const page = i + 1;
                    if (page >= currentPage - 1 && page <= currentPage + 1) {
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-1 border rounded ${currentPage === page ? "bg-blue-500 text-white" : "bg-blue-100"}`}
                        >
                          {page}
                        </button>
                      );
                    }
                    return null;
                  })}
                  <button disabled={currentPage === totalPages} onClick={() => handlePageChange(currentPage + 1)}>
                    <FaChevronRight />
                  </button>
                  <button disabled={currentPage === totalPages} onClick={() => handlePageChange(totalPages)}>
                    <FaAngleDoubleRight />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <FormDelete
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        message="Bạn có chắc chắn muốn xóa bài viết này không?"
        Id={selectedIdToDelete}
      />
    </div>
  );
}

export default BlogList; 