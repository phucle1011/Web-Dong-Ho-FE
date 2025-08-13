import { useEffect, useState } from "react";
import axios from "axios";
import Constants from "../../../../Constants";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import {
  FaSearch,
  FaAngleDoubleLeft,
  FaChevronLeft,
  FaChevronRight,
  FaAngleDoubleRight,
} from "react-icons/fa";

function AddressList() {
  const [addresses, setAddresses] = useState([]);
  const [limit] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const totalPages = Math.ceil(addresses.length / limit);
  const currentData = addresses.slice((currentPage - 1) * limit, currentPage * limit);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const response = await axios.get(`${Constants.DOMAIN_API}/admin/address/list`);
      setAddresses(response.data.data || []);
      setCurrentPage(1);
      setSearchTerm("");
    } catch (error) {
      console.error("Lỗi khi tải địa chỉ:", error);
    }
  };

  const handleSearch = async () => {
    try {
      if (searchTerm.trim() === "") {
        fetchAddresses();
        return;
      }

      const response = await axios.get(
        `${Constants.DOMAIN_API}/admin/address/list?search=${encodeURIComponent(searchTerm)}`
      );

      setAddresses(response.data.data || []);
      setCurrentPage(1);
    } catch (error) {
      console.error("Lỗi khi tìm kiếm địa chỉ:", error);
    }
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12 d-flex align-items-stretch">
          <div className="card w-100">
            <div className="card-body p-4">
              <h5 className="card-title fw-semibold mb-4">Quản lý địa chỉ người dùng</h5>

              <div className="mb-4 d-flex" style={{ maxWidth: "100%" }}>
                <input
                  type="text"
                  className="border border-gray-300 rounded w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Tìm theo tên người dùng..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
                <button className="bg-blue-900 hover:bg-blue-800 text-white px-4 rounded ml-2" onClick={handleSearch}>
                  <FaSearch />
                </button>
                <button className="ms-2 p-2 border flex gap-2 bg-blue-900 hover:bg-blue-800 text-white py-1 px-3 rounded" onClick={fetchAddresses}>
                  Xem tất cả
                </button>
              </div>

              <div className="table-responsive">
                <table className="table text-nowrap mb-0 align-middle">
                  <thead className="text-dark fs-4">
                    <tr>
                      <th>ID người dùng</th>
                      <th>Tên người dùng</th>
                      <th>Chi tiết</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentData.length > 0 ? (
                      currentData.map((addr) => (
                        <tr key={addr.id}>
                          <td>{addr.user?.id || "N/A"}</td>
                          <td>{addr.user?.name || "Không rõ"}</td>
                          <td>
                            <button
                              className="btn btn-info btn-sm"
                              onClick={() => navigate(`/admin/address/detail/user/${addr.user?.id}`)}
                              disabled={!addr.user?.id}
                            >
                              Xem địa chỉ
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="text-center text-muted">
                          Không có người dùng nào.
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
                      <button onClick={() => handlePageChange(1)} className="px-3 py-1 border rounded">
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
                      <button onClick={() => handlePageChange(totalPages)} className="px-3 py-1 border rounded">
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

export default AddressList;
