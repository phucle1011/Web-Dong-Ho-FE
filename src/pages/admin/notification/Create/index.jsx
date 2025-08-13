import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import Constants from "../../../../Constants.jsx";
import Select from "react-select";
import { io } from "socket.io-client";
import { uploadToCloudinary } from "../../../../Upload/uploadToCloudinary.js";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const socket = io(Constants.DOMAIN_API);

const CreateNotification = () => {
  const [title, setTitle] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [selectedPromotions, setSelectedPromotions] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [status, setStatus] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        const res = await axios.get(
          `${Constants.DOMAIN_API}/admin/active-products`
        );
        const now = new Date();

        const mapped = res.data.data.map((p) => {
          const start = new Date(p.start_date);
          const daysLeft = Math.ceil((start - now) / (1000 * 60 * 60 * 24));

          const timeText =
            daysLeft > 0 ? `${daysLeft} ngày nữa` : "Đang diễn ra";

          return {
            value: p.id,
            name: p.name,
            timeText,
            variant_count: p.variant_count,
          };
        });

        setPromotions(mapped);
      } catch (err) {
        console.error("Lỗi khi lấy danh sách khuyến mãi:", err);
        toast.error("Không thể tải chương trình khuyến mãi.");
      }
    };

    fetchPromotions();
  }, []);

  const validate = () => {
    const errs = {};
    if (!title) errs.title = "Bắt buộc.";
    if (!thumbnail) errs.thumbnail = "Bắt buộc.";
    if (!selectedPromotions.length) errs.promotionIds = "Chọn ít nhất 1.";
    if (!startDate) errs.startDate = "Bắt buộc.";
    if (!endDate) errs.endDate = "Bắt buộc.";
    if (startDate && endDate && startDate > endDate)
      errs.date = "Khoảng thời gian không hợp lệ.";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) return setErrors(errs);
    try {
      await axios.post(`${Constants.DOMAIN_API}/admin/flashSale`, {
        title,
        thumbnail:thumbnail.url,
        promotion_id: selectedPromotions.map((p) => p.value),
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        status: status ? 1 : 0,
      });
      socket.emit("new_notification");
      toast.success("Thành công!");
      navigate("/admin/notification/getAll");
    } catch {
      toast.error("Thất bại.");
    }
  };
const handleCancel = async () => {
  if (thumbnail?.public_id) {
    try {
      await axios.post(`${Constants.DOMAIN_API}/admin/products/imagesClauding`, {
        public_id: thumbnail.public_id,
      });
      console.log("Đã xoá ảnh:", thumbnail.public_id);
    } catch (error) {
      console.error("Lỗi xoá ảnh:", error);
    }
  }

  navigate(-1); // Quay lại trang trước
};

  // Helpers to return Date objects for time boundaries
  // Helpers để tính min/max time
  const now = new Date();
  const computeMinTime = (selected) => {
    if (!selected) return now;
    const d = new Date(selected);
    return d.toDateString() === now.toDateString()
      ? now
      : new Date(d.setHours(0, 0, 0, 0));
  };
  const computeMaxTime = (selected, limit) => {
    if (
      selected &&
      limit &&
      new Date(selected).toDateString() === new Date(limit).toDateString()
    ) {
      return new Date(limit);
    }
    const d = selected ? new Date(selected) : new Date();
    return new Date(d.setHours(23, 59, 59, 999));
  };

  // Compute bounds cho DatePicker
  const startMin = computeMinTime(startDate);
  const startMax = computeMaxTime(startDate, endDate);
  const endMin = computeMinTime(startDate);
  const endMax = computeMaxTime(endDate);
  return (
    <div className="p-6 max-w-7xl mx-auto bg-white rounded shadow">
      <h2 className="text-2xl font-semibold mb-6">Tạo slideshow</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
          {/* Card 1: Thông tin chung */}
          <div className="border border-gray-300 rounded p-4 shadow-lg bg-white min-h-[300px]">
            <h3 className="text-lg font-medium mb-4">Thông tin chung</h3>

            <div className="mb-4">
              <label className="block mb-1 font-medium">
                Tiêu đề
                <span style={{ color: "red", fontWeight: "bold" }}>*</span>
              </label>
              <input
                className="w-full border rounded px-3 py-2"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              {errors.title && (
                <p className="text-sm text-red-500">{errors.title}</p>
              )}
            </div>

            <div>
              <label className="block mb-1 font-medium">
                Chương trình khuyến mãi
                <span style={{ color: "red", fontWeight: "bold" }}>*</span>
              </label>
              <Select
                options={promotions}
                isMulti
                closeMenuOnSelect={false}
                menuPlacement="auto"
                value={selectedPromotions}
                onChange={(selected) => setSelectedPromotions(selected || [])}
                placeholder="Chọn chương trình khuyến mãi..."
                styles={{
                  control: (provided) => ({
                    ...provided,
                    minHeight: "48px",
                    flexWrap: "wrap",
                    alignItems: "flex-start",
                  }),
                  valueContainer: (provided) => ({
                    ...provided,
                    flexWrap: "wrap",
                    maxHeight: "auto",
                    overflowY: "auto",
                    paddingTop: "6px",
                    paddingBottom: "6px",
                  }),
                  multiValue: (provided) => ({
                    ...provided,
                    whiteSpace: "normal",
                    wordBreak: "break-word",
                    maxWidth: "100%",
                  }),
                  input: (provided) => ({
                    ...provided,
                    maxWidth: "100%",
                    minWidth: "50px",
                    flex: 1,
                  }),
                }}
                getOptionLabel={(e) => (
                  <div className="flex items-center">
                    <span className="font-medium mr-1">{e.name}</span>
                    <span className="text-sm">
                      (<span className="text-yellow-500">{e.timeText}</span> -{" "}
                      <span className="text-green-500">
                        {e.variant_count} biến thể
                      </span>
                      )
                    </span>
                  </div>
                )}
              />
              {errors.promotionIds && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.promotionIds}
                </p>
              )}
            </div>
          </div>

          {/* Card 2: Thời gian */}
          <div className="border border-gray-300 rounded p-4 shadow-lg bg-white min-h-[300px]">
            <h3 className="text-lg font-medium mb-4">Thời gian diễn ra</h3>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block mb-1 font-medium">
                  Ngày bắt đầu
                  <span style={{ color: "red", fontWeight: "bold" }}>*</span>
                </label>
                <DatePicker
                  selected={startDate}
                  onChange={setStartDate}
                  // showTimeSelect
                  className="w-full border rounded px-4 py-2"
                  minDate={new Date()}
                  maxDate={endDate || null}
                  minTime={startMin}
                  maxTime={startMax}
                />
                {errors.startDate && (
                  <p className="text-sm text-red-500">{errors.startDate}</p>
                )}
              </div>

              <div>
                <label className="block mb-1 font-medium">
                  Ngày kết thúc
                  <span style={{ color: "red", fontWeight: "bold" }}>*</span>
                </label>
                <DatePicker
                  selected={endDate}
                  onChange={setEndDate}
                  // showTimeSelect
                  className="w-full border rounded px-4 py-2"
                  minDate={startDate || new Date()}
                  minTime={endMin}
                  maxTime={endMax}
                />
                {errors.endDate && (
                  <p className="text-sm text-red-500">{errors.endDate}</p>
                )}
              </div>
            </div>

            {errors.date && (
              <p className="text-sm text-red-500 mt-4">{errors.date}</p>
            )}
          </div>

          {/* Card 3: Ảnh slideshow */}
          <div className="border border-gray-300 rounded p-4 shadow-lg bg-white min-h-[300px]">
            <h3 className="text-lg font-medium mb-4">
              Ảnh slideshow
              <span style={{ color: "red", fontWeight: "bold" }}>*</span>
            </h3>

            <div>
              <label className="block mb-1 font-medium">Tải ảnh</label>
              <input
                type="file"
                className="block mb-2"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    uploadToCloudinary(file).then((res) => {
                      setThumbnail({ url: res.url, public_id: res.public_id });
                    });
                  }
                }}
              />
              {thumbnail?.url && (
                <div className="border rounded overflow-hidden">
                  <img
                    src={thumbnail.url}
                    alt="Thumbnail Preview"
                    className="w-full h-48 object-cover"
                  />
                </div>
              )}

              {errors.thumbnail && (
                <p className="text-sm text-red-500 mt-1">{errors.thumbnail}</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer: Nút gửi và kích hoạt */}
        <div className="flex justify-start items-center gap-2 mt-4">
          <button
            type="button"
            className="px-6 py-2 bg-gray-500 text-gray-800 rounded "
            onClick={handleCancel}
          >
            Quay lại
          </button>

          <button
            type="submit"
            className="px-6 py-2 bg-[#073272] text-white rounded "
          >
            Gửi
          </button>

          <div className="form-check form-switch flex items-center gap-2">
            <input
              type="checkbox"
              id="status"
              className="form-check-input h-5 w-5"
              checked={status}
              onChange={() => setStatus((s) => !s)}
            />
            <label htmlFor="status" className="select-none">
              Kích hoạt
            </label>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateNotification;
