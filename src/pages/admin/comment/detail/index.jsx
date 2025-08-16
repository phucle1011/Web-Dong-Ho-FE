import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import Constants from "../../../../Constants";
import { Modal, Carousel } from "react-bootstrap";
import {
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";

function CommentDetailPage() {
  const { id: productId } = useParams();
  const [comments, setComments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [startIndex, setStartIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  useEffect(() => {
    fetchCommentsByProduct();
  }, [productId]);

  const fetchCommentsByProduct = async () => {
    try {
      const response = await axios.get(`${Constants.DOMAIN_API}/admin/comment/product/${productId}`);
      const allComments = response.data.data || [];
      const filtered = allComments.filter(c => c.parent_id === null);
      setComments(filtered);
      setCurrentPage(1);
    } catch (error) {
      console.error("Lỗi lấy bình luận sản phẩm:", error);
    }
  };

  const totalPages = Math.ceil(comments.length / ITEMS_PER_PAGE);

  const currentComments = comments.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <i
          key={i}
          className={`fa${i <= rating ? "s" : "r"} fa-star text-warning me-1`}
          aria-hidden="true"
        ></i>
      );
    }

    return (
      <div className="position-relative d-inline-block text-center">
        <div
          className="position-absolute top-0 start-50 translate-middle-x text-primary fw-bold"
          style={{ fontSize: "0.9rem" }}
        >
          {rating} sao
        </div>
        <div className="pt-4">{stars}</div>
      </div>
    );
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return isNaN(date)
      ? "Không xác định"
      : date.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
  };

  const handleImageClick = (images, index) => {
    setSelectedImages(images);
    setStartIndex(index);
    setShowModal(true);
  };

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12 d-flex align-items-stretch">
          <div className="card w-100">
            <div className="card-body p-4">
              <h5 className="card-title fw-semibold mb-4">
                Chi tiết đánh giá theo sản phẩm
              </h5>
              <div className="table-responsive">
                <table className="table table-striped align-middle">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Người dùng</th>
                      <th>Đánh giá</th>
                      <th>Nội dung</th>
                      <th>Ảnh</th>

                    </tr>
                  </thead>
                  <tbody>
                    {currentComments.length > 0 ? (
                      currentComments.map((comment, index) => (
                        <tr key={comment.id}>
                          <td>{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
                          <td>{comment.user?.name || "Ẩn danh"}</td>
                          <td>{renderStars(comment.rating)}</td>
                          <td>{comment.comment_text || "Không có nội dung"}</td>
                          <td>
                            {comment.commentImages && comment.commentImages.length > 0 ? (
                              <img
                                key={comment.commentImages[0].id}
                                src={comment.commentImages[0].image_url}
                                alt="Comment"
                                width="60"
                                className="me-2 img-thumbnail"
                                style={{ cursor: "pointer" }}
                                onClick={() => handleImageClick(comment.commentImages, 0)}
                              />
                            ) : (
                              "Không có ảnh"
                            )}
                          </td>

                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center">
                          Không có đánh giá nào
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {totalPages > 0 && (
                <div className="flex justify-center mt-4 items-center">
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

                    {[...Array(totalPages)].map((_, i) => {
                      const page = i + 1;
                      if (page >= currentPage - 1 && page <= currentPage + 1) {
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-3 py-1 border rounded ${
                              currentPage === page
                                ? "bg-blue-600 text-white"
                                : "bg-white hover:bg-blue-100"
                            }`}
                          >
                            {page}
                          </button>
                        );
                      }
                      return null;
                    })}

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
              )}

              <Link
                to="/admin/comments/getAll"
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 mt-4 inline-block"
              >
                Quay lại danh sách
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        size="lg"
        centered
        backdrop="static"
        animation={true}
      >
        <Modal.Header closeButton>
          <Modal.Title>Xem ảnh đánh giá </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Carousel interval={null} defaultActiveIndex={startIndex}>
            {selectedImages.map((img) => (
              <Carousel.Item key={img.id}>
                <img
                  className="d-block w-100"
                  src={img.image_url}
                  alt="đánh giá"
                  style={{ maxHeight: "70vh", objectFit: "contain" }}
                />
              </Carousel.Item>
            ))}
          </Carousel>
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default CommentDetailPage;
