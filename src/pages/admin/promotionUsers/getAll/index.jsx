import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import Constants from "../../../../Constants.jsx";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { FaAngleDoubleLeft, FaAngleDoubleRight, FaChevronLeft, FaChevronRight, FaTimes } from "react-icons/fa";
import Swal from 'sweetalert2';
import Select from "react-select";
import { FaUserPlus } from 'react-icons/fa';

function PromotionList() {
  const [userPage, setUserPage] = useState(1);
  const [promotions, setPromotions] = useState([]);
  const [selectedPromotionId, setSelectedPromotionId] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState([]);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailContent, setEmailContent] = useState("");
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [loadingPromotions, setLoadingPromotions] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [promotionPage, setPromotionPage] = useState(1);
  const [promotionSearchTerm, setPromotionSearchTerm] = useState("");
  const [promotionSearchInput, setPromotionSearchInput] = useState("");
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [usersNotInPromo, setUsersNotInPromo] = useState([]);
  const [selectedUsersToAdd, setSelectedUsersToAdd] = useState([]);
  const [selectedPromoForAddUser, setSelectedPromoForAddUser] = useState(null);
  const [totalCustomers, setTotalCustomers] = useState(0);

  const ITEMS_PER_PAGE = 10;
  const PROMOTIONS_PER_PAGE = 5;
  const MAX_IMAGES = 3;

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const handlePromotionPageChange = (page) => {
    if (page < 1 || page > totalPromotionPages) return;
    setPromotionPage(page);
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  useEffect(() => {
    if (selectedPromotionId) {
      fetchCustomersByPromotion(selectedPromotionId);
    } else {
      setCustomers([]);
      setTotalCustomers(0);
    }
    setSelectedCustomerIds([]);
    setCurrentPage(1);
    setSearchTerm("");
    setSearchInput("");
  }, [selectedPromotionId]);

  const openAddUserModal = async (promotionId) => {
    try {
      const res = await axios.get(`${Constants.DOMAIN_API}/admin/users/not-in-promotion`, {
        params: { promotionId },
      });
      const userList = res.data.data.map((u) => ({ value: u.id, label: `${u.name} (${u.email})` }));
      setUsersNotInPromo(userList);
      setSelectedPromoForAddUser(promotionId);
      setSelectedUsersToAdd([]);
      setIsAddUserModalOpen(true);
    } catch (error) {
      toast.error("Không thể lấy danh sách người dùng chưa được áp dụng mã.");
    }
  };

  const handleAddUsersToPromotion = async () => {
    if (!selectedPromoForAddUser || selectedUsersToAdd.length === 0) return;
    try {
      const userIds = selectedUsersToAdd.map((u) => u.value);
      const res = await axios.post(`${Constants.DOMAIN_API}/admin/promotionusers/add`, {
        promotionId: selectedPromoForAddUser,
        userIds,
      });

      toast.success(`Đã thêm ${res.data.addedCount || userIds.length} người dùng vào mã giảm!`);
      setIsAddUserModalOpen(false);
      setSelectedUsersToAdd([]);
      // Luôn làm mới danh sách khách hàng
      fetchCustomersByPromotion(selectedPromoForAddUser);
    } catch {
      toast.error("Không thể thêm người dùng.");
    }
  };

  const fetchPromotions = async () => {
    setLoadingPromotions(true);
    try {
      const res = await axios.get(`${Constants.DOMAIN_API}/admin/promotions/list`);
      const data = res.data.data || [];
      const specialPromotions = data.filter((promo) => promo.special_promotion);
      setPromotions(specialPromotions);
      if (specialPromotions.length > 0) setSelectedPromotionId(specialPromotions[0].id);
    } catch (err) {
      toast.error("Không thể tải danh sách mã giảm.");
    } finally {
      setLoadingPromotions(false);
    }
  };

  const fetchCustomersByPromotion = async (promotionId) => {
    setLoadingCustomers(true);
    try {
      let allCustomers = [];
      let page = 1;
      let totalPages = 1;

      while (page <= totalPages) {
        const res = await axios.get(`${Constants.DOMAIN_API}/admin/promotionusers/list`, {
          params: { promotionId, page, limit: 50 },
        });
        allCustomers = [...allCustomers, ...res.data.data];
        totalPages = res.data.pagination.totalPages;
        setTotalCustomers(res.data.pagination.totalRecords);
        page += 1;
      }
      setCustomers(allCustomers);
      console.log('Total customers fetched:', allCustomers.length);
    } catch {
      toast.error("Không thể tải danh sách khách hàng.");
      setCustomers([]);
      setTotalCustomers(0);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const filteredPromotions = useMemo(() => {
    const sortOrder = { active: 1, inactive: 2, expired: 3 };
    return promotions
      .filter(
        (promo) =>
          promo.name?.toLowerCase().includes(promotionSearchTerm.toLowerCase()) ||
          promo.code?.toLowerCase().includes(promotionSearchTerm.toLowerCase())
      )
      .sort((a, b) => sortOrder[a.status] - sortOrder[b.status]);
  }, [promotions, promotionSearchTerm]);

  const totalPromotionPages = Math.ceil(filteredPromotions.length / PROMOTIONS_PER_PAGE);
  const paginatedPromotions = useMemo(() => {
    const start = (promotionPage - 1) * PROMOTIONS_PER_PAGE;
    return filteredPromotions.slice(start, start + PROMOTIONS_PER_PAGE);
  }, [filteredPromotions, promotionPage]);

  const filteredCustomers = useMemo(() => {
    return customers.filter(
      (cus) =>
        cus.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cus.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [customers, searchTerm]);

  const totalPages = Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE);
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCustomers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCustomers, currentPage]);

  const handleCheckboxChange = (id) => {
    setSelectedCustomerIds((prev) =>
      prev.includes(id) ? prev.filter((cid) => cid !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (e) => {
    const idsOnPage = paginatedCustomers
      .filter((c) => !c.promotions.some((p) => p.promotionId === selectedPromotionId && p.used && p.isSpecialPromotion))
      .map((c) => c.id);
    if (e.target.checked) {
      setSelectedCustomerIds((prev) => [...new Set([...prev, ...idsOnPage])]);
    } else {
      setSelectedCustomerIds((prev) => prev.filter((id) => !idsOnPage.includes(id)));
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > MAX_IMAGES) {
      toast.error(`Chỉ được tải lên tối đa ${MAX_IMAGES} ảnh.`);
      return;
    }
    if (files.length > 0) {
      files.forEach((file) => {
        if (!file.type.startsWith('image/')) {
          toast.error(`File ${file.name} không phải hình ảnh.`);
          return;
        }
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`File ${file.name} vượt quá 5MB.`);
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          setImages((prev) => [...prev, reader.result]);
          setImagePreviews((prev) => [...prev, reader.result]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleRemoveImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    if (currentImageIndex >= imagePreviews.length - 1 && currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => Math.min(prev + 1, imagePreviews.length - 1));
  };

  const handleSendEmails = async (useDefault = false) => {
    let subject = emailSubject;
    let content = emailContent;
    if (useDefault) {
      if (!selectedPromotion) return;
      subject = `Khuyến mãi: ${selectedPromotion.name || "Mã không tên"}`;
      content = `<p>Bạn nhận được khuyến mãi đặc biệt: <strong>${selectedPromotion.name}</strong></p>`;
    }

    if (!subject.trim() || !content.trim()) {
      toast.warning("Vui lòng nhập tiêu đề và nội dung email.");
      return;
    }
    if (selectedCustomerIds.length === 0) {
      toast.warning("Vui lòng chọn ít nhất một khách hàng.");
      return;
    }

    if (selectedPromotion.status === 'expired' || selectedPromotion.status === 'inactive') {
      toast.error("Không thể gửi email vì mã giảm giá không hoạt động.");
      return;
    }

    setSendingEmail(true);
    try {
      await axios.post(`${Constants.DOMAIN_API}/admin/send-promotion-emails`, {
        customerIds: selectedCustomerIds,
        subject,
        content,
        promotionId: selectedPromotionId,
        images: images.length > 0 ? images : null,
      });

      toast.success("Gửi email thành công!");
      setCustomers((prev) =>
        prev.map((c) =>
          selectedCustomerIds.includes(c.id)
            ? {
              ...c,
              promotions: c.promotions.map((p) =>
                p.promotionId === selectedPromotionId
                  ? { ...p, emailSent: true }
                  : p
              ),
            }
            : c
        )
      );
      setSelectedCustomerIds([]);
      setEmailSubject("");
      setEmailContent("");
      setImages([]);
      setImagePreviews([]);
      setCurrentImageIndex(0);
      setIsEmailModalOpen(false);
    } catch {
      toast.error("Không thể gửi email.");
    } finally {
      setSendingEmail(false);
    }
  };

  const handleQuickSendEmail = async (customerId) => {
    if (!selectedPromotionId) return;
    const customer = customers.find((c) => c.id === customerId);
    if (!customer) return;

    if (selectedPromotion.status === 'expired' || selectedPromotion.status === 'inactive') {
      toast.error("Không thể gửi email vì mã giảm giá không hoạt động.");
      return;
    }

    const promotionStatus = customer.promotions.find((p) => p.promotionId === selectedPromotionId);
    if (promotionStatus?.used) {
      toast.error("Không thể gửi email vì khách hàng đã sử dụng mã giảm giá này.");
      return;
    }

    const result = await Swal.fire({
      title: 'Xác nhận gửi mail',
      text: `Gửi mail khuyến mãi tới ${customer.name} (${customer.email})?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Gửi',
      cancelButtonText: 'Hủy',
    });

    if (!result.isConfirmed) return;

    setSendingEmail(true);
    try {
      await axios.post(`${Constants.DOMAIN_API}/admin/send-promotion-emails`, {
        customerIds: [customerId],
        subject: `Khuyến mãi: ${selectedPromotion?.name || ""}`,
        content: `<p>Bạn nhận được khuyến mãi đặc biệt: <strong>${selectedPromotion?.name}</strong></p>`,
        promotionId: selectedPromotionId,
      });
      toast.success(`Đã gửi mail cho ${customer.email}`);
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === customerId
            ? {
              ...c,
              promotions: c.promotions.map((p) =>
                p.promotionId === selectedPromotionId
                  ? { ...p, emailSent: true }
                  : p
              ),
            }
            : c
        )
      );
    } catch (err) {
      toast.error("Không thể gửi email.");
    } finally {
      setSendingEmail(false);
    }
  };

  const selectedPromotion = promotions.find((p) => p.id === selectedPromotionId);
  const promotionTitle = selectedPromotion
    ? `cho mã giảm (${selectedPromotion.name || "Mã không tên"})`
    : "";

  const handleSearch = () => {
    setSearchTerm(searchInput.trim());
    setCurrentPage(1);
  };

  const handlePromotionSearch = () => {
    setPromotionSearchTerm(promotionSearchInput.trim());
    setPromotionPage(1);
  };

  const handlePromotionKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handlePromotionSearch();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  const quillModules = {
    toolbar: [
      [{ header: [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link', 'image'],
      [{ align: [] }],
      ['clean'],
    ],
  };

  return (
    <div className="container mx-auto p-6 bg-white shadow rounded-lg flex gap-8 min-h-[600px]">
      <div className="w-1/3 border rounded-lg shadow-sm p-4 flex flex-col">
        <h3 className="text-xl font-semibold mb-4 text-blue-700 border-b pb-2">
          Danh sách mã giảm giá đặc biệt
        </h3>
        <div className="flex mb-3 gap-2">
          <input
            type="text"
            value={promotionSearchInput}
            onChange={(e) => setPromotionSearchInput(e.target.value)}
            onKeyDown={handlePromotionKeyDown}
            className="flex-grow border border-gray-300 rounded py-2 px-4 text-gray-700 leading-tight focus:ring-2 focus:ring-blue-500"
            placeholder="Tìm kiếm theo tên hoặc mã..."
          />
          <button
            onClick={handlePromotionSearch}
            className="bg-blue-900 hover:bg-blue-800 text-white px-4 py-1.5 rounded"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1010.5 3a7.5 7.5 0 006.15 13.65z" />
            </svg>
          </button>
        </div>
        {loadingPromotions ? (
          <div className="text-center text-gray-500 mt-10">Đang tải...</div>
        ) : filteredPromotions.length === 0 ? (
          <div className="text-center text-gray-400 mt-10">Không có mã giảm đặc biệt.</div>
        ) : (
          <>
            <ul className="overflow-auto max-h-[460px] custom-scrollbar pr-2">
              {paginatedPromotions.map((promo) => (
                <li
                  key={promo.id}
                  onClick={() => setSelectedPromotionId(promo.id)}
                  className={`cursor-pointer p-3 mb-2 rounded-lg transition-colors ${selectedPromotionId === promo.id ? 'bg-blue-100 shadow' : 'hover:bg-blue-50'
                    } ${promo.status === 'expired' || promo.status === 'inactive' ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-base text-blue-900">{promo.name || 'Mã không tên'}</div>
                      <div className="text-sm text-gray-600">
                        {promo.discount_value !== undefined
                          ? promo.discount_type === 'percentage'
                            ? `Giảm ${promo.discount_value}%`
                            : `Giảm ${promo.discount_value.toLocaleString()}đ`
                          : 'Chưa xác định'}
                        <div className="text-xs text-gray-500">
                          Trạng thái:{' '}
                          {promo.status === 'active'
                            ? 'đang diễn ra'
                            : promo.status === 'expired'
                              ? 'hết hạn'
                              : promo.status === 'inactive'
                                ? 'không hoạt động'
                                : promo.status}
                          {promo.code && (
                            <div className="text-xs text-blue-600">
                              Mã: <span className="font-medium">{promo.code}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <button
                        className="text-blue-700 hover:text-purple-900"
                        onClick={(e) => {
                          e.stopPropagation();
                          openAddUserModal(promo.id);
                        }}
                        disabled={promo.status !== 'active'}
                        title="Thêm người dùng"
                      >
                        <FaUserPlus className="inline-block text-base" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="flex justify-center mt-4">
              <div className="flex items-center space-x-1">
                <button
                  disabled={promotionPage === 1}
                  onClick={() => setPromotionPage(1)}
                  className="px-2 py-1 border rounded-md bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-50 text-sm"
                >
                  <FaAngleDoubleLeft />
                </button>
                <button
                  disabled={promotionPage === 1}
                  onClick={() => setPromotionPage((prev) => prev - 1)}
                  className="px-2 py-1 border rounded-md bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-50 text-sm"
                >
                  <FaChevronLeft />
                </button>
                {[...Array(totalPromotionPages)].map((_, i) => {
                  const page = i + 1;
                  if (page >= promotionPage - 1 && page <= promotionPage + 1) {
                    return (
                      <button
                        key={page}
                        onClick={() => setPromotionPage(page)}
                        className={`px-3 py-1 border rounded-md text-sm ${page === promotionPage ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
                          }`}
                      >
                        {page}
                      </button>
                    );
                  }
                  return null;
                })}
                <button
                  disabled={promotionPage === totalPromotionPages}
                  onClick={() => setPromotionPage((prev) => prev + 1)}
                  className="px-2 py-1 border rounded-md bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-50 text-sm"
                >
                  <FaChevronRight />
                </button>
                <button
                  disabled={promotionPage === totalPromotionPages}
                  onClick={() => setPromotionPage(totalPromotionPages)}
                  className="px-2 py-1 border rounded-md bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-50 text-sm"
                >
                  <FaAngleDoubleRight />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="w-2/3 flex flex-col">
        <div className="flex justify-between items-start mb-4 flex-wrap sm:flex-nowrap gap-2">

          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-semibold text-gray-800 break-words">
              Danh sách khách hàng {promotionTitle}
            </h3>
          </div>

          <div className="flex gap-2 flex-shrink-0">
            <button
              className={`bg-blue-600 text-white px-3 py-2 rounded-md font-semibold transition-opacity ${selectedCustomerIds.length === 0 ||
                selectedPromotion?.status === 'expired' ||
                selectedPromotion?.status === 'inactive'
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-blue-700'
                }`}
              onClick={() => handleSendEmails(true)}
              disabled={
                selectedCustomerIds.length === 0 ||
                selectedPromotion?.status === 'expired' ||
                selectedPromotion?.status === 'inactive'
              }
            >
              Gửi Email ({selectedCustomerIds.length})
            </button>
            <button
              className={`bg-green-600 text-white px-3 py-2 rounded-md font-semibold transition-opacity ${selectedCustomerIds.length === 0 ||
                selectedPromotion?.status === 'expired' ||
                selectedPromotion?.status === 'inactive'
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-green-700'
                }`}
              onClick={() => setIsEmailModalOpen(true)}
              disabled={
                selectedCustomerIds.length === 0 ||
                selectedPromotion?.status === 'expired' ||
                selectedPromotion?.status === 'inactive'
              }
            >
              Soạn Email ({selectedCustomerIds.length})
            </button>
          </div>
        </div>

        <div className="flex mb-3 gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-grow border border-gray-300 rounded py-2 px-4 text-gray-700 leading-tight focus:ring-2 focus:ring-blue-500"
            placeholder="Tìm kiếm theo tên hoặc email..."
          />
          <button onClick={handleSearch} className="bg-blue-900 hover:bg-blue-800 text-white px-4 py-1.5 rounded">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1010.5 3a7.5 7.5 0 006.15 13.65z" />
            </svg>
          </button>
        </div>
        {loadingCustomers ? (
          <div className="text-center text-gray-500 mt-10">Đang tải...</div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center text-gray-400 mt-16">Không tìm thấy khách hàng.</div>
        ) : (
          <>
            <div className="overflow-auto border rounded-lg shadow-sm">
              <table className="min-w-full divide-y divide-gray-200 text-sm table-fixed">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="p-3 text-center w-12 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={paginatedCustomers
                          .filter((c) => !c.promotions.some((p) => p.promotionId === selectedPromotionId && p.used && p.isSpecialPromotion))
                          .every((c) => selectedCustomerIds.includes(c.id))}
                        onChange={handleSelectAll}
                        disabled={selectedPromotion?.status === 'expired' || selectedPromotion?.status === 'inactive'}
                      />
                    </th>
                    <th className="border p-2 w-10 whitespace-nowrap">#</th>
                    <th className="border p-2 whitespace-nowrap">Tên</th>
                    <th className="border p-2 whitespace-nowrap">Email</th>
                    <th className="border p-2 whitespace-nowrap">Số điện thoại</th>
                    <th className="border p-2 w-32 whitespace-nowrap">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedCustomers.map((cus, index) => (
                    <tr key={cus.id} className={`hover:bg-gray-50 ${selectedCustomerIds.includes(cus.id) ? 'bg-blue-50' : ''}`}>
                      <td className="p-1 text-center">
                        <input
                          type="checkbox"
                          checked={selectedCustomerIds.includes(cus.id)}
                          onChange={() => handleCheckboxChange(cus.id)}
                          disabled={
                            selectedPromotion?.status === 'expired' ||
                            selectedPromotion?.status === 'inactive' ||
                            cus.promotions.some((p) => p.promotionId === selectedPromotionId && p.used && p.isSpecialPromotion)
                          }
                        />
                      </td>
                      <td className="border p-1 text-center">{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
                      <td className="border p-2 text-center">{cus.name}</td>
                      <td className="border p-2 text-center">{cus.email}</td>
                      <td className="border p-2 text-center">{cus.phone}</td>
                      <td className="border p-1 text-center">
                        {cus.promotions.some((p) => p.promotionId === selectedPromotionId && p.used && p.isSpecialPromotion) ? (
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">Đã sử dụng</span>
                        ) : cus.promotions.some((p) => p.promotionId === selectedPromotionId && p.emailSent) ? (
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Đã gửi</span>
                        ) : (
                          <button
                            onClick={() => handleQuickSendEmail(cus.id)}
                            className={`px-3 py-1 rounded text-sm text-white ${selectedPromotion?.status === 'expired' ||
                              selectedPromotion?.status === 'inactive' ||
                              cus.promotions.some((p) => p.promotionId === selectedPromotionId && p.used && p.isSpecialPromotion)
                              ? 'bg-gray-500 cursor-not-allowed'
                              : 'bg-blue-500 hover:bg-blue-600'
                              }`}
                            disabled={
                              selectedPromotion?.status === 'expired' ||
                              selectedPromotion?.status === 'inactive' ||
                              cus.promotions.some((p) => p.promotionId === selectedPromotionId && p.used && p.isSpecialPromotion)
                            }
                          >
                            Gửi email
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-center mt-6">
              <div className="flex items-center space-x-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(1)}
                  className="px-2 py-1 border rounded-md bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-50 text-sm"
                >
                  <FaAngleDoubleLeft />
                </button>
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => prev - 1)}
                  className="px-2 py-1 border rounded-md bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-50 text-sm"
                >
                  <FaChevronLeft />
                </button>
                {[...Array(totalPages)].map((_, i) => {
                  const page = i + 1;
                  if (page >= currentPage - 1 && page <= currentPage + 1) {
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 border rounded-md text-sm ${page === currentPage ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
                          }`}
                      >
                        {page}
                      </button>
                    );
                  }
                  return null;
                })}
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                  className="px-2 py-1 border rounded-md bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-50 text-sm"
                >
                  <FaChevronRight />
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                  className="px-2 py-1 border rounded-md bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-50 text-sm"
                >
                  <FaAngleDoubleRight />
                </button>
              </div>
            </div>
          </>
        )}

        {isEmailModalOpen && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-60 flex items-center justify-center z-50">
            <div className="bg-gradient-to-b from-white to-gray-50 rounded-xl shadow-2xl w-full max-w-3xl p-8 max-h-[90vh] overflow-auto">
              <h3 className="text-2xl font-bold mb-6 text-gray-800">Soạn email {promotionTitle}</h3>
              <div className="mb-6 relative">
                <label className="block text-sm font-medium text-gray-700 mb-1 transition-all duration-300">Tiêu đề</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 disabled:bg-gray-100"
                  placeholder="Nhập tiêu đề email"
                  disabled={selectedPromotion?.status === 'expired' || selectedPromotion?.status === 'inactive'}
                />
              </div>
              <div className="mb-12">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung</label>
                <ReactQuill
                  theme="snow"
                  value={emailContent}
                  onChange={setEmailContent}
                  className="h-64 bg-white rounded-lg border border-gray-300"
                  modules={quillModules}
                  readOnly={selectedPromotion?.status === 'expired' || selectedPromotion?.status === 'inactive'}
                />
              </div>
              <div className="mb-8">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="w-full p-3 border border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700 transition-all duration-300 disabled:bg-gray-100"
                  disabled={selectedPromotion?.status === 'expired' || selectedPromotion?.status === 'inactive'}
                />
                {imagePreviews.length > 0 && (
                  <div className="mt-4 relative flex items-center justify-center">
                    <button
                      onClick={handlePrevImage}
                      disabled={currentImageIndex === 0}
                      className="absolute left-0 p-2 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 disabled:opacity-50"
                    >
                      <FaChevronLeft size={16} />
                    </button>
                    <div className="relative">
                      <img
                        src={imagePreviews[currentImageIndex]}
                        alt={`Preview ${currentImageIndex}`}
                        className="max-w-full h-40 object-contain rounded-lg shadow-md"
                      />
                      <button
                        onClick={() => handleRemoveImage(currentImageIndex)}
                        className="absolute top-1 right-1 bg-red-600 text-white p-1.5 rounded-full hover:bg-red-700 transition-all duration-300"
                      >
                        <FaTimes size={12} />
                      </button>
                    </div>
                    <button
                      onClick={handleNextImage}
                      disabled={currentImageIndex === imagePreviews.length - 1}
                      className="absolute right-0 p-2 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 disabled:opacity-50"
                    >
                      <FaChevronRight size={16} />
                    </button>
                    <div className="absolute bottom-2 text-sm text-gray-600">
                      {currentImageIndex + 1}/{imagePreviews.length}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-4 mt-8">
                <button
                  className="px-6 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition-all duration-300 disabled:opacity-50 font-medium"
                  onClick={() => setIsEmailModalOpen(false)}
                  disabled={sendingEmail}
                >
                  Hủy bỏ
                </button>
                <button
                  className={`px-6 py-2 rounded-lg text-white font-medium transition-all duration-300 ${selectedPromotion?.status === 'expired' || selectedPromotion?.status === 'inactive' || sendingEmail
                    ? 'bg-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  onClick={() => handleSendEmails(false)}
                  disabled={selectedPromotion?.status === 'expired' || selectedPromotion?.status === 'inactive' || sendingEmail}
                >
                  {sendingEmail ? 'Đang gửi...' : 'Gửi email'}
                </button>
              </div>
            </div>
          </div>
        )}
        {isAddUserModalOpen && (
          <div className="fixed inset-0 backdrop-blur-sm bg-white/30 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
              <h2 className="text-lg font-semibold mb-4">Chọn người dùng để thêm vào mã</h2>
              <div className="flex items-center mb-3">
                <input
                  type="checkbox"
                  id="selectAllUsers"
                  className="mr-2"
                  checked={selectedUsersToAdd.length === usersNotInPromo.length && usersNotInPromo.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedUsersToAdd(usersNotInPromo);
                    } else {
                      setSelectedUsersToAdd([]);
                    }
                  }}
                />
                <label htmlFor="selectAllUsers" className="text-sm text-gray-700">Chọn tất cả người dùng</label>
              </div>
              <Select
                isMulti
                options={usersNotInPromo}
                value={selectedUsersToAdd}
                onChange={setSelectedUsersToAdd}
                placeholder="Chọn người dùng..."
              />
              <div className="flex justify-end mt-4 gap-3">
                <button
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
                >
                  Hủy
                </button>
                <button
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  disabled={selectedUsersToAdd.length === 0}
                  onClick={handleAddUsersToPromotion}
                >
                  Thêm
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PromotionList;