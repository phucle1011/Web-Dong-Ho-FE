import { useEffect, useState } from "react";
import axios from "axios";
import Constants from "../../../../Constants";
import { Link } from "react-router-dom";
import {
  FaAngleDoubleLeft,
  FaChevronLeft,
  FaChevronRight,
  FaAngleDoubleRight,
  FaSearch,
  FaEye
} from "react-icons/fa";

function CartPage() {
  const [cartItems, setCartItems] = useState([]); // raw data từ API
  const [groupedUsers, setGroupedUsers] = useState([]); // dữ liệu nhóm theo user
  const [searchTerm, setSearchTerm] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const limit = 5;
  const totalPages = Math.ceil(groupedUsers.length / limit);
  const currentData = groupedUsers.slice((currentPage - 1) * limit, currentPage * limit);

  useEffect(() => {
    fetchAllCart();
  }, []);

  // Lấy dữ liệu và gom nhóm theo user
  const fetchAllCart = async () => {
    try {
      const response = await axios.get(`${Constants.DOMAIN_API}/admin/cart/list`);
      const data = response.data.data || [];

      setCartItems(data);
      setCurrentPage(1);
      setSearchTerm("");

      // Gom nhóm theo user id
      const grouped = data.reduce((acc, item) => {
        const userId = item.user?.id;
        if (!userId) return acc;

        if (!acc[userId]) {
          acc[userId] = {
            userId,
            userName: item.user.name || "Không rõ",
            productsCount: 0,
          };
        }
        acc[userId].productsCount += 1; // cộng sản phẩm trong giỏ

        return acc;
      }, {});

      // Chuyển từ object sang mảng
      setGroupedUsers(Object.values(grouped));
    } catch (error) {
      console.error("Error fetching cart:", error);
    }
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      setCurrentPage(page);
    }
  };

  const handleSearch = async () => {
    try {
      if (searchTerm.trim() === "") {
        fetchAllCart();
        return;
      }

      // Gọi API tìm kiếm (giả sử API trả dữ liệu theo từng sản phẩm)
      const response = await axios.get(
        `${Constants.DOMAIN_API}/admin/cart/list?search=${encodeURIComponent(searchTerm)}`
      );
      const data = response.data.data || [];

      setCartItems(data);
      setCurrentPage(1);

      // Gom nhóm lại như fetchAllCart
      const grouped = data.reduce((acc, item) => {
        const userId = item.user?.id;
        if (!userId) return acc;

        if (!acc[userId]) {
          acc[userId] = {
            userId,
            userName: item.user.name || "Không rõ",
            productsCount: 0,
          };
        }
        acc[userId].productsCount += 1;

        return acc;
      }, {});
      setGroupedUsers(Object.values(grouped));
    } catch (error) {
      console.error("Error searching cart:", error);
    }
  };

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12 d-flex align-items-stretch">
          <div className="card w-100">
            <div className="card-body p-4">
              <h5 className="card-title fw-semibold mb-4">Danh sách giỏ hàng</h5>

              <div className="mb-4 d-flex" style={{ maxWidth: "100%" }}>
                <input
                  type="text"
                  className="flex-grow border border-gray-300 rounded py-2 px-4 text-gray-700 leading-tight focus:ring-2 focus:ring-blue-500"
                  placeholder="Tìm theo tên người dùng..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button
                  className="bg-blue-900 hover:bg-blue-800 text-white px-4 py-1.5 rounded ms-2"
                  onClick={handleSearch}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1010.5 3a7.5 7.5 0 006.15 13.65z" />
                  </svg>
                </button>
              </div>

              <div className="table-responsive">
                <table className="table text-nowrap mb-0 align-middle">
                  <thead className="text-dark fs-4">
                    <tr>
                      <th>ID</th> {/* Cột ID thứ tự */}
                      <th>Người dùng</th>
                      <th>Số sản phẩm</th>
                      <th>Chi tiết</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentData.length > 0 ? (
                      currentData.map((user, index) => (
                        <tr key={user.userId}>
                          <td>{(currentPage - 1) * limit + index + 1}</td> {/* ID tăng dần */}
                          <td>{user.userName}</td>
                          <td>{user.productsCount}</td>
                          <td>
                            <Link
                              to={`/admin/carts/detail/${user.userId}`}
                              className="bg-blue-500 text-white p-2 rounded w-10 h-10 inline-flex items-center justify-center"
                            >
                              <FaEye size={16} className="font-bold" />
                            </Link>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="text-center">
                          Không có dữ liệu giỏ hàng
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-center mt-4 items-center">
                <div className="flex items-center space-x-1">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(1)}
                    className="px-2 py-1 border rounded disabled:opacity-50"
                  >
                    <FaAngleDoubleLeft />
                  </button>

                  <button
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                    className="px-2 py-1 border rounded disabled:opacity-50"
                  >
                    <FaChevronLeft />
                  </button>

                  {currentPage > 2 && (
                    <>
                      <button
                        onClick={() => handlePageChange(1)}
                        className="px-3 py-1 border rounded"
                      >
                        1
                      </button>
                      {currentPage > 3 && <span className="px-2">...</span>}
                    </>
                  )}

                  {[...Array(totalPages)].map((_, i) => {
                    const page = i + 1;
                    if (page >= currentPage - 1 && page <= currentPage + 1) {
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-1 border rounded ${currentPage === page
                              ? "bg-blue-500 text-white"
                              : "bg-blue-100 text-black hover:bg-blue-200"
                            }`}
                        >
                          {page}
                        </button>
                      );
                    }
                    return null;
                  })}

                  {currentPage < totalPages - 1 && (
                    <>
                      {currentPage < totalPages - 2 && <span className="px-2">...</span>}
                      <button
                        onClick={() => handlePageChange(totalPages)}
                        className="px-3 py-1 border rounded"
                      >
                        {totalPages}
                      </button>
                    </>
                  )}

                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                    className="px-2 py-1 border rounded disabled:opacity-50"
                  >
                    <FaChevronRight />
                  </button>

                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange(totalPages)}
                    className="px-2 py-1 border rounded disabled:opacity-50"
                  >
                    <FaAngleDoubleRight />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CartPage;
