import { useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import Constants from "../../../../Constants.jsx";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const generateSlug = (text) => {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
};

function BlogCategoryadd() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      status: "true",
    },
  });

  const nameValue = watch("name");
  const slugValue = watch("slug");

  if (nameValue && !slugValue) {
    setValue("slug", generateSlug(nameValue));
  }

  const onSubmit = async (formData) => {
    setLoading(true);

    const cleanedData = {
      name: formData.name.trim(),
      slug: generateSlug(formData.name),
      description: formData.description.trim(),
      status: formData.status === "true",
    };

    try {
      await axios.post(`${Constants.DOMAIN_API}/admin/blogcategory`, cleanedData);
      toast.success("Thêm danh mục thành công!");
      navigate("/admin/blogcategory/getAll");
    } catch (error) {
      if (error.response?.status === 409) {
        toast.error("Tên danh mục đã tồn tại.");
      } else {
        toast.error("Thêm danh mục thất bại.");
      }
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-screen-xl mx-auto bg-white p-8 rounded shadow mt-8">
      <h2 className="text-2xl font-semibold mb-6">Thêm danh mục bài viết</h2>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="mb-6">
          <label className="block font-medium mb-2">Tên danh mục </label>
          <input
            type="text"
            className="w-full border px-4 py-3 rounded"
            placeholder="VD: Tin tức đồng hồ"
            {...register("name", {
              required: "Tên danh mục không được để trống",
              minLength: { value: 4, message: "Phải ít nhất 4 ký tự" },
              maxLength: { value: 100, message: "Tên danh mục quá dài " },
            })}
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
          )}
        </div>

        {/* <div className="mb-6">
          <label className="block font-medium mb-2">Mô tả </label>
          <textarea
            rows={4}
            className="w-full border px-4 py-3 rounded"
            placeholder="Thông tin về danh mục"
            {...register("description", {
              required: "Mô tả không được để trống",
            })}
          ></textarea>
          {errors.description && (
            <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
          )}
        </div> */}

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

        <div className="mt-4 flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-[#073272] text-white px-6 py-2 rounded hover:bg-[#052354] transition"
          >
            {loading ? "Đang thêm..." : "Thêm danh mục"}
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

export default BlogCategoryadd;
