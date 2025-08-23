import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { Filter } from "bad-words";
import StarRating from "../Helpers/StarRating";
import LoaderStyleOne from "../Helpers/Loaders/LoaderStyleOne";
import { decodeToken } from "../Helpers/jwtDecode";
import { useLocation, useNavigate } from "react-router-dom";
const ProductReviewSection = () => {
  const [orderDetailId, setOrderDetailId] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [imageFiles, setImageFiles] = useState([]);
  const [visibleCount, setVisibleCount] = useState(5);
  const [filterType, setFilterType] = useState("all");
  const [filterRating, setFilterRating] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const { state } = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    if (!state?.productId) {
      toast.error("Thiếu thông tin sản phẩm!");
      navigate("/all-products");
    }
  }, [state]);
  const { productId } = state || {};
  useEffect(() => {
    const storedOrderDetailId = sessionStorage.getItem("pendingReviewOrderDetailId");
    if (storedOrderDetailId) {
      setOrderDetailId(storedOrderDetailId);
      sessionStorage.removeItem("pendingReviewOrderDetailId");
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decoded = decodeToken(token);
      setUserId(decoded?.user_id || decoded?.id || null);
    }
  }, []);

  useEffect(() => {
    if (userId && orderDetailId && comments.length > 0) {
      const userComment = comments.find(c => c.user_id === userId && c.order_detail_id == orderDetailId);
      if (userComment && !userComment.edited) {
        setMessage(userComment.comment_text || "");
        setRating(userComment.rating || 0);
      }
    }
  }, [userId, orderDetailId, comments]);

  useEffect(() => {
    if (userId) {
      const userComment = comments.find(c => c.user_id === userId && c.order_detail_id == orderDetailId);
      if (userComment) {
        const el = document.getElementById(`comment-${userComment.id}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    }
  }, [comments]);

  useEffect(() => {
    if (productId) {
      fetchComments();
    } else {
      toast.warning("Không tìm thấy sản phẩm.");
    }
  }, [productId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      //https://web-dong-ho-be.onrender.com
      // https://web-dong-ho-be.onrender.com
      const res = await axios.get(`https://web-dong-ho-be.onrender.com/comment/product/${productId}`);
      const data = res.data.data;
      const parentComments = data.filter((c) => c.parent_id === null);
      const childComments = data.filter((c) => c.parent_id !== null);
      const structured = parentComments.map((parent) => {
        const replys = childComments
          .filter((c) => c.parent_id === parent.id)
          .map((reply) => ({ ...reply, author: reply.user?.name || "Ẩn danh" }));
        return { ...parent, author: parent.user?.name || "Ẩn danh", replys };
      });
      setComments(structured);

      const storedOrderDetailId = sessionStorage.getItem("pendingReviewOrderDetailId");
      if (storedOrderDetailId && userId) {
        const comment = structured.find(
          c => c.user_id === userId && c.order_detail_id == storedOrderDetailId
        );

        if (comment) {
          setMessage(comment.comment_text || "");
          setRating(comment.rating || 0);
        }

        setOrderDetailId(storedOrderDetailId);
        sessionStorage.removeItem("pendingReviewOrderDetailId");
      }

    } catch (error) {
      console.error("Lỗi khi lấy bình luận:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 3) {
      toast.error("Chỉ được tải tối đa 3 ảnh. Vui lòng chọn lại.");

      e.target.value = null;
      return;
    }

    // Kiểm tra từng hình ảnh xem có phải là đồng hồ không
    for (const file of files) {
      const isWatch = await isWatchImage(file);
      if (!isWatch) {
        toast.error("Một hoặc nhiều ảnh bạn tải lên không phải là đồng hồ. Vui lòng chọn lại.");

        e.target.value = null;
        return;
      }
    }

    setImageFiles(files);
  };



  const handleImageUploads = async (files) => {
    const urls = [];

    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "duantotnghiep_preset");
      formData.append("cloud_name", "ddkqka4b4");

      try {
        const res = await fetch("https://api.cloudinary.com/v1_1/ddkqka4b4/image/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (data.secure_url) {
          urls.push(data.secure_url); // Chỉ thêm 1 lần
        }
      } catch (err) {
        console.error("Lỗi upload ảnh:", err);
        toast.error("Không thể tải ảnh lên Cloudinary. Vui lòng thử lại.");

        return null; // dừng luôn nếu 1 ảnh lỗi
      }
    }

    return urls;
  };




  const reviewAction = async () => {
    if (reviewLoading) {
      toast.warning("Đang xử lý, vui lòng chờ...");
      return;
    }
    if (!message || rating === 0) {
      toast.warning("Vui lòng nhập nội dung và chọn số sao trước khi gửi.");
      return;
    }
    setReviewLoading(true);
    try {
      const response = await fetch("/badword.txt");
      const text = await response.text();

      const badWordsVi = text
        .split("\n")
        .map((word) => word.trim())
        .filter((word) => word.length >= 2 && !word.startsWith("#"));

      // Hàm normalize full nội dung
      // Hàm normalize full nội dung
      const normalizeFullMessage = (text) =>
        (text || "")
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          // map số và ký tự đặc biệt về chữ cái tương ứng
          .replace(/0/g, "o")
          .replace(/1/g, "i")
          .replace(/3/g, "e")
          .replace(/5/g, "s")
          .replace(/7/g, "t")
          .replace(/\$/g, "s")
          .replace(/\+/g, "t")
          // cuối cùng mới xoá hết ký tự còn lại
          .replace(/[^a-z0-9]/g, "")
          .trim();

      const normalizeWord = (word) =>
        (word || "")
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/0/g, "o")
          .replace(/1/g, "i")
          .replace(/3/g, "e")
          .replace(/5/g, "s")
          .replace(/7/g, "t")
          .replace(/\$/g, "s")
          .replace(/\+/g, "t")
          .replace(/[^a-z0-9]/g, "")
          .trim();


      const normalizedBadWords = badWordsVi.map(normalizeWord);
      const messageWords = message.split(/\s+/).map(normalizeWord).filter(Boolean);
      const fullNormalizedMessage = normalizeFullMessage(message);


      let foundBad = null;
      for (let i = 0; i < messageWords.length; i++) {
        const word = messageWords[i];
        if (normalizedBadWords.includes(word)) {
          const prevWord = messageWords[i - 1] || "";
          const prev2Word = messageWords[i - 2] || "";


          if (["khong", "chong", "chang", "cha"].includes(prevWord) || ["khong", "chong", "chang", "cha"].includes(prev2Word)) {
            continue;
          }


          if (prevWord === "rat" || prevWord === "kha") {
            continue;
          }


          foundBad = word;
          break;
        }
      }


      if (!foundBad) {
        foundBad = normalizedBadWords
          .filter((bad) => bad.length >= 4)
          .find((bad) => fullNormalizedMessage.includes(bad));
      }

      if (foundBad) {
        toast.error("Nội dung đánh giá chứa từ ngữ phản cảm. Vui lòng chỉnh sửa.");
        return;
      }

      if (!orderDetailId) {
        toast.error("Không thể gửi đánh giá do thiếu mã chi tiết đơn hàng.");
        return;
      }


      setReviewLoading(true);
      let imageUrls = [];
      if (imageFiles?.length > 0) {
        imageUrls = await handleImageUploads(imageFiles);
        if (!imageUrls) {
          setReviewLoading(false);
          return;
        }
      }

      const existingComment = comments.find(
        (c) => c.user_id === userId && c.order_detail_id == orderDetailId
      );

      if (existingComment) {
        if (existingComment.edited) {
          toast.warning("Bạn chỉ được chỉnh sửa đánh giá một lần.");
          return;
        }

        await axios.put(`https://web-dong-ho-be.onrender.com/comments/${existingComment.id}`, {
          rating,
          comment_text: message,
          images: imageUrls,
          edited: true,
        });

        toast.success("Đã cập nhật đánh giá");

      } else {
        const payload = {
          user_id: userId,
          rating,
          comment_text: message,
          order_detail_id: Number(orderDetailId),
          images: imageUrls,
        };
        await axios.post("https://web-dong-ho-be.onrender.com/comments", payload);
        toast.success("Đánh giá thành công! Cảm ơn bạn đã đánh giá.");
      }

      setMessage("");
      setRating(0);
      setHoverRating(0);
      setImageFiles([]);
      setOrderDetailId(null);
      fetchComments();
    } catch (error) {
      console.error("Lỗi khi gửi/chỉnh sửa bình luận:", error);
      toast.error("Ảnh không phù hợp với tiêu chuẩn cộng đồng. Vui lòng thử lại.");
    } finally {
      setReviewLoading(false);
    }
  };


  const renderStars = (rating) => [...Array(5)].map((_, i) => (
    <span key={i} style={{ color: i < rating ? "#FFA500" : "#ccc", fontSize: "20px" }}>★</span>
  ));

  const getRatingStats = (comments) => {
    const stats = { total: 0, count: 0, byStar: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }, withText: 0, withImage: 0 };
    comments.forEach((c) => {
      stats.total += c.rating;
      stats.count += 1;
      stats.byStar[c.rating] += 1;
      if (c.comment_text?.trim()) stats.withText += 1;
      if (c.commentImages?.length > 0) stats.withImage += 1;
    });
    return { average: stats.count ? (stats.total / stats.count).toFixed(1) : 0, ...stats };
  };

  const ratingStats = getRatingStats(comments);
  const filteredComments = comments.filter((comment) => {
    if (filterType === "image") return comment.commentImages?.length > 0;
    if (filterType === "text") return comment.comment_text?.trim();
    if (filterType === "rating" && filterRating) return comment.rating === filterRating;
    return true;
  });
  const visibleComments = filteredComments.slice(0, visibleCount);

  return (
    <>
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="Full View"
            className="max-w-[90%] max-h-[90%] rounded-lg shadow-lg"
          />
        </div>
      )}
      {/* Filter & Rating Summary */}
      <div className="max-w-[900px] mx-auto mt-5 px-6 bg-[#fff7f4] rounded-md border py-6">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
          <div className="text-center md:text-left">
            <p className="text-4xl font-bold text-red-500">{ratingStats.average}</p>
            <p className="text-sm text-gray-500 mb-2">trên 5</p>
            <div className="flex justify-center md:justify-start">
              {renderStars(Math.round(ratingStats.average))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { setFilterType("all"); setFilterRating(null); }}
              className={`border rounded px-3 py-1 text-sm ${filterType === "all" ? "bg-red-500 text-white" : "bg-white text-black"}`}
            >
              Tất Cả
            </button>
            {[5, 4, 3, 2, 1].map((star) => (
              <button
                key={star}
                onClick={() => { setFilterType("rating"); setFilterRating(star); }}
                className={`border rounded px-3 py-1 text-sm ${filterType === "rating" && filterRating === star ? "bg-red-500 text-white" : "bg-white text-black"}`}
              >
                {star} Sao ({ratingStats.byStar[star]})
              </button>
            ))}
            <button
              onClick={() => { setFilterType("text"); setFilterRating(null); }}
              className={`border rounded px-3 py-1 text-sm ${filterType === "text" ? "bg-red-500 text-white" : "bg-white text-black"}`}
            >
              Có Bình Luận ({ratingStats.withText})
            </button>
            <button
              onClick={() => { setFilterType("image"); setFilterRating(null); }}
              className={`border rounded px-3 py-1 text-sm ${filterType === "image" ? "bg-red-500 text-white" : "bg-white text-black"}`}
            >
              Có Hình Ảnh / Video ({ratingStats.withImage})
            </button>
          </div>
        </div>
      </div>

      {/* Danh sách bình luận */}
      <div className="py-10 max-w-[900px] mx-auto">
        {visibleComments.map((comment) => (
          <div id={`comment-${comment.id}`} key={comment.id} className="bg-white border rounded-lg p-6 mb-6 shadow relative">
            {/* Góc phải trên: Số sao */}
            <div className="absolute top-4 right-4 flex items-center gap-1">
              {renderStars(comment.rating)}
              <span className="text-sm text-gray-500">({comment.rating.toFixed(1)})</span>
            </div>

            <div className="flex flex-col gap-4">
              {/* Tên người dùng */}
              <div className="text-lg font-semibold">{comment.user?.name || comment.author}</div>

              {/* Phân loại + Ngày */}
              <div className="text-sm text-gray-500">
                Phân loại hàng:{" "}
                <span className="font-medium">{comment.orderDetail?.variant?.sku || "Không rõ"}</span>{" "}
                | {new Date(comment.created_at).toLocaleDateString("vi-VN", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                })}
              </div>

              {/* Nội dung bình luận */}
              <p className="text-gray-700 text-base">{comment.comment_text}</p>

              {/* Ảnh hoặc video */}
              {comment.commentImages?.length > 0 && (
                <div className="flex gap-3 flex-wrap mt-2">
                  {comment.commentImages.map((media, idx) =>
                    media.image_url.endsWith(".mp4") ? (
                      <video key={idx} controls width="150" className="rounded-md">
                        <source src={media.image_url} type="video/mp4" />
                      </video>
                    ) : (

                      <img
                        key={idx}
                        src={media.image_url}
                        alt={`comment-img-${idx}`}
                        className="w-28 h-28 rounded-md object-cover cursor-pointer hover:opacity-80 transition"
                        onClick={() => setSelectedImage(media.image_url)}
                      />

                    )
                  )}
                </div>
              )}

              {/* Trả lời (nếu có) */}
              {comment.replys?.length > 0 && (
                <div className="pl-4 border-l mt-4 space-y-3">
                  {comment.replys.map((reply) => (
                    <div key={reply.id}>
                      <strong>{reply.author}</strong>
                      <p className="text-sm text-gray-600">{reply.comment_text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}


      </div>

      {/* Form viết đánh giá */}
      {userId && orderDetailId ? (
        <div className="write-review w-full mt-10 px-6 max-w-[900px] mx-auto">
          <h1 className="text-2xl font-medium text-qblack mb-5">Viết đánh giá của bạn</h1>
          <div className="flex space-x-1 items-center mb-6">
            <StarRating
              hoverRating={hoverRating}
              hoverHandler={(val) => setHoverRating(val)}
              rating={rating}
              ratingHandler={(val) => setRating(val)}
            />
            <span className="text-qblack text-[15px] font-normal mt-1">
              ({rating}.0)
            </span>
          </div>


          <textarea
            value={message}
            onChange={(e) => {
              if (e.target.value.length <= 100) {
                setMessage(e.target.value);
              } else {
                toast.error("Nội dung đánh giá không được vượt quá 100 ký tự!");
              }
            }}
            rows="4"
            placeholder="Nội dung đánh giá (tối đa 100 ký tự)..."
            className="w-full border p-4 rounded-md outline-none mb-1"
          />



          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium text-qblack">Tải hình ảnh (tối đa 3):</label>
            <label
              htmlFor="upload-images"
              className="w-full max-w-[300px] h-[45px] border border-gray-300 rounded-md flex items-center justify-center cursor-pointer hover:bg-gray-100 transition"
            >
              <span className="text-sm text-gray-600">Chọn ảnh từ thiết bị</span>
            </label>
            <input
              id="upload-images"
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files);
                if (files.length > 3) {
                  toast.error("Chỉ được tải tối đa 3 ảnh. Vui lòng chọn lại ảnh.");
                  e.target.value = null; // reset input nếu lỗi
                  return;
                }
                setImageFiles(files);
              }}
              className="hidden"
            />

            {imageFiles?.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-4">
                {imageFiles.map((file, idx) => (
                  <div key={idx} className="relative w-24 h-24 border rounded-md overflow-hidden">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Preview ${idx}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newFiles = imageFiles.filter((_, i) => i !== idx);
                        setImageFiles(newFiles);

                        // 🔑 reset input để có thể chọn lại file cũ
                        const inputEl = document.getElementById("upload-images");
                        if (inputEl) inputEl.value = "";
                      }}
                      className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] leading-none hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}



          </div>

          <div className="flex justify-end">
            <button
              onClick={reviewAction}
              type="button"
              className="black-btn w-[300px] h-[50px] flex justify-center"
            >
              <span className="flex space-x-1 items-center h-full">
                <span className="text-sm font-semibold">Gửi đánh giá</span>
                {reviewLoading && (
                  <span className="w-5" style={{ transform: "scale(0.3)" }}>
                    <LoaderStyleOne />
                  </span>
                )}
              </span>
            </button>
          </div>
        </div>
      ) : userId && !orderDetailId ? (
        <></>
      ) : (
        <p className="text-center mt-10 text-gray-500">Vui lòng đăng nhập để viết đánh giá.</p>
      )}
    </>
  );
};

export default ProductReviewSection;
