import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Constants from "../../../../Constants";
import { toast } from "react-toastify";
import axios from "axios";
import Swal from "sweetalert2";
import {
  FaTrashAlt,
  FaEdit,
  FaAngleDoubleLeft, FaAngleDoubleRight, FaChevronLeft, FaChevronRight
} from "react-icons/fa";

function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState({});
  const [addresses, setAddresses] = useState([]);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [selectedNewStatus, setSelectedNewStatus] = useState("");
  const [reasonOption, setReasonOption] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);

  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedWard, setSelectedWard] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [addressLimit] = useState(5);

  useEffect(() => {
    fetchUserDetail();
  }, [currentPage]);


  const fetchUserDetail = async () => {
    try {
      const res = await axios.get(
        `${Constants.DOMAIN_API}/admin/user/${id}?page=${currentPage}&limit=${addressLimit}`
      );
      if (res.data.data) {
        setUser(res.data.data);
        setAddresses(res.data.data.addresses || []);
        const pag = res.data.data.addressPagination;
        setTotalPages(pag?.totalPages || 1);
      } else {
        setUser({});
        setAddresses([]);
      }
    } catch (error) {
      console.error("Lỗi khi lấy chi tiết người dùng:", error);
      toast.error("Không thể lấy chi tiết người dùng");
      navigate("/admin/user/getAll");
    }
  };

  const handleStatusChange = (newStatus) => {
    setSelectedNewStatus(newStatus);
    setReasonOption("");
    setCustomReason("");
    setShowReasonModal(true);
  };

  const handleSubmitReason = async () => {
    const finalReason = reasonOption === "Khác" ? customReason : reasonOption;
    if (!finalReason || !finalReason.trim()) {
      toast.warning("Vui lòng nhập lý do thay đổi trạng thái.");
      return;
    }

    try {
      const res = await axios.put(
        `${Constants.DOMAIN_API}/admin/user/${id}/status`,
        { status: selectedNewStatus, reason: finalReason }
      );
      toast.success(res.data.message);
      fetchUserDetail();
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái người dùng:", error);
      toast.error("Không thể cập nhật trạng thái người dùng.");
    } finally {
      setShowReasonModal(false);
      setSelectedNewStatus("");
    }
  };

  const getReasonOptionsForStatus = (status) => {
    switch (status) {
      // case "inactive":
      //   return (
      //     <>
      //       <option value="">-- Chọn lý do --</option>
      //       <option value="Không hoạt động trong thời gian dài">
      //         Không hoạt động trong thời gian dài
      //       </option>
      //       <option value="Yêu cầu tạm dừng của người dùng">
      //         Yêu cầu tạm dừng của người dùng
      //       </option>
      //       <option value="Lý do nội bộ hệ thống">Lý do nội bộ hệ thống</option>
      //       <option value="Khác">Khác</option>
      //     </>
      //   );
      case "locked":
        return (
          <>
            <option value="">-- Chọn lý do --</option>
            <option value="Vi phạm chính sách cộng đồng">
              Vi phạm chính sách cộng đồng
            </option>
            <option value="Hoạt động đáng ngờ">Hoạt động đáng ngờ</option>
            <option value="Spam hoặc lạm dụng">Spam hoặc lạm dụng</option>
            <option value="Khác">Khác</option>
          </>
        );
      case "active":
        return (
          <>
            <option value="">-- Chọn lý do --</option>
            <option value="Kích hoạt lại tài khoản">Kích hoạt lại tài khoản</option>
            <option value="Xác minh thành công">Xác minh thành công</option>
            <option value="Khác">Khác</option>
          </>
        );
      default:
        return (
          <>
            <option value="">-- Chọn lý do --</option>
            <option value="Lý do chung">Lý do chung</option>
            <option value="Khác">Khác</option>
          </>
        );
    }
  };

  const getVietnameseStatus = (englishStatus) => {
    switch (englishStatus) {
      case "active":
        return "Hoạt động";
      // case "inactive":
      //   return "Ngưng hoạt động";
      case "locked":
        return "Bị khóa";
      default:
        return "Không xác định";
    }
  };

  // GHN APIs for addresses
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const res = await axios.get(`${Constants.DOMAIN_API}/apiRoutes/provinces`);
        setProvinces(res.data);
      } catch (error) {
        console.error("Lỗi khi lấy danh sách tỉnh:", error);
      }
    };
    fetchProvinces();
  }, []);

  useEffect(() => {
    if (!selectedProvince) return;
    const fetchDistricts = async () => {
      try {
        const res = await axios.get(
          `${Constants.DOMAIN_API}/apiRoutes/districts?provinceId=${selectedProvince}`
        );
        setDistricts(res.data);
        setWards([]);
        setSelectedDistrict("");
        setSelectedWard("");
      } catch (error) {
        console.error("Lỗi khi lấy danh sách quận:", error);
      }
    };
    fetchDistricts();
  }, [selectedProvince]);

  useEffect(() => {
    if (!selectedDistrict) return;
    const fetchWards = async () => {
      try {
        const res = await axios.get(
          `${Constants.DOMAIN_API}/apiRoutes/wards?districtId=${selectedDistrict}`
        );
        setWards(res.data);
        setSelectedWard("");
      } catch (error) {
        console.error("Lỗi khi lấy danh sách phường:", error);
      }
    };
    fetchWards();
  }, [selectedDistrict]);

  const showAddressModal = (address = null) => {
    const isEdit = !!address;

    Swal.fire({
      title: isEdit ? "Cập nhật địa chỉ" : "Thêm địa chỉ mới",
      html: `
      <div class="container mt-3 text-left">
        <form>
          <div class="mb-4">
            <label for="swal-address_line" class="form-label font-semibold block mb-1" >Địa chỉ:</label>
            <input type="text" id="swal-address_line" class="form-input w-full border rounded px-3 py-2" value="${address?.address_line || ''}" disabled>
          </div>
          <div class="mb-4">
            <label for="swal-province" class="form-label font-semibold block mb-1">Tỉnh/Thành phố:</label>
            <select id="swal-province" class="form-select w-full border rounded px-3 py-2">
              <option value="">Chọn tỉnh/thành phố</option>
              ${provinces.map(p => `<option value="${p.ProvinceID}">${p.ProvinceName}</option>`).join("")}
            </select>
          </div>
          <div class="mb-4">
            <label for="swal-district" class="form-label font-semibold block mb-1">Quận/Huyện:</label>
            <select id="swal-district" class="form-select w-full border rounded px-3 py-2" disabled>
              <option value="">Chọn quận/huyện</option>
            </select>
          </div>
          <div class="mb-4">
            <label for="swal-ward" class="form-label font-semibold block mb-1">Xã/Phường:</label>
            <select id="swal-ward" class="form-select w-full border rounded px-3 py-2" disabled>
              <option value="">Chọn xã/phường</option>
            </select>
          </div>
          <div class="form-check mb-3 flex items-center">
           
            <input type="checkbox" class="form-check-input mr-2" id="swal-is_default" ${(!address && addresses.length === 0) || address?.is_default === 1 ? "checked" : ""}>
            <label class="form-check-label font-semibold" for="swal-is_default">Đặt làm địa chỉ mặc định</label>
          </div>
        </form>
      </div>
    `,
      didOpen: async () => {
        const provinceSelect = Swal.getPopup().querySelector("#swal-province");
        const districtSelect = Swal.getPopup().querySelector("#swal-district");
        const wardSelect = Swal.getPopup().querySelector("#swal-ward");
        const addressInput = Swal.getPopup().querySelector("#swal-address_line");

        const fetchDistricts = async (provinceId) => {
          try {
            const res = await axios.get(
              `${Constants.DOMAIN_API}/apiRoutes/districts?provinceId=${provinceId}`
            );
            return res.data;
          } catch {
            return [];
          }
        };

        const fetchWards = async (districtId) => {
          try {
            const res = await axios.get(
              `${Constants.DOMAIN_API}/apiRoutes/wards?districtId=${districtId}`
            );
            return res.data;
          } catch {
            return [];
          }
        };

        const updateFullAddress = () => {
          const provinceName = provinceSelect.options[provinceSelect.selectedIndex]?.text || "";
          const districtName = districtSelect.options[districtSelect.selectedIndex]?.text || "";
          const wardName = wardSelect.options[wardSelect.selectedIndex]?.text || "";

          let fullAddress = "";
          if (wardName && districtName && provinceName) {
            fullAddress = `${wardName}, ${districtName}, ${provinceName}`;
          } else if (districtName && provinceName) {
            fullAddress = `${districtName}, ${provinceName}`;
          } else if (provinceName) {
            fullAddress = `${provinceName}`;
          }
          addressInput.value = fullAddress;
        };

        if (isEdit && address) {
          const province = provinces.find((p) => p.ProvinceName === address.city);
          if (province) {
            provinceSelect.value = province.ProvinceID;

            districtSelect.disabled = false;
            const dList = await fetchDistricts(province.ProvinceID);
            districtSelect.innerHTML = '<option value="">Chọn quận/huyện</option>';
            dList.forEach((d) => {
              const option = document.createElement("option");
              option.value = d.DistrictID;
              option.text = d.DistrictName;
              if (d.DistrictName === address.district) option.selected = true;
              districtSelect.appendChild(option);
            });

            const selectedDistrictOption = districtSelect.options[districtSelect.selectedIndex];
            const districtId = selectedDistrictOption?.value;

            if (districtId) {
              wardSelect.disabled = false;
              // const wards = await fetchWards(districtId);
              // wardSelect.innerHTML = '<option value="">Chọn xã/phường</option>';
              // wList.forEach((w) => {
              //   const option = document.createElement("option");
              //   option.value = w.WardCode;
              //   option.text = w.WardName;
              //   if (w.WardName === address.ward) option.selected = true;
              //   wardSelect.appendChild(option);
              // });

              const wList = await fetchWards(districtId);
              wardSelect.innerHTML = '<option value="">Chọn xã/phường</option>';
              wList.forEach((w) => {
                const option = document.createElement("option");
                option.value = w.WardCode;
                option.text = w.WardName;
                if (w.WardName === address.ward) option.selected = true;
                wardSelect.appendChild(option);
              });

            }
          }
          updateFullAddress();
        }

        provinceSelect.addEventListener("change", async (e) => {
          const provinceId = e.target.value;
          districtSelect.disabled = !provinceId;
          wardSelect.disabled = true;
          districtSelect.innerHTML = '<option value="">Chọn quận/huyện</option>';
          wardSelect.innerHTML = '<option value="">Chọn xã/phường</option>';
          if (!provinceId) return;
          const dList = await fetchDistricts(provinceId);
          dList.forEach((d) => {
            const option = document.createElement("option");
            option.value = d.DistrictID;
            option.text = d.DistrictName;
            districtSelect.appendChild(option);
          });
          updateFullAddress();
        });

        districtSelect.addEventListener("change", async (e) => {
          const districtId = e.target.value;
          wardSelect.disabled = !districtId;
          wardSelect.innerHTML = '<option value="">Chọn xã/phường</option>';
          if (!districtId) return;
          const wList = await fetchWards(districtId);
          wList.forEach((w) => {
            const option = document.createElement("option");
            option.value = w.WardCode;
            option.text = w.WardName;
            wardSelect.appendChild(option);
          });
          updateFullAddress();
        });

        wardSelect.addEventListener("change", () => updateFullAddress());
      },
      showCancelButton: true,
      confirmButtonText: isEdit ? "Cập nhật" : "Thêm",
      cancelButtonText: "Hủy",
      preConfirm: () => {
        const address_line = Swal.getPopup()
          .querySelector("#swal-address_line")
          .value.trim();
        const provinceSelect = Swal.getPopup().querySelector("#swal-province");
        const districtSelect = Swal.getPopup().querySelector("#swal-district");
        const wardSelect = Swal.getPopup().querySelector("#swal-ward");
        const is_default = Swal.getPopup().querySelector("#swal-is_default").checked ? 1 : 0;

        const city = provinceSelect.options[provinceSelect.selectedIndex]?.text || "";
        const district = districtSelect.options[districtSelect.selectedIndex]?.text || "";
        const ward = wardSelect.options[wardSelect.selectedIndex]?.text || "";

        if (!city || !district || !ward) {
          Swal.showValidationMessage("Vui lòng chọn đầy đủ tỉnh/quận/phường.");
          return false;
        }

        return { address_line, city, district, ward, is_default };
      },
    }).then(async (result) => {
      if (result.isConfirmed) {
        if (isEdit) {
          await handleUpdateAddress(address.id, result.value);
        } else {
          await handleAddAddress(result.value);
        }
        fetchUserDetail();
      }
    });
  };

  const handleAddAddress = async (addressData) => {
    if (addresses.length === 0) {
      addressData.is_default = 1;
    }

    // if (addressData.is_default === 1) {
    //   const hasDefault = addresses.some((addr) => addr.is_default === 1);
    //   if (hasDefault) {
    //     const confirmResult = await Swal.fire({
    //       title: "Đã có địa chỉ mặc định",
    //       text: "Bạn có muốn thay đổi địa chỉ mặc định không?",
    //       icon: "warning",
    //       showCancelButton: true,
    //       confirmButtonText: "Có, thay đổi",
    //       cancelButtonText: "Không",
    //     });
    //     if (!confirmResult.isConfirmed) {
    //       return;
    //     }
    //   }
    // }

    if (addresses.length > 0 && addressData.is_default === 1) {
      const hasDefault = addresses.some((addr) => addr.is_default === 1);
      if (hasDefault) {
        const confirmResult = await Swal.fire({
          title: "Đã có địa chỉ mặc định",
          text: "Bạn có muốn thay đổi địa chỉ mặc định không?",
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Có, thay đổi",
          cancelButtonText: "Không",
        });
        if (!confirmResult.isConfirmed) return;
      }
    }

    try {
      await axios.post(`${Constants.DOMAIN_API}/admin/user/${id}/addresses`, addressData);
      toast.success("Thêm địa chỉ thành công");
      fetchUserDetail();
    } catch (error) {
      console.error("Lỗi khi thêm địa chỉ:", error);
      toast.error("Thêm địa chỉ thất bại");
    }
  };

  const handleUpdateAddress = async (addressId, addressData) => {
    if (addressData.is_default === 1) {
      const hasOtherDefault = addresses.some(
        (addr) => addr.is_default === 1 && addr.id !== addressId
      );
      if (hasOtherDefault) {
        const confirmResult = await Swal.fire({
          title: "Đã có địa chỉ mặc định",
          text: "Bạn có muốn thay đổi địa chỉ mặc định không?",
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Có, thay đổi",
          cancelButtonText: "Không",
        });
        if (!confirmResult.isConfirmed) {
          return;
        }
      }
    }

    try {
      await axios.put(
        `${Constants.DOMAIN_API}/admin/user/${id}/addresses/${addressId}`,
        addressData
      );
      toast.success("Cập nhật địa chỉ thành công");
      fetchUserDetail();
    } catch (error) {
      console.error("Lỗi khi cập nhật địa chỉ:", error);
      toast.error("Lỗi khi cập nhật địa chỉ");
    }
  };

  const handleDeleteAddress = async (addressId) => {
    Swal.fire({
      title: "Xác nhận xóa",
      text: "Bạn có chắc chắn muốn xóa địa chỉ này không?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(
            `${Constants.DOMAIN_API}/admin/user/${id}/addresses/${addressId}`
          );
          toast.success("Xóa địa chỉ thành công");
          fetchUserDetail();
        } catch (error) {
          console.error("Lỗi khi xóa địa chỉ:", error);
          toast.success("Lỗi khi xóa địa chỉ");
        }
      }
    });
  };

  return (
    <div className="container mx-auto p-6">
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-md">
        {/* Thông tin người dùng */}
        <div className="mb-8">
          <h1 className="text-xl font-semibold mb-4">Thông tin người dùng</h1>

          {/* LAYOUT: Avatar 2 cột | Thông tin 5 + 5 cột */}
          <div className="grid grid-cols-12 gap-6 items-start">
            {/* Avatar (2/12) */}
            <div className="col-span-12 md:col-span-2 flex justify-center md:justify-start">
              {user.avatar ? (
                <img
                  src={
                    user.avatar.startsWith("http")
                      ? user.avatar
                      : `${Constants.DOMAIN_API}/Uploads/${user.avatar}`
                  }
                  alt={user.name}
                  className="w-32 h-32 object-cover rounded-full shadow-md border-2 border-gray-300"
                />
              ) : (
                <div className="w-32 h-32 flex items-center justify-center bg-gray-100 rounded-full border-2 border-dashed border-gray-300">
                  <span className="text-gray-400 text-sm text-center px-2">
                    Không có avatar
                  </span>
                </div>
              )}
            </div>

            {/* Cột thông tin trái (5/12) */}
            <div className="col-span-12 md:col-span-5 space-y-4">
              <div className="flex items-center gap-2">
                <strong className="text-gray-600 w-28 shrink-0">Họ tên:</strong>
                <input
                  type="text"
                  className="text-gray-800 border border-gray-200 rounded px-3 py-1.5 bg-gray-50 w-full focus:outline-none"
                  value={user.name || ""}
                  readOnly
                />
              </div>

              {/* <div className="flex items-center gap-2">
                <strong className="text-gray-600 w-28 shrink-0">Vai trò:</strong>
                <input
                  type="text"
                  className="capitalize px-3 py-1.5 border border-gray-200 rounded bg-blue-100 text-blue-800 text-sm font-medium w-full focus:outline-none"
                  value={user.role || ""}
                  readOnly
                />
              </div> */}

              <div className="flex items-center gap-2">
                <strong className="text-gray-600 w-28 shrink-0">Ngày tạo:</strong>
                <input
                  type="text"
                  className="text-gray-800 border border-gray-200 rounded px-3 py-1.5 bg-gray-50 w-full focus:outline-none whitespace-nowrap"
                  value={user.created_at ? new Date(user.created_at).toLocaleDateString() : ""}
                  readOnly
                />
              </div>
            </div>

            {/* Cột thông tin phải (5/12) */}
            <div className="col-span-12 md:col-span-5 space-y-4">
              <div className="flex items-center gap-2">
                <strong className="text-gray-600 w-28 shrink-0">Email:</strong>
                <input
                  type="text"
                  className="text-blue-600 border border-gray-200 rounded px-3 py-1.5 bg-gray-50 w-full cursor-pointer focus:outline-none"
                  value={user.email || ""}
                  readOnly
                  onClick={() => user.email && window.open(`mailto:${user.email}`)}
                />
              </div>

              <div className="flex items-center gap-2">
                <strong className="text-gray-600 w-28 shrink-0">Trạng thái:</strong>
                <select
                  value={user.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="text-gray-800 border border-gray-200 rounded px-3 py-1.5 bg-gray-50 w-full focus:outline-none"
                >
                  <option value="active">Hoạt động</option>
                  {/* <option value="inactive">Ngưng hoạt động</option> */}
                  <option value="locked">Bị khóa</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <strong className="text-gray-600 w-28 shrink-0">Ngày cập nhật:</strong>
                <input
                  type="text"
                  className="text-gray-800 border border-gray-200 rounded px-3 py-1.5 bg-gray-50 w-full focus:outline-none whitespace-nowrap"
                  value={user.updated_at ? new Date(user.updated_at).toLocaleDateString() : ""}
                  readOnly
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modal chọn lý do */}
        {showReasonModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">
                Lý do thay đổi trạng thái sang:{" "}
                <span className="text-blue-600">{getVietnameseStatus(selectedNewStatus)}</span>
              </h3>
              <label className="block mb-2">Chọn lý do mẫu:</label>
              <select
                value={reasonOption}
                onChange={(e) => {
                  setReasonOption(e.target.value);
                  setCustomReason("");
                }}
                className="w-full border rounded px-3 py-2 mb-4"
              >
                {getReasonOptionsForStatus(selectedNewStatus)}
              </select>
              {reasonOption === "Khác" && (
                <>
                  <label className="block mb-2">Nhập lý do khác:</label>
                  <input
                    type="text"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                    placeholder="Nhập lý do..."
                  />
                </>
              )}
              <div className="flex justify-end mt-4 space-x-2">
                <button onClick={() => setShowReasonModal(false)} className="px-4 py-2 bg-gray-300 rounded">
                  Hủy
                </button>
                <button onClick={handleSubmitReason} className="px-4 py-2 bg-blue-500 text-white rounded">
                  Xác nhận
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Phần địa chỉ */}
        <div className="mb-8">
          <section className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4 border-b border-gray-200 pb-2 text-gray-700 flex justify-between items-center">
              Địa chỉ
              <button
                className="text-sm bg-[#073272] hover:bg-[#052652] text-white px-2 py-1 rounded shadow flex items-center"
                onClick={() => showAddressModal()}
              >
                <i className="fas fa-plus mr-1 text-xs"></i> Thêm địa chỉ mới
              </button>
            </h3>

            {addresses.length === 0 ? (
              <p className="text-gray-600 italic">Chưa có địa chỉ nào.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-300 rounded divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      {["#", "Địa chỉ", "Mặc định", ""].map(header => (
                        <th key={header} className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {addresses.map((addr, index) => (
                      <tr key={addr.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          {(currentPage - 1) * addressLimit + index + 1}
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">{addr.address_line}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-center font-semibold">
                          {addr.is_default === 1 ? (
                            <span className="text-green-600">Có</span>
                          ) : (
                            <span className="text-gray-400">Không</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap space-x-2">
                          <button
                            className="bg-yellow-500 text-white p-2 rounded w-8 h-8 inline-flex items-center justify-center"
                            onClick={() => showAddressModal(addr)}
                          >
                            <FaEdit size={20} />
                          </button>
                          <button
                            className="text-xl p-2 rounded-full bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700 transition duration-200"
                            onClick={() => handleDeleteAddress(addr.id)}
                          >
                            <FaTrashAlt />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
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
              onClick={() => setCurrentPage((prev) => prev - 1)}
              className="px-2 py-1 border rounded disabled:opacity-50"
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
                    className={`px-3 py-1 border rounded ${page === currentPage ? "bg-blue-600 text-white" : "bg-white hover:bg-blue-100"
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

        {/* Nút quay lại */}
        <div className="mt-4 text-left">
          <button
            onClick={() => navigate("/admin/user/getAll")}
            className="bg-gray-600 text-white px-6 py-2 rounded-md shadow-md hover:bg-gray-700 transition duration-200 ease-in-out"
          >
            Quay lại
          </button>
        </div>
      </div>
    </div>
  );
}


export default UserDetail;
