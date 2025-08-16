import axios from "axios";
import { decodeToken } from "../../../Helpers/jwtDecode.jsx";
import React, { useState, useEffect } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { BiMoneyWithdraw, BiPlusCircle } from "react-icons/bi";
import {
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaChevronLeft,
  FaChevronRight
} from "react-icons/fa";

import Constants from "../../../../../Constants.jsx";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

import ProductsTable from "../../../CartPage/ProductsTable.jsx";

const token = localStorage.getItem("token");
const decoded = token ? decodeToken(token) : {};
const userId = decoded?.id;

export default function Payment() {
  const [hasActiveAuction, setHasActiveAuction] = useState(false);
  const [cartItems, setCartItems] = useState([]);

  const [showBalance, setShowBalance] = useState(false);
  const [balance, setBalance] = useState(0);
  const [pending, setPending] = useState(0);
  const [hasPendingWithdraw, setHasPendingWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [selectedBank, setSelectedBank] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [banks, setBanks] = useState([]);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [showTopUpInput, setShowTopUpInput] = useState(false);
  const [showWithdrawSection, setShowWithdrawSection] = useState(false);
  const [topups, setTopups] = useState([]);
  const [totalTopups, setTotalTopups] = useState(0);


  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const [withdraws, setWithdraws] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [totalWithdraws, setTotalWithdraws] = useState(0);
  const [totalRefunds, setTotalRefunds] = useState(0);

  const [showTerms, setShowTerms] = useState(false);

  const [agreeTerms, setAgreeTerms] = useState(false);
  const [receiverName, setReceiverName] = useState("");

  const AccordionItem = ({ title, children }) => {
    const [open, setOpen] = useState(false);
    return (
      <div className="border border-gray-200 rounded mb-3 shadow-sm">
        <button
          className="w-full text-left px-4 py-3 bg-gray-100 hover:bg-gray-200 font-semibold text-sm rounded-t"
          onClick={() => setOpen(!open)}
        >
          {title}
        </button>
        {open && <div className="px-5 py-4 bg-white text-sm">{children}</div>}
      </div>
    );
  };

  useEffect(() => {
    fetchWalletInfo();
    fetchWalletDetails();
    fetchTopups();
    fetchBanks();
  }, [currentPage]);

  const fetchWalletInfo = async () => {
    try {
      const res = await axios.get(`${Constants.DOMAIN_API}/wallets`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const wallet = res.data?.data?.[0];
      setBalance(parseInt(wallet.balance || 0));
      const pendingAmount = wallet.withdrawRequests?.filter(r => r.status === "pending" && r.type === "withdraw")
        .reduce((sum, r) => sum + parseInt(r.amount || 0), 0);
      setPending(pendingAmount || 0);
      setHasPendingWithdraw(!!wallet.withdrawRequests?.find(r => r.status === "pending" && r.type === "withdraw"));
    } catch (err) {
      // toast.error("Không thể tải thông tin ví.");
    }
  };

  const fetchWalletDetails = async () => {
    try {
      const res = await axios.get(
        `${Constants.DOMAIN_API}/admin/wallets/user/${userId}?page=${currentPage}&limit=${recordsPerPage}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = res.data?.data || {};
      const pagination = res.data?.pagination || {};
      setWithdraws(data.withdraws || []);
      setRefunds(data.refunds || []);
      setTotalWithdraws(pagination.totalWithdraws || 0);
      setTotalRefunds(pagination.totalRefunds || 0);
      setTotalPages(pagination.totalPages || 1);
    } catch (err) {
      // toast.error("Không thể tải lịch sử ví.");
    }
  };

  const fetchTopups = async (page) => {
    try {
      const res = await axios.get(
        `${Constants.DOMAIN_API}/wallets/topups?page=${page}&limit=${recordsPerPage}&userId=${userId}`
      );
      setTopups(res.data?.data || []);
      setTotalTopups(res.data?.pagination?.total || 0);
    } catch (err) {
      // toast.error("Không thể tải lịch sử nạp tiền.");
    }
  };

  const formatCurrency = (amount) => parseInt(amount).toLocaleString("vi-VN") + " ₫";

  const handleTopUp = async () => {
    const amountInt = parseInt(topUpAmount);
    if (!topUpAmount || isNaN(amountInt)) return toast.warning("Vui lòng nhập số tiền hợp lệ.");
    if (amountInt < 13000) return toast.warning("Số tiền tối thiểu là 13,000₫.");
    try {
      setIsSubmitting(true);
      const res = await axios.post(`${Constants.DOMAIN_API}/wallet/topup`, { amount: amountInt }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.url) window.location.href = res.data.url;
      // toast.success("Nạp tiền thành công.");
    } catch {
      toast.error("Số tiền không được lớn hơn 99.999.999đ.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseInt(withdrawAmount);

    if (amount > 99_999_999) {
      return toast.warning("Số tiền không được vượt quá 99.999.999₫");
    }
    if (!amount || !selectedBank || !bankAccount || !receiverName) return toast.warning("Vui lòng nhập đầy đủ.");
    if (amount > balance - pending) return toast.warning(`Không đủ số dư: ${formatCurrency(balance - pending)}`);
    const confirm = await Swal.fire({
      title: "Xác nhận thông tin",
      icon: "warning",
      html: `
        <div style="text-align:left">
        <p><strong>Tên người nhận:</strong> ${receiverName}</p>
          <p><strong>Số tiền:</strong> ${formatCurrency(amount)}</p>
          <p><strong>Ngân hàng:</strong> ${selectedBank.toUpperCase()}</p>
          <p><strong>Số tài khoản:</strong> ${bankAccount}</p>
          <p>Bạn xác nhận thông tin rút tiền là <strong>chính xác</strong> và tự chịu trách nhiệm nếu có sai xót?</p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Xác nhận",
      cancelButtonText: "Hủy",
      reverseButtons: true,
    });
    if (!confirm.isConfirmed) return;
    try {
      setIsSubmitting(true);
      const res = await axios.post(`${Constants.DOMAIN_API}/wallets/transactions`, {
        amount, method: selectedBank, bank_account: bankAccount, bank_name: selectedBank, note, receiver_name: receiverName,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(res.data.message || "Đã gửi yêu cầu rút.");
      setWithdrawAmount(""); setSelectedBank(""); setBankAccount(""); setNote(""); setReceiverName("");
      fetchWalletInfo();
      fetchWalletDetails();
    } catch {
      toast.error("Rút tiền thất bại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const translateStatus = (status) => ({
    pending: "Chờ duyệt",
    approved: "Đã duyệt",
    rejected: "Từ chối",
    completed: "Hoàn thành",
  }[status] || status);

  const fetchBanks = async () => {
    try {
      const res = await axios.get("https://api.vietqr.io/v2/banks");
      if (res.data.code === "00") setBanks(res.data.data);
    } catch { }
  };

  const meId = (() => {
    try {
      const token = localStorage.getItem("token");
      const payload = decodeToken(token);
      return Number(payload?.id || payload?.user_id || 0);
    } catch {
      return 0;
    }
  })();

  function getTopBid(bids = []) {
    if (!Array.isArray(bids) || bids.length === 0) return null;
    return bids
      .slice()
      .sort((a, b) => Number(b.bidAmount) - Number(a.bidAmount) ||
        new Date(a.bidTime) - new Date(b.bidTime))[0];
  }

  function getAuctionInfo(variant, userId, itemCreatedAt) {
    const auctions = variant?.auctions || [];
    const won = auctions.filter(a =>
      a.status === "ended" &&
      (new Date(a.end_time).getTime() + 24 * 3600 * 1000) > new Date(itemCreatedAt).getTime() &&
      a.bids?.some(b => Number(b.user_id) === userId)
    );
    if (won.length === 0) return { isAuction: false };
    const target = won.reduce((best, cur) =>
      new Date(cur.end_time) > new Date(best.end_time) ? cur : best
    );
    const topBid = getTopBid(target.bids);
    return { isAuction: true, bidAmount: Number(topBid.bidAmount) };
  }

  useEffect(() => {
    const token = localStorage.getItem("token");
    axios
      .get(`${Constants.DOMAIN_API}/carts`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setCartItems(res.data.data))
      .catch(() => {/* lỗi load giỏ hàng */ });
  }, []);

  useEffect(() => {
    const found = cartItems.some(item => {
      const info = getAuctionInfo(item.variant, meId, item.created_at);
      return info.isAuction;
    });
    setHasActiveAuction(found);
  }, [cartItems]);

  return (
    <div className="min-h-screen bg-gray-100 pb-10">
      <header className="bg-orange-500 text-white px-6 py-6 rounded-b-3xl">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <span className="uppercase tracking-wide text-sm opacity-90">Tổng số dư&nbsp;&gt;</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setShowBalance(!showBalance)} className="p-0.5">
              {showBalance ? <FiEyeOff size={16} /> : <FiEye size={16} />}
            </button>
            <p className="text-sm font-medium leading-none">
              {showBalance ? formatCurrency(balance) : "*** ₫"}
            </p>
          </div>
        </div>
      </header>

      <section className="bg-white shadow-lg rounded-xl -mt-4 mx-4 sm:mx-auto max-w-2xl flex justify-center text-center">
        <ActionButton icon={<BiPlusCircle size={22} />} label="Nạp tiền" onClick={() => setShowTopUpInput(prev => !prev)} />
        <ActionButton icon={<BiMoneyWithdraw size={22} />} label="Rút tiền" onClick={() => setShowWithdrawSection(prev => !prev)} />

        <ActionButton
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M6 4h9l3 3v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="1.5" />
              <path d="M9 9h6M9 12h6M9 15h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          }
          label="Điều khoản - Điều kiện"
          onClick={() => setShowTerms(true)}
        />
      </section>

      {showTopUpInput && (
        <div className="mt-4 max-w-2xl mx-auto px-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-medium mb-2">Nhập số tiền cần nạp</h3>
            <input type="number" value={topUpAmount} onChange={(e) => setTopUpAmount(e.target.value)}
              placeholder="Nhập số tiền" className="border rounded px-3 py-2 w-full mb-3" />
            <div className="flex gap-2 justify-end">
              <button className="bg-gray-500 text-white px-4 py-2 rounded" onClick={() => {
                setShowTopUpInput(false); setTopUpAmount('');
              }}>Hủy</button>
              <button className="bg-[#1868D5] text-white px-4 py-2 rounded" onClick={handleTopUp} disabled={isSubmitting}>
                {isSubmitting ? "Đang xử lý..." : "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showWithdrawSection && (
        <div className="mt-4 max-w-2xl mx-auto px-4">
          <div className="bg-white p-4 rounded-lg shadow space-y-3">
            <label htmlFor="" className="block form-control">Tên người nhận<span className="text-red-600">*</span></label>
            <input
              type="text"
              placeholder="Tên người nhận"
              value={typeof receiverName === "string" ? receiverName : ""}
              onChange={e => setReceiverName(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />

            <label htmlFor="" className="block form-control">Số tiền cần rút <span className="text-red-600">*</span></label>
            <input
              type="number"
              value={withdrawAmount}
              onChange={e => setWithdrawAmount(e.target.value)}
              placeholder="Số tiền cần rút"
              className="w-full border rounded px-3 py-2"
            />
            <label htmlFor="" className="block form-control">Chọn ngân hàng <span className="text-red-600">*</span></label>
            <select
              value={selectedBank}
              onChange={e => setSelectedBank(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Chọn ngân hàng</option>
              {banks.map(bank => (
                <option key={bank.code} value={bank.code}>
                  {bank.shortName || bank.name}
                </option>
              ))}
            </select>
            <label htmlFor="" className="block form-control">Số tài khoản <span className="text-red-600">*</span></label>
            <input
              type="text"
              placeholder="Số tài khoản"
              value={bankAccount}
              onChange={e => setBankAccount(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
            <label htmlFor="" className="block form-control">Ghi chú</label>
            <textarea
              placeholder="Ghi chú (không bắt buộc)"
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />

            <div className="flex items-center space-x-2 mt-3">
              <input
                type="checkbox"
                id="agreeTerms"
                checked={agreeTerms}
                onChange={() => setAgreeTerms(!agreeTerms)}
                className="w-4 h-4"
              />
              <label htmlFor="agreeTerms" className="text-sm">
                Tôi đồng ý với{" "}
                <a target="_blank" className="text-blue-600 underline">
                  Điều khoản & Điều kiện
                </a>
              </label>
            </div>

            {hasActiveAuction && (
              <p className="text-red-600 text-sm">
                Bạn có đơn đấu giá đang chờ thanh toán nên không thể rút tiền.
              </p>
            )}

            <button
              className="w-full rounded px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              onClick={handleWithdraw}
              disabled={isSubmitting || hasPendingWithdraw || hasActiveAuction || !agreeTerms}
            >
              {hasActiveAuction
                ? "Bạn có đơn đấu giá đang chờ thanh toán nên không thể rút tiền"
                : hasPendingWithdraw
                  ? "Bạn đã gửi yêu cầu rút tiền trước đó và đang chờ duyệt..."
                  : isSubmitting
                    ? "Đang xử lý..."
                    : "Rút tiền"}
            </button>
          </div>
        </div>
      )}

      <div className="mt-10 max-w-4xl mx-auto px-4">
        <h3 className="text-2xl font-bold mb-6 text-center text-gray-800">Lịch sử giao dịch</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[{
            label: "Rút tiền", list: withdraws, total: totalWithdraws, type: "withdraw"
          }, {
            label: "Hoàn tiền", list: refunds, total: totalRefunds, type: "refund"
          }, {
            label: "Nạp tiền", list: topups, total: totalTopups, type: "topup"
          }].map(({ label, list, total, type }) => (
            <div key={type} className="bg-white rounded-xl shadow-md border border-gray-200">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-800">{label} ({total})</h3>
              </div>
              <div className="divide-y">
                {list.length === 0 ? (
                  <p className="text-gray-500 text-sm py-6 text-center">Không có lịch sử {label.toLowerCase()}</p>
                ) : (
                  list.map((item, idx) => {
                    const stt = (currentPage - 1) * recordsPerPage + idx + 1;
                    return (
                      <AccordionItem key={`${type}-${item.id || idx}`}
                        title={
                          <div className="flex items-center justify-between text-sm font-medium">
                            <span className="text-gray-700">#{stt}</span>
                            <span className="text-gray-600">{formatCurrency(item.amount)}</span>
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${item.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                              item.status === "approved" || item.status === "completed" ? "bg-green-100 text-green-700" :
                                item.status === "rejected" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"
                              }`}>
                              {translateStatus(item.status)}
                            </span>
                          </div>
                        }
                      >
                        <div className="text-sm text-gray-700 space-y-2 mt-2">
                          <p><strong>Ngày tạo: </strong>
                            {(() => {
                              const date = new Date(item.created_at);
                              const pad = (n) => String(n).padStart(2, '0');
                              const h = pad(date.getUTCHours());
                              const m = pad(date.getUTCMinutes());
                              const s = pad(date.getUTCSeconds());
                              const d = pad(date.getUTCDate());
                              const mo = pad(date.getUTCMonth() + 1);
                              const y = date.getUTCFullYear();
                              return `${h}:${m}:${s} ${d}/${mo}/${y}`;
                            })()} </p>
                          {type === "withdraw" && (
                            <>
                              <p><strong>Tên người nhận:</strong> {item.receiver_name}</p>
                              <p><strong>Ngân hàng:</strong> {item.bank_name}</p>
                              <p><strong>Số tài khoản:</strong> {item.bank_account}</p>
                              <p><strong>Ghi chú:</strong> {item.note}</p>
                              {item.status === "rejected" && item.cancellation_reason && (
                                <p className="mt-1">
                                  <strong>Lý do từ chối:  </strong>{item.cancellation_reason}
                                </p>
                              )}
                            </>
                          )}
                          {type === "refund" && (
                            <>
                              <p><strong>Mã đơn hàng:</strong> {item.order?.order_code || "—"}</p>
                              <p><strong>Phương thức thanh toán:</strong> {item.order?.payment_method || "—"}</p>
                              {item.order?.orderDetails?.map((d, i) => (
                                <p key={i}>
                                  <strong>Sản phẩm:</strong> {d.variant?.product?.name || "—"} - <strong>SKU:</strong> {d.variant.sku || "—"}
                                </p>
                              ))}
                            </>
                          )}
                          {type === "topup" && (
                            <>
                              <p><strong>Phương thức:</strong> {item.method?.toUpperCase() || "—"}</p>
                              <p><strong>Thời gian thực hiện:</strong>
                                {(() => {
                                  const date = new Date(item.created_at);
                                  const pad = (n) => String(n).padStart(2, '0');
                                  const h = pad(date.getUTCHours());
                                  const m = pad(date.getUTCMinutes());
                                  const s = pad(date.getUTCSeconds());
                                  const d = pad(date.getUTCDate());
                                  const mo = pad(date.getUTCMonth() + 1);
                                  const y = date.getUTCFullYear();
                                  return `${h}:${m}:${s} ${d}/${mo}/${y}`;
                                })()} </p>
                            </>
                          )}
                        </div>
                      </AccordionItem>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>

        {totalPages && (
          <div className="flex justify-center mt-6">
            <div className="flex items-center space-x-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(1)}
                className="px-2 py-1 border rounded disabled:opacity-50"
              >
                <FaAngleDoubleLeft />
              </button>
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="px-2 py-1 border rounded disabled:opacity-50"
              >
                <FaChevronLeft />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((page) => page >= currentPage - 2 && page <= currentPage + 2)
                .map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 border rounded text-sm flex items-center justify-center ${page === currentPage
                      ? "bg-blue-600 text-white"
                      : "bg-white hover:bg-blue-100"
                      }`}
                  >
                    {page}
                  </button>
                ))}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-2 py-1 border rounded disabled:opacity-50"
              >
                <FaChevronRight />
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(totalPages)}
                className="px-2 py-1 border rounded disabled:opacity-50"
              >
                <FaAngleDoubleRight />
              </button>
            </div>
          </div>
        )}
      </div>
      {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}

    </div>
  );
}

function ActionButton({ icon, label, onClick }) {
  return (
    <button className="flex flex-col items-center gap-1 py-5 hover:text-orange-500 w-full" onClick={onClick}>
      <div className="w-11 h-11 flex items-center justify-center bg-orange-100 rounded-full">{icon}</div>
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}

function TermsModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-[9999]">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* modal */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* header */}
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h2 className="text-lg font-bold">Điều khoản &amp; Điều kiện sử dụng Ví tiền</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-red-700 text-xl leading-none"
              aria-label="Đóng"
              title="Đóng"
            >
              ×
            </button>
          </div>

          {/* body */}
          <div className="p-6 max-h-[70vh] overflow-y-auto text-sm leading-6 text-gray-800">
            <p className="mb-4">
              Bằng việc kích hoạt và sử dụng Ví tiền, bạn xác nhận đã đọc, hiểu và đồng ý bị ràng buộc bởi các điều khoản - điều kiện bên dưới.
              Tài liệu này có thể được cập nhật theo thời gian; phiên bản mới sẽ thay thế phiên bản cũ kể từ khi công bố.
            </p>

            <h3 className="font-semibold text-base mt-4 mb-2">1. Ví tiền là số tiền ảo trong tài khoản của bạn, dùng để:</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Nạp tiền vào.</li>
              <li>Thanh toán khi mua hàng.</li>
              <li>Rút tiền về ngân hàng.</li>
              <li>Nhận hoàn tiền khi bạn xác nhận hủy đơn.</li>
            </ul>

            <h3 className="font-semibold text-base mt-4 mb-2">2. Nạp tiền</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Cách nạp: </strong>Chuyển khoản ngân hàng (Stripe).</li>
              <li><strong>Thời gian xử lý: </strong>Thường cộng tiền ngay.</li>
              <li><strong>Phí: </strong>Hoàn toàn miễn phí.</li>
              <li>Nếu giao dịch đã trừ tiền từ ngân hàng chưa cộng vào Ví, vui lòng liên hệ chúng tôi để được hỗ trợ ngay kèm hình ảnh minh chứng; chúng tôi sẽ kiểm tra và xử lý ngay.</li>
            </ul>

            <h3 className="font-semibold text-base mt-4 mb-2">3. Rút tiền</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Điều kiện:</strong> Đảm bảo số dư còn đủ; không có yêu cầu rút tiền nào trước đó đang chờ duyệt và không có đơn hàng đấu giá nào đang chờ thanh toán.</li>
              <li><strong>Cách rút:</strong> Chuyển khoản trực tiếp về tài khoản ngân hàng bạn đã cung cấp.</li>
              <li><strong>Thời gian xử lý:</strong> Thường trong giờ làm việc, có thể lâu hơn nếu cần kiểm tra.</li>
              <li><strong>Phí:</strong> Hoàn toàn miễn phí.</li>
              <li><strong>Trách nhiệm thông tin:</strong> Người dùng sẽ tự chịu mọi trách nhiệm về tính chính xác của ngân hàng/số tài khoản/tên người nhận do người dùng đã cung cấp.</li>
              <li>Nếu giao dịch đã trừ tiền vào Ví nhưng bạn chưa nhận được, vui lòng liên hệ chúng tôi để được hỗ trợ ngay kèm hình ảnh minh chứng; chúng tôi sẽ kiểm tra và xử lý ngay.</li>
            </ul>

            <h3 className="font-semibold text-base mt-4 mb-2">4. Hoàn tiền</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Khi nào được hoàn tiền:</strong> Khi bạn hủy đơn, sản phẩm lỗi do từ phía nhà cung cấp.</li>
              <li><strong>Cách hoàn:</strong> Hoàn vào ví của bạn (mặc định).</li>
              <li><strong>Thời gian xử lý:</strong> Thông thường trong giờ làm việc; có thể lâu hơn nếu cần kiểm tra.</li>
              <li><strong>Phí:</strong> Hoàn toàn miễn phí.</li>
            </ul>

            <h3 className="font-semibold text-base mt-4 mb-2">5. Trách nhiệm của bạn</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Cung cấp thông tin chính xác (tên người nhận, tên ngân hàng, số tài khoản).</li>
              <li>Không dùng ví cho mục đích gian lận hoặc bất hợp pháp.</li>
            </ul>

            <h3 className="font-semibold text-base mt-4 mb-2">6. Trách nhiệm của chúng tôi</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Bảo mật thông tin của bạn.</li>
              <li>Xử lý giao dịch đúng thời gian cam kết.</li>
              <li>Hỗ trợ khi bạn gặp sự cố.</li>
            </ul>

            <h3 className="font-semibold text-base mt-4 mb-2">7. Lưu ý khác</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Điều khoản có thể thay đổi, hệ thống sẽ cập nhật nếu có bản mới.</li>
              <li>Nếu xảy ra tranh chấp không xử lý được sẽ giải quyết theo pháp luật Việt Nam.</li>
            </ul>

            <h3 className="font-semibold text-base mt-4 mb-2">8. Liên hệ</h3>
            <p>
              Nếu cần hỗ trợ hoặc có bất kỳ thắc mắc nào, vui lòng liên hệ bộ phận Chăm sóc khách hàng của chúng tôi qua:
            </p>
            <ul className="list-disc list-inside mt-2">
              <li>Email: <a href="mailto:phuc628780@gmail.com" className="text-blue-600 underline">phuc628780@gmail.com</a></li>
              <li>Điện thoại: <a href="tel:0379169731" className="text-blue-600 underline">0379 169 731</a></li>
            </ul>

            <p className="text-xs text-gray-500 mt-6">
              *Tài liệu này mang tính tham khảo và có thể cần điều chỉnh để phù hợp chính sách nội bộ và quy định pháp luật hiện hành.
            </p>
          </div>

          {/* footer */}
          <div className="px-6 py-4 border-t flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
