import React, { useState, useEffect } from "react";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Constants from "../../../../Constants";
import { toast } from "react-toastify";
import moment from "moment-timezone";

import Modal from "react-modal";
import { uploadToCloudinary } from "../../../../Upload/uploadToCloudinary.js";
Modal.setAppElement("#root");

const AuctionCreate = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [form, setForm] = useState({
        product_variant_id: null,
        start_price: "",
        priceStep: "",
        start_time: null,
        end_time: null,
    });
    const [errors, setErrors] = useState({
        product_variant_id: "",
        start_price: "",
        priceStep: "",
        start_time: "",
        end_time: "",
    });

    const [loading, setLoading] = useState(false);

    const [showAddVariant, setShowAddVariant] = useState(false);
    const [creatingVariant, setCreatingVariant] = useState(false);
    const [uploadingImg, setUploadingImg] = useState(false);

    const [productChoices, setProductChoices] = useState([]);

    const [allAttributes, setAllAttributes] = useState([]);
    const [variantImages, setVariantImages] = useState([]);
    const [variantForm, setVariantForm] = useState({
        product_id: null,
        sku: "",
        price: "",
        isAuctionOnly: 1,
        stock: 1,
        attributes: [{ attribute_id: "", value: "" }],
    });
    const [variantErrors, setVariantErrors] = useState({});

    const addAttrRow = () =>
        setVariantForm((p) => ({
            ...p,
            attributes: [...p.attributes, { attribute_id: "", value: "" }],
        }));

    const removeAttrRow = (i) =>
        setVariantForm((p) => ({
            ...p,
            attributes: p.attributes.filter((_, idx) => idx !== i),
        }));

    const setAttr = (i, field, value) =>
        setVariantForm((p) => {
            const next = [...p.attributes];
            next[i] = { ...next[i], [field]: value };
            return { ...p, attributes: next };
        });

    const fetchProducts = async () => {
        try {
            const res = await axios.get(`${Constants.DOMAIN_API}/admin/auction-products`);
            const data = Array.isArray(res.data?.data) ? res.data.data : [];
            const options = data.length
                ? data.map((p) => ({
                    value: p.id,
                    price: Number(p.price) || 0,
                    label: `${p.product?.name || "Không có sản phẩm"} (${p.sku}) - ${Number(p.price).toLocaleString("vi-VN")}₫`,
                }))
                : [
                    {
                        value: null,
                        label: "Không có sản phẩm đấu giá",
                        isDisabled: true,
                    },
                ];
            setProducts(options);
        } catch (err) {
            toast.error("Lỗi khi tải danh sách sản phẩm");
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const openAddVariant = async () => {
        try {

            const pr = await axios.get(`${Constants.DOMAIN_API}/admin/products/published`);
            const data = Array.isArray(pr.data?.data) ? pr.data.data : [];
            setProductChoices(data.map((x) => ({ value: x.id, label: x.name })));
        } catch {
            toast.error("Không tải được danh sách sản phẩm");
        }
        try {
            const attrs = await axios.get(`${Constants.DOMAIN_API}/admin/product-attributes`);
            setAllAttributes(attrs.data?.data || []);
        } catch {
            toast.error("Không tải được thuộc tính");
        }

        setVariantForm({
            product_id: null,
            sku: "",
            price: "",
            isAuctionOnly: 1,
            stock: 1,
            attributes: [{ attribute_id: "", value: "" }],
        });
        setVariantImages([]);
        setVariantErrors({});
        setShowAddVariant(true);
    };
    const closeAddVariant = () => setShowAddVariant(false);

    const formatCurrency = (value) => {
        if (!value) return "";
        const num = value.toString().replace(/\D/g, "");
        return num.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    const parseCurrency = (value) => {
        if (!value) return 0;
        return parseInt(value.replace(/\D/g, ""), 10) || 0;
    };

    const validateField = (name, value) => {
        let error = "";
        if (!value) {
            error = "Trường này không được bỏ trống";
        } else if (name === "start_price" && parseCurrency(value) <= 0) {
            error = "Giá trị phải lớn hơn 0";
        } else if (name === "end_time" && form.start_time && value <= form.start_time) {
            error = "Thời gian kết thúc phải sau thời gian bắt đầu";
        }
        setErrors(prev => ({ ...prev, [name]: error }));
        return !error;
    };

    const handleChange = (key, value) => {
        if (key === "start_price") {
            const formattedValue = formatCurrency(value);
            setForm({ ...form, [key]: formattedValue });
            validateField(key, formattedValue);
        } else {
            setForm({ ...form, [key]: value });
            validateField(key, value);
        }

    };

    const handleSelectVariant = (selected) => {
        const variantId = selected?.value ?? null;
        const price = Number(selected?.price || 0);

        const roundTo = 10000;
        const step = Math.ceil((price * 0.1) / roundTo) * roundTo;

        setForm((prev) => ({
            ...prev,
            product_variant_id: variantId,
            priceStep: step > 0 ? formatCurrency(step) : "",
        }));

        setErrors((prev) => ({ ...prev, product_variant_id: "", priceStep: "" }));
    };

    const formatToMySQL = (date) => {
        return moment.tz(date, "Asia/Ho_Chi_Minh").format("YYYY-MM-DD HH:mm:ss");
    };

    const validateForm = () => {
        let isValid = true;
        let newErrors = { ...errors };

        if (!form.product_variant_id) {
            newErrors.product_variant_id = "Vui lòng chọn sản phẩm";
            isValid = false;
        }

        const selectedOpt = products.find((o) => o.value === form.product_variant_id);
        const roundTo = 10000;
        const computedStep = selectedOpt
            ? Math.ceil((Number(selectedOpt.price || 0) * 0.1) / roundTo) * roundTo
            : 0;

        if (!computedStep || computedStep <= 0) {
            newErrors.priceStep = "Không tính được bước giá (10% giá sản phẩm).";
            isValid = false;
        } else {
            newErrors.priceStep = "";
        }

        if (!form.start_time) {
            newErrors.start_time = "Vui lòng chọn thời gian bắt đầu";
            isValid = false;
        }
        if (!form.end_time) {
            newErrors.end_time = "Vui lòng chọn thời gian kết thúc";
            isValid = false;
        } else if (form.start_time && form.end_time <= form.start_time) {
            newErrors.end_time = "Thời gian kết thúc phải sau thời gian bắt đầu";
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        const selectedOpt = products.find((o) => o.value === form.product_variant_id);
        const computedStep = selectedOpt ? Math.floor(Number(selectedOpt.price || 0) * 0.1) : 0;

        const payload = {
            ...form,
            start_price: parseCurrency(form.start_price),
            priceStep: computedStep,
            start_time: formatToMySQL(form.start_time),
            end_time: formatToMySQL(form.end_time),
        };

        setLoading(true);
        try {
            const res = await axios.post(`${Constants.DOMAIN_API}/admin/auctions`, payload);
            toast.success("Tạo phiên đấu giá thành công!");
            navigate("/admin/auctions/getAll");
        } catch (err) {
            toast.error(err.response?.data?.message || "Lỗi không xác định");
        } finally {
            setLoading(false);
        }
    };

    const validateVariant = () => {
        const errs = {};
        if (!variantForm.product_id) errs.product_id = "Chọn sản phẩm";
        if (!variantForm.sku.trim()) errs.sku = "Nhập SKU";
        if (parseCurrency(variantForm.price) <= 0) errs.price = "Giá phải > 0";
        variantForm.attributes.forEach((a, i) => {
            if (!a.attribute_id) errs[`attr_${i}_id`] = "Chọn thuộc tính";
            if (!String(a.value).trim()) errs[`attr_${i}_value`] = "Nhập giá trị";
        });
        setVariantErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const deleteCloudImage = async (public_id) => {
        try {
            await axios.post(`${Constants.DOMAIN_API}/admin/products/imagesClauding`, { public_id });
        } catch { }
    };

    const submitVariant = async () => {
        if (!validateVariant()) return;
        setCreatingVariant(true);
        try {
            const imageUrls = variantImages.map((i) => i.url);
            const data = {
                sku: variantForm.sku.trim(),
                price: parseCurrency(variantForm.price),
                stock: 1,
                attributes: variantForm.attributes,
                images: imageUrls,
                is_auction_only: 1,
            };

            const resp = await axios.post(
                `${Constants.DOMAIN_API}/admin/products/${variantForm.product_id}/variants`,
                data
            );

            const newVariant = resp.data?.data;
            toast.success("Tạo biến thể đấu giá thành công!");

            await fetchProducts();
            if (newVariant?.id) {
                setForm((f) => ({ ...f, product_variant_id: newVariant.id }));
            }
            setShowAddVariant(false);
        } catch (e) {
            toast.error(e.response?.data?.error || e.response?.data?.message || "Không tạo được biến thể");
        } finally {
            setCreatingVariant(false);
        }
    };

    const attrOptions = (excludeIds = []) =>
        (allAttributes || [])
            .filter((opt) => !excludeIds.includes(String(opt.id)))
            .map((opt) => ({ value: String(opt.id), label: opt.name }));

    const getOptionById = (id) => {
        if (!id) return null;
        const found = (allAttributes || []).find((a) => String(a.id) === String(id));
        return found ? { value: String(found.id), label: found.name } : null;
    };
    const handleVariantImageUpload = async (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        setUploadingImg(true);
        try {
            const uploaded = await Promise.all(
                files.map(async (f) => {
                    const { url, public_id } = await uploadToCloudinary(f);
                    return { url, public_id };
                })
            );
            setVariantImages((prev) => [...prev, ...uploaded]);
            toast.success("Tải ảnh lên thành công!");
        } catch (err) {
            console.error(err);
            toast.error("Upload ảnh thất bại!");
        } finally {
            setUploadingImg(false);
            e.target.value = ""; // reset input
        }
    };

    const removeVariantImage = async (idx) => {
        const img = variantImages[idx];
        try {
            if (img?.public_id) {
                await axios.post(`${Constants.DOMAIN_API}/admin/products/imagesClauding`, {
                    public_id: img.public_id,
                });
            }
        } catch (e) {
            console.error("Xoá ảnh Cloudinary lỗi:", e);
        } finally {
            setVariantImages((prev) => prev.filter((_, i) => i !== idx));
        }
    };


    return (
        <div className="max-w-screen-lg mx-auto bg-white p-5 md:p-10 rounded shadow mt-2 mb-2">
            <h2 className="text-xl font-semibold">Tạo phiên đấu giá</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    <div className="md:col-span-12">
                        <div className="flex items-center justify-between mb-1">
                            <label className="font-medium">
                                Sản phẩm đấu giá <span className="text-red-500">*</span>
                            </label>

                            <button
                                type="button"
                                onClick={openAddVariant}
                                className="inline-flex items-center text-blue-600 text-sm hover:text-blue-800"
                                title="Thêm biến thể đấu giá mới"
                            >
                                + Thêm biến thể đấu giá
                            </button>
                        </div>

                        <Select
                            options={products}
                            // onChange={(selected) =>
                            //     handleChange("product_variant_id", selected?.value || null)
                            // }
                            value={
                                products.find(o => o.value === form.product_variant_id)
                                || (products.length === 1 && products[0].isDisabled ? products[0] : null)
                            }
                            onChange={handleSelectVariant}
                            isOptionDisabled={(opt) => !!opt.isDisabled}
                            isDisabled={products.length === 1 && products[0].isDisabled}
                            placeholder="Chọn sản phẩm"
                            className={errors.product_variant_id ? "border-red-500" : ""}
                        />
                        {errors.product_variant_id && (
                            <p className="text-red-500 text-sm mt-1">{errors.product_variant_id}</p>
                        )}
                    </div>


                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    <div className="md:col-span-6">
                        <div className="md:col-span-6">
                            <label className="block mb-1 font-medium">
                                Bước giá <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    className={`form-control w-full px-3 py-2 border rounded ${errors.priceStep ? "border-red-500" : ""}`}
                                    placeholder="Tự động = 10% giá sản phẩm"
                                    value={form.priceStep}
                                    readOnly
                                    disabled
                                    title="Bước giá được tính tự động = 10% giá sản phẩm"
                                />

                            </div>
                            {errors.priceStep && (
                                <p className="text-red-500 text-sm mt-1">{errors.priceStep}</p>
                            )}
                        </div>
                    </div>
                    <div className="md:col-span-3 ml-auto">
                        <label className="block mb-1 font-medium">
                            Thời gian bắt đầu <span className="text-red-500">*</span>
                        </label>
                        <DatePicker
                            selected={form.start_time}
                            onChange={(date) => handleChange("start_time", date)}
                            showTimeSelect
                            timeFormat="HH:mm"
                            timeIntervals={15}
                            dateFormat="yyyy-MM-dd HH:mm:ss"
                            className={`w-full px-3 py-2 border rounded ${errors.start_time ? "border-red-500" : ""} style: "with: 1500px"`}
                            placeholderText="Chọn thời gian bắt đầu"
                            onBlur={() => validateField("start_time", form.start_time)}
                        />
                        {errors.start_time && (
                            <p className="text-red-500 text-sm mt-1">{errors.start_time}</p>
                        )}
                    </div>

                    <div className="md:col-span-3 ml-auto">
                        <label className="block mb-1 font-medium">
                            Thời gian kết thúc <span className="text-red-500">*</span>
                        </label>
                        <DatePicker
                            selected={form.end_time}
                            onChange={(date) => handleChange("end_time", date)}
                            showTimeSelect
                            timeFormat="HH:mm"
                            timeIntervals={15}
                            dateFormat="yyyy-MM-dd HH:mm:ss"
                            className={`w-full px-3 py-2 border rounded ${errors.end_time ? "border-red-500" : ""}`}
                            placeholderText="Chọn thời gian kết thúc"
                            onBlur={() => validateField("end_time", form.end_time)}
                        />
                        {errors.end_time && (
                            <p className="text-red-500 text-sm mt-1">{errors.end_time}</p>
                        )}
                    </div>
                </div>

                <div className="mt-4 flex gap-4 no-print">
                    <button
                        type="submit"
                        className="bg-[#073272] text-white px-6 py-2 rounded hover:bg-[#052354] transition"
                        disabled={loading}
                    >
                        {loading ? "Đang tạo..." : "Tạo phiên đấu giá"}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate("/admin/auctions/getAll")}
                        className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                    >
                        Quay lại
                    </button>
                </div>
            </form>
            <Modal
                isOpen={showAddVariant}
                onRequestClose={closeAddVariant}
                style={{
                    overlay: {
                        backgroundColor: "rgba(0,0,0,0.5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 1000,
                    },
                    content: {
                        position: "relative",
                        inset: "auto",
                        padding: "1.25rem",
                        borderRadius: "0.5rem",
                        width: "42rem",
                        maxHeight: "90vh",
                        overflowY: "auto",
                    },
                }}
            >
                <button onClick={closeAddVariant} className="absolute top-0 right-3 text-red-500 text-2xl">
                    ×
                </button>
                <h3 className="text-lg font-semibold mb-3">Thêm biến thể đấu giá</h3>

                {/* Chọn sản phẩm gốc */}
                <div className="mb-3">
                    <label className="block mb-1 font-medium">Sản phẩm <span className="text-red-500">*</span></label>
                    <Select
                        options={productChoices}
                        value={productChoices.find((o) => o.value === variantForm.product_id) || null}
                        onChange={(opt) => setVariantForm((p) => ({ ...p, product_id: opt?.value || null }))}
                        placeholder="Chọn sản phẩm"
                    />
                    {variantErrors.product_id && (
                        <p className="text-red-600 text-sm mt-1">{variantErrors.product_id}</p>
                    )}
                </div>

                {/* SKU + Giá (stock cố định = 1, is_auction_only = 1) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                        <label className="block mb-1 font-medium">Mã SKU <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            value={variantForm.sku}
                            onChange={(e) => setVariantForm((p) => ({ ...p, sku: e.target.value }))}
                            className="w-full border px-3 py-2 rounded"
                        />
                        {variantErrors.sku && <p className="text-red-600 text-sm mt-1">{variantErrors.sku}</p>}
                    </div>
                    <div>
                        <label className="block mb-1 font-medium">Giá <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            value={variantForm.price}
                            onChange={(e) =>
                                setVariantForm((p) => ({ ...p, price: formatCurrency(e.target.value) }))
                            }
                            className="w-full border px-3 py-2 rounded"
                        />
                        {variantErrors.price && (
                            <p className="text-red-600 text-sm mt-1">{variantErrors.price}</p>
                        )}
                    </div>
                </div>

                {/* Thuộc tính */}
                <div className="mt-3">
                    <label className="block mb-2 font-medium">Thuộc tính biến thể <span className="text-red-500">*</span></label>
                    {variantForm.attributes.map((a, i) => {
                        const selectedAttr = (allAttributes || []).find(
                            (at) => String(at.id) === String(a.attribute_id)
                        );
                        const isColor =
                            selectedAttr?.name?.toLowerCase() === "màu sắc" ||
                            selectedAttr?.name?.toLowerCase() === "màu";

                        const selectedIdsOtherRows = variantForm.attributes
                            .map((row, idx) => (idx !== i ? String(row.attribute_id) : null))
                            .filter(Boolean);

                        const options = attrOptions(selectedIdsOtherRows);

                        return (
                            <div key={i} className="flex gap-3 items-center mb-2">
                                <div className="w-1/2">
                                    <Select
                                        classNamePrefix="attr-select"
                                        placeholder="-- Chọn thuộc tính --"
                                        options={options}
                                        value={getOptionById(a.attribute_id)}
                                        onChange={(opt) => {
                                            setAttr(i, "attribute_id", opt ? opt.value : "");
                                            setAttr(i, "value", "");
                                        }}
                                        isSearchable
                                        noOptionsMessage={() => "Không có kết quả"}
                                        styles={{
                                            control: (base) => ({
                                                ...base,
                                                minHeight: 40,
                                                borderColor: variantErrors?.[`attr_${i}_id`] ? "#ef4444" : base.borderColor,
                                                boxShadow: "none",
                                            }),
                                        }}
                                    />

                                    {variantErrors[`attr_${i}_id`] && (
                                        <p className="text-red-600 text-sm mt-1">{variantErrors[`attr_${i}_id`]}</p>
                                    )}
                                </div>
                                <div className="w-1/2">
                                    <input
                                        type={isColor ? "color" : "text"}
                                        value={a.value}
                                        onChange={(e) => setAttr(i, "value", e.target.value)}
                                        className={`w-full border px-3 py-2 rounded ${isColor ? "h-10 p-1" : ""}`}
                                        placeholder={isColor ? "" : "Giá trị"}
                                    />

                                    {variantErrors[`attr_${i}_value`] && (
                                        <p className="text-red-600 text-sm mt-1">{variantErrors[`attr_${i}_value`]}</p>
                                    )}
                                </div>
                                {variantForm.attributes.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeAttrRow(i)}
                                        className="text-red-600 px-2"
                                        title="Xoá dòng"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        );
                    })}
                    {variantForm.attributes.length < allAttributes.length && (
                        <button type="button" onClick={addAttrRow} className="text-blue-600 text-sm">
                            + Thêm thuộc tính
                        </button>
                    )}
                </div>

                {/* Ảnh */}
                <div className="mt-4">
                    <label className="block mb-2 font-medium">Ảnh biến thể</label>
                    <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={async (e) => {
                            const files = Array.from(e.target.files || []);
                            if (!files.length) return;
                            setUploadingImg(true);
                            const uploaded = [];
                            for (const f of files) {
                                try {
                                    const { url, public_id } = await uploadToCloudinary(f);
                                    uploaded.push({ url, public_id });
                                } catch (err) {
                                    console.error(err);
                                }
                            }
                            setVariantImages((prev) => [...prev, ...uploaded]);
                            setUploadingImg(false);
                        }}
                        className="w-full border px-2 py-1.5 rounded"
                    />

                    <div className="mt-3 flex gap-3 overflow-x-auto">
                        {variantImages.map((img, idx) => (
                            <div key={idx} className="relative">
                                <img src={img.url} alt="" className="w-24 h-24 object-cover rounded border" />
                                <button
                                    type="button"
                                    onClick={async () => {
                                        if (img.public_id) await deleteCloudImage(img.public_id);
                                        setVariantImages((prev) => prev.filter((_, i) => i !== idx));
                                    }}
                                    className="absolute top-0 right-0 bg-red-600 text-white text-xs px-2 rounded-full"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Action */}
                <div className="mt-4 flex justify-end gap-2">
                    <button className="bg-gray-500 text-white px-4 py-2 rounded" onClick={closeAddVariant}>
                        Hủy
                    </button>
                    <button
                        className="bg-[#073272] text-white px-6 py-2 rounded hover:bg-[#052354] transition"
                        disabled={creatingVariant || uploadingImg}
                        onClick={submitVariant}
                    >
                        {creatingVariant ? "Đang tạo..." : uploadingImg ? "Đang tải ảnh..." : "Tạo biến thể"}
                    </button>

                </div>
            </Modal>
        </div>
    );
};

export default AuctionCreate;