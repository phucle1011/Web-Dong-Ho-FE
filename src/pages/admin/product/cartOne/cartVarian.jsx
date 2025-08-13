import React from "react";
import Select from "react-select";
import { uploadToCloudinary } from "../../../../Upload/uploadToCloudinary.js";
import { deleteImageFromCloudinary } from "../../../../Upload/uploadToCloudinary.js";

const CartVarian = ({
  sku,
  setSku,
  price,
  setPrice,
  stock,
  setStock,
  errors,
  attributes,
  setAttributes,
  allAttributes,
  handleAttributeChange, // (index, field, value)
  removeAttributeRow,
  addAttributeRow,
  images,
  setImages,
}) => {
  // Tạo options cho react-select từ allAttributes
  const attrOptions = (excludeIds = []) =>
    (allAttributes || [])
      .filter((opt) => !excludeIds.includes(String(opt.id)))
      .map((opt) => ({ value: String(opt.id), label: opt.name }));

  // Helper: lấy option theo id hiện tại
  const getOptionById = (id) => {
    if (!id) return null;
    const found = (allAttributes || []).find((a) => String(a.id) === String(id));
    return found ? { value: String(found.id), label: found.name } : null;
  };

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files);
    const uploadPromises = files.map(uploadToCloudinary);
    const uploadedUrls = await Promise.all(uploadPromises);
    setImages(uploadedUrls);
  };

  const handleImageDelete = async (public_id) => {
    try {
      const res = await deleteImageFromCloudinary(public_id);
      if (res.message) {
        const updatedImages = images.filter((img) => img.public_id !== public_id);
        setImages(updatedImages);
      } else {
        console.error("Không thể xóa ảnh:", res);
      }
    } catch (err) {
      console.error("Lỗi khi gọi API xóa ảnh:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hàng 1: SKU, Giá, Tồn kho */}
      <div className="flex gap-6">
        {/* SKU */}
        <div className="w-1/3">
          <label className="block font-medium mb-2">Mã SKU *</label>
          <input
            type="text"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          />
          {errors.sku && <p className="text-red-600 text-sm mt-1">{errors.sku}</p>}
        </div>

        {/* Giá */}
        <div className="w-1/3">
          <label className="block font-medium mb-2">Giá *</label>
          <input
            type="text"
            value={price ? Number(price).toLocaleString("vi-VN") : ""}
            onChange={(e) => {
              const raw = e.target.value.replace(/[^\d]/g, "");
              const numeric = parseInt(raw || "0", 10);
              setPrice(numeric > 0 ? numeric : "");
            }}
            onBlur={() => {
              if (!price || Number(price) <= 0) setPrice("");
            }}
            className="w-full border px-3 py-2 rounded"
          />
          {errors.price && <p className="text-red-600 text-sm mt-1">{errors.price}</p>}
        </div>

        {/* Tồn kho */}
        <div className="w-1/3">
          <label className="block font-medium mb-2">Số lượng tồn kho *</label>
          <input
            type="text"
            value={stock ? Number(stock).toLocaleString("vi-VN") : ""}
            onChange={(e) => {
              const raw = e.target.value.replace(/[^\d]/g, "");
              const numeric = parseInt(raw || "0", 10);
              setStock(numeric > 0 ? numeric : "");
            }}
            onBlur={() => {
              if (!stock || Number(stock) <= 0) setStock("");
            }}
            className="w-full border px-3 py-2 rounded"
          />
          {errors.stock && <p className="text-red-600 text-sm mt-1">{errors.stock}</p>}
        </div>
      </div>

      {/* Hàng 2: Thuộc tính và ảnh biến thể */}
      <div className="flex gap-6">
        {/* Thuộc tính biến thể */}
        <div className="w-1/2">
          <label className="block font-medium mb-2">Thuộc tính biến thể *</label>

          {attributes.map((attr, index) => {
            const selectedAttr = (allAttributes || []).find(
              (a) => String(a.id) === String(attr.attribute_id)
            );
            const isColor = selectedAttr?.name?.toLowerCase() === "màu sắc";

            // Loại bỏ những attribute_id đã chọn ở các hàng khác
            const selectedIdsOtherRows = attributes
              .map((a, i) => (i !== index ? String(a.attribute_id) : null))
              .filter(Boolean);

            return (
              <div key={index} className="flex gap-4 mb-2 items-center">
                {/* Loại thuộc tính (react-select có tìm kiếm) */}
                <div className="w-1/2">
                  <Select
                    classNamePrefix="attr-select"
                    placeholder="-- Chọn thuộc tính --"
                    options={attrOptions(selectedIdsOtherRows)}
                    value={getOptionById(attr.attribute_id)}
                    onChange={(opt) => {
                      // set attribute_id (string/id)
                      handleAttributeChange(index, "attribute_id", opt ? opt.value : "");
                      // reset value khi đổi loại thuộc tính
                      handleAttributeChange(index, "value", "");
                    }}
                    isSearchable // bật tìm kiếm
                    noOptionsMessage={() => "Không có kết quả"}
                    styles={{
                      control: (base) => ({
                        ...base,
                        minHeight: 40,
                        borderColor: errors?.[`attr_${index}_id`] ? "#ef4444" : base.borderColor,
                        boxShadow: "none",
                      }),
                    }}
                  />
                  {errors?.[`attr_${index}_id`] && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors[`attr_${index}_id`]}
                    </p>
                  )}
                </div>

                {/* Giá trị */}
                <div className="w-1/2">
                  <input
                    type={isColor ? "color" : "text"}
                    value={attr.value || ""}
                    onChange={(e) => handleAttributeChange(index, "value", e.target.value)}
                    className={`w-full border rounded ${
                      isColor ? "h-10 p-1" : "h-10 px-4 py-3"
                    }`}
                  />
                  {errors?.[`attr_${index}_value`] && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors[`attr_${index}_value`]}
                    </p>
                  )}
                </div>

                {/* Nút xóa */}
                {attributes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeAttributeRow(index)}
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
                )}
              </div>
            );
          })}

          {/* Nút thêm thuộc tính */}
          <button
            type="button"
            onClick={addAttributeRow}
            className="text-blue-600 text-sm mt-2"
          >
            + Thêm thuộc tính
          </button>
        </div>

        {/* Ảnh biến thể */}
        <div className="w-1/2">
          <label className="block font-medium mb-2">Ảnh biến thể</label>
          <input type="file" accept="image/*" multiple onChange={handleImageChange} />

          {errors.images && <p className="text-red-600 text-sm mt-1">{errors.images}</p>}

          <div className="overflow-x-auto mt-3">
            <div className="flex gap-3 flex-nowrap">
              {images.map((img, idx) => (
                <div key={idx} className="relative flex-shrink-0">
                  <img
                    src={img.url || img}
                    alt={`variant-${idx}`}
                    className="w-20 h-20 object-cover border rounded"
                  />
                  <button
                    type="button"
                    onClick={() => handleImageDelete(img.public_id)}
                    className="absolute top-0 right-0 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartVarian;
