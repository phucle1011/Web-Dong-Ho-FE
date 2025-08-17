// FE/src/pages/admin/wishlist/getAll/index.jsx
import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import Constants from "../../../../Constants.jsx";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import { FaAngleDoubleLeft, FaChevronLeft, FaChevronRight, FaAngleDoubleRight, FaEye } from 'react-icons/fa';
import Chart from 'react-apexcharts';

function WishlistList() {
  const [groupedWishlistItems, setGroupedWishlistItems] = useState([]);
  const [mostFavoritedVariants, setMostFavoritedVariants] = useState([]);
  const [recentlyFavoritedVariants, setRecentlyFavoritedVariants] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearchTerm, setAppliedSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [modalItems, setModalItems] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const limit = 10;

  // Chỉ giữ icon menu (download)
  const chartToolbarMenuOnly = useMemo(() => ({
    toolbar: {
      show: true,
      tools: { download: true, selection: false, zoom: false, zoomin: false, zoomout: false, pan: false, reset: false },
      export: {
        csv: { filename: 'wishlist' },
        svg: { filename: 'wishlist' },
        png: { filename: 'wishlist' },
      },
    },
  }), []);

  // Rút gọn giữa, giữ đuôi (VD: "Đồng hồ O…GL-D")
  const middleEllipsis = (s, max = 18, tail = 6) => {
    const str = String(s ?? "");
    if (str.length <= max) return str;
    const headLen = Math.max(1, max - tail - 1);
    return `${str.slice(0, headLen)}…${str.slice(-tail)}`;
  };

  const sanitizedMost = useMemo(
    () => mostFavoritedVariants.filter(v => v?.variant?.product?.name?.trim()),
    [mostFavoritedVariants]
  );
  const sanitizedRecent = useMemo(
    () => recentlyFavoritedVariants.filter(v => v?.variant?.product?.name?.trim()),
    [recentlyFavoritedVariants]
  );

  // -------- PIE --------
  const pieSeries = useMemo(
    () => sanitizedMost.map(item => Number(item.favoriteCount || 0)),
    [sanitizedMost]
  );

  const correctedPercents = useMemo(() => {
    const total = pieSeries.reduce((a, b) => a + (+b || 0), 0);
    if (!total) return [];
    const raw = pieSeries.map(c => (c * 100) / total);
    const rounded = raw.map(p => Math.round(p * 10) / 10);
    const sum = +rounded.reduce((a, b) => a + b, 0).toFixed(1);
    const diff = +(100 - sum).toFixed(1);
    if (Math.abs(diff) >= 0.1) {
      const idx = raw.indexOf(Math.max(...raw));
      rounded[idx] = +(rounded[idx] + diff).toFixed(1);
    }
    return rounded;
  }, [pieSeries]);

  const pieOptions = useMemo(() => ({
    chart: { ...chartToolbarMenuOnly },
    title: { text: 'Top sản phẩm được yêu thích nhiều nhất', align: 'center' },
    labels: sanitizedMost.map(item => item.variant.product.name),
    legend: { position: 'bottom' },
    dataLabels: {
      enabled: true,
      formatter: (_val, opts) => `${(correctedPercents[opts.seriesIndex] ?? 0).toFixed(1)}%`
    },
    tooltip: {
      y: {
        formatter: (_val, { seriesIndex }) => {
          const count = pieSeries[seriesIndex] || 0;
          const pct = correctedPercents[seriesIndex] || 0;
          return `${count} lượt (${pct.toFixed(1)}%)`;
        }
      }
    },
    responsive: [{ breakpoint: 480, options: { chart: { width: 300 }, legend: { position: 'bottom' } } }]
  }), [sanitizedMost, pieSeries, correctedPercents, chartToolbarMenuOnly]);

  // -------- BAR (gần đây) --------
  const categoriesRecent = useMemo(
    () => sanitizedRecent.map(v => (v?.variant?.product?.name || '').trim() || '(Không tên)'),
    [sanitizedRecent]
  );

  const barData = useMemo(() => ({
    categories: categoriesRecent,
    series: [{ name: 'Số lượt', data: sanitizedRecent.map(v => Number(v.favoriteCount || 0)) }]
  }), [categoriesRecent, sanitizedRecent]);

  const barSeries = barData.series;

  // Max theo dữ liệu (tối thiểu 5 để đồ thị đẹp)
  const rawMax = useMemo(() => {
    const arr = (barSeries?.[0]?.data || []).map(Number);
    return arr.length ? Math.max(...arr) : 0;
  }, [barSeries]);

  const yMaxInt = useMemo(() => Math.max(5, Math.ceil(rawMax)), [rawMax]);

  // Với trục nhỏ (≤10) -> tick nguyên 0..yMaxInt; lớn hơn -> 6 tick cho đỡ rối
  const tickAmountInt = useMemo(() => (yMaxInt <= 10 ? yMaxInt : 6), [yMaxInt]);

  const barOptions = useMemo(() => ({
    chart: { type: 'bar', height: 350, ...chartToolbarMenuOnly },
    title: { text: 'Sản phẩm được yêu thích gần đây', align: 'center' },
    plotOptions: { bar: { borderRadius: 4 } },
    xaxis: {
      categories: barData.categories,
      tickPlacement: 'on',
      labels: {
        show: true, rotate: 0, trim: true,
        hideOverlappingLabels: false, showDuplicates: true,
        formatter: (val) => middleEllipsis(val, 18, 6)
      }
    },
    tooltip: {
      x: { formatter: (_v, { dataPointIndex }) => categoriesRecent[dataPointIndex] || '(Không tên)' },
      y: { formatter: (val) => new Intl.NumberFormat('vi-VN').format(val) + ' lượt' }
    },
    dataLabels: { enabled: false },
    yaxis: {
      min: 0,
      max: yMaxInt,              // ép max là số nguyên
      tickAmount: tickAmountInt, // <=10: 0..yMaxInt (bước 1). >10: 6 tick
      forceNiceScale: false,     // tránh chia thập phân lẻ
      decimalsInFloat: 0,        // hiển thị số nguyên
      labels: {
        formatter: (val) =>
          new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(val)
      }
    }
  }), [barData, categoriesRecent, chartToolbarMenuOnly, yMaxInt, tickAmountInt]);

  // ---------- Effects ----------
  useEffect(() => { fetchGroupedWishlist(currentPage); }, [currentPage, appliedSearchTerm]);
  useEffect(() => { fetchStatistics(); }, []);

  // ---------- API ----------
  const fetchGroupedWishlist = async (page) => {
    setLoading(true);
    try {
      const url = appliedSearchTerm.trim()
        ? `${Constants.DOMAIN_API}/admin/wishlist/search`
        : `${Constants.DOMAIN_API}/admin/wishlist`;
      const params = { page, limit, ...(appliedSearchTerm.trim() && { searchTerm: appliedSearchTerm.trim() }) };
      const res = await axios.get(url, { params });
      if (res.data.status === 200) {
        setGroupedWishlistItems(res.data.data);
        setTotalPages(res.data.totalPages || 1);
        setSearchError('');
      } else {
        setGroupedWishlistItems([]);
        setTotalPages(1);
        setSearchError('Không tìm thấy danh sách yêu thích nào.');
      }
    } catch {
      toast.error('Lỗi khi tải danh sách yêu thích');
    } finally { setLoading(false); }
  };

  const fetchStatistics = async () => {
    try {
      const mostRes = await axios.get(`${Constants.DOMAIN_API}/admin/wishlist/most-favorited?limit=5`);
      if (mostRes.data.status === 200) setMostFavoritedVariants(mostRes.data.data);
      const recentRes = await axios.get(`${Constants.DOMAIN_API}/admin/wishlist/recently-favorited?days=30&limit=5`);
      if (recentRes.data.status === 200) setRecentlyFavoritedVariants(recentRes.data.data);
    } catch (error) {
      toast.error(`Lỗi khi tải thống kê: ${error?.response?.data?.error || error.message}`);
    }
  };

  // ---------- Helpers ----------
  const handleSearchSubmit = () => { setCurrentPage(1); setAppliedSearchTerm(searchTerm.trim()); };
  const handlePageChange = (page) => setCurrentPage(page);
  const formatCurrency = (price) =>
    price ? parseFloat(price).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }) : '';
  const openModal = (items) => { setModalItems(items); setIsModalOpen(true); };
  const closeModal = () => { setIsModalOpen(false); setModalItems([]); };

  // Render
  return (
    <div className="container mx-auto p-2">
      <div className="bg-white p-4 shadow rounded-md">
        <h2 className="text-xl font-semibold mb-4">Danh sách yêu thích</h2>

        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border p-4 rounded-md bg-gray-50">
            <Chart options={pieOptions} series={pieSeries} type="pie" width="100%" height={350} />
          </div>
          <div className="border p-4 rounded-md bg-gray-50">
            <Chart options={barOptions} series={barData.series} type="bar" width="100%" height={350} />
          </div>
        </div>

        <div className="mb-6 flex items-center gap-2">
          <input
            type="text"
            placeholder="Tìm kiếm tên người dùng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
            className="flex-grow border border-gray-300 rounded py-2 px-4 text-gray-700 leading-tight focus:ring-2 focus:ring-blue-500"
          />
          <button onClick={handleSearchSubmit} className="bg-blue-900 hover:bg-blue-800 text-white px-4 py-1.5 rounded">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1010.5 3a7.5 7.5 0 006.15 13.65z" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="text-center py-4">Đang tải dữ liệu...</div>
        ) : (
          <table className="w-full border-collapse border border-gray-300 mt-3">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-2 border">#</th>
                <th className="p-2 border">Người dùng</th>
                <th className="p-2 border">Yêu thích</th>
                <th className="p-2 border"></th>
              </tr>
            </thead>
            <tbody>
              {searchError ? (
                <tr><td colSpan="4" className="p-4 text-center text-red-500">{searchError}</td></tr>
              ) : groupedWishlistItems.length > 0 ? (
                groupedWishlistItems.map((grp, idx) => (
                  <tr key={grp.user.id} className="border-b hover:bg-gray-50">
                    <td className="p-2 border">{(currentPage - 1) * limit + idx + 1}</td>
                    <td className="p-2 border font-medium w-[180px] whitespace-nowrap overflow-hidden text-ellipsis">
                      {grp.user.name}
                    </td>
                    <td className="p-2 border">
                      <div className="grid grid-cols-4 gap-1 p-1">
                        {grp.wishlistItems.slice(0, 4).map(item => {
                          const prod = item.variant?.product;
                          return (
                            <div key={item.id} className="border p-1 rounded-md text-center max-w-[120px]">
                              {prod?.thumbnail && (
                                <img
                                  src={prod.thumbnail.startsWith('http') ? prod.thumbnail : `${Constants.DOMAIN_API}/Uploads/${prod.thumbnail}`}
                                  alt={prod?.name}
                                  className="w-10 h-10 object-cover rounded mx-auto"
                                />
                              )}
                              <div className="text-sm font-medium truncate w-full">{prod?.name}</div>
                              <div className="text-xs text-gray-600">{formatCurrency(item.variant?.price)}</div>
                            </div>
                          );
                        })}
                        {grp.wishlistItems.length > 4 && (
                          <button onClick={() => openModal(grp.wishlistItems)} className="text-blue-600 underline">
                            ... Xem thêm
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="p-2 border text-center">
                      <Link to={`/admin/wishlist/detail/${grp.user.id}`} className="bg-blue-500 text-white p-2 rounded inline-flex justify-center">
                        <FaEye size={16} />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="4" className="p-4 text-center text-gray-500 italic">Không có dữ liệu</td></tr>
              )}
            </tbody>
          </table>
        )}

        <div className="flex justify-center mt-4 items-center">
          <div className="flex items-center space-x-1">
            <button disabled={currentPage === 1} onClick={() => handlePageChange(1)} className="px-2 py-1 border rounded disabled:opacity-50"><FaAngleDoubleLeft /></button>
            <button disabled={currentPage === 1} onClick={() => handlePageChange(currentPage - 1)} className="px-2 py-1 border rounded disabled:opacity-50"><FaChevronLeft /></button>
            {currentPage > 2 && (
              <>
                <button onClick={() => handlePageChange(1)} className="px-3 py-1 border rounded">1</button>
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
                    className={`px-3 py-1 border rounded ${currentPage === page ? "bg-blue-500 text-white" : "bg-blue-100 text-black hover:bg-blue-200"}`}
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
                <button onClick={() => handlePageChange(totalPages)} className="px-3 py-1 border rounded">{totalPages}</button>
              </>
            )}
            <button disabled={currentPage === totalPages} onClick={() => handlePageChange(currentPage + 1)} className="px-2 py-1 border rounded disabled:opacity-50"><FaChevronRight /></button>
            <button disabled={currentPage === totalPages} onClick={() => handlePageChange(totalPages)} className="px-2 py-1 border rounded disabled:opacity-50"><FaAngleDoubleRight /></button>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-11/12 md:w-3/4 max-w-3xl p-6 relative max-h-[80vh] overflow-y-auto">
            <button onClick={closeModal} className="absolute top-3 right-3 text-gray-700 hover:text-black text-xl font-bold">✕</button>
            <h3 className="text-lg font-semibold mb-4">Danh sách yêu thích</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {modalItems.map(item => {
                const prod = item.variant?.product;
                return (
                  <div key={item.id} className="border p-3 rounded-md text-center">
                    {prod?.thumbnail && (
                      <img
                        src={prod.thumbnail.startsWith('http') ? prod.thumbnail : `${Constants.DOMAIN_API}/Uploads/${prod.thumbnail}`}
                        alt={prod?.name}
                        className="w-full h-32 object-cover mb-2 rounded"
                      />
                    )}
                    <div className="font-medium truncate">{prod?.name}</div>
                    <div className="text-sm text-gray-600">{formatCurrency(item.variant?.price)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WishlistList;
