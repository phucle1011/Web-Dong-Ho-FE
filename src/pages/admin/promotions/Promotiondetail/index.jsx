import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import Constants from "../../../../Constants";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";

export default function PromotionAppliedDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axios.get(`${Constants.DOMAIN_API}/admin/promotions/applied/${id}`);
        if (res.data?.success) {
          setOrders(Array.isArray(res.data.orders) ? res.data.orders : []);
        } else {
          setOrders([]);
        }
      } catch (err) {
        console.error(err);
        alert("Không thể tải đơn hàng.");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [id]);

  const toggleExpand = (orderId) => {
    setExpandedOrderId((prev) => (prev === orderId ? null : orderId));
  };

  const formatCurrency = (amount) =>
    Number(amount || 0).toLocaleString("vi-VN", { style: "currency", currency: "VND" });

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
        return status || "—";
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Đơn hàng đã áp dụng khuyến mãi</h2>
        <button
          onClick={() => navigate(-1)}
          className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800"
        >
          ← Quay lại
        </button>
      </div>

      {loading ? (
        <p className="text-gray-600">Đang tải...</p>
      ) : orders.length === 0 ? (
        <p className="text-gray-600">Không có đơn hàng nào áp dụng.</p>
      ) : (
        <div className="space-y-5">
          {orders.map((order) => {
            const orderDetails = Array.isArray(order.orderDetails)
              ? order.orderDetails
              : [];
            return (
              <div key={order.id} className="bg-white border rounded-md shadow">

                <button
                  className="w-full flex justify-between items-center px-4 py-3 hover:bg-gray-50"
                  onClick={() => toggleExpand(order.id)}
                >
                  <div className="text-left">
                    <div className="font-semibold">
                      Mã đơn: <span className="font-bold">{order.order_code || "—"}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Khách: {order.user?.name || "—"} ({order.user?.email || "—"})
                    </div>
                    <div className="text-sm text-gray-600">
                      Trạng thái: <span className="font-medium">{translateStatus(order.status)}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Tổng tiền: <span className="font-medium">{formatCurrency(order.total_price)}</span>
                    </div>
                  </div>
                  <div className="text-gray-600">
                    {expandedOrderId === order.id ? <FaChevronUp /> : <FaChevronDown />}
                  </div>
                </button>

                {expandedOrderId === order.id && (
                  <div className="px-4 pb-4">
                    <div className="bg-white shadow-sm rounded-md p-4 mb-4 border">
                      <h4 className="text-lg font-semibold mb-3">Thông tin khách hàng</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
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
                        <div className="md:col-span-2">
                          <span className="font-medium">Địa chỉ:</span> {order.shipping_address || "—"}
                        </div>
                        <div>
                          <span className="font-medium">Phương thức thanh toán:</span>{" "}
                          {order.payment_method || "—"}
                        </div>
                        <div>
                          <span className="font-medium">Ngày đặt hàng:</span>{" "}
                          {order.created_at
                            ? new Date(order.created_at).toLocaleDateString("vi-VN")
                            : "—"}
                        </div>
                        <div className="md:col-span-2">
                          <span className="font-medium">Ghi chú:</span> {order.note || "—"}
                        </div>
                      </div>
                    </div>

                    <div className="bg-white shadow-sm rounded-md p-4 border">
                      <h4 className="text-lg font-semibold mb-3">Sản phẩm</h4>
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
                              {orderDetails.map((item, idx) => {
                                const name = item?.variant?.product?.name || "Không có tên sản phẩm";
                                const sku = item?.variant?.sku ? ` (${item.variant.sku})` : "";
                                const quantity = Number(item?.quantity || 0);
                                const price = Number(item?.price || 0);
                                return (
                                  <tr key={idx} className="border-b">
                                    <td className="p-2">{translateStatus(order.status)}</td>
                                    <td className="p-2">{name}{sku}</td>
                                    <td className="p-2 text-center">{quantity}</td>
                                    <td className="p-2 text-right">{formatCurrency(price)}</td>
                                    <td className="p-2 text-right">{formatCurrency(quantity * price)}</td>
                                  </tr>
                                );
                              })}

                              {Number(order?.shipping_fee) > 0 && (
                                <tr className="bg-gray-50">
                                  <td colSpan={4} className="text-right font-medium p-2 border-t">
                                    Phí vận chuyển:
                                  </td>
                                  <td className="text-right p-2 border-t font-medium">
                                    +{formatCurrency(order.shipping_fee)}
                                  </td>
                                </tr>
                              )}

                              {Number(order?.discount_amount) > 0 && (
                                <tr className="bg-gray-50">
                                  <td colSpan={4} className="text-right font-medium p-2 border-t">
                                    Số tiền giảm giá:
                                  </td>
                                  <td className="text-right p-2 border-t text-red-600 font-medium">
                                    -{formatCurrency(order.discount_amount)}
                                  </td>
                                </tr>
                              )}

                              {Number(order?.special_discount_amount) > 0 && (
                                <tr className="bg-gray-50">
                                  <td colSpan={4} className="text-right font-medium p-2 border-t">
                                    Giảm giá đặc biệt:
                                  </td>
                                  <td className="text-right p-2 border-t text-red-600 font-medium">
                                    -{formatCurrency(order.special_discount_amount)}
                                  </td>
                                </tr>
                              )}

                              {Number(order?.wallet_balance) > 0 && order?.status !== "cancelled" && (
                                <tr className="bg-gray-50">
                                  <td colSpan={4} className="text-right font-medium p-2 border-t">
                                    Ví tiền:
                                  </td>
                                  <td className="text-right p-2 border-t text-red-600 font-medium">
                                    -{formatCurrency(order.wallet_balance)}
                                  </td>
                                </tr>
                              )}

                              <tr className="bg-gray-100 font-semibold">
                                <td colSpan={4} className="text-right p-2 border-t border-b">Tổng tiền:</td>
                                <td className="text-right p-2 border-t border-b text-blue-600">
                                  {formatCurrency(order.total_price)}
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

                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
