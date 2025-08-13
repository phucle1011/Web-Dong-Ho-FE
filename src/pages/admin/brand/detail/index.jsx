import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Constants from "../../../../Constants";
import { toast } from "react-toastify";
import axios from "axios";
import Swal from 'sweetalert2';
import { Editor } from "@tinymce/tinymce-react";
import { uploadToCloudinary } from "../../../../Upload/uploadToCloudinary";

function BrandDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [brand, setBrand] = useState({});
    const [originalBrand, setOriginalBrand] = useState({});
    const [editableBrand, setEditableBrand] = useState({});
    const [errors, setErrors] = useState({});
    const [countries, setCountries] = useState([]);
    const [logoFile, setLogoFile] = useState(null); // Ảnh mới
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        fetchBrandDetail();
        fetchCountries();
    }, []);

    const fetchBrandDetail = async () => {
        try {
            const res = await axios.get(`${Constants.DOMAIN_API}/admin/brand/${id}`);
            if (res.data.data) {
                setBrand(res.data.data);
                setOriginalBrand(res.data.data);
                setEditableBrand(res.data.data);
            } else {
                setBrand({});
                setOriginalBrand({});
                setEditableBrand({});
            }
        } catch (error) {
            console.error("Lỗi khi lấy chi tiết thương hiệu:", error);
            toast.error("Không thể lấy chi tiết thương hiệu");
            navigate("/admin/brand/getAll");
        }
    };

    const fetchCountries = async () => {
        try {
            const res = await axios.get("https://restcountries.com/v3.1/all?fields=name");
            const countryNames = res.data.map(country => country.name.common).sort();
            setCountries(countryNames);
        } catch (error) {
            console.error("Lỗi khi lấy danh sách quốc gia:", error);
            toast.error("Không thể lấy danh sách quốc gia");
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEditableBrand(prev => ({ ...prev, [name]: value }));
        setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setLogoFile(file);
        }
    };

    const uploadLogo = async () => {
        if (!logoFile) return editableBrand.logo;

        setIsUploading(true);
        try {
            const { url } = await uploadToCloudinary(logoFile);
            setIsUploading(false);
            setLogoFile(null);
            return url;
        } catch (err) {
            setIsUploading(false);
            toast.error("Lỗi khi tải ảnh lên Cloudinary");
            return editableBrand.logo;
        }
    };

    const handleUpdate = async () => {
        const newErrors = {};
        if (!editableBrand.name?.trim()) {
            newErrors.name = "Tên thương hiệu không được để trống.";
        }
        if (!editableBrand.country?.trim()) {
            newErrors.country = "Quốc gia không được để trống.";
        }
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            toast.error("Vui lòng sửa các lỗi trong biểu mẫu.");
            return;
        }

        Swal.fire({
            title: "Xác nhận cập nhật",
            text: `Bạn có chắc chắn muốn cập nhật thông tin thương hiệu "${originalBrand.name}" không?`,
            icon: "info",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Cập nhật",
            cancelButtonText: "Hủy",
        }).then(async (result) => {
            if (!result.isConfirmed) return;

            try {
                // Cập nhật thông tin trừ logo
                const url = `${Constants.DOMAIN_API}/admin/brand/update/${id}`;
                const { logo, ...updateWithoutLogo } = editableBrand;
                const res = await axios.put(url, updateWithoutLogo);
                const updatedBrand = res.data.data;

                toast.success("Cập nhật thông tin thành công!");

                if (logoFile) {
                    setIsUploading(true);
                    try {
                        const { url: logoUrl } = await uploadToCloudinary(logoFile);
                        await axios.put(`${Constants.DOMAIN_API}/admin/brand/${id}/logo`, { logo: logoUrl });
                        updatedBrand.logo = logoUrl;
                        toast.success("Cập nhật logo thành công!");
                    } catch (logoErr) {
                        toast.error("Cập nhật thành công nhưng lỗi khi upload logo.");
                    } finally {
                        setIsUploading(false);
                    }
                }

                setBrand(updatedBrand);
                setOriginalBrand(updatedBrand);
                setEditableBrand(updatedBrand);
                setLogoFile(null);
            } catch (error) {
                const resError = error.response?.data;
                if (resError?.errors) {
                    setErrors(resError.errors);
                }
                toast.error(error.response?.data?.message || "Lỗi khi cập nhật thương hiệu.");
            }
        });
    };


    const handleStatusChange = async (newStatus) => {
        if (newStatus === editableBrand.status) return;

        Swal.fire({
            title: 'Xác nhận đổi trạng thái',
            text: `Bạn có chắc chắn muốn đổi trạng thái của thương hiệu "${editableBrand.name}" thành "${getVietnameseStatus(newStatus)}" không?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'OK',
            cancelButtonText: 'Hủy'
        }).then((result) => {
            if (result.isConfirmed) {
                const url = `${Constants.DOMAIN_API}/admin/brand/update/${id}`;
                axios.put(url, { status: newStatus })
                    .then(response => {
                        toast.success(`Cập nhật trạng thái thành công: ${getVietnameseStatus(newStatus)}`);
                        fetchBrandDetail();
                    })
                    .catch(error => {
                        toast.error(error.response?.data?.message || "Lỗi khi cập nhật trạng thái thương hiệu.");
                    });
            }
        });
    };

    const getVietnameseStatus = (englishStatus) => {
        switch (englishStatus) {
            case "active": return "Hoạt động";
            case "inactive": return "Ngưng hoạt động";
            default: return englishStatus;
        }
    };

    return (
        <div className="container mx-auto p-6">
            {editableBrand.id ? (
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-md">
                    <h3 className="text-2xl font-bold text-gray-700 mb-5 border-b pb-3">Chi tiết thương hiệu</h3>

                    {/* Logo Section */}
                    <div className="mb-8 flex flex-col items-center">
                        <h4 className="text-lg font-semibold text-gray-700 mb-3">Logo thương hiệu</h4>
                        <div className="relative w-40 h-40 mb-4 overflow-hidden rounded-xl border-2 border-dashed border-gray-300 bg-white flex items-center justify-center">
                            {logoFile ? (
                                <img
                                    src={URL.createObjectURL(logoFile)}
                                    alt="Preview"
                                    className="w-full h-full object-contain p-2"
                                />
                            ) : editableBrand.logo ? (
                                <img
                                    src={editableBrand.logo}
                                    alt={editableBrand.name}
                                    className="w-full h-full object-contain p-2"
                                />
                            ) : (
                                <span className="text-sm text-gray-400 text-center px-4">Không có logo</span>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleLogoChange}
                                id="logo-upload"
                                className="hidden"
                            />
                            <label
                                htmlFor="logo-upload"
                                className="cursor-pointer px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded shadow text-sm transition"
                            >
                                {logoFile ? "Đổi ảnh khác" : "Chọn ảnh"}
                            </label>
                            {(logoFile || editableBrand.logo) && (
                                <button
                                    type="button"
                                    onClick={() => setLogoFile(null)}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded shadow text-sm transition"
                                >
                                    Hủy
                                </button>
                            )}
                            {isUploading && <span className="text-blue-600 text-sm">Đang tải lên...</span>}
                        </div>
                        <p className="mt-2 text-xs text-gray-500 text-center max-w-xs">
                            Hỗ trợ các định dạng: JPG, PNG, WEBP. Kích thước tối đa 5MB.
                        </p>
                    </div>

                    {/* Form fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8 mb-6">
                        {/* Name */}
                        <div>
                            <strong className="text-gray-600 block mb-1">Tên:</strong>
                            <input
                                type="text"
                                name="name"
                                value={editableBrand.name || ''}
                                onChange={handleChange}
                                className={`w-full px-3 py-2 border ${errors.name ? 'border-red-500' : 'border-gray-200'} rounded focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            />
                            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                        </div>

                        {/* Slug */}
                        <div>
                            <strong className="text-gray-600 block mb-1">Slug:</strong>
                            <input
                                type="text"
                                value={editableBrand.slug || ''}
                                readOnly
                                className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded focus:outline-none"
                            />
                        </div>

                        {/* Country */}
                        <div>
                            <strong className="text-gray-600 block mb-1">Quốc gia:</strong>
                            <select
                                name="country"
                                value={editableBrand.country || ''}
                                onChange={handleChange}
                                className={`w-full px-3 py-2 border ${errors.country ? 'border-red-500' : 'border-gray-200'} rounded focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            >
                                <option value="">Chọn quốc gia</option>
                                {countries.map((c, i) => (
                                    <option key={i} value={c}>{c}</option>
                                ))}
                            </select>
                            {errors.country && <p className="mt-1 text-xs text-red-500">{errors.country}</p>}
                        </div>

                        {/* Status */}
                        <div>
                            <strong className="text-gray-600 block mb-1">Trạng thái:</strong>
                            <div className="border rounded p-2 w-fit">
                                <div className="form-check form-switch m-0 flex items-center">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id="brandStatusSwitch"
                                        checked={editableBrand.status === "active"}
                                        onChange={(e) =>
                                            handleStatusChange(e.target.checked ? "active" : "inactive")
                                        }
                                    />
                                    <span
                                        className="form-check-label ms-2"
                                        style={{ whiteSpace: "nowrap" }}
                                    >
                                        {editableBrand.status === "active"
                                            ? "Hoạt động"
                                            : "Ngưng hoạt động"}
                                    </span>
                                </div>
                            </div>
                        </div>


                        {/* Created At */}
                        <div>
                            <strong className="text-gray-600 block mb-1">Ngày tạo:</strong>
                            <input
                                type="text"
                                value={editableBrand.created_at ? new Date(editableBrand.created_at).toLocaleDateString('vi-VN') : ''}
                                readOnly
                                className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded focus:outline-none"
                            />
                        </div>

                        {/* Updated At */}
                        <div>
                            <strong className="text-gray-600 block mb-1">Ngày cập nhật:</strong>
                            <input
                                type="text"
                                value={editableBrand.updated_at ? new Date(editableBrand.updated_at).toLocaleDateString('vi-VN') : ''}
                                readOnly
                                className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div className="mb-6">
                        <strong className="text-gray-600 block mb-1">Mô tả:</strong>
                        <Editor
                            apiKey="242t4tlz75qp0zzr2tgk6oz501hd80om15fr7rykscdflilg" // Hoặc để trống nếu dùng community
                            value={editableBrand.description || ""}
                            onEditorChange={(newValue) =>
                                setEditableBrand((prev) => ({ ...prev, description: newValue }))
                            }
                            init={{
                                height: 250,
                                menubar: false,
                                plugins: "link image code lists",
                                toolbar:
                                    "undo redo | formatselect | bold italic | alignleft aligncenter alignright | bullist numlist | removeformat",
                            }}
                        />
                    </div>


                    {/* Actions */}
                    <div className="flex justify-start gap-2 mt-6">
                        <button
                            onClick={handleUpdate}
                            disabled={isUploading}
                            className="bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700 transition disabled:opacity-70"
                        >
                            {isUploading ? "Đang lưu..." : "Lưu"}
                        </button>
                        <button
                            onClick={() => navigate("/admin/brand/getAll")}
                            className="bg-gray-600 text-white px-6 py-2 rounded shadow hover:bg-gray-700 transition"
                        >
                            Quay lại
                        </button>
                    </div>
                </div>
            ) : (
                <div className="bg-white shadow-lg rounded-xl p-6 mb-8 border border-gray-200 text-center text-gray-700">
                    <p>Không tìm thấy thông tin thương hiệu.</p>
                </div>
            )}
        </div>
    );
}

export default BrandDetail;
