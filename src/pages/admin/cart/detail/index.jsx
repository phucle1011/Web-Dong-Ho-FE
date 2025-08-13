import { useEffect, useState } from "react";
import axios from "axios";
import { useParams, Link } from "react-router-dom";
import Constants from "../../../../Constants";

function CartDetailPage() {
  const { id } = useParams(); // id là userId trong trường hợp này
  const [cartItems, setCartItems] = useState([]); // mảng các cart detail
  const [userInfo, setUserInfo] = useState(null); // lưu thông tin user để hiển thị chung

  useEffect(() => {
    fetchCartByUserId();
  }, [id]);

  const fetchCartByUserId = async () => {
    try {
      const response = await axios.get(`${Constants.DOMAIN_API}/admin/cart/user/${id}`);
      if (response.data.success && response.data.data.length > 0) {
        setCartItems(response.data.data);
        setUserInfo(response.data.data[0].user); // Lấy thông tin user từ item đầu tiên
      } else {
        setCartItems([]);
        setUserInfo(null);
      }
    } catch (error) {
      console.error("Lỗi khi tải giỏ hàng:", error);
      setCartItems([]);
      setUserInfo(null);
    }
  };

  return (
    <div className="container-fluid mt-4">
      <div className="card">
        <div className="card-body">
          <h4 className="card-title mb-4">Chi tiết giỏ hàng của người dùng #{id}</h4>

          <div className="mb-4">
            <Link to="/admin/carts/getAll" className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
              Quay lại
            </Link>
          </div>

          {userInfo ? (
            <>
              {/* Thông tin người dùng */}
              <div className="mb-4 border p-3 rounded">
                <div className="mb-3">
                  <label className="form-label fw-bold">Tên người dùng</label>
                  <input type="text" className="form-control" value={userInfo.name} disabled />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold">Email người dùng</label>
                  <input type="text" className="form-control" value={userInfo.email} disabled />
                </div>
              </div>

              {/* Danh sách sản phẩm trong giỏ hàng */}
              <table className="table table-bordered">
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>SKU sản phẩm</th>
                    <th>Tên sản phẩm</th>
                    <th>Giá</th>
                    <th>Số lượng</th>
                  </tr>
                </thead>
                <tbody>
                  {cartItems.length > 0 ? (
                    cartItems.map((item, index) => (
                      <tr key={item.id}>
                        <td>{index + 1}</td>
                        <td>{item.variant?.sku || ""}</td>
                        <td>{item.variant?.product?.name || ""}</td>
                        <td>
                          {item.variant?.price
                            ? Number(item.variant.price).toLocaleString("vi-VN", {
                                style: "currency",
                                currency: "VND",
                              })
                            : ""}
                        </td>
                        <td>{item.quantity}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center">
                        Giỏ hàng chưa có sản phẩm nào.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </>
          ) : (
            <div className="alert alert-warning">Không tìm thấy giỏ hàng của người dùng này.</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CartDetailPage;
