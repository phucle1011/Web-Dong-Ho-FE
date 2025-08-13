import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Constants from "../../../../Constants";
import { toast } from "react-toastify";
import axios from "axios";
import Swal from "sweetalert2";
import { FaAngleDoubleLeft, FaChevronLeft, FaChevronRight, FaAngleDoubleRight, FaSearch } from 'react-icons/fa';

function WishlistDetail() {
    const { id: userId } = useParams();
    const navigate = useNavigate();

    const [wishlistItems, setWishlistItems] = useState([]);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searchInput, setSearchInput] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 5;

    const formatCurrency = (price) => {
        if (!price) return "0 ₫";
        return parseFloat(price).toLocaleString("vi-VN") + " ₫";
    };

    const fetchWishlist = async (page = 1) => {
        setLoading(true);
        try {
            const res = await axios.get(`${Constants.DOMAIN_API}/admin/users/${userId}/wishlist?page=${page}&limit=${limit}`);
            if (res.data.data && res.data.data.length > 0) {
                setWishlistItems(res.data.data);
                setTotalPages(res.data.totalPages || 1);
                setUser(res.data.data[0]?.user || null);
            } else {
                setWishlistItems([]);
                setUser(null);
            }
        } catch (error) {
            console.error("Lỗi khi lấy danh sách yêu thích:", error);
            toast.error("Không thể tải danh sách yêu thích");
            navigate("/admin/user/getAll");
        } finally {
            setLoading(false);
        }
    };

    const handleSearchSubmit = async () => {
        const value = searchInput.trim();
        if (!value) {
            toast.warning("Vui lòng nhập từ khóa cần tìm.");
            return;
        }

        setLoading(true);
        try {
            const res = await axios.get(
                `${Constants.DOMAIN_API}/admin/users/${userId}/wishlist/search?searchTerm=${value}&page=1&limit=${limit}`
            );
            setWishlistItems(res.data.data || []);
            setTotalPages(res.data.totalPages || 1);
            setCurrentPage(1);
        } catch (error) {
            console.error("Lỗi khi tìm kiếm:", error);
            setWishlistItems([]);
            setTotalPages(1);
        } finally {
            setLoading(false);
        }
    };


    const getVietnameseStatus = (status) => {
        switch (status) {
            case 'active':
                return 'Hoạt động';
            case 'inactive':
                return 'Ngừng hoạt động';
            case 'pending':
                return 'Chờ duyệt';
            case 'locked':
                return 'Bị khóa';
            default:
                return status;
        }
    };

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
        fetchWishlist(newPage);
    };

    const handleSearchChange = (e) => {
        setSearchInput(e.target.value);

        if (e.target.value.trim() === "") {
            handleClearSearch();
        } else {
            setCurrentPage(1);
        }
    };

    const handleClearSearch = () => {
        setSearchInput("");
        setCurrentPage(1);
        fetchWishlist(1);
    };

    useEffect(() => {
        fetchWishlist(currentPage);
    }, [currentPage]);

    return (
        <div className="max-w-6xl mx-auto p-6 bg-white-50 min-h-screen">

            {/* Thông tin người dùng */}
            {user && (
                <div className="bg-white shadow-lg rounded-xl p-6 mb-8 border border-gray-200 mb-6">
                    <h3 className="text-2xl font-bold text-gray-700 mb-5 border-b pb-3">
                        Thông Tin Người Dùng
                    </h3>

                    {/* Layout: Avatar bên trái - Thông tin bên phải */}
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Avatar bên trái */}
                        <div className="md:w-1/3 flex justify-center md:justify-center">
                            {user.avatar ? (
                                <img
                                    src={user.avatar.startsWith('http')
                                        ? user.avatar
                                        : `${Constants.DOMAIN_API}/uploads/${user.avatar}`}
                                    alt={user.name}
                                    className="w-32 h-32 object-cover rounded-full shadow-md border-2 border-gray-300"
                                />
                            ) : (
                                <div className="w-32 h-32 flex items-center justify-center bg-gray-100 rounded-full border-2 border-dashed border-gray-300">
                                    <span className="text-gray-400 text-sm text-center px-2">Không có avatar</span>
                                </div>
                            )}
                        </div>

                        {/* Thông tin bên phải */}
                        <div className="md:w-2/3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
                                {/* Họ tên */}
                                <div className="flex items-center">
                                    <strong className="text-gray-600 w-24">Họ tên:</strong>
                                    <input
                                        type="text"
                                        value={user.name || ''}
                                        readOnly
                                        className="text-gray-800 border border-gray-200 rounded px-3 py-1.5 bg-gray-50 w-full focus:outline-none"
                                    />
                                </div>

                                {/* Email */}
                                <div className="flex items-center">
                                    <strong className="text-gray-600 w-24">Email:</strong>
                                    <input
                                        type="text"
                                        value={user.email || ''}
                                        readOnly
                                        className="text-blue-600 border border-gray-200 rounded px-3 py-1.5 bg-gray-50 w-full cursor-pointer hover:underline focus:outline-none"
                                    />
                                </div>

                                {/* Số điện thoại */}
                                <div className="flex items-center">
                                    <strong className="text-gray-600 w-24">SĐT:</strong>
                                    <input
                                        type="text"
                                        value={user.phone || 'Chưa cập nhật'}
                                        readOnly
                                        className="text-gray-800 border border-gray-200 rounded px-3 py-1.5 bg-gray-50 w-full focus:outline-none"
                                    />
                                </div>

                                {/* Trạng thái */}
                                <div className="flex items-center">
                                    <strong className="text-gray-600 w-24">Trạng thái:</strong>
                                    <span
                                        className={`capitalize px-3 py-1 rounded-full text-sm font-medium ${user.status === 'active'
                                            ? 'bg-green-100 text-green-800'
                                            : user.status === 'inactive'
                                                ? 'bg-red-100 text-red-800'
                                                : user.status === 'pending'
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : 'bg-gray-100 text-gray-800'
                                            }`}
                                    >
                                        {getVietnameseStatus(user.status)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <div className="mb-4 relative flex">
                <input
                    type="text"
                    className="shadow border border-gray-300 rounded w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Tìm kiếm theo tên sản phẩm..."
                    value={searchInput}
                    onChange={handleSearchChange}
                />
                <button
                    type="button"
                    className="bg-blue-900 hover:bg-blue-800 text-white px-4 rounded ml-2"
                    onClick={handleSearchSubmit}
                >
                    <FaSearch className="w-5 h-5" />
                </button>
            </div>

            {loading ? (
                <div className="text-center py-4">Đang tải dữ liệu...</div>
            ) : (
                <>
                    {/* Bảng danh sách yêu thích */}
                    <div className="overflow-x-auto mt-6">
                        <table className="min-w-full shadow-lg rounded-xl p-6 mb-8 border border-gray-200 mb-6">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">STT</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Ảnh</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Tên sản phẩm</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Giá</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Tồn kho</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Thông số</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan="6" className="p-4 text-center text-gray-500">
                                            Đang tải dữ liệu...
                                        </td>
                                    </tr>
                                ) : wishlistItems.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="p-4 text-center text-gray-500 italic">
                                            Người dùng này chưa có sản phẩm yêu thích nào.
                                        </td>
                                    </tr>
                                ) : (
                                    wishlistItems.map((item, index) => {

                                        const variant = item.variant;
                                        const product = variant.product;

                                        // Nhóm thuộc tính theo tên
                                        const attributes = {};
                                        if (variant.attributeValues && variant.attributeValues.length > 0) {
                                            variant.attributeValues.forEach((attrVal) => {
                                                if (attrVal.attribute?.name) {
                                                    attributes[attrVal.attribute.name] = attrVal.value;
                                                }
                                            });
                                        }

                                        return (
                                            <tr key={item.id} className="hover:bg-gray-50 transition">
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                                    {(currentPage - 1) * limit + index + 1}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    {variant.images && variant.images.length > 0 ? (
                                                        <img
                                                            src={variant.images[0].image_url.startsWith('http')
                                                                ? variant.images[0].image_url
                                                                : `${Constants.DOMAIN_API}/uploads/${variant.images[0].image_url}`}
                                                            alt="Biến thể"
                                                            className="w-12 h-12 object-cover rounded"
                                                        />
                                                    ) : product.thumbnail ? (
                                                        <img
                                                            src={product.thumbnail.startsWith('http')
                                                                ? product.thumbnail
                                                                : `${Constants.DOMAIN_API}/uploads/${product.thumbnail}`}
                                                            alt="Thumbnail"
                                                            className="w-12 h-12 object-cover rounded"
                                                        />
                                                    ) : (
                                                        <span className="text-gray-400">Không có ảnh</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-800">
                                                    {product?.name}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                                    {formatCurrency(variant.price)}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                                    {variant.stock || "N/A"}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm">
                                                    {Object.keys(attributes).length > 0 ? (
                                                        <ul className="space-y-1">
                                                            {Object.entries(attributes).map(([key, value]) => (
                                                                <li key={key}>
                                                                    <strong>{key}:</strong> {value}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    ) : (
                                                        <span className="text-gray-400">Không có thông số</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>

                            {/* Phân trang nằm trong bảng */}
                            <tfoot>
                                <tr>
                                    <td colSpan="6" className="p-0 bg-white ">
                                        <div className="flex justify-center mt-4 mb-2 items-center">
                                            <div className="flex items-center space-x-1">
                                                <button
                                                    disabled={currentPage === 1}
                                                    onClick={() => handlePageChange(1)}
                                                    className="px-2 py-1 border rounded disabled:opacity-50"
                                                    title="Đầu trang"
                                                >
                                                    <FaAngleDoubleLeft />
                                                </button>
                                                <button
                                                    disabled={currentPage === 1}
                                                    onClick={() => handlePageChange(currentPage - 1)}
                                                    className="px-2 py-1 border rounded disabled:opacity-50"
                                                    title="Trang trước"
                                                >
                                                    <FaChevronLeft />
                                                </button>

                                                {/* Hiển thị các số trang gần nhất */}
                                                {currentPage > 2 && (
                                                    <>
                                                        <button
                                                            onClick={() => handlePageChange(1)}
                                                            className="px-3 py-1 border rounded hover:bg-blue-100"
                                                        >
                                                            1
                                                        </button>
                                                        {currentPage > 3 && <span className="px-2">...</span>}
                                                    </>
                                                )}

                                                {[...Array(totalPages)].map((_, i) => {
                                                    const page = i + 1;
                                                    if (page >= currentPage - 1 && page <= currentPage + 1 && page <= totalPages) {
                                                        return (
                                                            <button
                                                                key={page}
                                                                onClick={() => handlePageChange(page)}
                                                                className={`px-3 py-1 border rounded ${currentPage === page
                                                                    ? "bg-blue-500 text-white"
                                                                    : "bg-blue-100 hover:bg-blue-200"
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
                                                            className="px-3 py-1 border rounded hover:bg-blue-100"
                                                        >
                                                            {totalPages}
                                                        </button>
                                                    </>
                                                )}

                                                <button
                                                    disabled={currentPage === totalPages}
                                                    onClick={() => handlePageChange(currentPage + 1)}
                                                    className="px-2 py-1 border rounded disabled:opacity-50"
                                                    title="Trang sau"
                                                >
                                                    <FaChevronRight />
                                                </button>
                                                <button
                                                    disabled={currentPage === totalPages}
                                                    onClick={() => handlePageChange(totalPages)}
                                                    className="px-2 py-1 border rounded disabled:opacity-50"
                                                    title="Cuối trang"
                                                >
                                                    <FaAngleDoubleRight />
                                                </button>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </>
            )}

            <div className="mt-6 text-left">
                <button
                    onClick={() => navigate("/admin/wishlist/getAll")}
                    className="bg-gray-600 text-white px-6 py-2 rounded-md shadow-md hover:bg-gray-700 transition duration-200 ease-in-out"
                >
                    Quay lại
                </button>
            </div>
        </div>
    );
}

export default WishlistDetail;