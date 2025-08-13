import React, { useEffect, useState,useRef  } from "react";
import axios from "axios";
import { useParams, Link, useNavigate } from "react-router-dom";
import { uploadToCloudinary } from "../../../../Upload/uploadToCloudinary.js";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Constants from "../../../../Constants.jsx";

const EditVariantForm = () => {
  const { id } = useParams();
  const [variant, setVariant] = useState(null);
  const [attributesList, setAttributesList] = useState([]);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    id: "",
    sku: "",
    price: 0,
    stock: "",
    attributes: [],
    images: [],
    is_auction_only: 0,
  });
// phía trên cùng component, cùng nhóm useState khác
const [isUploadingImages, setIsUploadingImages] = useState(false);

  // ---- NEW: errors state ----
  const [errors, setErrors] = useState({});
const initialAuctionRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const attrRes = await axios.get(
          `${Constants.DOMAIN_API}/admin/product-attributes`
        );
        setAttributesList(attrRes.data.data || []);

        const res = await axios.get(
          `${Constants.DOMAIN_API}/admin/variants/${id}`
        );
        const data = res.data.data;
initialAuctionRef.current = Number(data.is_auction_only) || 0;

        const hasPromotion =
          data.promotionProducts && data.promotionProducts.length > 0;

        setVariant(data);
        setFormData({
          sku: data.sku || "",
          price: data.price || "",
          stock: data.stock || "",
          product_id: data.product_id || "",
          attributes:
            data.attributeValues?.map((attr) => ({
              id: attr.id,
              attribute_id: attr.product_attribute_id,
              value: attr.value,
            })) || [],
          images:
            data.images?.map((img) => ({
              id: img.id,
              url: img.image_url,
            })) || [],
          is_auction_only: Number(data.is_auction_only) || 0,
          has_promotion: hasPromotion,
        });
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu:", err);
        toast.error("Lỗi khi tải dữ liệu!");
      }
    };

    fetchData();
  }, [id]);

  // ---- CHANGE: clear lỗi khi gõ ----
  const handleChange = (e) => {
    const { name, value } = e.target;

    setErrors((prev) => ({ ...prev, [name]: undefined }));

    if (name === "price") {
      const raw = value.replace(/[^\d]/g, "");
      const numeric = parseInt(raw || "0", 10);
      setFormData((prev) => ({
        ...prev,
        price: numeric > 0 ? numeric : "",
      }));
    } else if (name === "stock") {
      const raw = value.replace(/[^\d]/g, "");
      const numeric = parseInt(raw || "0", 10);
      setFormData((prev) => ({
        ...prev,
        stock: numeric > 0 ? numeric : "",
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleAttributeChange = (index, field, value) => {
    const newAttributes = [...formData.attributes];
    newAttributes[index][field] = value;
    setFormData((prev) => ({ ...prev, attributes: newAttributes }));
    // clear lỗi chung attributes khi user sửa
    setErrors((prev) => ({ ...prev, attributes: undefined }));
  };

  const addAttributeField = () => {
    setFormData((prev) => ({
      ...prev,
      attributes: [...prev.attributes, { attribute_id: "", value: "" }],
    }));
    setErrors((prev) => ({ ...prev, attributes: undefined }));
  };

  const handleImageUpload = async (e) => {
  const files = Array.from(e.target.files || []);
  if (files.length === 0) return;

  setIsUploadingImages(true); // ⬅️ chặn submit trong lúc upload
  try {
    // Upload song song, gọn hơn
    const uploaded = await Promise.all(
      files.map(async (file) => {
        const { url, public_id } = await uploadToCloudinary(file);
        return { id: null, url: { url, public_id } };
      })
    );

    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...uploaded],
    }));

    toast.success("Tải ảnh lên thành công!");
  } catch (error) {
    console.error("Upload thất bại:", error);
    toast.error("Lỗi khi upload ảnh lên Cloudinary!");
  } finally {
    setIsUploadingImages(false); // ⬅️ mở submit khi xong
  }

  e.target.value = ""; // reset input
};


  const handleDeleteAttribute = async (id) => {
    const newAttributes = [...formData.attributes];
    const index = newAttributes.findIndex((attr) => attr.id === id);
    if (index === -1) return;

    if (id) {
      try {
        await axios.delete(
          `${Constants.DOMAIN_API}/admin/product-variants/deleteAttributeValueById/${id}`
        );
      } catch (error) {
        console.error("Lỗi khi xóa thuộc tính:", error);
        toast.error("Xoá thuộc tính thất bại!");
        return;
      }
    }

    newAttributes.splice(index, 1);
    setFormData((prev) => ({ ...prev, attributes: newAttributes }));
  };

  const handleDeleteImage = async (index) => {
    const image = formData.images[index];
    if (!image) return;
    try {
      if (image.id) {
        await axios.delete(
          `${Constants.DOMAIN_API}/admin/variant-images/${image.id}`
        );
      } else if (image.url?.public_id) {
        await axios.post(
          `${Constants.DOMAIN_API}/admin/products/imagesClauding`,
          {
            public_id: image.url.public_id,
          }
        );
      }
    } catch (error) {
      console.error("Lỗi khi xóa ảnh:", error);
      toast.error("Xoá ảnh thất bại!");
      return;
    }

    const newImages = [...formData.images];
    newImages.splice(index, 1);
    setFormData((prev) => ({ ...prev, images: newImages }));

    toast.error("Đã xoá ảnh.");
  };

  const addImageField = () => {
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, { id: null, url: "" }],
    }));
  };

  // ---- NEW: validate form (BỎ QUA ẢNH) ----
  const validate = () => {
    const v = {};

    if (!formData.sku?.trim()) v.sku = "Vui lòng nhập SKU.";
    if (!formData.price || Number(formData.price) <= 0)
      v.price = "Giá phải lớn hơn 0.";

    if (Number(formData.is_auction_only) !== 1) {
      if (!formData.stock || Number(formData.stock) <= 0)
        v.stock = "Tồn kho phải lớn hơn 0.";
    }

    // attributes: ít nhất 1 và mỗi dòng phải chọn attribute_id + có value
    const attrs = formData.attributes || [];
    const invalid =
      attrs.length === 0 ||
      attrs.some(
        (a) =>
          !a ||
          !String(a.attribute_id || "").trim() ||
          !String(a.value || "").trim()
      );
    if (invalid)
      v.attributes =
        "Vui lòng thêm ít nhất 1 thuộc tính và nhập đầy đủ giá trị.";

    // ❌ KHÔNG BẮT LỖI ẢNH: images (bỏ qua)

    return v;
  };

  // scroll tới field lỗi đầu tiên
  const scrollToFirstError = (v) => {
    const firstKey = Object.keys(v)[0];
    const el = document.querySelector(`[data-error="${firstKey}"]`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const v = validate();
    if (Object.keys(v).length) {
      setErrors(v);
      toast.error("Vui lòng kiểm tra các trường bắt buộc.");
      scrollToFirstError(v);
      return;
    }

    const preparedData = {
      ...formData,
      price: Number(formData.price),
      images: formData.images.map((img) => img.url),
      is_auction_only: Number(formData.is_auction_only) || 0,
    };

    try {
      await axios.put(
        `${Constants.DOMAIN_API}/admin/variants/${id}`,
        preparedData
      );
      toast.success("Cập nhật biến thể thành công!");
      navigate(`/admin/products/detail/${formData.product_id}`);
    } catch (error) {
      console.error("Lỗi khi cập nhật:", error);
      toast.error("Cập nhật thất bại!");
    }
  };

  const deleteCloudImage = async (public_id) => {
    try {
      await axios.post(
        `${Constants.DOMAIN_API}/admin/products/imagesClauding`,
        {
          public_id,
        }
      );
    } catch (err) {
      console.error("Lỗi xóa ảnh Cloudinary:", err);
    }
  };

  const handleBack = async () => {
    const cloudOnlyImages = formData.images.filter(
      (img) => !img.id && img.url?.public_id
    );

    for (const img of cloudOnlyImages) {
      await deleteCloudImage(img.url.public_id);
    }

    navigate(`/admin/products/detail/${formData.product_id}`);
  };

  if (!variant) return <p>Đang tải dữ liệu...</p>;

  return (
    <div className="max-w-screen-xl mx-auto bg-white p-5 md:p-10 rounded shadow mt-2 mb-2">
    <form
      onSubmit={handleSubmit}
      className="max-w-5xl mx-auto p-10 bg-white  rounded-lg space-y-8"
    >
      <h2 className="text-3xl font-bold text-center mb-6">Chỉnh sửa biến thể</h2>

      {/* Thông tin cơ bản */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label htmlFor="sku" className="block text-sm font-medium mb-1">
            SKU <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="sku"
            name="sku"
            data-error="sku"
            value={formData.sku}
            onChange={handleChange}
            className={`w-full border p-2 rounded ${
              errors.sku ? "border-red-500" : ""
            }`}
            placeholder="Mã SKU"
          />
          {errors.sku && (
            <p className="text-red-500 text-sm mt-1">{errors.sku}</p>
          )}
        </div>

        <div>
          <label htmlFor="price" className="block text-sm font-medium mb-1">
            Giá <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="price"
            name="price"
            data-error="price"
            value={
              formData.price !== ""
                ? Number(formData.price).toLocaleString("vi-VN")
                : ""
            }
            onChange={(e) => {
              const raw = e.target.value.replace(/[^\d]/g, "");
              const numeric = parseInt(raw || "0", 10);
              setFormData((prev) => ({
                ...prev,
                price: numeric > 0 ? numeric : "",
              }));
              setErrors((prev) => ({ ...prev, price: undefined }));
            }}
            onBlur={() => {
              if (!formData.price || formData.price <= 0) {
                setFormData((prev) => ({ ...prev, price: "" }));
                setErrors((prev) => ({
                  ...prev,
                  price: "Giá phải lớn hơn 0.",
                }));
              }
            }}
            className={`w-full border p-2 rounded ${
              errors.price ? "border-red-500" : ""
            }`}
            placeholder="Giá"
          />
          {errors.price && (
            <p className="text-red-500 text-sm mt-1">{errors.price}</p>
          )}
        </div>

        <div>
          <label htmlFor="stock" className="block text-sm font-medium mb-1">
            Tồn kho{" "}
            {Number(formData.is_auction_only) !== 1 && (
              <span className="text-red-500">*</span>
            )}
          </label>
          <input
            type="text"
            id="stock"
            name="stock"
            data-error="stock"
            value={
              Number(formData.is_auction_only) === 1
                ? "1"
                : formData.stock
                ? Number(formData.stock).toLocaleString("vi-VN")
                : ""
            }
            onChange={(e) => {
              const raw = e.target.value.replace(/[^\d]/g, "");
              const numeric = parseInt(raw || "0", 10);
              if (Number(formData.is_auction_only) !== 1) {
                setFormData((prev) => ({
                  ...prev,
                  stock: numeric > 0 ? numeric : "",
                }));
                setErrors((prev) => ({ ...prev, stock: undefined }));
              }
            }}
            onBlur={() => {
              if (
                Number(formData.is_auction_only) !== 1 &&
                (!formData.stock || Number(formData.stock) <= 0)
              ) {
                setFormData((prev) => ({ ...prev, stock: "" }));
                setErrors((prev) => ({
                  ...prev,
                  stock: "Tồn kho phải lớn hơn 0.",
                }));
              }
            }}
            className={`w-full border p-2 rounded ${
              errors.stock ? "border-red-500" : ""
            }`}
            placeholder="Tồn kho"
            disabled={Number(formData.is_auction_only) === 1}
          />
          {errors.stock && (
            <p className="text-red-500 text-sm mt-1">{errors.stock}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        {/* Thuộc tính */}
        <fieldset className="flex-1 border rounded p-4" data-error="attributes">
          <legend className="font-semibold text-lg px-2">Thuộc tính</legend>
          <div className="space-y-4 mt-2">
            {formData.attributes.map((attr, index) => {
              const selectedAttr = attributesList.find(
                (item) => item.id === parseInt(attr.attribute_id)
              );
              const isColor =
                selectedAttr?.name?.toLowerCase() === "màu sắc" ||
                selectedAttr?.name?.toLowerCase() === "màu";

              return (
                <div
                  key={index}
                  className="flex flex-col md:flex-row items-center gap-4"
                >
                  <select
                    value={attr.attribute_id}
                    onChange={(e) =>
                      handleAttributeChange(
                        index,
                        "attribute_id",
                        e.target.value
                      )
                    }
                    className="border p-2 rounded w-full md:w-1/3"
                  >
                    <option value="">Chọn thuộc tính</option>
                    {attributesList
                      .filter((item) => {
                        const isSelected = formData.attributes.some(
                          (a, i) =>
                            i !== index && parseInt(a.attribute_id) === item.id
                        );
                        return !isSelected;
                      })
                      .map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                  </select>

                  {isColor ? (
                    <input
                      type="color"
                      value={attr.value}
                      onChange={(e) =>
                        handleAttributeChange(index, "value", e.target.value)
                      }
                      className="border rounded w-full md:w-1/3 h-10"
                    />
                  ) : (
                    <input
                      type="text"
                      placeholder="Giá trị"
                      value={attr.value}
                      onChange={(e) =>
                        handleAttributeChange(index, "value", e.target.value)
                      }
                      className="border p-2 rounded w-full md:w-1/3"
                    />
                  )}

                  <button
                    type="button"
                    onClick={() => handleDeleteAttribute(attr.id)}
                    className="text-red-600 hover:text-red-800 p-1 rounded"
                    aria-label="Xóa thuộc tính"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4m-4 0a1 1 0 00-1 1v1h6V4a1 1 0 00-1-1m-4 0h4"
                      />
                    </svg>
                  </button>
                </div>
              );
            })}

            {formData.attributes.length < attributesList.length && (
              <button
                type="button"
                onClick={addAttributeField}
                className="text-blue-600 "
              >
                + Thêm thuộc tính
              </button>
            )}

            {errors.attributes && (
              <p className="text-red-500 text-sm">{errors.attributes}</p>
            )}
          </div>
        </fieldset>

        {/* Ảnh biến thể (KHÔNG validate) */}
        <fieldset className="flex-1 border rounded p-4">
          <legend className="font-semibold text-lg px-2">Ảnh biến thể</legend>

          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageUpload}
            className="w-full border p-2 rounded mb-4"
          />

          <div className="flex overflow-x-auto gap-4">
            {formData.images.map((img, index) => (
              <div key={index} className="relative flex-shrink-0">
                <img
                  src={img.url?.url || img.url}
                  alt={`image-${index}`}
                  className="w-24 h-24 object-cover rounded border"
                />
                <button
                  type="button"
                  onClick={() => handleDeleteImage(index)}
                  className="absolute top-1 right-1 bg-red-600 text-white w-5 h-5 flex items-center justify-center text-xs rounded-full shadow hover:scale-110 transition"
                  aria-label="Xóa ảnh"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </fieldset>
      </div>

      {/* Nút submit */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-2 justify-start">
        <button
  type="submit"
  disabled={isUploadingImages}
  className={`bg-blue-600 text-white py-2 px-4 rounded text-sm ${
    isUploadingImages ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700"
  }`}
>
  {isUploadingImages ? "Đang tải ảnh..." : "Cập nhật"}
</button>

        <button
          type="button"
          onClick={handleBack}
          className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
        >
          Quay lại
        </button>

        {/* Toggle is_auction_only */}
       {/* Toggle is_auction_only */}
<div className="form-check form-switch d-flex align-items-center gap-2">
  {(() => {
    const locked = initialAuctionRef.current === 1; // khóa nếu dữ liệu ban đầu là 1
    return (
      <>
        <input
          className={`form-check-input ${locked ? 'opacity-60 cursor-not-allowed' : ''}`}
          type="checkbox"
          id="auctionSwitch"
          checked={Number(formData.is_auction_only) === 1}
          disabled={locked}
          title={locked ? "Biến thể này đã được thiết lập đấu giá từ trước và không thể thay đổi" : ""}
          onChange={(e) => {
            if (locked) return; // chặn thay đổi nếu bị khóa
            const checked = e.target.checked;
            setFormData((prev) => ({
              ...prev,
              is_auction_only: checked ? 1 : 0,
              stock: checked ? 1 : prev.stock, // bật đấu giá thì ép stock = 1
            }));
            setErrors((prev) => ({ ...prev, stock: undefined }));
          }}
        />

        <label className="form-check-label ms-2" htmlFor="auctionSwitch">
          {locked
            ? "Biến thể đấu giá (không thể thay đổi)"
            : Number(formData.is_auction_only) === 1
              ? "Biến thể đấu giá (kho = 1)"
              : "Đặt là biến thể đấu giá"}
        </label>
      </>
    );
  })()}
</div>

      </div>
    </form>
    </div>
  );
};

export default EditVariantForm;
