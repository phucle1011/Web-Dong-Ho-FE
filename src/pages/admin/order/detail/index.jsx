import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Constants from "../../../../Constants";
import { toast } from "react-toastify";
import axios from "axios";
import { FaTrophy } from "react-icons/fa";

function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState({});
  const [orderDetails, setOrderDetails] = useState([]);
  const [user, setUser] = useState({});

  useEffect(() => {
    fetchOrderDetail();
  }, []);

  const fetchOrderDetail = async () => {
    try {
      const res = await axios.get(`${Constants.DOMAIN_API}/admin/orders/${id}`);
      if (res.data.data) {
        setOrder(res.data.data);
        const details = Array.isArray(res.data.data.orderDetails)
          ? res.data.data.orderDetails
          : [];
        setOrderDetails(details);
        setUser(res.data.data.user || {});
      } else {
        setOrderDetails([]);
      }
    } catch (error) {
      console.error("Lỗi khi lấy chi tiết đơn hàng:", error);
      toast.error("Không thể lấy chi tiết đơn hàng");
      navigate("/admin/orders");
    }
  };

  const translateStatus = (status) => {
    switch (status) {
      case "pending":
        return "Chờ xác nhận";
      case "confirmed":
        return "Đã xác nhận";
      case "shipping":
        return "Đang giao";
      case "completed":
        return "Hoàn thành";
      case "delivered":
        return "Đã giao hàng thành công";
      case "cancelled":
        return "Đã hủy";
      default:
        return status;
    }
  };

  const totalAmount = Array.isArray(orderDetails)
    ? orderDetails.reduce((sum, item) => sum + item.quantity * parseFloat(item.price), 0)
    : 0;

  const isAuctionOrder = Array.isArray(orderDetails) && orderDetails.some(d => d?.auction_id != null);

  return (
    <div className="container mx-auto p-4">
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: white !important;
          }
        }
      `}</style>

      {/* <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Chi tiết đơn hàng</h2>
        <button
          onClick={() => window.print()}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          In hóa đơn
        </button>
      </div> */}

      <div className="bg-white shadow-md rounded-md p-4 mb-6">
        <h4 className="text-xl font-semibold mb-4">Thông tin khách hàng</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div>
            <span className="font-medium">Mã đơn:</span> {order.order_code || "—"}
          </div>
          <div>
            <span className="font-medium">Họ tên:</span> {order.user?.name || "—"}
          </div>
          <div>
            <span className="font-medium">Số điện thoại:</span> {order.user?.phone || "—"}
          </div>
          <div>
            <span className="font-medium">Email:</span> {order.user?.email || "—"}
          </div>
          <div>
            <span className="font-medium">Địa chỉ:</span> {order.shipping_address || "—"}
          </div>
          <div>
            <span className="font-medium">Phương thức thanh toán:</span> {order.payment_method || "—"}
          </div>
          <div>
            <span className="font-medium">Ngày đặt hàng:</span>{" "}
            {order.created_at
              ? new Date(order.created_at).toLocaleDateString()
              : "—"}
          </div>

          <div>
            <span className="font-medium">Ghi chú:</span> {order.note || "—"}
          </div>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-md p-4">
        <h1 className="text-xl font-semibold">Sản phẩm</h1>
        <table className="w-full border-collapse border text-center">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2">Trạng thái</th>
              <th className="border p-2">Tên sản phẩm</th>
              <th className="border p-2">Số lượng</th>
              <th className="border p-2">Đơn giá</th>
              <th className="border p-2">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {orderDetails.length > 0 ? (
              <>
                {orderDetails.map((item, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-2">
                      {translateStatus(order.status)}
                    </td>
                    <td className="p-2">
                      {item.variant?.product?.name || "Không có tên sản phẩm"} ({item.variant?.sku})
                      {item?.auction_id != null && (
                        <span className="ml-2 inline-flex items-center text-xs bg-purple-200 text-purple-700 px-2 py-1 rounded">
                          <FaTrophy className="mr-1" />
                          Đấu giá
                        </span>
                      )}
                    </td>
                    <td className="p-2 text-center">{item.quantity}</td>
                    <td className="p-2 text-right">
                      {Number(item.price).toLocaleString("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      })}
                    </td>
                    <td className="p-2 text-right">
                      {(item.quantity * parseFloat(item.price)).toLocaleString("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      })}
                    </td>
                  </tr>
                ))}

                {Number(order.shipping_fee) > 0 && (
                  <tr className="bg-gray-50">
                    <td colSpan={4} className="text-right font-medium p-2 border-t">
                      Phí vận chuyển:
                    </td>
                    <td className="text-right p-2 border-t font-medium">
                      +{Number(order.shipping_fee).toLocaleString("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      })}
                    </td>
                  </tr>
                )}

                {Number(order.discount_amount) > 0 && (
                  <tr className="bg-gray-50">
                    <td colSpan={4} className="text-right font-medium p-2 border-t">
                      Số tiền giảm giá:
                    </td>
                    <td className="text-right p-2 border-t text-red-600 font-medium">
                      -{Number(order.discount_amount).toLocaleString("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      })}
                    </td>
                  </tr>
                )}

                {Number(order.special_discount_amount) > 0 && (
                  <tr className="bg-gray-50">
                    <td colSpan={4} className="text-right font-medium p-2 border-t">
                      Giảm giá đặc biệt:
                    </td>
                    <td className="text-right p-2 border-t text-red-600 font-medium">
                      -{Number(order.special_discount_amount).toLocaleString("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      })}
                    </td>
                  </tr>
                )}

                {Number(order.wallet_balance) > 0 && order.status !== "cancelled" && (
                  <tr className="bg-gray-50">
                    <td colSpan={4} className="text-right font-medium p-2 border-t">
                      Ví tiền:
                    </td>
                    <td className="text-right p-2 border-t text-red-600 font-medium">
                      -{Number(order.wallet_balance).toLocaleString("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      })}
                    </td>
                  </tr>
                )}

                <tr className="bg-gray-100 font-semibold">
                  <td colSpan={4} className="text-right p-2 border-t border-b">Tổng tiền:</td>
                  <td className="text-right p-2 border-t border-b text-blue-600">
                    {Number(order.total_price).toLocaleString("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    })}
                  </td>
                </tr>
              </>
            ) : (
              <tr>
                <td colSpan={5} className="border p-2 text-center text-gray-500">
                  Không có sản phẩm nào
                </td>
              </tr>
            )}
          </tbody>

        </table>

        <div className="mt-4 flex gap-4 no-print">
          <button
            onClick={() => navigate("/admin/orders/getAll")}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Quay lại
          </button>
        </div>
      </div>
    </div>
  );
}

export default OrderDetail;
