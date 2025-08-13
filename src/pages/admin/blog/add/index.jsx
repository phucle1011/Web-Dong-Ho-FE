import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { Editor } from "@tinymce/tinymce-react";
import Constants from "../../../../Constants";
import { decodeToken } from "../../../client/Helpers/jwtDecode";
import "tinymce/skins/ui/oxide/skin.min.css";
import "tinymce/skins/content/default/content.min.css";
import { uploadToCloudinary } from "../../../../Upload/uploadToCloudinary.js";
import { toast } from "react-toastify";

function AddBlog() {
  const [categoryPage, setCategoryPage] = useState(1);
  const [totalCategoryPages, setTotalCategoryPages] = useState(1);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [selectedCategoryName, setSelectedCategoryName] = useState("");
  const perPage = 10;
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryStatus, setNewCategoryStatus] = useState("true");
  const [newCategoryError, setNewCategoryError] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [metaDescription, setMetaDescription] = useState("");
  const [userId, setUserId] = useState("");
  const [categories, setCategories] = useState([]);
  const [blogCategoryId, setBlogCategoryId] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [imagePreview, setImagePreview] = useState("");
  
  const navigate = useNavigate();
  const editorRef = useRef(null);

  const CLOUD_NAME = "ddkqka4b4";
  const UPLOAD_PRESET = "duantotnghiep_preset";

  const fetchCategories = async (page = 1) => {
    try {
      const res = await fetch(`${Constants.DOMAIN_API}/admin/blogcategory/list?page=${page}&limit=${perPage}&status=1`);
      const data = await res.json();
      setCategories(data.data || []);
      setCategoryPage(page);
      setTotalCategoryPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error("Lỗi lấy danh mục:", error);
    }
  };

  useEffect(() => {
    fetchCategories(1);
    const token = localStorage.getItem("token");
    if (token) {
      const decoded = decodeToken(token);
      setUserId(decoded?.id || "");
    }
  }, []);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      setNewCategoryError("Tên danh mục không được để trống.");
      return;
    }

    setNewCategoryError("");
    setAddingCategory(true);

    try {
      const res = await fetch(`${Constants.DOMAIN_API}/admin/blogcategory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          status: newCategoryStatus === "true"
        }),
      });

      if (res.ok) {
        const newCategory = await res.json();

        toast.success("Thêm danh mục thành công");
        await fetchCategories(1);

        setBlogCategoryId(newCategory.id);
        setSelectedCategoryName(newCategory.name);

        setShowCategoryModal(false);
        setNewCategoryName("");
        setNewCategoryStatus("true");
      } else if (res.status === 409) {
        const data = await res.json();
        setNewCategoryError(data.message || "Tên danh mục đã tồn tại.");
      } else {
        const data = await res.json();
        setNewCategoryError(data.message || "Không thể thêm danh mục.");
      }
    } catch (error) {
      console.error("Lỗi fetch:", error);
      setNewCategoryError("Có lỗi xảy ra khi thêm danh mục.");
    } finally {
      setAddingCategory(false);
    }
  };

  const handleImageUpload = async () => {
    if (!image) return "";
    const formData = new FormData();
    formData.append("file", image);
    formData.append("upload_preset", UPLOAD_PRESET);
    setUploading(true);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData }
      );
      const data = await response.json();
      setUploading(false);
      return data.secure_url || "";
    } catch (error) {
      setUploading(false);
      Swal.fire("Lỗi", "Không thể tải ảnh lên Cloudinary", "error");
      return "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const contentValue = editorRef.current?.getContent() || content;
    const plainText = contentValue.replace(/<[^>]+>/g, '').trim();

    const newErrors = {};
    if (!title.trim()) newErrors.title = "Tiêu đề không được để trống.";
    if (!plainText) newErrors.content = "Nội dung không được để trống.";
    if (!image) newErrors.image = "Vui lòng chọn ảnh đại diện.";
    if (!blogCategoryId) newErrors.category = "Vui lòng chọn danh mục.";
    if (!metaDescription.trim()) newErrors.metaDescription = "Mô tả không được để trống.";

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      return;
    }

    setFormErrors({});

    const imageUrl = await handleImageUpload();
    if (!imageUrl) return;

    try {
      const response = await fetch(`${Constants.DOMAIN_API}/admin/blog/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content: contentValue,
          image_url: imageUrl,
          user_id: userId,
          meta_description: metaDescription,
          blogCategory_id: blogCategoryId
        }),
      });

      if (response.ok) {
        toast.success("Thêm bài viết thành công!");
        navigate("/admin/blog/getAll");
      }

    } catch (error) {
      toast.error("Gửi dữ liệu thất bại. Vui lòng thử lại!");
    }

  };

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-md-12">
          <div className="card mb-4">
            <div className="card-body p-4">
              <h5 className="card-title fw-semibold mb-4">Thêm bài viết mới</h5>
              <form onSubmit={handleSubmit}>
                <input
                  type="text"
                  className="form-control"
                  value={title}
                  onChange={(e) => {
                    const newTitle = e.target.value;
                    const wordCount = newTitle.trim().split(/\s+/).length;

                    setTitle(newTitle);

                    if (wordCount > 200) {
                      setFormErrors(prev => ({
                        ...prev,
                        title: "Tiêu đề không được quá 200 từ."
                      }));
                    } else if (newTitle.length > 255) {
                      setFormErrors(prev => ({
                        ...prev,
                        title: "Tiêu đề không được vượt quá 255 ký tự."
                      }));
                    } else {
                      setFormErrors(prev => ({ ...prev, title: "" }));
                    }
                  }}
                  placeholder="Nhập tiêu đề"
                />

                {formErrors.title && (
                  <div className="text-danger mt-1">{formErrors.title}</div>
                )}


                <div className="row mb-3">
                  {/* Chọn danh mục */}

                  <div className="col-md-6 position-relative mt-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <label className="form-label fw-bold mb-0">Danh mục</label>
                      <button
                        type="button"
                        onClick={() => setShowCategoryModal(true)}
                        className="text-blue-600 text-sm"
                      >
                        + Thêm danh mục
                      </button>
                    </div>


                    <div
                      className="form-control d-flex justify-between align-items-center"
                      onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                      style={{ cursor: "pointer" }}
                    >
                      {selectedCategoryName || "-- Chọn danh mục --"}
                    </div>

                    {/* Dropdown */}
                    {isCategoryDropdownOpen && (
                      <div
                        className="border bg-white shadow-sm position-absolute z-10 mt-1 rounded"
                        style={{ width: "100%", maxHeight: "250px", overflowY: "auto" }}
                      >
                        {categories.map((cat) => (
                          <div
                            key={cat.id}
                            className={`px-3 py-2 hover:bg-light ${blogCategoryId === cat.id ? "bg-primary text-white" : ""}`}
                            style={{ cursor: "pointer" }}
                            onClick={() => {
                              setBlogCategoryId(cat.id);
                              setSelectedCategoryName(cat.name);
                              setIsCategoryDropdownOpen(false);
                            }}
                          >
                            {cat.name}
                          </div>
                        ))}

                        {/* Phân trang ngay trong dropdown */}
                        <div className="d-flex justify-content-center gap-2 px-2 py-2 border-top">
                          <button type="button" disabled={categoryPage === 1} onClick={() => fetchCategories(1)} className="btn btn-sm btn-light">&laquo;</button>
                          <button type="button" disabled={categoryPage === 1} onClick={() => fetchCategories(categoryPage - 1)} className="btn btn-sm btn-light">&lsaquo;</button>
                          {[...Array(totalCategoryPages)].map((_, i) => {
                            const page = i + 1;
                            return (
                              <button
                              type="button"
                                key={page}
                                onClick={() => fetchCategories(page)}
                                className={`btn btn-sm ${categoryPage === page ? "btn-primary text-white" : "btn-light"}`}
                              >
                                {page}
                              </button>
                            );
                          })}
                          <button type="button" disabled={categoryPage === totalCategoryPages} onClick={() => fetchCategories(categoryPage + 1)} className="btn btn-sm btn-light">&rsaquo;</button>
                          <button type="button" disabled={categoryPage === totalCategoryPages} onClick={() => fetchCategories(totalCategoryPages)} className="btn btn-sm btn-light">&raquo;</button>
                        </div>
                      </div>
                    )}
                    {formErrors.category && (
                      <div className="text-danger mt-1">{formErrors.category}</div>
                    )}

                  </div>


                  {/* Ảnh đại diện */}
                  <div className="col-md-6 mt-3">
                    <label className="form-label fw-bold">Ảnh đại diện</label>
                    <input
                      type="file"
                      className="form-control"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setImage(file);
                          setImagePreview(URL.createObjectURL(file));
                        }
                      }}

                    />
                    {formErrors.image && (
                      <div className="text-danger mt-1">{formErrors.image}</div>
                    )}

                    {uploading && <p className="text-muted mt-1">Đang tải ảnh lên...</p>}
                  </div>
                </div>


                <label className="form-label fw-bold">Mô tả ngắn</label>
                <Editor
                  apiKey="242t4tlz75qp0zzr2tgk6oz501hd80om15fr7rykscdflilg"
                  value={metaDescription}
                  onEditorChange={(newValue) => setMetaDescription(newValue)}
                  init={{
                    height: 200,
                    menubar: false,
                    plugins: ["lists", "link", "autolink", "charmap", "preview"],
                    toolbar:
                      "undo redo | bold italic underline | alignleft aligncenter alignright | bullist numlist",
                    placeholder: "Nhập mô tả ngắn cho bài viết",
                  }}
                />
                {formErrors.metaDescription && (
                  <div className="text-danger mt-1">{formErrors.metaDescription}</div>
                )}





                <label className="form-label fw-bold mt-3">Nội dung bài viết</label>
                <Editor
                  apiKey="242t4tlz75qp0zzr2tgk6oz501hd80om15fr7rykscdflilg"
                  value={content}
                  onInit={(evt, editor) => (editorRef.current = editor)}
                  init={{
                    height: 400,
                    menubar: true,
                    plugins: [
                      "advlist", "autolink", "lists", "link", "image", "charmap", "preview", "anchor",
                      "searchreplace", "visualblocks", "code", "fullscreen", "insertdatetime", "media", "table", "help", "wordcount"
                    ],
                    toolbar:
                      "undo redo | formatselect | bold italic backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | image | help",
                    image_title: true,
                    automatic_uploads: true,
                    file_picker_types: "image",
                    file_picker_callback: function (cb, value, meta) {
                      const input = document.createElement("input");
                      input.setAttribute("type", "file");
                      input.setAttribute("accept", "image/*");
                      input.onchange = async function () {
                        const file = input.files[0];
                        if (!file) return;
                        try {
                          const result = await uploadToCloudinary(file);
                          cb(result.url, { title: file.name });
                        } catch (err) {
                          console.error("Upload lỗi:", err);
                        }
                      };
                      input.click();
                    },
                  }}
                  onEditorChange={(newContent) => setContent(newContent)}
                />
                {formErrors.content && (
                  <div className="text-danger mt-1">{formErrors.content}</div>
                )}
                {showCategoryModal && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">


                    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                      <h2 className="text-lg font-semibold mb-4">Thêm danh mục mới</h2>
                      <div className="mb-3">
                        <label className="form-label">Tên danh mục</label>
                        <input
                          type="text"
                          className="form-control"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                        />
                        {newCategoryError && <p className="text-danger text-sm mt-1">{newCategoryError}</p>}
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Trạng thái</label>
                        <select
                          className="form-select"
                          value={newCategoryStatus}
                          onChange={(e) => setNewCategoryStatus(e.target.value)}
                        >
                          <option value="true">Hiển thị</option>
                          <option value="false">Ẩn</option>
                        </select>
                      </div>
                      <div className="d-flex justify-content-end gap-2">
                        <button
                          className="btn btn-secondary"
                          onClick={() => setShowCategoryModal(false)}
                          disabled={addingCategory}
                        >
                          Hủy
                        </button>
                        <button
                          className="btn btn-primary"
                          onClick={handleAddCategory}
                          disabled={addingCategory}
                        >
                          {addingCategory ? "Đang thêm..." : "Thêm"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="d-flex justify-content-start gap-2 mt-3">
<button
  type="submit"
  disabled={uploading}
  className="bg-[#073272] text-white px-6 py-2 rounded hover:bg-[#052354] transition"
>
  {uploading ? "Đang thêm..." : "Thêm bài viết"}
</button>

                  <button
                    type="button"
                    className="btn"
                    style={{ backgroundColor: "#6c757d", color: "#fff", border: "none" }}
                    onClick={() => navigate(-1)}
                  >
                    Quay lại
                  </button>
                </div>

              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddBlog;
