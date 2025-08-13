import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import axios from "axios";
import Constants from "../../../../Constants.jsx";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { Editor } from "@tinymce/tinymce-react";
import { uploadToCloudinary } from "../../../../Upload/uploadToCloudinary";

const generateSlug = (text) => {
    return text
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^\w-]+/g, "")
        .replace(/--+/g, "-")
        .replace(/^-+/, "")
        .replace(/-+$/, "");
};

function CategoryCreate() {
    const [description, setDescription] = useState("");
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const {
        control,
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
            status: "active",
        },
    });

    useEffect(() => {
        setValue("description", description);
    }, [description, setValue]);

    const nameValue = watch("name");
    const slugValue = watch("slug");

    if (nameValue && !slugValue) {
        setValue("slug", generateSlug(nameValue));
    }

    const onSubmit = async (formData) => {
        setLoading(true);

        const cleanedData = {
            ...formData,
            name: formData.name.trim().replace(/\s+/g, " "),
            slug: generateSlug(formData.name),
            description: formData.description.trim(),
        };

        try {
            await axios.post(`${Constants.DOMAIN_API}/admin/category/create`, cleanedData);
            toast.success("Thêm danh mục thành công!");
            navigate("/admin/categories/getAll");
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
            <h2 className="text-2xl font-semibold mb-6">Thêm danh mục mới</h2>

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <div className="mb-6">
                    <label className="block font-medium mb-2">Tên danh mục *</label>
                    <input
                        type="text"
                        className="w-full border px-4 py-3 rounded"
                        placeholder="VD: Đồng hồ thời trang"
                        {...register("name", {
                            required: "Tên danh mục không được để trống",
                            minLength: {
                                value: 4,
                                message: "Tên danh mục phải ít nhất 4 ký tự",
                            },
                        })}
                    />
                    {errors.name && (
                        <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                    )}
                </div>

                <div className="mb-6">
                    <label className="block font-medium mb-2">Trạng thái *</label>
                    <select
                        className="w-full border px-4 py-3 rounded"
                        {...register("status", {
                            required: "Trạng thái là bắt buộc",
                        })}
                    >
                        <option value="active">Hiển thị</option>
                        <option value="inactive">Ẩn</option>
                    </select>
                    {errors.status && (
                        <p className="text-red-500 text-sm mt-1">{errors.status.message}</p>
                    )}
                </div>

                <div className="md:col-span-2 grid grid-cols-1 gap-6">
                    <label className="block mb-1 font-medium">Mô tả</label>
                    <Controller
                        name="description"
                        control={control}
                        defaultValue=""
                        render={({ field: { onChange, value } }) => (
                            <Editor
                                apiKey="242t4tlz75qp0zzr2tgk6oz501hd80om15fr7rykscdflilg"
                                value={value}
                                init={{
                                    height: 400,
                                    menubar: true,
                                    forced_root_block: false,
                                    force_br_newlines: true,
                                    force_p_newlines: false,
                                    content_style: "body { white-space: pre-wrap; }",
                                    valid_elements:
                                        "br,strong/b,em/i,span[style],a[href|target],img[src|alt|width|height],ul,ol,li",
                                    plugins: [
                                        "advlist", "autolink", "lists", "link", "image", "charmap", "preview", "anchor",
                                        "searchreplace", "visualblocks", "code", "fullscreen",
                                        "insertdatetime", "media", "table", "help", "wordcount"
                                    ],
                                    toolbar:
                                        "undo redo | bold italic backcolor | " +
                                        "alignleft aligncenter alignright alignjustify | " +
                                        "bullist numlist outdent indent | image | help",
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
                                onEditorChange={(content) => {
                                    const cleaned = content.replace(/<\/?p[^>]*>/g, ""); // Xóa thẻ <p>
                                    setDescription(cleaned);
                                    setValue("description", cleaned);
                                }}
                            />
                        )}
                    />
                </div>

                <div className="mt-4 flex gap-4 no-print">
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-[#073272] text-white px-6 py-2 rounded hover:bg-[#052354] transition"
                    >
                        {loading ? "Đang thêm..." : "Thêm danh mục"}
                    </button>

                    <button
                        onClick={() => navigate("/admin/categories/getAll")}
                        className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                    >
                        Quay lại
                    </button>
                </div>
            </form>
        </div>
    );
}

export default CategoryCreate;
