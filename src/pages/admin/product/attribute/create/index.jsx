import { useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import Constants from "../../../../../Constants.jsx";
import { toast } from "react-toastify";
import { useNavigate,Link } from "react-router-dom";

function AttributeCreate() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        defaultValues: {
            name: "",
        },
    });

    const onSubmit = async (formData) => {
        setLoading(true);

        const cleanedData = {
            ...formData,
            name: formData.name.trim(),
        };

        try {
            await axios.post(`${Constants.DOMAIN_API}/admin/attribute`, cleanedData);
            toast.success("Thêm thuộc tính thành công!");
            navigate("/admin/attribute/getall");
        } catch (error) {
            if (error.response?.status === 409) {
                toast.error("Tên thuộc tính đã tồn tại.");
            } else {
                toast.error("Thêm thuộc tính thất bại.");
            }
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
       <div className="max-w-screen-xl mx-auto bg-white p-8 rounded shadow mt-8">
  <h2 className="text-xl font-semibold">Thêm thuộc tính mới</h2>
  <form onSubmit={handleSubmit(onSubmit)} noValidate>
    <div className="mb-6">
      <label className="block font-medium mb-2">Tên thuộc tính *</label>
      <input
        type="text"
        className="w-full border px-4 py-2 rounded"
        placeholder="VD: Màu sắc, Kích thước..."
        {...register("name", {
          required: "Tên thuộc tính không được để trống",
          minLength: {
            value: 2,
            message: "Tên thuộc tính phải ít nhất 2 ký tự",
          },
        })}
      />
      {errors.name && (
        <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
      )}
    </div>

    <div className="flex gap-2">
      <Link
        to="/admin/attribute/getall"
        className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
      >
        ← Quay lại
      </Link>
      <button
        type="submit"
        disabled={loading}
        className="bg-[#073272] text-white px-6 py-2 rounded hover:bg-[#052354] transition"
      >
        {loading ? "Đang thêm..." : "Thêm thuộc tính"}
      </button>
    </div>
  </form>
</div>

    );
}

export default AttributeCreate;
