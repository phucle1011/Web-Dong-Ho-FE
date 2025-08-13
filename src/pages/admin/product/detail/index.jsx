import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import FormDelete from "../../../../components/formDelete";
import { toast } from "react-toastify";
import Constants from "../../../../Constants.jsx";
import { Modal, Carousel } from "react-bootstrap";
import {
  FaAngleDoubleLeft,
  FaChevronLeft,
  FaChevronRight,
  FaAngleDoubleRight,
  FaTrashAlt,
  FaEdit,
} from "react-icons/fa";
import { uploadToCloudinary } from "../../../../Upload/uploadToCloudinary.js";
import { Editor } from "@tinymce/tinymce-react";
import Select from "react-select";

import * as XLSX from "xlsx";
const AdminProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [formData, setFormData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [startIndex, setStartIndex] = useState(0);

  const [variants, setVariants] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 5;

  const [description, setDescription] = useState("");
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [brandOptions, setBrandOptions] = useState([]);
  const [attrExpanded, setAttrExpanded] = useState({});
  const [deletedImages, setDeletedImages] = useState([]);
  // phía trên cùng component
  const [errors, setErrors] = useState({});
  // phía trên cùng component (cùng nhóm useState khác)
  const [isUploadingThumb, setIsUploadingThumb] = useState(false);

  const toggleAttr = (variantId) =>
    setAttrExpanded((prev) => ({ ...prev, [variantId]: !prev[variantId] }));
  const handleImageClick = (images, index) => {
    setSelectedImages(images);
    setStartIndex(index);
    setShowModal(true);
  };
  const fetchVariants = async (page = 1) => {
    try {
      const res = await axios.get(
        `${Constants.DOMAIN_API}/admin/products/${id}?page=${page}&limit=${limit}`
      );

      setVariants(res.data.data.variants); // cập nhật biến thể theo trang
      setCurrentPage(res.data.data.pagination.page); // đồng bộ trang hiện tại với backend
      setTotalPages(res.data.data.pagination.totalPages); // tổng số trang
    } catch (error) {
      console.error("Lỗi khi lấy biến thể:", error);
    }
  };
  const validate = () => {
    const v = {};

    // ✅ BẮT những field bạn muốn
    if (!formData?.name?.trim()) v.name = "Vui lòng nhập tên sản phẩm";
    if (!formData?.category?.value) v.category = "Vui lòng chọn danh mục";
    if (!formData?.brand?.value) v.brand = "Vui lòng chọn thương hiệu";

    // ❌ KHÔNG BẮT 4 FIELD SAU: slug, thumbnail, short_description, description
    // (Không thêm gì ở đây)

    return v;
  };
  const fetchProduct = async () => {
    try {
      const res = await axios.get(
        `${Constants.DOMAIN_API}/admin/products/${id}`
      );

      const productData = res.data?.data || {};
      console.log(res.data?.data);

      // Lấy thông tin mô tả riêng
      setDescription(productData.description || "");

      // Thiết lập state formData với dữ liệu đã xử lý
      setFormData({
        ...productData,
        category: productData.category
          ? {
              value: productData.category.id,
              label: productData.category.name,
            }
          : null,
        brand: productData.brand
          ? {
              value: productData.brand.id,
              label: productData.brand.name,
            }
          : null,
      });

      // Lưu lại thông tin sản phẩm gốc (nếu cần)
      setProduct(productData);

      // Gọi song song danh sách danh mục và thương hiệu
      const [categoriesRes, brandsRes] = await Promise.all([
        axios.get(`${Constants.DOMAIN_API}/admin/product/get-category`),
        axios.get(`${Constants.DOMAIN_API}/admin/product/get-brand`),
      ]);

      // Gán options cho Select
      setCategoryOptions(
        (categoriesRes.data?.data || []).map((cat) => ({
          value: cat.id,
          label: cat.name,
        }))
      );
      setBrandOptions(
        (brandsRes.data?.data || []).map((brand) => ({
          value: brand.id,
          label: brand.name,
        }))
      );
    } catch (error) {
      console.error("Lỗi khi lấy chi tiết sản phẩm:", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await fetchProduct();
      await fetchVariants(currentPage);
    };
    if (id) {
      fetchData();
    }
  }, [id, currentPage]);
  // Gọi API lấy danh sách danh mục và thương hiệu
  useEffect(() => {
    const fetchData = async () => {
      try {
      } catch (error) {
        console.error("Lỗi khi gọi API:", error);
      }
    };

    fetchData();
  }, []);
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "name") {
      const slug = value
        .toLowerCase()
        .normalize("NFD") // Loại bỏ dấu tiếng Việt
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w\s-]/g, "") // Xoá ký tự đặc biệt
        .trim()
        .replace(/\s+/g, "-") // Thay khoảng trắng thành dấu gạch ngang
        .replace(/--+/g, "-"); // Xoá dấu gạch ngang dư

      setFormData((prev) => ({
        ...prev,
        name: value,
        slug: slug,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]:
          name === "price" || name === "discount_price"
            ? parseFloat(value)
            : value,
      }));
    }
  };
  const onChangeCategory = (selected) => {
    setErrors((p) => ({ ...p, category: undefined }));
    setFormData((prev) => ({ ...prev, category: selected }));
  };
  const onChangeBrand = (selected) => {
    setErrors((p) => ({ ...p, brand: undefined }));
    setFormData((prev) => ({ ...prev, brand: selected }));
  };
  const productData = {
    ...formData,
    category_id: formData?.category?.value || null,
    brand_id: formData?.brand?.value || null,
    description: description || "",
  };

  const handleSave = async () => {
    const v = validate();
    if (Object.keys(v).length) {
      setErrors(v);
      toast.error("Vui lòng kiểm tra các trường bắt buộc.");
      const firstKey = Object.keys(v)[0];
      const el = document.querySelector(`[data-error="${firstKey}"]`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    try {
      setSaving(true);
      await axios.put(`${Constants.DOMAIN_API}/admin/products/${id}`, {
        ...formData,
        category_id: formData?.category?.value || null,
        brand_id: formData?.brand?.value || null,
        description, // vẫn gửi mô tả nếu bạn đang dùng TinyMCE state 'description'
      });
      toast.success("Cập nhật sản phẩm thành công!");
      navigate("/admin/products/getAll");
    } catch (error) {
      console.error("Lỗi khi cập nhật sản phẩm:", error);
      toast.error("Cập nhật thất bại. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };
  const deleteProduct = async () => {
    if (!selectedProduct) return;

    try {
      await axios.delete(
        `${Constants.DOMAIN_API}/admin/variants/${selectedProduct.id}`
      );
      toast.error("Xóa sản phẩm thành công");

      // 👉 Gọi lại API để cập nhật danh sách biến thể
      fetchVariants(currentPage);
    } catch (error) {
      console.error("Lỗi khi xóa sản phẩm:", error);
      if (
        error.response?.data?.error?.includes("foreign key constraint fails")
      ) {
        toast.error("Không thể xóa vì có sản phẩm đang sử dụng sản phẩm này.");
      } else {
        toast.error("Xóa thất bại. Vui lòng thử lại.");
      }
    } finally {
      setSelectedProduct(null);
    }
  };

  if (!formData) return <div>Đang tải...</div>;
  const handleThumbnailChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploadingThumb(true); // ⬅️ bắt đầu chặn nút Lưu
    try {
      const imageUrl = await uploadToCloudinary(file);

      if (imageUrl.public_id) {
        setDeletedImages((prev) => [...prev, imageUrl.public_id]);
      }

      setFormData((prev) => ({
        ...prev,
        thumbnail: imageUrl.url,
      }));

      toast.success("Tải ảnh lên thành công!");
    } catch (error) {
      console.error("Lỗi khi upload ảnh:", error);
      toast.error("Tải ảnh thất bại!");
    } finally {
      setIsUploadingThumb(false); // ⬅️ Cloudinary trả về xong → mở nút Lưu
    }
  };

  const deleteImagesOnCloudinary = async () => {
    for (const public_id of deletedImages) {
      try {
        await axios.post(
          `${Constants.DOMAIN_API}/admin/products/imagesClauding`,
          {
            public_id,
          }
        );
        console.log(`Đã xoá ảnh: ${public_id}`);
      } catch (err) {
        console.error("Xoá ảnh thất bại:", err);
      }
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white shadow rounded-md p-4">
        <h2 className="text-2xl font-semibold mb-4">Chỉnh sửa sản phẩm</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-4">
          {/* Card 1: Ảnh đại diện + Upload */}
          <div className="p-4 border rounded shadow bg-white flex flex-col items-center">
            <label className="font-semibold mb-2 self-start">
              Ảnh đại diện:
            </label>
            <img
              src={formData.thumbnail || ""}
              alt="Thumbnail"
              className="w-32 h-32 object-cover rounded mb-2"
            />
            <input
              type="file"
              accept="image/*"
              onChange={handleThumbnailChange}
              className="w-full"
            />
          </div>
          {/* Card 2: Tên + Slug */}
          <div className="p-4 border rounded shadow bg-white">
            {/* Tên sản phẩm */}
            <div>
              <label className="font-semibold mb-1 block">Tên sản phẩm:</label>
              <input
                type="text"
                name="name"
                data-error="name"
                className={`border rounded p-2 w-full ${
                  errors.name ? "border-red-500" : ""
                }`}
                value={formData.name || ""}
                onChange={handleChange}
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            {/* Gạch ngang */}
            <hr className="my-3" />

            {/* Slug */}
            <div>
              <label className="font-semibold mb-1 block">Slug:</label>
              <input
                readOnly
                type="text"
                name="slug"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed"
                value={formData.slug}
                onChange={handleChange}
              />
            </div>
          </div>
          {/* Card 3: Danh mục + Thương hiệu */}
          <div className="p-4 border rounded shadow bg-white">
            {/* Danh mục */}
            <div style={{ position: "relative", zIndex: 1 }}>
              <label className="font-semibold mb-1 block">Danh mục:</label>
              <div data-error="category">
                <Select
                  options={categoryOptions}
                  value={formData?.category || null}
                  onChange={onChangeCategory}
                  placeholder="Chọn danh mục"
                  isClearable
                  menuPortalTarget={document.body}
                  styles={{
                    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                    control: (base) => ({
                      ...base,
                      borderColor: errors.category
                        ? "#ef4444"
                        : base.borderColor,
                      boxShadow: errors.category
                        ? "0 0 0 1px #ef4444"
                        : base.boxShadow,
                      "&:hover": {
                        borderColor: errors.category
                          ? "#ef4444"
                          : base.borderColor,
                      },
                    }),
                  }}
                />
              </div>
              {errors.category && (
                <p className="text-red-500 text-sm mt-1">{errors.category}</p>
              )}
            </div>

            <hr className="my-3" />

            {/* Thương hiệu */}
            <div style={{ position: "relative", zIndex: 1 }}>
              <label className="font-semibold mb-1 block">Thương hiệu:</label>
              <div data-error="brand">
                <Select
                  options={brandOptions}
                  value={formData?.brand || null}
                  onChange={onChangeBrand}
                  placeholder="Chọn thương hiệu"
                  isClearable
                  menuPortalTarget={document.body}
                  styles={{
                    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                    control: (base) => ({
                      ...base,
                      borderColor: errors.brand ? "#ef4444" : base.borderColor,
                      boxShadow: errors.brand
                        ? "0 0 0 1px #ef4444"
                        : base.boxShadow,
                      "&:hover": {
                        borderColor: errors.brand
                          ? "#ef4444"
                          : base.borderColor,
                      },
                    }),
                  }}
                />
              </div>
              {errors.brand && (
                <p className="text-red-500 text-sm mt-1">{errors.brand}</p>
              )}
            </div>
          </div>

          {/* Card 4: Trạng thái */}
          <div className="p-4 border rounded shadow bg-white">
            <span className="fw-semibold d-block mb-1">
              Trạng thái hiển thị:
            </span>
            <div className="border rounded p-2">
              <div className="form-check form-switch m-0">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="statusSwitch"
                  checked={formData.status === 1}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      status: e.target.checked ? 1 : 0,
                    }))
                  }
                />
                <span className="form-check-label ms-2">
                  {formData.status === 1 ? "Hiển thị" : "Ẩn"}
                </span>
              </div>
            </div>

            <hr className="my-3" />

            <span className="fw-semibold d-block mb-1">
              Tình trạng xuất bản:
            </span>
            <div className="border rounded p-2">
              <div className="form-check form-switch m-0">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="publicationSwitch"
                  checked={formData.publication_status === "published"}
                  onChange={(e) => {
                    if (formData.publication_status !== "published") {
                      setFormData((prev) => ({
                        ...prev,
                        publication_status: e.target.checked
                          ? "published"
                          : "draft",
                      }));
                    }
                  }}
                  disabled={formData.publication_status === "published"}
                />
                <span className="form-check-label ms-2">
                  {formData.publication_status === "published"
                    ? "Đã xuất bản"
                    : "Bản nháp"}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="mb-4">
          <label className="font-semibold block mb-2">Mô tả ngắn:</label>
          <textarea
            rows={3}
            name="short_description"
            className="w-full border p-2 rounded"
            value={formData.short_description || ""}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                short_description: e.target.value,
              }))
            }
          />
        </div>

        <div className="mb-4">
          <label className="font-semibold block mb-2">Mô tả:</label>
          <Editor
            apiKey="242t4tlz75qp0zzr2tgk6oz501hd80om15fr7rykscdflilg"
            value={description}
            init={{
              height: 400,
              menubar: true,
              plugins: [
                "advlist",
                "autolink",
                "lists",
                "link",
                "image",
                "charmap",
                "preview",
                "anchor",
                "searchreplace",
                "visualblocks",
                "code",
                "fullscreen",
                "insertdatetime",
                "media",
                "table",
                "help",
                "wordcount",
              ],
              toolbar:
                "undo redo | formatselect | bold italic backcolor | \
         alignleft aligncenter alignright alignjustify | \
         bullist numlist outdent indent | image | help",
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
            onEditorChange={(content) => setDescription(content)}
          />
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={handleSave}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={saving || isUploadingThumb} // ⬅️ thêm isUploadingThumb
          >
            {saving ? "Đang lưu..." : "Lưu"}
          </button>

          <Link
            to="/admin/products/getAll"
            className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
            onClick={async (e) => {
              e.preventDefault();
              await deleteImagesOnCloudinary();
              navigate("/admin/products/getAll");
            }}
          >
            Quay lại
          </Link>
        </div>

        {/* Bảng biến thể vẫn giữ nguyên như cũ */}
        {variants?.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Biến thể sản phẩm:</h3>
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-2 border">#</th>
                  <th className="p-2 border">SKU</th>
                  <th className="p-2 border">Loại</th>
                  <th className="p-2 border">Giá</th>
                  <th className="p-2 border">Kho</th>
                  <th className="p-2 border">Thuộc tính</th>
                  <th className="p-2 border">Ảnh</th>
                  <th className="p-2 border">Hành động</th>
                </tr>
              </thead>

              <tbody>
                {variants.map((variant, index) => {
                  const isAuction =
                    variant.is_auction_only === 1 ||
                    variant.is_auction_only === "1" ||
                    variant.is_auction_only === true;

                  return (
                    <tr key={variant.id} className="border-b">
                      <td className="p-2 border text-center">
                        {(currentPage - 1) * limit + index + 1}
                      </td>

                      <td className="p-2 border">{variant.sku}</td>

                      {/* 🔹 HIỂN THỊ LOẠI */}
                      <td className="p-2 border">
                        {isAuction ? (
                          <span className="inline-block px-2 py-0.5 rounded text-xs border border-purple-300 bg-purple-100 text-purple-700">
                            Đang đấu giá
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded text-xs border border-gray-300 bg-gray-100 text-gray-700">
                            Bán thường
                          </span>
                        )}
                      </td>

                      <td className="p-2 border">
                        {Number(variant.price).toLocaleString()} đ
                      </td>

                      {/* 🔹 (Tuỳ chọn) Thể hiện stock rõ hơn khi là đấu giá */}
                      <td className="p-2 border">
                        {isAuction ? (
                          <span>{variant.stock}</span>
                        ) : (
                          variant.stock ?? "Chưa có"
                        )}
                      </td>

                      {/* ... giữ nguyên các cột còn lại */}
                      <td className="p-2 border">
                        {(() => {
                          const MAX = 4;
                          const attrs = variant.attributeValues || [];
                          const isExpanded = !!attrExpanded[variant.id];
                          const visible = isExpanded
                            ? attrs
                            : attrs.slice(0, MAX);

                          // Hàm nhận diện thuộc tính màu (hỗ trợ cả "Màu sắc" và "Color")
                          const isColorAttr = (name) => {
                            if (!name) return false;
                            const n = String(name).trim().toLowerCase();
                            return n === "màu sắc" || n === "color";
                          };

                          return (
                            <>
                              {visible.map((av) => (
                                <div
                                  key={av.id}
                                  className="flex items-center gap-2 mb-1"
                                >
                                  <strong>{av.attribute?.name}:</strong>
                                  {isColorAttr(av.attribute?.name) ? (
                                    <div
                                      className="w-6 h-6 rounded border"
                                      style={{ backgroundColor: av.value }}
                                      title={av.value}
                                    />
                                  ) : (
                                    <span>{av.value}</span>
                                  )}
                                </div>
                              ))}

                              {/* Nút Xem thêm / Thu gọn khi có hơn MAX dòng */}
                              {attrs.length > MAX && (
                                <button
                                  type="button"
                                  onClick={() => toggleAttr(variant.id)}
                                  className="mt-1 text-xs text-blue-600 "
                                >
                                  {isExpanded
                                    ? "Thu gọn"
                                    : `Xem thêm (${attrs.length - MAX})`}
                                </button>
                              )}
                            </>
                          );
                        })()}
                      </td>

                      <td className="p-2 border text-center">
                        <div className="flex justify-center items-center h-full">
                          {variant.images && variant.images.length > 0 ? (
                            <img
                              key={variant.images[0].id}
                              src={variant.images[0].image_url}
                              alt="Variant"
                              width="60"
                              className="cursor-pointer rounded border"
                              onClick={() =>
                                handleImageClick(variant.images, 0)
                              }
                            />
                          ) : (
                            <span>Không có ảnh</span>
                          )}
                        </div>
                      </td>
                      <td className="p-2 border text-center">
                        <div className="flex gap-2 justify-center">
                          <Link
                            to={`/admin/products/editVariant/${variant.id}`}
                            className="bg-yellow-500 text-white p-2 rounded w-8 h-8 inline-flex items-center justify-center"
                          >
                            <FaEdit size={20} className="font-bold" />
                          </Link>
                          {variant.canDelete && (
                            <button
                              onClick={() => setSelectedProduct(variant)}
                              className="p-2 bg-red-500 text-white rounded hover:bg-red-600"
                              title="Xoá biến thể"
                            >
                              <FaTrashAlt size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="w-full flex justify-center mt-4">
              <div className="inline-flex items-center space-x-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(1)}
                  className="px-2 py-1 border rounded disabled:opacity-50"
                >
                  <FaAngleDoubleLeft />
                </button>
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                  className="px-2 py-1 border rounded disabled:opacity-50"
                >
                  <FaChevronLeft />
                </button>

                {currentPage > 2 && (
                  <>
                    <button
                      onClick={() => setCurrentPage(1)}
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
                        onClick={() => setCurrentPage(page)}
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
                      onClick={() => setCurrentPage(totalPages)}
                      className="px-3 py-1 border rounded"
                    >
                      {totalPages}
                    </button>
                  </>
                )}

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                  className="px-2 py-1 border rounded disabled:opacity-50"
                >
                  <FaChevronRight />
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                  className="px-2 py-1 border rounded disabled:opacity-50"
                >
                  <FaAngleDoubleRight />
                </button>
              </div>
            </div>

            {selectedProduct && (
              <FormDelete
                isOpen={true}
                onClose={() => setSelectedProduct(null)}
                onConfirm={deleteProduct}
                message={`Bạn có chắc chắn muốn xóa sản phẩm "${selectedProduct.name}" không?`}
              />
            )}
          </div>
        )}
      </div>
      {/* Modal hiển thị ảnh lớn */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        size="lg"
        centered
        backdrop="static"
        animation={true}
      >
        <Modal.Header closeButton>
          <Modal.Title>Xem ảnh </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Carousel interval={null} defaultActiveIndex={startIndex}>
            {selectedImages.map((img) => (
              <Carousel.Item key={img.id}>
                <img
                  className="d-block w-100"
                  src={img.image_url}
                  alt="Bình luận"
                  style={{ maxHeight: "70vh", objectFit: "contain" }}
                />
              </Carousel.Item>
            ))}
          </Carousel>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default AdminProductDetail;
