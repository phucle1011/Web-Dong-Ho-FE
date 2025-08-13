import React, { useState, useEffect } from "react";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import Constants from "../../../../Constants";
import { toast } from "react-toastify";
import moment from "moment-timezone";

const AuctionEdit = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [products, setProducts] = useState([]);
    const [form, setForm] = useState({
        product_variant_id: null,
        priceStep: "",
        start_time: null,
        end_time: null,
    });
    const [errors, setErrors] = useState({
        product_variant_id: "",
        priceStep: "",
        start_time: "",
        end_time: "",
    });
    const [loading, setLoading] = useState(false);
    const [initialLoad, setInitialLoad] = useState(true);
    const [auctionStatus, setAuctionStatus] = useState("");

    const fetchProducts = async () => {
        try {
            const res = await axios.get(`${Constants.DOMAIN_API}/admin/auction-products`,
                { params: { auctionId: id } })
            // const available = res.data.data.filter(p => p.stock > 0);
            // const options = res.data.data.map(p => ({
            //     value: p.id,
            //     label: `${p.product?.name || "Không có sản phẩm"} (${p.sku}) - ${Number(p.price).toLocaleString("vi-VN", { style: "currency", currency: "VND" })
            //         }`,
            // }));
            // setProducts(options);
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

    const parseUTCStringAsLocal = (utcString) => {
        const m = moment.utc(utcString);
        return new Date(
            m.year(),
            m.month(),
            m.date(),
            m.hour(),
            m.minute(),
            m.second()
        );
    };

    const fetchAuction = async () => {
        try {
            const res = await axios.get(`${Constants.DOMAIN_API}/admin/auctions/${id}`);
            const auction = res.data.data;

            setAuctionStatus(auction.status);
            if (auction.status !== "upcoming") {
                toast.error("Chỉ có thể chỉnh sửa phiên đấu giá sắp diễn ra");
                navigate("/admin/auctions/getAll");
                return;
            }

            setForm({
                product_variant_id: auction.product_variant_id,
                priceStep: "",
                start_time: parseUTCStringAsLocal(auction.start_time),
                end_time: parseUTCStringAsLocal(auction.end_time),

            });

            // setInitialLoad(false);
        } catch (err) {
            toast.error("Không tìm thấy phiên đấu giá");

            navigate("/admin/auctions/getAll");
        }
    };

    // useEffect(() => {
    //     fetchProducts();
    //     fetchAuction();
    // }, []);

    useEffect(() => {
        Promise.all([fetchProducts(), fetchAuction()])
            .then(() => setInitialLoad(false));
    }, []);

        useEffect(() => {
        if (!products?.length || !form.product_variant_id) return;
        const selected = products.find(o => o.value === form.product_variant_id);
        if (!selected) return;
        const step = computeStep(selected.price);
        setForm(prev => ({ ...prev, priceStep: step > 0 ? formatCurrency(step) : "" }));
        setErrors(prev => ({ ...prev, priceStep: "" }));
    }, [products, form.product_variant_id]);

    const formatCurrency = (value) => {
        if (!value) return "";
        const [intPart] = value.toString().split(".");
        const num = intPart.replace(/\D/g, "");
        return num.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    const computeStep = (price) => {
        const roundTo = 10000;
        return Math.ceil((Number(price || 0) * 0.1) / roundTo) * roundTo;
    };

    const handlePriceChange = e => {
        const el = e.target;
        const rawBeforeCursor = el.value.slice(0, el.selectionStart).replace(/\D/g, "");
        const raw = el.value.replace(/\D/g, "");

        const formatted = raw.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

        setForm(prev => ({ ...prev, priceStep: formatted }));
        validateField("priceStep", formatted);

        const formattedBeforeCursor = rawBeforeCursor.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        const newPos = formattedBeforeCursor.length;

        setTimeout(() => {
            el.setSelectionRange(newPos, newPos);
        }, 0);
    };

    const parseCurrency = (value) => {
        if (!value) return 0;
        return parseInt(value.replace(/\D/g, ""), 10) || 0;
    };

    const validateField = (name, value) => {
        let error = "";

        if (!value) {
            error = "Trường này không được bỏ trống";
        } else if ((name === "priceStep") && parseCurrency(value) <= 0) {
            error = "Giá trị phải lớn hơn 0";
        } else if (name === "end_time" && form.start_time && value <= form.start_time) {
            error = "Thời gian kết thúc phải sau thời gian bắt đầu";
        }

        setErrors(prev => ({ ...prev, [name]: error }));
        return !error;
    };

    const handleChange = (key, value) => {
        if (key === "priceStep") {
            const formattedValue = formatCurrency(value);
            setForm({ ...form, [key]: formattedValue });
            validateField(key, formattedValue);
        } else {
            setForm({ ...form, [key]: value });
            validateField(key, value);
        }
    };

    const formatToMySQL = (date) => {
        return moment(date).format("YYYY-MM-DD HH:mm:ss");
    };

    const validateForm = () => {
        let isValid = true;
        const newErrors = { ...errors };

        if (!form.product_variant_id) {
            newErrors.product_variant_id = "Vui lòng chọn sản phẩm";
            isValid = false;
        }
        if (!form.priceStep) {
            newErrors.priceStep = "Vui lòng nhập bước giá";
            isValid = false;
        } else if (parseCurrency(form.priceStep) <= 0) {
            newErrors.priceStep = "Bước giá phải lớn hơn 0";
            isValid = false;
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

        const payload = {
            ...form,
            priceStep: parseCurrency(form.priceStep),
            start_time: formatToMySQL(form.start_time),
            end_time: formatToMySQL(form.end_time),
        };

        setLoading(true);
        try {
            const res = await axios.put(`${Constants.DOMAIN_API}/admin/auctions/edit/${id}`, payload);
            toast.success("Cập nhật phiên đấu giá thành công!");
            navigate("/admin/auctions/getAll");
        } catch (err) {
            toast.error(err.response?.data?.message || "Lỗi không xác định");
        } finally {
            setLoading(false);
        }
    };

    if (initialLoad) {
        return <div className="text-center p-8">Đang tải dữ liệu...</div>;
    }

    return (
        <div className="max-w-screen-lg mx-auto bg-white p-5 md:p-10 rounded shadow mt-2 mb-2">
            <h2 className="text-xl font-semibold">Chỉnh sửa phiên đấu giá</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    <div className="md:col-span-12">
                        <label className="block mb-1 font-medium">
                            Sản phẩm đấu giá <span className="text-red-500">*</span>
                        </label>
                        <Select
                            options={products}
                            // value={products.find(p => String(p.value) === String(form.product_variant_id))}
                            // onChange={(selected) =>
                            //     handleChange("product_variant_id", selected?.value || null)
                            // }
                            value={
                                products.find(o => o.value === form.product_variant_id)
                                || (products.length === 1 && products[0].isDisabled ? products[0] : null)
                            }
                            onChange={(selected) =>
                                handleChange("product_variant_id", selected?.value ?? null)
                            }
                            isOptionDisabled={(opt) => !!opt.isDisabled}
                            isDisabled={products.length === 1 && products[0].isDisabled}
                            placeholder="Chọn sản phẩm"
                            className={errors.product_variant_id ? "border-red-500" : ""}
                        // isDisabled={loading}
                        />
                        {errors.product_variant_id && (
                            <p className="text-red-500 text-sm mt-1">{errors.product_variant_id}</p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-6">
                    <div className="md:col-span-6">
                        <label className="block mb-1 font-medium">
                            Bước giá <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                className="form-control w-full px-3 py-2 border rounded pl-8"
                                placeholder="Nhập bước giá"
                                value={form.priceStep}
                                onChange={handlePriceChange}
                                disabled={loading}
                            />

                        </div>
                        {errors.priceStep && (
                            <p className="text-red-500 text-sm mt-1">{errors.priceStep}</p>
                        )}
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
                            className={`w-full px-3 py-2 border rounded ${errors.start_time ? "border-red-500" : ""}`}
                            placeholderText="Chọn thời gian bắt đầu"
                            onBlur={() => validateField("start_time", form.start_time)}
                            disabled={loading}
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
                            disabled={loading}
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
                        {loading ? "Đang cập nhật..." : "Cập nhật"}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate("/admin/auctions/getAll")}
                        className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                        disabled={loading}
                    >
                        Quay lại
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AuctionEdit;