import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import Constants from "../../../../../Constants.jsx";
import { toast } from "react-toastify";
import { useNavigate, useParams,Link } from "react-router-dom";

function AttributeEdit() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm();

    // Lấy thông tin thuộc tính theo ID
    useEffect(() => {
        const fetchAttribute = async () => {
            try {
                const response = await axios.get(`${Constants.DOMAIN_API}/admin/attribute/${id}`);
                const attribute = response.data.data;

                setValue("name", attribute.name);
            } catch (error) {
                toast.error("Không tìm thấy thuộc tính.");
                navigate("/admin/attribute/getall");
            }
        };

        fetchAttribute();
    }, [id, navigate, setValue]);

    // Gửi form cập nhật
    const onSubmit = async (data) => {
        setLoading(true);
        try {
            await axios.put(`${Constants.DOMAIN_API}/admin/attribute/${id}`, data);
            toast.success("Cập nhật thuộc tính thành công!");
            navigate("/admin/attribute/getall");
        } catch (error) {
            toast.error("Cập nhật thuộc tính thất bại.");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
       <div className="max-w-screen-md mx-auto bg-white p-8 rounded shadow mt-8">
  <h2 className="text-xl font-semibold">Cập nhật thuộc tính</h2>

  <form onSubmit={handleSubmit(onSubmit)} noValidate>
    <div className="mb-6">
      <label className="block font-medium mb-2">Tên thuộc tính *</label>
      <input
        type="text"
        className="w-full border px-4 py-2 rounded"
        placeholder="VD: Màu sắc, Chất liệu dây..."
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
        {loading ? "Đang cập nhật..." : "Cập nhật thuộc tính"}
      </button>
    </div>
  </form>
</div>

    );
}

export default AttributeEdit;
