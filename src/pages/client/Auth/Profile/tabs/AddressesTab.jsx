import axios from "axios";
import React, { useState, useEffect } from "react";
import { decodeToken } from "../../../Helpers/jwtDecode";
import Swal from "sweetalert2";
import Constants from "../../../../../Constants.jsx";
import { toast } from "react-toastify";

export default function AddressesTab() {
  const [userId, setUserId] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedWard, setSelectedWard] = useState("");
    const [user, setUser] = useState({});

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decoded = decodeToken(token);
      const id = decoded?.user_id || decoded?.id || null;
      setUserId(id);
    }
  }, []);

  useEffect(() => {
    if (userId) fetchUserDetail();
  }, [userId]);

    const fetchUserDetail = async () => {
    try {
      const res = await axios.get(`${Constants.DOMAIN_API}/admin/user/${userId}`);
      if (res.data.data) {
        setUser(res.data.data);
        setAddresses(res.data.data.addresses || []);
      } else {
        setUser({});
        setAddresses([]);
      }
    } catch (error) {
      console.error("Lỗi khi lấy chi tiết người dùng:", error);
      toast.error("Không thể lấy chi tiết người dùng");
    }
  };

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
            <label for="swal-address_line" class="form-label font-semibold block mb-1">Địa chỉ:</label>
            <input type="text" id="swal-address_line" class="form-input w-full border rounded px-3 py-2" value="${address?.address_line || ''}">
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
            <input type="checkbox" class="form-check-input mr-2" id="swal-is_default" ${address?.is_default === 1 ? "checked" : ""}>
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
            const res = await axios.get(`${Constants.DOMAIN_API}/apiRoutes/districts?provinceId=${provinceId}`);
            return res.data;
          } catch (err) {
            console.error("Lỗi tải quận:", err);
            return [];
          }
        };

        const fetchWards = async (districtId) => {
          try {
            const res = await axios.get(`${Constants.DOMAIN_API}/apiRoutes/wards?districtId=${districtId}`);
            return res.data;
          } catch (err) {
            console.error("Lỗi tải phường:", err);
            return [];
          }
        };

        // Hàm cập nhật địa chỉ đầy đủ vào ô input
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

        // Load dữ liệu cũ nếu là edit
        if (isEdit && address) {
          const province = provinces.find(p => p.ProvinceName === address.city);
          if (province) {
            provinceSelect.value = province.ProvinceID;

            districtSelect.disabled = false;
            const districts = await fetchDistricts(province.ProvinceID);
            districtSelect.innerHTML = '<option value="">Chọn quận/huyện</option>';
            districts.forEach(d => {
              const option = document.createElement("option");
              option.value = d.DistrictID;
              option.text = d.DistrictName;
              if (d.DistrictName === address.district) option.selected = true;
              districtSelect.appendChild(option);
            });

            // Lấy DistrictID từ dropdown quận đã chọn
            const selectedDistrictOption = districtSelect.options[districtSelect.selectedIndex];
            const districtId = selectedDistrictOption?.value;

            if (districtId) {
              wardSelect.disabled = false;
              const wards = await fetchWards(districtId);
              wardSelect.innerHTML = '<option value="">Chọn xã/phường</option>';
              wards.forEach(w => {
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

        // Sự kiện chọn tỉnh
        provinceSelect.addEventListener("change", async (e) => {
          const provinceId = e.target.value;
          districtSelect.disabled = !provinceId;
          wardSelect.disabled = true;
          districtSelect.innerHTML = '<option value="">Chọn quận/huyện</option>';
          wardSelect.innerHTML = '<option value="">Chọn xã/phường</option>';

          if (!provinceId) return;

          const districts = await fetchDistricts(provinceId);
          districts.forEach(d => {
            const option = document.createElement("option");
            option.value = d.DistrictID;
            option.text = d.DistrictName;
            districtSelect.appendChild(option);
          });

          updateFullAddress();
        });

        // Sự kiện chọn quận
        districtSelect.addEventListener("change", async (e) => {
          const districtId = e.target.value;
          wardSelect.disabled = !districtId;
          wardSelect.innerHTML = '<option value="">Chọn xã/phường</option>';

          if (!districtId) return;

          const wards = await fetchWards(districtId);
          wards.forEach(w => {
            const option = document.createElement("option");
            option.value = w.WardCode;
            option.text = w.WardName;
            wardSelect.appendChild(option);
          });

          updateFullAddress();
        });

        // Sự kiện chọn phường
        wardSelect.addEventListener("change", () => {
          updateFullAddress();
        });
      },
      showCancelButton: true,
      confirmButtonText: isEdit ? "Cập nhật" : "Thêm",
      cancelButtonText: "Hủy",
      preConfirm: () => {
        const address_line = Swal.getPopup().querySelector("#swal-address_line").value.trim();
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

        return {
          address_line,
          city,
          district,
          ward,
          is_default,
        };
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
    if (addressData.is_default === 1) {
      const hasDefault = addresses.some((addr) => addr.is_default === 1);
      if (hasDefault) {
        toast.success("Vui lòng bỏ chọn địa chỉ mặc định hiện tại trước khi đặt địa chỉ này làm mặc định.");
        return;
      }
    }
    try {
      const res = await axios.post(`${Constants.DOMAIN_API}/admin/user/${userId}/addresses`, addressData);
      toast.success("Thêm địa chỉ thành công");
      fetchUserDetail();
    } catch (error) {
      console.error("Lỗi khi thêm địa chỉ:", error);
      toast.success("Thêm địa chỉ thất bại");
    }
  };

  const handleUpdateAddress = async (addressId, addressData) => {
    if (addressData.is_default === 1) {
      const hasOtherDefault = addresses.some(
        (addr) => addr.is_default === 1 && addr.id !== addressId
      );
      if (hasOtherDefault) {
        toast.success("Vui lòng bỏ chọn địa chỉ mặc định hiện tại trước khi đặt địa chỉ này làm mặc định.");
        return;
      }
    }
    try {
      const res = await axios.put(
        `${Constants.DOMAIN_API}/admin/user/${userId}/addresses/${addressId}`,
        addressData
      );
      toast.success("Cập nhật địa chỉ thành công");
      fetchUserDetail();
    } catch (error) {
      console.error("Lỗi khi cập nhật địa chỉ:", error);
      toast.success("Lỗi khi cập nhật địa chỉ");
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
          const res = await axios.delete(
            `${Constants.DOMAIN_API}/admin/user/${userId}/addresses/${addressId}`
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
    <div>
      <div className="w-[180px] h-[50px] mt-4">
        <button
          type="button"
          className="yellow-btn w-full h-full"
          onClick={() => showAddressModal()}
          disabled={submitting}
        >
          <div className="w-full text-sm font-semibold">Thêm địa chỉ</div>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-[30px] mt-6">
        {addresses.length === 0 && <p>Chưa có địa chỉ nào.</p>}
        {addresses.map((address, idx) => (
          <div key={address.id} className="w-full bg-primarygray p-5 border relative">
            <div className="flex justify-between items-center">
              <p className="title text-[22px] font-semibold">Địa chỉ #{idx + 1}</p>
              <div className="flex gap-2">
                <button
                  className="border border-qgray w-[34px] h-[34px] rounded-full flex justify-center items-center"
                  onClick={() => showAddressModal(address)}
                  title="Sửa"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                    strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-blue-600">
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M16.862 3.487a2.125 2.125 0 113 3L7.5 19.849l-4 1 1-4L16.862 3.487z" />
                  </svg>
                </button>
                <button
                  className="border border-qgray w-[34px] h-[34px] rounded-full flex justify-center items-center"
                  onClick={() => handleDeleteAddress(address.id)}
                  title="Xóa"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                    strokeWidth={2} stroke="#EB5757" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <p className="mt-5 text-base"><strong>Địa Chỉ:</strong> {address.address_line}</p>
            <p className="mt-2 text-base"><strong>Xã/Phường:</strong> {address.ward}</p>
            <p className="mt-2 text-base"><strong>Quận/Huyện:</strong> {address.district}</p>
            <p className="mt-2 text-base"><strong>Tỉnh/Thành Phố:</strong> {address.city}</p>
            <p className="mt-2 text-base">
              <strong>Mặc Định:</strong>{" "}
              {address.is_default === 1 ? (
                <span className="text-green-600 font-semibold">Có</span>
              ) : (
                "Không"
              )}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}