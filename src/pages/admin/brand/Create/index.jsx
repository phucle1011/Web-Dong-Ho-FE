import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import Constants from "../../../../Constants.jsx";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { uploadToCloudinary } from "../../../../Upload/uploadToCloudinary.js";
import { Editor } from "@tinymce/tinymce-react";

const generateSlug = (text) => {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
};

function BrandCreate({ onSuccess, isModal = false }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [countries, setCountries] = useState([]);
  const [description, setDescription] = useState(""); // Thêm state cho description

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    setError,
    clearErrors,
    reset,
  } = useForm({
    defaultValues: {
      name: "",
      slug: "",
      country: "",
      status: "active",
    },
  });

  const nameValue = watch("name");
  const slugValue = watch("slug");

  useEffect(() => {
    fetchCountries();
  }, []);

  const fetchCountries = async () => {
    try {
      const res = await axios.get(
        "https://restcountries.com/v3.1/all?fields=name"
      );
      const countryNames = res.data.map((c) => c.name.common).sort();
      setCountries(countryNames);
    } catch (error) {
      console.error("Lỗi khi lấy quốc gia:", error);
    }
  };

  useEffect(() => {
    if (nameValue && !slugValue) {
      setValue("slug", generateSlug(nameValue));
    }
  }, [nameValue, slugValue, setValue]);

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      clearErrors("logo");
    } else {
      setLogoFile(null);
    }
  };

  const onSubmit = async (formData) => {
    Swal.fire({
      title: "Xác nhận thêm thương hiệu",
      text: `Bạn có chắc muốn thêm thương hiệu "${formData.name}"?`,
      icon: "info",
      showCancelButton: true,
      confirmButtonText: "Thêm",
      cancelButtonText: "Hủy",
    }).then(async (result) => {
      if (!result.isConfirmed) return;

      setLoading(true);

      const brandData = {
        ...formData,
        slug: generateSlug(formData.name),
        description: description, // Sử dụng state description
      };

      try {
        const res = await axios.post(`${Constants.DOMAIN_API}/admin/brand/create`, brandData);
        const brandId = res.data.data?.id;

        if (logoFile && brandId) {
          try {
            const logoRes = await uploadToCloudinary(logoFile);
            try {
              await axios.put(`${Constants.DOMAIN_API}/admin/brand/${brandId}/logo`, {
                logo: logoRes.url,
              });
            } catch (err) {
              await deleteImageFromCloudinary(logoRes.public_id);
              toast.error("Tạo thương hiệu thành công nhưng lỗi khi cập nhật logo.");
            }
          } catch (err) {
            toast.error("Lỗi khi upload ảnh lên Cloudinary: " + err.message);
          }
        }

        toast.success("Thêm thương hiệu thành công!");
        reset();
        setLogoFile(null);
        setDescription(""); // Reset description
        if (isModal) {
          onSuccess?.();
        } else {
          navigate("/admin/brand/getAll");
        }
      } catch (error) {
        const errRes = error.response?.data;
        if (errRes?.errors) {
          Object.entries(errRes.errors).forEach(([key, msg]) => {
            setError(key, { type: "server", message: msg });
          });
          toast.error("Có lỗi xảy ra, vui lòng kiểm tra lại.");
        } else {
          toast.error(errRes?.message || "Lỗi không xác định.");
        }
      } finally {
        setLoading(false);
      }
    });
  };

  return (
    <div className="container mx-auto p-0 m-0 ">
      <div className="bg-white p-4 shadow rounded-md">
        <h3 className="text-2xl font-semibold text-gray-800 text-center mb-6 border-b border-gray-200 pb-4">
          Thêm thương hiệu mới
        </h3>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
          {/* Row 1: Tên thương hiệu + Slug */}
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 md:col-span-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên thương hiệu <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                className={`w-full px-3 py-2 rounded-lg border ${errors.name ? "border-red-500" : "border-gray-300"} focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 text-sm`}
                placeholder="Nhập tên thương hiệu, ví dụ: Apple, Samsung"
                {...register("name", {
                  required: "Tên không được để trống",
                  minLength: { value: 2, message: "Tối thiểu 2 ký tự" },
                })}
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
              )}
            </div>

            <div className="col-span-12 md:col-span-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Slug
              </label>
              <input
                id="slug"
                type="text"
                readOnly
                className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed text-sm"
                {...register("slug")}
              />
            </div>
          </div>

          {/* Row 2: Logo + Quốc gia + Trạng thái */}
          <div className="grid grid-cols-12 gap-6">
            {/* Logo */}
            <div className="col-span-12 md:col-span-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Logo
              </label>
              <input
                id="logo"
                type="file"
                accept="image/*"
                className={`w-full px-3 py-1.5 rounded-lg border ${errors.logo ? "border-red-500" : "border-gray-300"} file:mr-3 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition duration-200`}
                onChange={handleLogoChange}
              />
              {errors.logo && (
                <p className="text-red-500 text-xs mt-1">{errors.logo.message}</p>
              )}
              {logoFile && (
                <div className="mt-3 flex items-center space-x-3">
                  <img
                    src={URL.createObjectURL(logoFile)}
                    alt="Preview"
                    className="w-24 h-24 object-contain rounded-md border border-gray-200 shadow-sm"
                    />
                  <span className="text-sm text-gray-600 truncate max-w-xs">
                    {logoFile.name}
                  </span>
                </div>
              )}
            </div>

            <div className="col-span-12 md:col-span-6 grid grid-cols-2 gap-6">
              {/* Quốc gia */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quốc gia <span className="text-red-500">*</span>
                </label>
                <select
                  id="country"
                  className={`w-full px-3 py-2 rounded-lg border ${errors.country ? "border-red-500" : "border-gray-300"} focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 text-sm`}
                  {...register("country", { required: "Quốc gia là bắt buộc" })}
                >
                  <option value="">-- Chọn quốc gia --</option>
                  {countries.map((country, idx) => (
                    <option key={idx} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
                {errors.country && (
                  <p className="text-red-500 text-xs mt-1">{errors.country.message}</p>
                )}
              </div>

              {/* Trạng thái */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trạng thái <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center px-3 py-2 rounded-lg border border-gray-300">
                  <div className="form-check form-switch m-0 flex items-center">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="statusSwitch"
                      checked={watch("status") === "active"}
                      onChange={(e) =>
                        setValue("status", e.target.checked ? "active" : "inactive")
                      }
                    />
                    <label htmlFor="statusSwitch" className="form-check-label ms-2 text-sm">
                      {watch("status") === "active" ? "Hoạt động" : "Ngừng hoạt động"}
                    </label>
                  </div>
                </div>
                {errors.status && (
                  <p className="text-red-500 text-xs mt-1">{errors.status.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Mô tả */}
          <div className="mb-4 col-span-12">
            <label className="font-semibold block mb-2 text-sm">Mô tả:</label>
            <div className="bg-white border rounded">
              <Editor
                apiKey="242t4tlz75qp0zzr2tgk6oz501hd80om15fr7rykscdflilg"
                value={description}
                init={{
                  height: 400,
                  menubar: true,
                  plugins: [
                    "advlist", "autolink", "lists", "link", "image", "charmap", "preview",
                    "anchor", "searchreplace", "visualblocks", "code", "fullscreen",
                    "insertdatetime", "media", "table", "help", "wordcount",
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
          </div>

          {/* Buttons */}
          <div className="mt-6 flex space-x-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-[#073272] text-white px-6 py-2 rounded shadow hover:bg-blue-700 transition disabled:opacity-70"
            >
              {loading ? "Đang thêm thương hiệu..." : "Thêm thương hiệu"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/admin/brand/getAll")}
              className="bg-gray-600 text-white px-6 py-2 rounded shadow hover:bg-gray-700 transition"
            >
              Quay lại
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BrandCreate;