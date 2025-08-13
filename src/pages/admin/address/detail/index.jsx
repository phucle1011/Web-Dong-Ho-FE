import { useEffect, useState } from "react";
import axios from "axios";
import { useParams, Link } from "react-router-dom";
import Constants from "../../../../Constants";

function AddressDetail() {
    const { userId } = useParams();
    const [addresses, setAddresses] = useState([]);
    const [userInfo, setUserInfo] = useState(null);

    useEffect(() => {
        fetchAddressDetails();
    }, [userId]);

    const fetchAddressDetails = async () => {
        try {
            const response = await axios.get(`${Constants.DOMAIN_API}/admin/address/user/${userId}`);
            const data = response.data.data || [];

            setAddresses(data);
            if (data.length > 0) {
                setUserInfo(data[0].user);
            }
        } catch (error) {
            console.error("Lỗi khi tải chi tiết địa chỉ:", error);
        }
    };

    return (
        <div className="container-fluid mt-4">
            <div className="card">
                <div className="card-body">
                    <h4 className="card-title mb-4">Chi tiết địa chỉ người dùng</h4>

                    <div className="mb-4">
                        <Link to="/admin/address/getAll" className="btn btn-secondary">
                            Quay lại
                        </Link>
                    </div>

                    {userInfo && (
                        <div className="mb-4 border p-3 rounded bg-light">
                            <h5>Thông tin người dùng</h5>
                            <div className="mb-2">
                                <label className="form-label fw-bold">Tên:</label>
                                <input type="text" className="form-control" value={userInfo.name} disabled />
                            </div>
                            <div className="mb-2">
                                <label className="form-label fw-bold">Email:</label>
                                <input type="text" className="form-control" value={userInfo.email} disabled />
                            </div>
                        </div>
                    )}

                    {addresses.length > 0 ? (
                        addresses.map((addr, index) => (
                            <div key={addr.id} className="mb-4 border p-3 rounded">
                                <h6 className="fw-semibold">Địa chỉ #{index + 1}</h6>
                                <div className="mb-2">
                                    <label className="form-label">Địa chỉ chi tiết</label>
                                    <input type="text" className="form-control" value={addr.address_line} disabled />
                                </div>
                                <div className="row">
                                    <div className="col-md-4 mb-2">
                                        <label className="form-label">Tỉnh/Thành phố</label>
                                        <input type="text" className="form-control" value={addr.province} disabled />
                                    </div>
                                    <div className="col-md-4 mb-2">
                                        <label className="form-label">Quận/Huyện</label>
                                        <input type="text" className="form-control" value={addr.district} disabled />
                                    </div>
                                    <div className="col-md-4 mb-2">
                                        <label className="form-label">Thành phố</label>
                                        <input type="text" className="form-control" value={addr.city} disabled />
                                    </div>
                                </div>
                                <div className="mb-2">
                                    <label className="form-label">Địa chỉ mặc định</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={addr.is_default ? "Có" : "Không"}
                                        disabled
                                    />
                                </div>
                                <div className="row">
                                    <div className="col-md-6 mb-2">
                                        <label className="form-label">Ngày tạo</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={new Date(addr.created_at).toLocaleString()}
                                            disabled
                                        />
                                    </div>
                                    <div className="col-md-6 mb-2">
                                        <label className="form-label">Cập nhật</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={new Date(addr.updated_at).toLocaleString()}
                                            disabled
                                        />
                                    </div>
                                </div>

                            </div>
                        ))
                    ) : (
                        <div className="alert alert-warning">Không có địa chỉ nào cho người dùng này.</div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AddressDetail;
