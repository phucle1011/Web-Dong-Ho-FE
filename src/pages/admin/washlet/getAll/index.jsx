import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import React, { useEffect, useState } from "react";
import {
  FaChevronLeft,
  FaChevronRight,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaCheck,
  FaTrashAlt,
  FaEye
} from "react-icons/fa";
import Constants from "../../../../Constants.jsx";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import FormDelete from "../../../../components/formDelete/index.jsx";

function WashletGetAll() {
  const [wallets, setWallets] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeStatus, setActiveStatus] = useState('');
  const [statusCounts, setStatusCounts] = useState({
    all: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const recordsPerPage = 10;
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    id: null,
    action: null,
  });

  const [rejectModal, setRejectModal] = useState({ isOpen: false, id: null });
  const [rejectReason, setRejectReason] = useState("");
  const [rejectSubmitting, setRejectSubmitting] = useState(false);
  const formatDateLocal = (date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const fetchWallets = async (page = 1) => {
    try {
      setCurrentPage(page);
      const params = {
        page,
        limit: recordsPerPage,
        searchTerm: searchTerm.trim(),
      };
      if (startDate) params.startDate = formatDateLocal(startDate);
      if (endDate) params.endDate = formatDateLocal(endDate);
      if (statusFilter && statusFilter !== "all") params.status = statusFilter;

      const res = await axios.get(`${Constants.DOMAIN_API}/admin/wallets`, {
        params,
      });
      setWallets(res.data.data || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
      setStatusCounts(res.data.statusCounts || statusCounts);
    } catch (error) {
      console.error("Lỗi khi tải ví:", error);
      toast.error("Lỗi tải dữ liệu ví từ máy chủ.");
    }
  };

  useEffect(() => {
    fetchWallets(currentPage);
  }, [currentPage, statusFilter]);

  const handleApprove = async (id) => {
    try {
      const res = await axios.put(`${Constants.DOMAIN_API}/admin/wallets/withdraw/${id}`, {
        status: "approved",
      });
      toast.success(res.data.message || "Đã duyệt yêu cầu rút tiền.");
      fetchWallets(currentPage);
    } catch (error) {
      toast.error("Không thể duyệt yêu cầu.");
      console.error(error);
    }
  };

  const handleReject = async (id, reason) => {
    try {
      const res = await axios.put(`${Constants.DOMAIN_API}/admin/wallets/withdraw/${id}`, {
        status: "rejected",
        cancellation_reason: reason,
      });
      toast.success(res.data.message || "Đã từ chối yêu cầu rút tiền.");
      fetchWallets(currentPage);
    } catch (error) {
      toast.error("Không thể từ chối yêu cầu.");
      console.error(error);
    }
  };

  const handleFilterClick = (status) => {
    setStatusFilter(status);
    setActiveStatus(status);
  };

  const openConfirmModal = (id, action) => {
    setConfirmModal({ isOpen: true, id, action });
  };

  const handleConfirmAction = async () => {
    const { id, action } = confirmModal;
    setConfirmModal({ isOpen: false, id: null, action: null });

    if (action === "approve") {
      await handleApprove(id);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className="container mx-auto p-2">
      <div className="bg-white p-4 shadow rounded-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Danh sách ví người dùng</h2>
          <div className="flex items-center gap-3">
            <span className="italic text-gray-600">Chọn khoảng thời gian:</span>
            <DatePicker selected={startDate} onChange={(date) => setStartDate(date)} dateFormat="yyyy-MM-dd" className="border px-3 py-2 rounded w-40" placeholderText="Ngày bắt đầu" />
            <DatePicker selected={endDate} onChange={(date) => setEndDate(date)} dateFormat="yyyy-MM-dd" className="border px-3 py-2 rounded w-40" placeholderText="Ngày kết thúc" />
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded" onClick={() => fetchWallets(1)}>Lọc theo ngày</button>
          </div>
        </div>

        <div className="flex flex-nowrap items-center gap-6 border-b border-gray-200 px-6 py-4 overflow-x-auto mb-4">
          {[
            { key: "", label: "Tất cả", color: "bg-gray-800", textColor: "text-white", count: statusCounts.all },
            { key: "pending", label: "Đang chờ duyệt", color: "bg-amber-300", textColor: "text-amber-800", count: statusCounts.pending },
            { key: "approved", label: "Đã duyệt", color: "bg-green-300", textColor: "text-green-800", count: statusCounts.approved },
            { key: "rejected", label: "Từ chối", color: "bg-rose-300", textColor: "text-rose-800", count: statusCounts.rejected },
          ].map(({ key, label, color, textColor, count }) => {
            const isActive = activeStatus === key;
            return (
              <button
                key={key}
                onClick={() => handleFilterClick(key)}
                className={`border px-3 py-1.5 text-nowrap ${isActive ? 'bg-[#073272] text-white' : 'bg-white text-gray-700'}`}
              >
                <span>{label}</span>
                <span className={`${color} ${textColor} rounded-pill px-2 py-0.5 ms-2`}>{count}</span>
              </button>
            );
          })}
        </div>

        <div className="mb-6 flex items-center gap-2">
          <input
            type="text"
            className="flex-grow border border-gray-300 rounded py-2 px-4 text-gray-700 leading-tight focus:ring-2 focus:ring-blue-500"
            placeholder="Nhập tên khách hàng..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
          <button
            type="button"
            className="bg-blue-900 hover:bg-blue-800 text-white px-4 py-1.5 rounded"
            onClick={() => fetchWallets(1)}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1010.5 3a7.5 7.5 0 006.15 13.65z" />
            </svg>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300 mt-3 text-left text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-center py-3 px-2 whitespace-nowrap">#</th>
                <th className="text-center py-3 px-2 whitespace-nowrap">Tên khách hàng</th>
                <th className="text-center py-3 px-2 whitespace-nowrap">Số dư</th>
                <th className="text-center py-3 px-2 whitespace-nowrap">Số tiền chờ duyệt</th>
                <th className="text-center py-3 px-2 whitespace-nowrap">Số lần rút tiền</th>
                <th className="text-center py-3 px-2 whitespace-nowrap">Số lần hoàn tiền</th>
                <th className="text-center py-3 px-2 whitespace-nowrap">Số lần nạp tiền</th>
                <th className="text-center py-3 px-2 whitespace-nowrap">Trạng thái</th>
                <th className="text-center py-3 px-2 whitespace-nowrap">Ngày thực hiện</th>
                <th className="text-center py-3 px-2 whitespace-nowrap"></th>
              </tr>
            </thead>
            <tbody>
              {wallets.length > 0 ? (
                wallets.map((item, index) => (
                  <tr key={item.user.id}>
                    <td className="p-2 border text-center">{index + 1}</td>
                    <td className="p-2 border text-center">{item.user?.name || 'N/A'}</td>

                    <td className="p-2 border text-center">
                      <span className="inline-block px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-800">
                        {Number(item.user?.balance || 0).toLocaleString("vi-VN")} ₫
                      </span>
                    </td>
                    <td className="p-2 border text-center">
                      <span className="inline-block px-2 py-1 text-xs font-semibold rounded bg-red-100 text-red-800">
                        {Number(item.amount || 0).toLocaleString("vi-VN")} ₫
                      </span>
                    </td>
                    <td className="p-2 border text-center">{item.user.withdrawCount}</td>
                    <td className="p-2 border text-center">{item.user.refundCount}</td>
                    <td className="p-2 border text-center">{item.user.rechargeCount || 0}</td>

                    <td className="p-2 border text-center">
                      <span className={`inline-block px-2 py-1 text-xs font-semibold rounded ${item.hasPending ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-600'}`}>
                        {item.hasPending ? 'Đang chờ duyệt' : 'Không có yêu cầu'}
                      </span>
                    </td>

                    <td className="p-2 border text-center">
                      {(() => {
                        const date = new Date(item.latestCreatedAt);
                        const pad = (n) => String(n).padStart(2, '0');
                        const h = pad(date.getUTCHours());
                        const m = pad(date.getUTCMinutes());
                        const s = pad(date.getUTCSeconds());
                        const d = pad(date.getUTCDate());
                        const mo = pad(date.getUTCMonth() + 1);
                        const y = date.getUTCFullYear();
                        return `${h}:${m}:${s} ${d}/${mo}/${y}`;
                      })()}
                    </td>

                    <td className="p-2 border text-center">
                      <div className="flex justify-center items-center gap-2">
                        <Link
                          to={`/admin/washlets/user/${item.user.id}`}
                          className="bg-blue-500 text-white p-2 rounded w-8 h-8 inline-flex items-center justify-center"
                          title="Xem chi tiết"
                        >
                          <FaEye size={18} />
                        </Link>

                        {item.status === 'pending' && (
                          <>
                            <button
                              onClick={() => openConfirmModal(item.id, "approve")}
                              className="bg-green-500 text-white p-2 rounded w-8 h-8 inline-flex items-center justify-center"
                              title="Duyệt yêu cầu"
                            >
                              <FaCheck size={18} />
                            </button>

                            <button
                              // onClick={() => openConfirmModal(item.id, "reject")}
                              onClick={() => setRejectModal({ isOpen: true, id: item.id })}
                              className="bg-red-100 text-red-600 p-2 rounded w-8 h-8 inline-flex items-center justify-center"
                              title="Từ chối yêu cầu"
                            >
                              <FaTrashAlt size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="text-center py-4 text-gray-500">
                    Không có yêu cầu nào.
                  </td>
                </tr>
              )}
            </tbody>

          </table>
        </div>

        <div className="flex justify-center mt-6">
          <div className="flex items-center space-x-1">
            <button disabled={currentPage === 1} onClick={() => fetchWallets(1)} className="px-2 py-1 border rounded disabled:opacity-50"><FaAngleDoubleLeft /></button>
            <button disabled={currentPage === 1} onClick={() => fetchWallets(currentPage - 1)} className="px-2 py-1 border rounded disabled:opacity-50"><FaChevronLeft /></button>
            {[...Array(totalPages)].map((_, i) => {
              const page = i + 1;
              if (page >= currentPage - 1 && page <= currentPage + 1) {
                return (
                  <button
                    key={page}
                    onClick={() => fetchWallets(page)}
                    className={`w-8 h-8 border rounded text-sm flex items-center justify-center ${page === currentPage ? "bg-blue-600 text-white" : "bg-white hover:bg-blue-100"}`}
                  >
                    {page}
                  </button>
                );
              }
              return null;
            })}
            <button disabled={currentPage === totalPages} onClick={() => fetchWallets(currentPage + 1)} className="px-2 py-1 border rounded disabled:opacity-50"><FaChevronRight /></button>
            <button disabled={currentPage === totalPages} onClick={() => fetchWallets(totalPages)} className="px-2 py-1 border rounded disabled:opacity-50"><FaAngleDoubleRight /></button>
          </div>
        </div>
      </div>
      {selectedRequest && (
        <DetailModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
        />
      )}
      <FormDelete
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, id: null, action: null })}
        onConfirm={handleConfirmAction}
        title={"Xác nhận duyệt yêu cầu"}
        message={"Bạn có chắc chắn muốn duyệt yêu cầu rút tiền này?"}
        confirmText={"Duyệt"}
        type={"approve"}
      />

      {rejectModal.isOpen && (
        <RejectReasonModal
          submitting={rejectSubmitting}
          onClose={() => {
            if (rejectSubmitting) return;
            setRejectModal({ isOpen: false, id: null });
            setRejectReason("");
          }}
          onConfirm={async () => {
            if (!rejectReason.trim()) {
              toast.warning("Vui lòng chọn/nhập lý do từ chối.");
              return;
            }
            if (rejectSubmitting) return;
            try {
              setRejectSubmitting(true);
              await handleReject(rejectModal.id, rejectReason.trim());
              setRejectModal({ isOpen: false, id: null });
              setRejectReason("");
            } finally {
              setRejectSubmitting(false);
            }
          }}
          reason={rejectReason}
          setReason={setRejectReason}
        />
      )}

    </div>
  );
}

export default WashletGetAll;

function RejectReasonModal({ onClose, onConfirm, reason, setReason }) {
  const presets = [
    "Thông tin tài khoản không khớp tên người nhận",
    "Số tài khoản/Ngân hàng không hợp lệ",
    "Nghi ngờ gian lận",
    "Khác..."
  ];


  const [selected, setSelected] = React.useState("");
  const isOther = selected === "Khác...";

  const handleSelectChange = (e) => {
    const v = e.target.value;
    setSelected(v);
    if (v === "Khác...") {
      setReason("");
    } else {

      setReason(v);
    }
  };

  const canConfirm = (isOther ? reason.trim().length > 0 : selected && selected !== "");

  return (
    <div className="fixed inset-0 z-[9999]" aria-modal="true" role="dialog">

      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden relative"
          onClick={(e) => e.stopPropagation()}
        >

          <div className="px-5 py-4 border-b flex items-center justify-center relative">
            <h3 className="text-lg font-semibold text-center flex-1">Chọn lý do từ chối</h3>
            <button
              onClick={onClose}
              aria-label="Đóng"
              title="Đóng"
              className="w-10 h-10 text-2xl absolute right-2 top-2 flex items-center justify-center rounded-full hover:text-red-600 text-gray-500"
            >
              ×
            </button>

          </div>

          <div className="p-5 space-y-3">
            <label className="text-sm font-medium">Chọn lý do</label>
            <select
              className="w-full border rounded px-3 py-2"
              onChange={handleSelectChange}
              value={selected}
            >
              <option value="" disabled>— Chọn lý do —</option>
              {presets.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            {isOther && (
              <>
                <label className="text-sm font-medium">Nhập lý do cụ thể</label>
                <textarea
                  placeholder="Nhập lý do từ chối..."
                  className="w-full border rounded px-3 py-2 min-h-28"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </>
            )}
          </div>

          <div className="px-5 py-4 border-t flex gap-2 justify-end">
            <button className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600" onClick={onClose}>
              Hủy
            </button>
            <button
              className={`bg-red-600 hover:bg-red-800 text-white px-4 py-2 rounded-md ${canConfirm}`}
              onClick={onConfirm}
              disabled={!canConfirm}
            >
              Xác nhận từ chối
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}