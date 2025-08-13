import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import Constants from "../../../../Constants.jsx";
import { toast } from "react-toastify";
import { useNavigate, useParams } from "react-router-dom";

// Tạo slug từ tên
const generateSlug = (text) => {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
};

function BlogCategoryEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const response = await axios.get(`${Constants.DOMAIN_API}/admin/blogcategory/${id}`);
        const category = response.data.data;

        setValue("name", category.name);
        setValue("slug", category.slug || "");
        setValue("status", category.status ? "true" : "false");
      } catch (error) {
        toast.error("Không tìm thấy danh mục.");
        navigate("/admin/blogcategory/getAll");
      }
    };

    fetchCategory();
  }, [id, navigate, setValue]);

  const nameValue = watch("name");
  const slugValue = watch("slug");

  useEffect(() => {
    if (nameValue && !slugValue) {
      setValue("slug", generateSlug(nameValue));
    }
  }, [nameValue, slugValue, setValue]);

  const onSubmit = async (data) => {
    setLoading(true);

    const cleanedData = {
      name: data.name.trim(),
      slug: data.slug.trim(),
      status: data.status === "true",
    };

    try {
      await axios.put(`${Constants.DOMAIN_API}/admin/blogcategory/${id}`, cleanedData);
      toast.success("Cập nhật danh mục thành công!");
      navigate("/admin/blogcategory/getAll");
    } catch (error) {
      toast.error("Cập nhật danh mục thất bại.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-screen-xl mx-auto bg-white p-8 rounded shadow mt-8">
      <h2 className="text-2xl font-semibold mb-6">Cập nhật danh mục bài viết</h2>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* Tên danh mục */}
        <div className="mb-6">
          <label className="block font-medium mb-2">Tên danh mục </label>
          <input
            type="text"
            className="w-full border px-4 py-3 rounded"
            placeholder="VD: Tin tức đồng hồ"
            {...register("name", {
              required: "Tên danh mục không được để trống",
              minLength: {
                value: 4,
                message: "Tên danh mục phải ít nhất 4 ký tự",
              },
              maxLength: { value: 100, message: "Tên danh mục quá dài " }
            })}
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
          )}
        </div>

        {/* Slug
        <div className="mb-6">
          <label className="block font-medium mb-2">Slug *</label>
          <input
            type="text"
            className="w-full border px-4 py-3 rounded"
            placeholder="Tự động tạo từ tên hoặc nhập thủ công"
            {...register("slug", {
              required: "Slug không được để trống",
            })}
          />
          {errors.slug && (
            <p className="text-red-500 text-sm mt-1">{errors.slug.message}</p>
          )}
        </div> */}

        {/* Trạng thái */}
        <div className="mb-6">
          <label className="block font-medium mb-2">Trạng thái </label>
          <select
            className="w-full border px-4 py-3 rounded"
            {...register("status", {
              required: "Trạng thái là bắt buộc",
            })}
          >
            <option value="true">Hiển thị</option>
            <option value="false">Ẩn</option>
          </select>
          {errors.status && (
            <p className="text-red-500 text-sm mt-1">{errors.status.message}</p>
          )}
        </div>

        {/* Nút hành động */}
        <div className="mt-6 flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-[#073272] text-white px-6 py-2 rounded hover:bg-[#052354] transition"
          >
            {loading ? "Đang cập nhật..." : "Cập nhật danh mục"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/admin/blogcategory/getAll")}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Quay lại
          </button>
        </div>
      </form>
    </div>
  );
}

export default BlogCategoryEdit;
