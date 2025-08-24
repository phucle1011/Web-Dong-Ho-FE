// CommentPage.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import Constants from "../../../../Constants";
import { Link } from "react-router-dom";
import {
  FaAngleDoubleLeft,
  FaChevronLeft,
  FaChevronRight,
  FaAngleDoubleRight,
  FaEye,
  FaSearch
} from "react-icons/fa";
import { toast } from "react-toastify";
import { decodeToken } from "../../../client/Helpers/jwtDecode";
import React from "react";

function CommentPage() {
  const [allProducts, setAllProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [unrepliedComments, setUnrepliedComments] = useState([]);
  const [expandedCommentId, setExpandedCommentId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [submittingId, setSubmittingId] = useState(null);

  // phân trang cho reply
  const [replyPage, setReplyPage] = useState(1);
  const [replyLimit] = useState(5);
  const [replyTotalPages, setReplyTotalPages] = useState(1);

  useEffect(() => {
    setReplyTotalPages(Math.ceil(unrepliedComments.length / replyLimit));
    setReplyPage(1); // reset về trang 1 mỗi khi data đổi
  }, [unrepliedComments]);

  const currentReplyData = unrepliedComments.slice(
    (replyPage - 1) * replyLimit,
    replyPage * replyLimit
  );

  useEffect(() => {
    fetchComments();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [allProducts, statusFilter]);

  useEffect(() => {
    setTotalPages(Math.ceil(filteredProducts.length / limit));
  }, [filteredProducts]);

  const currentData = filteredProducts.slice(
    (currentPage - 1) * limit,
    currentPage * limit
  );

  const applyFilter = () => {
    if (statusFilter === "reply") return;
    let data = [...allProducts];
    switch (statusFilter) {
      case "most_comments":
        data = data.filter((p) => p.total_comments > 0);
        data.sort((a, b) => b.total_comments - a.total_comments);
        break;
      case "highest_rating":
        data = data.filter((p) => p.total_comments > 0);
        data.sort(
          (a, b) =>
            parseFloat(b.average_rating) - parseFloat(a.average_rating)
        );
        break;
      case "lowest_rating":
        data = data.sort(
          (a, b) =>
            parseFloat(a.average_rating) - parseFloat(b.average_rating)
        );
        break;
      default:
        data.sort((a, b) =>
          (a.product_name || "").localeCompare(b.product_name || "")
        );
    }
    setFilteredProducts(data);
    setCurrentPage(1);
  };

  const fetchComments = async () => {
    try {
      const response = await axios.get(
        `${Constants.DOMAIN_API}/admin/comment/list?includeReplies=true`
      );
      const comments = response.data.data || [];
      const productMap = {};
      const unrepliedList = [];

      comments.forEach((comment) => {
        const productId = comment?.orderDetail?.variant?.product?.id;
        const productName = comment?.orderDetail?.variant?.product?.name;
        const rating = comment?.rating;
        const parentId = comment?.parent_id;

        if (!productId || !productName) return;

        if (!productMap[productId]) {
          productMap[productId] = {
            product_id: productId,
            product_name: productName,
            total_comments: 0,
            total_rating: 0,
            unreplied_comments: 0,
          };
        }

        if (parentId === null) {
          productMap[productId].total_comments += 1;
          productMap[productId].total_rating += rating || 0;

          const hasReply = comments.some((c) => c.parent_id === comment.id);
          if (!hasReply) {
            productMap[productId].unreplied_comments += 1;
            unrepliedList.push(comment);
          }
        }
      });

      const result = Object.values(productMap).map((item) => ({
        ...item,
        average_rating:
          item.total_comments > 0
            ? (item.total_rating / item.total_comments).toFixed(1)
            : "0.0",
      }));

      setAllProducts(result);
      setFilteredProducts(result);
      setUnrepliedComments(unrepliedList);
    } catch (error) {
      console.error("Lỗi lấy danh sách bình luận:", error);
    }
  };

  const handleSearch = () => {
    const term = searchTerm.trim().toLowerCase();
    const result = allProducts.filter((product) =>
      product.product_name?.toLowerCase().includes(term)
    );
    setFilteredProducts(result);
    setCurrentPage(1);

    if (result.length === 0) {
      toast.info("Không tìm thấy sản phẩm nào.");
    }
  };

  const handleReplySubmit = async (parentId) => {
    if (!replyText.trim()) return;

    if (submittingId === parentId) {
      toast.warning("Đang gửi, vui lòng chờ...");
      return;
    }

    const token = localStorage.getItem("token");
    const decoded = decodeToken(token);
    const userId = decoded?.id;

    if (!userId) {
      toast.error("Không xác định được user_id từ token.");
      return;
    }

    try {
      setSubmittingId(parentId);
      await axios.post(`${Constants.DOMAIN_API}/admin/comment/reply`, {
        parent_id: parentId,
        comment_text: replyText,
        user_id: userId,
      });

      toast.success("Đã gửi trả lời thành công");
      setReplyText("");
      setExpandedCommentId(null);
      fetchComments();
    } catch (error) {
      toast.error("Gửi trả lời thất bại");
    } finally {
      setSubmittingId(null);
    }
  };

  // ✅ Hàm phân trang tái sử dụng
  const renderPagination = (currentPage, totalPages, setPage) => {
    const pages = [];
    const start = Math.max(1, currentPage - 1);
    const end = Math.min(totalPages, currentPage + 1);
    for (let i = start; i <= end; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => setPage(i)}
          className={`px-3 py-1 border rounded ${
            i === currentPage ? "bg-blue-600 text-white" : "bg-white"
          }`}
        >
          {i}
        </button>
      );
    }
    return (
      <div className="flex justify-center gap-2 mt-4">
        <button disabled={currentPage === 1} onClick={() => setPage(1)}>
          <FaAngleDoubleLeft />
        </button>
        <button
          disabled={currentPage === 1}
          onClick={() => setPage(currentPage - 1)}
        >
          <FaChevronLeft />
        </button>
        {pages}
        <button
          disabled={currentPage === totalPages}
          onClick={() => setPage(currentPage + 1)}
        >
          <FaChevronRight />
        </button>
        <button
          disabled={currentPage === totalPages}
          onClick={() => setPage(totalPages)}
        >
          <FaAngleDoubleRight />
        </button>
      </div>
    );
  };

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12 d-flex align-items-stretch">
          <div className="card w-100">
            <div className="card-body p-4">
              <h5 className="card-title fw-semibold mb-4">
                Đánh giá theo sản phẩm
              </h5>

              {/* Tabs */}
              <div className="flex flex-wrap items-center gap-6 border-b border-gray-200 px-6 py-4 mb-4">
                {[
                  { key: "all", label: "Tất cả sản phẩm" },
                  { key: "most_comments", label: "Nhiều Đánh Giá nhất" },
                  { key: "highest_rating", label: "Đánh giá cao nhất" },
                  { key: "lowest_rating", label: "Đánh giá thấp nhất" },
                  {
                    key: "reply",
                    label: "Trả lời Đánh Giá",
                    count: unrepliedComments.length,
                    color: "bg-blue-300",
                    textColor: "text-blue-800",
                  },
                ].map(({ key, label, count, color, textColor }) => (
                  <button
                    key={key}
                    onClick={() => setStatusFilter(key)}
                    className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-semibold ${
                      statusFilter === key
                        ? "bg-blue-900 text-white"
                        : "bg-white text-gray-700"
                    }`}
                  >
                    <span>{label}</span>
                    {key === "reply" && (
                      <span
                        className={`inline-block ml-1 rounded-full px-2 py-0.5 text-xs font-bold ${
                          statusFilter === key
                            ? "bg-white text-blue-900"
                            : `${color} ${textColor}`
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Search input */}
              <div className="mb-4 flex gap-2">
                <input
                  type="text"
                  placeholder="Tìm sản phẩm..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="border rounded w-full px-3 py-2"
                />
                <button
                  onClick={handleSearch}
                  className="bg-[#073272] text-white px-4 py-2 rounded"
                >
                  <FaSearch />
                </button>
              </div>

              {/* Table */}
              {statusFilter !== "reply" ? (
                <div className="table-responsive">
                  <table className="table text-nowrap mb-0 align-middle">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border p-2">#</th>
                        <th className="border p-2">Sản phẩm</th>
                        <th className="border p-2">Tổng Đánh Giá</th>
                        <th className="border p-2">Trung bình đánh giá</th>
                        <th className="border p-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentData.map((product, index) => (
                        <tr key={product.product_id}>
                          <td>{(currentPage - 1) * limit + index + 1}</td>
                          <td>{product.product_name}</td>
                          <td>{product.total_comments}</td>
                          <td>{product.average_rating}</td>
                          <td>
                            <Link
                              to={`/admin/comments/detail/${product.product_id}`}
                              className="bg-blue-500 text-white p-2 rounded w-10 h-10 inline-flex items-center justify-center"
                            >
                              <FaEye size={16} className="font-bold" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {renderPagination(currentPage, totalPages, setCurrentPage)}
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table text-nowrap mb-0 align-middle">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border p-2">#</th>
                        <th className="border p-2">Người dùng</th>
                        <th className="border p-2">Nội dung</th>
                        <th className="border p-2">Số sao</th>
                        <th className="border p-2">Ngày</th>
                        <th className="border p-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentReplyData.map((comment, index) => (
                        <React.Fragment key={comment.id}>
                          <tr>
                            <td>{(replyPage - 1) * replyLimit + index + 1}</td>
                            <td>{comment.user?.name || "Ẩn danh"}</td>
                            <td>
                              {(() => {
                                const text = comment.comment_text || "";
                                const isExpanded =
                                  expandedCommentId === `cmt-${comment.id}`;
                                const limit = 50;
                                const shouldTruncate = text.length > limit;
                                const displayText = isExpanded
                                  ? text
                                  : text.slice(0, limit) +
                                    (shouldTruncate ? "..." : "");

                                return (
                                  <>
                                    {displayText}
                                    {shouldTruncate && (
                                      <button
                                        onClick={() =>
                                          setExpandedCommentId(
                                            isExpanded ? null : `cmt-${comment.id}`
                                          )
                                        }
                                        className="text-blue-500 ml-2"
                                      >
                                        {isExpanded ? "Thu gọn" : "Xem thêm"}
                                      </button>
                                    )}
                                  </>
                                );
                              })()}
                            </td>
                            <td>{comment.rating}</td>
                            <td>
                              {new Date(comment.created_at).toLocaleDateString()}
                            </td>
                            <td>
                              <button
                                onClick={() =>
                                  setExpandedCommentId(
                                    expandedCommentId === comment.id
                                      ? null
                                      : comment.id
                                  )
                                }
                                className="btn btn-sm btn-primary"
                              >
                                Trả lời
                              </button>
                            </td>
                          </tr>
                          {expandedCommentId === comment.id && (
                            <tr>
                              <td colSpan="6">
                                <textarea
                                  className="form-control mb-2"
                                  rows="3"
                                  value={replyText}
                                  onChange={(e) =>
                                    setReplyText(e.target.value)
                                  }
                                  placeholder="Nhập nội dung trả lời..."
                                ></textarea>
                                <button
                                  className="btn btn-success btn-sm"
                                  disabled={submittingId === comment.id}
                                  onClick={() => handleReplySubmit(comment.id)}
                                >
                                  {submittingId === comment.id
                                    ? "Đang gửi..."
                                    : "Gửi trả lời"}
                                </button>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                  {renderPagination(replyPage, replyTotalPages, setReplyPage)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CommentPage;
