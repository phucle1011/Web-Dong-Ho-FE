import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import Constants from "../../../../Constants.jsx";

export default function AddCategoryModal({ onClose, onSuccess }) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("active");
  const [errors, setErrors] = useState({});

  // Tự động sinh slug từ name
  useEffect(() => {
    const generateSlug = (text) => {
      return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9 -]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
    };
    setSlug(generateSlug(name));
  }, [name]);

  // Chỉ validate name (mô tả không bắt buộc)
  const validate = () => {
    const newErrors = {};
    if (!name.trim()) newErrors.name = "Vui lòng nhập tên danh mục";
    return newErrors;
  };

  const handleSubmit = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});

    try {
      await axios.post(`${Constants.DOMAIN_API}/admin/category/create`, {
        name,
        slug,
        description, // mô tả không bắt buộc
        status,
      });

      toast.success("✅ Thêm danh mục thành công!");
      onSuccess?.();
      onClose?.();
    } catch (error) {
      console.error("Lỗi thêm danh mục:", error.response?.data || error.message);
      toast.error("❌ Thêm danh mục thất bại");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.2)] backdrop-blur-sm">
      <div className="bg-white max-w-md w-full rounded-lg shadow-lg relative p-6">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-red-500 text-xl font-bold"
        >
          &times;
        </button>

        <h2 className="text-xl font-semibold mb-4">Thêm danh mục</h2>

        <div className="space-y-4">
          {/* Tên danh mục */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Tên danh mục
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
            {errors.name && (
              <p className="text-sm text-red-500 mt-1">{errors.name}</p>
            )}
          </div>

          {/* Mô tả (tùy chọn) */}
          <div>
            <label className="block text-sm font-medium mb-1">Mô tả</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
              rows={3}
              placeholder="Không bắt buộc"
            />
          </div>

          {/* Trạng thái */}
          <div className="mb-3">
            <label htmlFor="status" className="form-label">
              Trạng thái
            </label>
            <select
              id="status"
              className="form-select w-full border border-gray-300 rounded px-3 py-2"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="active">Hoạt động</option>
              <option value="inactive">Không hoạt động</option>
            </select>
          </div>

          {/* Nút submit */}
          <div className="text-right">
            <button
              onClick={handleSubmit}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Thêm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
