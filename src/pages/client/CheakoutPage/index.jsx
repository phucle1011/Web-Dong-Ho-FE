import PageTitle from "../Helpers/PageTitle";
import Layout from "../Partials/LayoutHomeThree";
import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { decodeToken } from "../Helpers/jwtDecode";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';
import Constants from "../../../Constants";
import Swal from "sweetalert2";
import axios from 'axios';
import { toast } from "react-toastify";
import { FaTrophy } from "react-icons/fa";

export default function CheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [checkoutItems, setCheckoutItems] = useState([]);
  const [originalTotalPrice, setOriginalTotalPrice] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [discountInfo, setDiscountInfo] = useState(null);
  const [finalTotal, setFinalTotal] = useState(0);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [voucherDiscount, setVoucherDiscount] = useState(0);
  const [showAll, setShowAll] = useState(false);

  const toggleShowAll = () => setShowAll(!showAll);

  const [promoCodeData, setPromoCodeData] = useState({
    code: "",
    discountAmount: 0,
  });
  const [finalData, setFinalData] = useState({
    total: 0,
    shippingFee: 0,
    shippingService: "Đang tính...",
    formattedAmount: "0",
    promoDiscount: 0,
    voucherDiscount: 0,
  });
  const token = localStorage.getItem("token");
  const [user, setUser] = useState(null);
  const [defaultAddress, setDefaultAddress] = useState(null);
  const [allAddresses, setAllAddresses] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedWard, setSelectedWard] = useState("");
  const [noteValue, setNoteValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
  const decoded = decodeToken(token);
  const id = decoded?.id;
  const [enabled, setEnabled] = useState(false);
  const [balance, setBalance] = useState(null);
  const savedVoucher = location.state?.selectedVoucher;


  const getAuctionInfo = (variant, userId, createdAt) => {
    const auctions = variant?.auctions || [];
    const won = auctions.filter(a =>
      a.status === "ended" &&
      ((a.end_time || a.ended_at).replace("T", " ").substr(0, 19)
        <= createdAt.replace("T", " ").substr(0, 19)) &&
      a.bids?.some(b => Number(b.user_id) === Number(userId))
    );
    if (!won.length) return { isAuction: false };
    const target = won.reduce((best, cur) => {
      const t1 = (best.end_time || best.ended_at).replace("T", " ").substr(0, 19);
      const t2 = (cur.end_time || cur.ended_at).replace("T", " ").substr(0, 19);
      return t2 > t1 ? cur : best;
    });
    const topBid = [...target.bids].sort((a, b) => b.bidAmount - a.bidAmount)[0];
    return {
      isAuction: true,
      auctionId: target.id,
      bidAmount: Number(topBid.bidAmount)
    };
  };

    const isAuctionOrder = useMemo(() => {
    return checkoutItems.some(item => {
      const info = getAuctionInfo(item.variant, user?.id, item.created_at);
      return info.isAuction || !!item.auction_id;
    });
  }, [checkoutItems, user?.id]);

  useEffect(() => {
    console.log("location", location.state);

    if (!location.state && !localStorage.getItem("checkoutData")) {
      console.warn("Không có dữ liệu giỏ hàng");
      toast.error("Không có sản phẩm để thanh toán. Vui lòng quay lại giỏ hàng.");
      // navigate("/cart");
    }
  }, [location.state, navigate]);

  useEffect(() => {
    let items = [];
    let savedTotalPrice = 0;
    let savedOriginalTotalPrice = 0;
    let savedDiscountInfo = null;
    let savedFinalTotal = 0;

    if (location.state?.cartItems && location.state.cartItems.length > 0) {
      items = location.state.cartItems;
      savedTotalPrice = location.state.totalPrice || 0;
      savedOriginalTotalPrice = location.state.originalTotalPrice || 0;
      savedDiscountInfo = location.state.discountInfo || null;
      savedFinalTotal = location.state.finalTotal || 0;
      // localStorage.setItem(
      //   "checkoutData",
      //   JSON.stringify({
      //     cartItems: items,
      //     totalPrice: savedTotalPrice,
      //     originalTotalPrice: savedOriginalTotalPrice,
      //     discountInfo: savedDiscountInfo,
      //     finalTotal: savedFinalTotal,
      //   })
      // );
    } else {
      const savedData = localStorage.getItem("checkoutData");
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          items = parsedData.cartItems || [];
          savedTotalPrice = parsedData.totalPrice || 0;
          savedOriginalTotalPrice = parsedData.originalTotalPrice || 0;
          savedDiscountInfo = parsedData.discountInfo || null;
          savedFinalTotal = parsedData.finalTotal || 0;
        } catch (error) {
          console.error("Lỗi parse dữ liệu từ localStorage:", error);
          toast.error("Dữ liệu giỏ hàng không hợp lệ. Vui lòng quay lại giỏ hàng.");
          navigate("/cart");
        }
      }
    }

    setCheckoutItems(items);
    setTotalPrice(savedTotalPrice);
    setOriginalTotalPrice(savedOriginalTotalPrice);
    setDiscountInfo(savedDiscountInfo);
    setFinalTotal(savedFinalTotal);
    setPromoCodeData({
      code: savedDiscountInfo?.code || "",
      discountAmount: savedDiscountInfo?.promoDiscount || 0,
    });
    setVoucherDiscount(savedDiscountInfo?.voucherDiscount || 0);
    const savedVoucher = localStorage.getItem("selectedVoucher");
    setSelectedVoucher(savedVoucher ? JSON.parse(savedVoucher) : null);
    console.log(savedVoucher ? JSON.parse(savedVoucher) : null);

  }, [location.state]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decoded = decodeToken(token);
      if (decoded) {
        setUser(decoded);
      } else {
        console.warn("Không thể giải mã token.");
        toast.error("Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.");
      }
    } else {
      console.warn("Không tìm thấy token trong localStorage.");
      toast.error("Vui lòng đăng nhập để tiếp tục thanh toán.");
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    let isMounted = true;

    const fetchDefaultAddress = async () => {
      if (!user || !user.id) {
        console.warn("Người dùng chưa đăng nhập hoặc không có ID");
        return;
      }

      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${Constants.DOMAIN_API}/admin/address/user/${user.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!isMounted) return;

        if (response.ok && data.success && Array.isArray(data.data)) {
          const defaultAddr = data.data.find(addr => addr.is_default === 1);
          setDefaultAddress(defaultAddr || null);
        } else {
          console.error("Lỗi từ server:", data.message || "Không tìm thấy địa chỉ");
          setDefaultAddress(null);
        }
      } catch (error) {
        if (isMounted) {
          console.error("Lỗi khi lấy địa chỉ:", error);
          setDefaultAddress(null);
        }
      }
    };

    fetchDefaultAddress();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const fetchAllAddresses = async () => {
    if (!user || !user.id) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${Constants.DOMAIN_API}/admin/address/user/${user.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.success && Array.isArray(data.data)) {
        setAllAddresses(data.data);
      } else {
        console.error("Không thể lấy danh sách địa chỉ:", data.message);
      }
    } catch (error) {
      console.error("Lỗi kết nối server:", error);
    }
  };

  useEffect(() => {
    fetchAllAddresses();
  }, [user?.id]);

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

  const showAddressModalDiaLog = (address = null) => {
    const isEdit = !!address;

    Swal.fire({
      title: isEdit ? "Cập nhật địa chỉ" : "Thêm địa chỉ mới",
      html: `
      <div class="container mt-3 text-left">
        <form>
          <div class="mb-4">
            <label for="swal-address_line" class="form-label font-semibold block mb-1">Địa chỉ:</label>
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
           
          <input type="checkbox" class="form-check-input mr-2" id="swal-is_default" ${(!address && allAddresses.length === 0) || address?.is_default === 1 ? "checked" : ""}>
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
      }
    });
  };

  const handleAddAddress = async (addressData) => {
    try {
      if (allAddresses.length === 0) {
        addressData.is_default = 1;
      } else {
        const hasDefault = allAddresses.some(addr => addr.is_default === 1);

        if (hasDefault && addressData.is_default === 1) {
          const result = await Swal.fire({
            title: "Đã có địa chỉ mặc định",
            text: "Bạn muốn thay thế địa chỉ mặc định hiện tại bằng địa chỉ mới này?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Có, thay thế",
            cancelButtonText: "Không",
          });

          if (!result.isConfirmed) {
            toast.info("Bạn đã hủy thao tác thêm địa chỉ mặc định mới.");
            return;
          }
        }
      }

      const res = await axios.post(`${Constants.DOMAIN_API}/admin/user/${id}/addresses`, addressData);

      // if (addressData.is_default === 1) {
      //   setDefaultAddress(res.data);
      // }

      if (addressData.is_default === 1) {
        setDefaultAddress(res.data?.data || res.data);
      }

      fetchAllAddresses();
      toast.success("Thêm địa chỉ thành công");
    } catch (error) {
      console.error("Lỗi khi thêm địa chỉ:", error);
      toast.error("Thêm địa chỉ thất bại");
    }
  };

  const handleUpdateAddress = async (addressId, addressData) => {
    const hasOtherDefault = allAddresses.some(
      (addr) => addr.is_default === 1 && addr.id !== addressId
    );

    if (addressData.is_default === 1 && hasOtherDefault) {
      toast.error("Vui lòng bỏ chọn địa chỉ mặc định hiện tại trước khi đặt địa chỉ này làm mặc định.");
      return;
    }

    try {
      const res = await axios.put(
        `${Constants.DOMAIN_API}/admin/user/${id}/addresses/${addressId}`,
        addressData
      );
      toast.success("Cập nhật địa chỉ thành công");

      const updatedAddresses = allAddresses.map(addr =>
        addr.id === addressId ? { ...addr, ...addressData } : addr
      );
      setAllAddresses(updatedAddresses);

      if (addressData.is_default === 1) {
        setDefaultAddress(updatedAddresses.find(addr => addr.id === addressId));
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật địa chỉ:", error);
      toast.error("Lỗi khi cập nhật địa chỉ");
    }
  };

  const handleSetDefaultAddress = async (addressId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `${Constants.DOMAIN_API}/admin/user/${id}/addresses/${addressId}`,
        { is_default: 1 },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (res.data.success) {
        const updatedAddresses = allAddresses.map(addr =>
          addr.id === addressId ? { ...addr, is_default: 1 } : { ...addr, is_default: 0 }
        );
        setAllAddresses(updatedAddresses);
        setDefaultAddress(updatedAddresses.find(addr => addr.is_default === 1));
        toast.success("Đặt làm địa chỉ mặc định thành công");
      }
    } catch (error) {
      console.error("Lỗi khi đặt làm địa chỉ mặc định:", error);
      toast.error("Không thể cập nhật địa chỉ mặc định");
    }
  };

  const confirmSetDefaultAddress = (addressId) => {
    Swal.fire({
      title: "Xác nhận",
      text: "Bạn có chắc chắn muốn đặt địa chỉ này làm mặc định?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Đồng ý",
      cancelButtonText: "Hủy"
    }).then(async (result) => {
      if (result.isConfirmed) {
        await handleSetDefaultAddress(addressId);
        const newDefault = allAddresses.find(addr => addr.id === addressId);
        setDefaultAddress(newDefault);
      }
    });
  };

  const getProvinceIdByName = async (provinceName) => {
    try {
      const res = await axios.get(`${Constants.DOMAIN_API}/apiRoutes/provinces`);
      const provinces = res.data;

      const province = provinces.find(p =>
        p.ProvinceName.toLowerCase().includes(provinceName.toLowerCase())
      );

      if (!province) {
        throw new Error(`Không tìm thấy mã tỉnh cho ${provinceName}`);
      }

      return province.ProvinceID;
    } catch (error) {
      console.error("Lỗi khi lấy ProvinceID:", error.message);
      toast.error("Không thể lấy mã tỉnh");
      return null;
    }
  };

  const getDistrictIdByProvinceAndName = async (provinceId, districtName) => {
    try {
      const res = await axios.get(`${Constants.DOMAIN_API}/apiRoutes/districts?provinceId=${provinceId}`);
      const districts = res.data;

      const district = districts.find(d =>
        d.DistrictName.toLowerCase().includes(districtName.toLowerCase())
      );

      if (!district) {
        throw new Error(`Không tìm thấy mã quận/huyện cho ${districtName}`);
      }

      return district.DistrictID;
    } catch (error) {
      console.error("Lỗi khi lấy DistrictID:", error.message);
      toast.error("Không thể lấy mã quận/huyện");
      return null;
    }
  };

  const getWardCodeByDistrictAndName = async (districtId, wardName) => {
    try {
      const res = await axios.get(`${Constants.DOMAIN_API}/apiRoutes/wards?districtId=${districtId}`);
      const wards = res.data;

      const ward = wards.find(w =>
        w.WardName.toLowerCase().includes(wardName.toLowerCase())
      );

      if (!ward) {
        throw new Error(`Không tìm thấy mã phường/xã cho ${wardName}`);
      }

      return ward.WardCode;
    } catch (error) {
      console.error("Lỗi khi lấy WardCode:", error.message);
      toast.error("Không thể lấy mã phường/xã");
      return null;
    }
  };

  const deleteCartItem = async (variantId) => {
    const token = localStorage.getItem("token");
    try {
      await axios.delete(`${Constants.DOMAIN_API}/delete-to-carts/${variantId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (err) {
      console.error(`Không thể xóa sản phẩm ID ${variantId} khỏi giỏ hàng`);
    }
  };

  const calculateShippingFee = async () => {
    setIsCalculatingShipping(true);

    try {

      if (!defaultAddress) {
        setFinalData(prev => {
          const amount = Math.max(0, prev.total - prev.voucherDiscount - prev.promoDiscount);
          return {
            ...prev,
            shippingFee: 0,
            shippingService: "Chưa có địa chỉ",
            formattedAmount: amount.toLocaleString("vi-VN", { style: "currency", currency: "VND" })
          };
        });
        return;
      }

      const toProvinceId = await getProvinceIdByName(defaultAddress.city);
      if (!toProvinceId) throw new Error("Không tìm thấy mã tỉnh");

      const toDistrictId = await getDistrictIdByProvinceAndName(toProvinceId, defaultAddress.district);
      if (!toDistrictId) throw new Error("Không tìm thấy mã quận");

      const toWardCode = await getWardCodeByDistrictAndName(toDistrictId, defaultAddress.ward);
      if (!toWardCode) throw new Error("Không tìm thấy mã phường");

      const warehouse = {
        from_province_id: 220,
        from_district_id: 1574,
        from_ward_code: "550110"
      };

      const servicePriority = [
        { "id": 53320, "name": "Giao hàng tiêu chuẩn" },
        { "id": 53322, "name": "Giao hàng hỏa tốc" },
        { "id": 53321, "name": "Giao hàng nhanh" },
        { "id": 53323, "name": "Giao hàng siêu tốc" },
        { "id": 53324, "name": "Giao hàng tiết kiệm" }
      ];

      for (const service of servicePriority) {
        try {
          const response = await axios.post(`${Constants.DOMAIN_API}/shipping/shipping-fee`, {
            from_district_id: warehouse.from_district_id,
            from_ward_code: warehouse.from_ward_code,
            to_district_id: Number(toDistrictId),
            to_ward_code: toWardCode,
            service_id: service.id,
            weight: 500,
            length: 20,
            width: 20,
            height: 15
          });

          if (response.data.success) {
            const shippingFee = response.data.data.total;
            const total = totalPrice - (discountInfo?.voucherDiscount || 0) - (discountInfo?.promoDiscount || 0) + shippingFee;

            setFinalData({
              total: totalPrice,
              shippingFee: shippingFee,
              shippingService: service.name,
              promoDiscount: discountInfo?.promoDiscount || 0,
              voucherDiscount: discountInfo?.voucherDiscount || 0,
              formattedAmount: Number(total).toLocaleString("vi-VN", { style: "currency", currency: "VND" })
            });
            return;
          }
        } catch (error) {
          console.warn(`Dịch vụ ${service.name} không khả dụng:`, error.message);
        }
      }

      setFinalData(prev => {
        const amount = Math.max(0, prev.total - prev.voucherDiscount - prev.promoDiscount);
        return {
          ...prev,
          shippingFee: 0,
          shippingService: "Không hỗ trợ giao hàng tới khu vực này",
          formattedAmount: amount.toLocaleString("vi-VN", { style: "currency", currency: "VND" })
        };
      });

    } catch (error) {
      console.error("Lỗi tính phí vận chuyển:", error);
      setFinalData(prev => ({
        ...prev,
        shippingFee: 0,
        shippingService: "Lỗi tính phí",
        formattedAmount: Number(prev.total - prev.voucherDiscount - prev.promoDiscount).toLocaleString("vi-VN", { style: "currency", currency: "VND" })
      }));
    } finally {
      setIsCalculatingShipping(false);
    }
  };

  useEffect(() => {
    if (defaultAddress) {
      calculateShippingFee();
    }
  }, [defaultAddress, discountInfo, totalPrice]);

  useEffect(() => {
    const total = Math.max(0, totalPrice - (discountInfo?.voucherDiscount || 0) - (discountInfo?.promoDiscount || 0)) + (finalData.shippingFee || 0);

    setFinalData(prev => ({
      ...prev,
      total: totalPrice,
      promoDiscount: discountInfo?.promoDiscount || 0,
      voucherDiscount: discountInfo?.voucherDiscount || 0,
      formattedAmount: Number(total).toLocaleString("vi-VN", { style: "currency", currency: "VND" })
    }));
  }, [checkoutItems, discountInfo, totalPrice, finalData.shippingFee]);

  const updateUserInfo = async (userId, updatedData) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `${Constants.DOMAIN_API}/users/${userId}`,
        updatedData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data.data;
    } catch (error) {
      console.error("Lỗi khi cập nhật thông tin:", error);
      // toast.error("Cập nhật thông tin người dùng thất bại");
      return null;
    }
  };

  const handleUserInfoChange = async (field, value) => {
    if (!user || !user.id) return;

    if (user[field] === value) return;

    const updatedUser = { ...user, [field]: value };
    setUser(updatedUser);

    const payload = {
      name: field === "name" ? value : user.name,
      phone: field === "phone" ? value : user.phone,
    };

    try {
      const updatedUserData = await updateUserInfo(user.id, payload);
      if (updatedUserData) {
        setUser({ ...user, ...updatedUserData });
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật thông tin:", error);
    }
  };

  const handleCheckout = async () => {
    if (isSubmitting || isCalculatingShipping) {
      toast.warning("Vui lòng chờ hệ thống tính toán phí vận chuyển...");
      return;
    }
    if (finalData.shippingService === "Đang tính..." || finalData.shippingService === "Chưa có địa chỉ") {
      toast.error("Vui lòng chờ hệ thống tính toán phí vận chuyển hoàn tất hoặc thêm địa chỉ giao hàng");
      return;
    }
    if (finalData.shippingService === "Không hỗ trợ giao hàng tới khu vực này") {
      toast.error("Rất tiếc, chúng tôi chưa hỗ trợ giao hàng tới địa chỉ của bạn");
      return;
    }
    try {
      setIsSubmitting(true);
      const selectedPaymentMethod = (document.querySelector('input[name="payment_method"]:checked')?.value || "").trim();
      if (!selectedPaymentMethod) {
        toast.error("Vui lòng chọn phương thức thanh toán");
        return;
      }

      if (isAuctionOrder && selectedPaymentMethod === "COD") {
        toast.error("Đơn hàng đấu giá không hỗ trợ COD. Vui lòng chọn MoMo hoặc VNPay.");
        return;
      }

      const name = user?.name?.trim();
      if (!name) {
        toast.error("Vui lòng nhập họ và tên");
        return;
      }

      const email = user?.email?.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email) {
        toast.error("Vui lòng nhập email");
        return;
      } else if (!emailRegex.test(email)) {
        toast.error("Email không đúng định dạng");
        return;
      }

      const phone = user?.phone?.trim();
      const phoneRegex = /^0\d{9}$/;
      if (!phone) {
        toast.error("Vui lòng nhập số điện thoại");
        return;
      } else if (!phoneRegex.test(phone)) {
        toast.error("Số điện thoại không hợp lệ. Phải bắt đầu bằng 0 và đủ 10 số.");
        return;
      }

      if (!defaultAddress || !defaultAddress.address_line) {
        toast.error("Vui lòng chọn hoặc thêm địa chỉ giao hàng");
        return;
      }

      const hasNegativeItem = checkoutItems.some(item => {
        const info = getAuctionInfo(item.variant, user.id, item.created_at);
        const unitPrice = info.isAuction
          ? Number(info.bidAmount)
          : Number(item.variant?.promotion?.discounted_price ?? item.variant?.price ?? 0);

        const qty = Number(item.quantity ?? 0);
        const lineTotal = unitPrice * qty;

        return unitPrice < 0 || lineTotal < 0;
      });

      if (hasNegativeItem) {
        toast.error("Có sản phẩm có giá không hợp lệ (nhỏ hơn 0). Vui lòng kiểm tra lại giỏ hàng.");
        return;
      }

      if (Number(finalData.shippingFee ?? 0) < 0) {
        toast.error("Phí vận chuyển không hợp lệ. Vui lòng thử lại sau.");
        return;
      }
      const totalBeforeWallet =
        Math.max(0, totalPrice - (discountInfo?.voucherDiscount || 0) - (discountInfo?.promoDiscount || 0)) +
        (finalData.shippingFee || 0);

      if (totalBeforeWallet < 0) {
        toast.error("Tổng tiền không hợp lệ (nhỏ hơn 0). Vui lòng kiểm tra lại.");
        return;
      }

      if (enabled && balance != null) {
        const afterWallet = totalBeforeWallet - Math.min(balance, totalBeforeWallet);
        if (afterWallet < 0) {
          toast.error("Số tiền thanh toán không hợp lệ sau khi trừ ví.");
          return;
        }
      }

      const savedVoucher = location.state?.selectedVoucher;

      const payload = {
        // products: checkoutItems.map(item => ({
        //   id: item.id,
        //   user_id: item.user_id,
        //   product_variant_id: item.product_variant_id,
        //   quantity: item.quantity,
        //   variant: {
        //     id: item.product_variant_id,
        //     sku: item.variant.sku || `SKU-${item.product_variant_id}`,
        //     price: parseFloat(item.variant.promotion?.discounted_price || item.variant.price || 0),
        //     original_price: parseFloat(item.variant.price || 0),
        //     product: {
        //       name: item.product?.name || "Không tên"
        //     },
        //     images: item.variant.images || [],
        //     attributeValues: item.variant.attributeValues || []
        //   }
        // })),

        products: checkoutItems.map(item => {
          console.log('Auctions for variant', item.product_variant_id, item.variant.auctions);
          const info = getAuctionInfo(item.variant, user.id, item.created_at);
          console.log('Auction info:', info);
          const unitPrice = info.isAuction
            ? info.bidAmount
            : parseFloat(item.variant.promotion?.discounted_price || item.variant.price || 0);
          return {
            id: item.id,
            user_id: item.user_id,
            product_variant_id: item.product_variant_id,
            promotion_product_id: item.variant.promotion.id,
            // auction_id: info.isAuction ? info.auctionId : null,
            auction_id: item.auction_id,
            quantity: item.quantity,
            unit_price: unitPrice,
            original_price: parseFloat(item.variant.price || 0),

            variant: {
              id: item.product_variant_id,
              sku: item.variant.sku,
              price: unitPrice,
              original_price: parseFloat(item.variant.price || 0),
              product: { name: item.product?.name },
              images: item.variant.images || [],
              attributeValues: item.variant.attributeValues || []
            }
          };
        }),

        user_id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        address: defaultAddress?.address_line || "",
        note: noteValue,
        promotion: savedVoucher ? savedVoucher.id : null,
        promo_discount: discountInfo?.promoDiscount || 0,
        voucher_discount: discountInfo?.voucherDiscount || 0,
        promotion_user_id: discountInfo?.promotion_user_id || null,
        payment_method: selectedPaymentMethod,
        wallet_balance: enabled && balance !== null
          ? Math.min(
            balance,
            totalPrice - (discountInfo?.promoDiscount || 0) - (discountInfo?.voucherDiscount || 0) + (finalData.shippingFee || 0)
          )
          : 0,
        shipping_fee: finalData.shippingFee || 0,
        amount: (Math.max(0, finalData.total - (discountInfo?.voucherDiscount || 0) - (discountInfo?.promoDiscount || 0)) + (finalData.shippingFee || 0)) || finalData.amount,
        orderId: `ORD-${Date.now()}`,
        orderDescription: `Thanh toan don hang cho ${user.name}`,
        orderType: 'other'
      };

      console.log("Đặt hàng với payload:", payload);

      if (selectedPaymentMethod === "VNPay") {
        const response = await axios.post(`${Constants.DOMAIN_API}/orders-vnpay`, payload);

        if (response.data.success && response.data.paymentUrl) {
          window.location.href = response.data.paymentUrl;
          return;
        }

        toast.error(response.data.message || "Không thể khởi tạo thanh toán VNPay. Vui lòng thử lại.");
        return;
      }

      let url = `${Constants.DOMAIN_API}/orders`;
      if (selectedPaymentMethod === "momo") {
        url = `${Constants.DOMAIN_API}/orders-momo`;
      }

      const response = await axios.post(url, payload);

      if (response.data.success) {
        const successfullyOrderedProductIds =
          response.data.data?.successfullyOrderedProductIds || [];

        for (const variantId of successfullyOrderedProductIds) {
          await deleteCartItem(variantId);
        }

        setCheckoutItems((prev) =>
          prev.filter((item) => !successfullyOrderedProductIds.includes(item.product_variant_id))
        );

        if (selectedPaymentMethod === "momo" && response.data?.data?.payUrl) {
          const payUrl = response.data.data.payUrl;
          if (payUrl.startsWith("https://")) {
            window.open(payUrl, "_self");
          } else {
            toast.error("Liên kết thanh toán MoMo không hợp lệ.");
          }
        } else {
          toast.success("Đặt hàng thành công!");
          navigate("/cart");
        }
      }
    } catch (error) {
      console.error("Lỗi đặt hàng:", error);
      const serverMessage = error.response?.data?.message;
      if (serverMessage?.includes("Giao dịch bị từ chối")) {
        toast.error("Giao dịch bị từ chối: Vui lòng kiểm tra tài khoản thanh toán hoặc dùng phương thức khác.");
      } else if (serverMessage?.includes("Số tiền thanh toán không hợp lệ")) {
        toast.error("Số tiền thanh toán không hợp lệ: phải từ 10.000đ đến 50.000.000đ.");
      } else {
        toast.error(serverMessage || "Có lỗi xảy ra khi đặt hàng.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async () => {
    const newEnabled = !enabled;
    setEnabled(newEnabled);

    if (newEnabled) {
      try {
        const response = await axios.get(`${Constants.DOMAIN_API}/wallet/balance`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (response.data.success) {
          const walletBalance = Number(response.data.balance);
          setBalance(walletBalance);

          const totalBeforeWallet = Math.max(0, totalPrice - (discountInfo?.voucherDiscount || 0) - (discountInfo?.promoDiscount || 0)) + (finalData.shippingFee || 0);

          const adjustedAmount = Math.max(0, totalBeforeWallet - walletBalance);

          setFinalData((prev) => ({
            ...prev,
            formattedAmount: adjustedAmount.toLocaleString("vi-VN", { style: "currency", currency: "VND" }),
            amount: adjustedAmount,
          }));
        }
      } catch (error) {
        console.error("Lỗi khi lấy balance:", error);
        setBalance(null);
      }
    } else {
      setBalance(null);

      const totalOriginal = Math.max(0, totalPrice - (discountInfo?.voucherDiscount || 0) - (discountInfo?.promoDiscount || 0)) + (finalData.shippingFee || 0);
      setFinalData((prev) => ({
        ...prev,
        formattedAmount: totalOriginal.toLocaleString("vi-VN", { style: "currency", currency: "VND" }),
        amount: totalOriginal,
      }));
    }
  };

  return (
    <Layout childrenClasses="pt-0 pb-0">
      <div className="checkout-page-wrapper w-full bg-white pb-[60px]">
        <div className="w-full mb-5">
          <PageTitle
            title="Thanh toán"
            breadcrumb={[
              { name: "trang chủ", path: "/" },
              { name: "thanh toán", path: "/checkout" },
            ]}
          />
        </div>
        <div className="checkout-main-content w-full">
          <div className="container-x mx-auto">
            <div className="w-full lg:flex lg:space-x-[30px]">
              <div className="lg:w-1/2 w-full">
                <h1 className="sm:text-2xl text-xl text-qblack font-medium mb-5">
                  Chi tiết đơn hàng
                </h1>
                <div className="form-area">
                  <form className="w-full px-10 py-[30px] border border-[#EDEDED]">
                    <div className="mb-5">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Họ và tên <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Nguyễn Văn A"
                          value={user?.name || ""}
                          onChange={(e) => handleUserInfoChange("name", e.target.value)}
                          className="w-full h-[44px] px-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          placeholder="example@example.com"
                          value={user?.email || ""}
                          onChange={(e) => handleUserInfoChange("email", e.target.value)}
                          className="w-full h-[44px] px-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                          disabled
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Số điện thoại <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          placeholder="0909xxxxxx"
                          value={user?.phone || ""}
                          onChange={(e) => {
                            const phone = e.target.value;
                            if (/^\d{0,10}$/.test(phone)) {
                              handleUserInfoChange("phone", phone);
                            }
                          }}
                          maxLength={10}
                          className="w-full h-[44px] px-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                          required
                        />
                      </div>
                    </div>
                    <div className="mb-5">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Ghi chú (tùy chọn)</label>
                      <textarea
                        placeholder="Ví dụ: Giao hàng sau 17h, không gọi điện..."
                        value={noteValue}
                        onChange={(e) => setNoteValue(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 resize-none"
                        rows="3"
                      />
                    </div>

                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Địa chỉ <span className="text-red-500">*</span>
                      </label>

                      <div className="w-full p-4 border border-gray-200 rounded-lg bg-white shadow-sm relative">
                        <button
                          type="button"
                          onClick={() => setShowAddressDropdown(!showAddressDropdown)}
                          className="absolute top-2 right-3 text-blue-500 text-xl font-bold z-10"
                        >
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            className={`transition-transform duration-300 ${showAddressDropdown ? "rotate-180" : ""}`}
                          >
                            {showAddressDropdown ? (
                              <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6 1.41 1.41z" />
                            ) : (
                              <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
                            )}
                          </svg>
                        </button>

                        {!showAddressDropdown && defaultAddress ? (
                          <div className="flex items-center space-x-2">
                            <div className="text-red-500">
                              <FontAwesomeIcon icon={faMapMarkerAlt} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-sans font-semibold text-black text-base leading-5 truncate">
                                {user?.name} (+84) {user?.phone}
                              </p>
                              <p className="font-sans text-gray-600 text-sm leading-5">
                                {defaultAddress.address_line}, Việt Nam
                              </p>
                            </div>
                            {/* <i className="fas fa-chevron-right text-gray-400 text-base"></i> */}
                          </div>
                        ) : null}

                        {showAddressDropdown && (
                          <>
                            <div className="flex items-center justify-between mt-2 mb-4">
                              <button
                                type="button"
                                className="px-2 py-1 text-gray-500 rounded-md hover:text-gray-700 transition duration-200 ease-in-out text-sm flex items-center space-x-1 "
                                onClick={() => showAddressModalDiaLog()}
                              >
                                <span>+ Thêm địa chỉ mới</span>
                              </button>
                            </div>

                            <div className="mt-2 border-t pt-4">
                              {allAddresses.length > 0 ? (
                                allAddresses.map((address) => (
                                  <div key={address.id} className="mb-4 border-b pb-3 last:border-b-0">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <p className="font-semibold">{user?.name} (+84) {user?.phone}</p>
                                        <p>{`${address.address_line}, Việt Nam`}</p>
                                        {address.is_default === 1 ? (
                                          <span className="inline-block px-2 py-1 bg-gray-200 text-gray-500 rounded-sm mt-1">
                                            Mặc định
                                          </span>
                                        ) : (
                                          <button type="button"
                                            onClick={() => confirmSetDefaultAddress(address.id)}
                                            className="text-green-500 hover:text-green-700 text-sm"
                                          >
                                            Đặt làm mặc định
                                          </button>
                                        )}
                                      </div>
                                      <div className="flex flex-col space-y-1">
                                        <button
                                          type="button"
                                          onClick={() => showAddressModalDiaLog(address)}
                                          className="text-red-500 hover:text-red-700 text-sm"
                                        >
                                          Sửa
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <p className="text-gray-500 px-3">Chưa có địa chỉ nào.</p>
                              )}
                            </div>
                          </>
                        )}

                        {!defaultAddress && !showAddressDropdown && (
                          <div className="text-gray-500">Chưa có địa chỉ mặc định</div>
                        )}
                      </div>
                    </div>
                  </form>
                </div>
              </div>
              <div className="flex-1">
                <h1 className="sm:text-2xl text-xl text-qblack font-medium mb-5">
                  Tóm tắt đơn hàng
                </h1>

                <div className="w-full px-10 py-[30px] border border-[#EDEDED]">
                  <ul className="flex flex-col space-y-5">
                    {checkoutItems.length > 0 ? (
                      <ul className="space-y-4">
                        {checkoutItems.map((item) => {
                          const variant = item.variant;
                          const originalPrice = parseFloat(variant.price || 0);
                          const price = parseFloat(variant.promotion?.discounted_price || variant.price || 0);
                          const discountPercent = parseFloat(variant.promotion?.discount_percent || 0);
                          const quantity = item.quantity;
                          const total = price * quantity;
                          const attributes = variant.attributeValues;
                          const image = variant?.images?.[0]?.image_url || "";
                          const displayedAttributes = showAll ? attributes : attributes.slice(0, 3);

                          const info = getAuctionInfo(item.variant, user.id, item.created_at);
                          const isAuction = info.isAuction;
                          const bidAmount = info.bidAmount || 0;
                          const unitPrice = isAuction ? bidAmount : parseFloat(item.variant.promotion?.discounted_price || item.variant.price || 0);
                          const lineTotal = isAuction ? bidAmount * item.quantity : unitPrice * item.quantity;

                          return (
                            <li key={item.id} className="pb-4">
                              <div className="flex justify-between items-start gap-4">
                                <div className="w-[80px] h-[80px] flex justify-center items-center border border-[#EDEDED] overflow-hidden">
                                  <img
                                    src={image}
                                    alt="product"
                                    className="w-full h-full object-contain"
                                  />
                                </div>

                                <div className="flex-1 space-y-1">
                                  <p className="font-medium text-[15px] text-qblack">{variant.sku}</p>

                                  <div className="space-y-1">
                                    {displayedAttributes.map((attr) => {
                                      const attrName = attr.attribute?.name || "";
                                      const attrValue = attr.value;
                                      const isColor = attrName.toLowerCase() === "color";

                                      return (
                                        <div
                                          key={attr.id}
                                          className="flex items-center gap-1 flex-wrap text-gray-500"
                                        >
                                          <span className="font-medium">{attrName}</span>
                                          {isColor ? (
                                            <span
                                              className="inline-block w-4 h-4 rounded-full border border-gray-300"
                                              style={{ backgroundColor: attrValue }}
                                              title={attrValue}
                                            ></span>
                                          ) : (
                                            <span>{attrValue}</span>
                                          )}
                                        </div>
                                      );
                                    })}

                                    {attributes.length > 3 && (
                                      <button
                                        onClick={toggleShowAll}
                                        className="text-blue-600 hover:text-blue-800 text-sm mt-1"
                                      >
                                        {showAll
                                          ? "Ẩn bớt"
                                          : `Xem thêm (${attributes.length - 3}) thuộc tính`}
                                      </button>
                                    )}
                                  </div>
                                  {/* <p className="text-sm text-gray-700">
                                    Số lượng: <strong>{quantity}</strong>
                                  </p>
                                  <div className="flex flex-col gap-1">
                                    <span className={`font-semibold ${discountPercent > 0 ? "text-qred" : "text-qblack"}`}>
                                      {Number(price).toLocaleString("vi-VN", { style: "currency", currency: "VND" })}
                                    </span>
                                    {discountPercent > 0 && price < originalPrice && (
                                      <span className="text-gray-400 line-through text-xs">
                                        {Number(originalPrice).toLocaleString("vi-VN", { style: "currency", currency: "VND" })}
                                      </span>
                                    )}
                                  </div> */}

                                  {isAuction ? (
                                    <div className="flex flex-col items-start gap-1">
                                      <span className="text-sm text-gray-700"><span className="ml-2 text-xs bg-purple-200 text-purple-700 px-2 py-1 rounded">
                                        <FaTrophy className="inline mr-1" />
                                        Đấu giá
                                      </span></span>
                                      {/* <div className="text-sm text-gray-700">
                                        Tổng tiền: <strong>
                                          {lineTotal.toLocaleString("vi-VN", { style: "currency", currency: "VND" })}
                                        </strong>
                                      </div> */}
                                    </div>
                                  ) : (
                                    <>
                                      <p className="text-sm text-gray-700">
                                        Số lượng: <strong>{quantity}</strong>
                                      </p>
                                      <div className="flex flex-col gap-1">
                                        <span className={`font-semibold ${discountPercent > 0 ? "text-qred" : "text-qblack"}`}>
                                          {Number(unitPrice).toLocaleString("vi-VN", { style: "currency", currency: "VND" })}
                                        </span>
                                        {discountPercent > 0 && unitPrice < originalPrice && (
                                          <span className="text-gray-400 line-through text-xs">
                                            {Number(originalPrice).toLocaleString("vi-VN", { style: "currency", currency: "VND" })}
                                          </span>
                                        )}
                                      </div>

                                    </>
                                  )}

                                </div>

                                {!isAuction && (
                                  <div className="text-right min-w-[100px]">
                                    <span className="text-lg font-bold text-qred block">
                                      {Number(total).toLocaleString("vi-VN", { style: "currency", currency: "VND" })}
                                    </span>
                                  </div>
                                )}

                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="text-red-500">Không có sản phẩm nào được chọn.</p>
                    )}
                  </ul>

                  <div className="mt-4 border-t pt-4">
                    {originalTotalPrice > totalPrice && (
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600">Tổng giá gốc:</span>
                        <span className="text-gray-400 line-through">
                          {Number(originalTotalPrice).toLocaleString("vi-VN", { style: "currency", currency: "VND" })}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">Tổng tiền (sau khuyến mãi sản phẩm):</span>
                      <span className="font-semibold">
                        {Number(totalPrice).toLocaleString("vi-VN", { style: "currency", currency: "VND" })}
                      </span>
                    </div>
                    {discountInfo?.voucherDiscount > 0 && (
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600">Giảm giá (Voucher):</span>
                        <span className="text-green-600">
                          -{Number(discountInfo.voucherDiscount).toLocaleString("vi-VN", { style: "currency", currency: "VND" })}
                        </span>
                      </div>
                    )}
                    {discountInfo?.promoDiscount > 0 && (
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600">Giảm giá (Mã đặc biệt):</span>
                        <span className="text-green-600">
                          -{Number(discountInfo.promoDiscount).toLocaleString("vi-VN", { style: "currency", currency: "VND" })}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">Phí vận chuyển:</span>
                      <div className="text-right">
                        {isCalculatingShipping ? (
                          <div className="flex items-center justify-end">
                            <span className="text-gray-500 text-sm mr-2">Đang tính phí...</span>
                            <svg className="animate-spin h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          </div>
                        ) : (
                          <>
                            <span className="font-semibold">
                              {finalData.shippingFee ? `${Number(finalData.shippingFee).toLocaleString("vi-VN", { style: "currency", currency: "VND" })}` : 'Không hỗ trợ'}
                            </span>
                            {finalData.shippingService && (
                              <span className="text-xs text-gray-500 block">({finalData.shippingService})</span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    {selectedVoucher && (
                      <div className="flex items-center justify-between p-3 border border-green-500 bg-green-50 rounded-lg mb-2 cursor-pointer bg-white shadow-sm transition-all duration-200">
                        <div className="flex items-center flex-1 min-w-0">
                          {selectedVoucher.discount_type === "shipping" && (
                            <span className="bg-teal-500 text-white text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap mr-3">FREE SHIP</span>
                          )}
                          {selectedVoucher.discount_type !== "shipping" && (
                            <span className="bg-green-500 text-white text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap mr-3">VOUCHER</span>
                          )}
                          <span className="text-sm flex-1 text-gray-700 flex-wrap">
                            {selectedVoucher.name}{" "}
                            {selectedVoucher.discount_type === 'percentage' && (
                              <span className="text-gray-500">
                                (Giảm {selectedVoucher.discount_value}%{selectedVoucher.max_price ? `, Tối đa ${Number(selectedVoucher.max_price).toLocaleString("vi-VN", {
                                  style: "currency",
                                  currency: "VND",
                                })}` : ''})
                              </span>
                            )}
                            {selectedVoucher.discount_type === 'fixed' && (
                              <span className="text-gray-500">
                                (Giảm {Number(selectedVoucher.discount_value).toLocaleString("vi-VN", {
                                  style: "currency",
                                  currency: "VND",
                                })})
                              </span>
                            )}
                            <span className="text-gray-500"> (Đơn tối thiểu {Number(selectedVoucher.min_price_threshold).toLocaleString("vi-VN", {
                              style: "currency",
                              currency: "VND",
                            })}) </span>
                          </span>
                        </div>
                      </div>
                    )}
                    <div className="flex items-start justify-between gap-4">
                      <label className="flex items-center cursor-pointer">
                        <div className="relative">
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={enabled}
                            onChange={handleToggle}
                          />
                          <div className={`w-10 h-6 bg-gray-300 rounded-full transition-colors duration-300 ${enabled ? 'bg-green-500' : ''}`}></div>
                          <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-300 transform ${enabled ? 'translate-x-4' : ''}`}></div>
                        </div>
                        <span className="ml-3">Ví tiền</span>
                      </label>

                      {enabled && balance !== null && (
                        <div className="text-right text-sm space-y-1">
                          <div className="text-gray-600">
                            Đã sử dụng: <strong className="text-green-600">
                              {Number(
                                Math.min(
                                  balance,
                                  totalPrice - (discountInfo?.promoDiscount || 0) - (discountInfo?.voucherDiscount || 0) + (finalData.shippingFee || 0)
                                )
                              ).toLocaleString()}đ
                            </strong>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t mt-2">
                      <span className="text-lg font-bold">Tổng cộng:</span>
                      <span className="text-xl font-bold text-qred">
                        {finalData.formattedAmount || "0"}
                      </span>
                    </div>
                  </div>

                  <div className="shipping mt-[30px]">
                    <ul className="flex flex-col space-y-1">
                      {isAuctionOrder && (
                        <div className="mb-2 text-sm text-orange-600">
                          Vì đây là sản phẩm đấu giá nên chỉ hỗ trợ thanh toán MoMo hoặc VNPay.
                        </div>
                      )}
                      <li>
                        <div className="flex space-x-2.5 items-center mb-5">
                          <div className="input-radio">
                            <input
                              type="radio"
                              name="payment_method"
                              value="momo"
                              defaultChecked
                            />
                          </div>
                          <label id="momo" className="text-[18px] text-normal text-qblack">
                            MoMo
                          </label>
                        </div>
                      </li>
                      <li>
                        <div className="flex space-x-2.5 items-center mb-5">
                          <div className="input-radio">
                            <input
                              type="radio"
                              name="payment_method"
                              value="VNPay"
                            />
                          </div>
                          <label htmlFor="vnpay" className="text-[18px] text-normal text-qblack">
                            VNPay
                          </label>
                        </div>
                      </li>
                      {!isAuctionOrder && (
                        <li>
                          <div className="flex space-x-2.5 items-center mb-5">
                            <div className="input-radio">
                              <input
                                type="radio"
                                name="payment_method"
                                value="COD"
                              />
                            </div>
                            <label htmlFor="cod" className="text-[18px] text-normal text-qblack">
                              Thanh toán khi nhận hàng
                            </label>
                          </div>
                        </li>
                      )}
                    </ul>
                  </div>
                  <button
                    type="button"
                    onClick={handleCheckout}
                    disabled={isSubmitting || isCalculatingShipping}
                    className={`w-full h-[40px] black-btn flex justify-center items-center mt-4 rounded-lg ${isSubmitting || isCalculatingShipping ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center">
                        <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-sm font-semibold">Đang xử lý...</span>
                      </div>
                    ) : (
                      <span className="text-sm font-semibold">Đặt hàng ngay</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}