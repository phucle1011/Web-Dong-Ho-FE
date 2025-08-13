import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Constants from "../../../Constants.jsx";
import { FaUsers, FaListAlt, FaCoffee, FaComments, FaShoppingCart, FaTag } from 'react-icons/fa';

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from 'chart.js';

import { Pie, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

function Dashboard() {

  const [counts, setCounts] = useState({
    total_user: 0,
    total_category: 0,
    total_product: 0,
    total_comment: 0,
    total_order: 0,
    total_revenue: 0,
    revenueCurrentMonth: 0,
    revenueLastMonth: 0,
    revenueCurrentYear: 0,
    revenueLastYear: 0,
    total_promotion: 0,
  });

  const [customRange, setCustomRange] = useState({ from: '', to: '' });

  const changePercent = counts.revenueLastMonth === 0
    ? (counts.revenueCurrentMonth > 0 ? 100 : 0)
    : ((counts.revenueCurrentMonth - counts.revenueLastMonth) / counts.revenueLastMonth) * 100;

  const changePercentYear = counts.revenueLastYear === 0
    ? (counts.revenueCurrentYear > 0 ? 100 : 0)
    : ((counts.revenueCurrentYear - counts.revenueLastYear) / counts.revenueLastYear) * 100;

  const [hoveredSection, setHoveredSection] = useState(null);

  const [revenueData, setRevenueData] = useState({
    labels: [],
    datasets: [{
      label: 'Doanh thu',
      data: [],
      backgroundColor: '#007bff',
      borderColor: '#007bff',
      borderWidth: 1
    }]
  });

  const [orderStatus, setOrderStatus] = useState(null);
const [promoImpact, setPromoImpact] = useState(null);
const [topPromos, setTopPromos] = useState([]);

  const totalRevenueSelectedMonth = revenueData.datasets[0]?.data.reduce((sum, val) => sum + val, 0) || 0;

  const safeNumber = (v) => (typeof v === 'number' ? v : Number(v) || 0);

  const formatVND = (number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(number);
  };

  const [bestSellingProduct, setBestSellingProduct] = useState(null);

  useEffect(() => {
    async function fetchCounts() {
      try {
        const res = await axios.get(`${Constants.DOMAIN_API}/admin/dashboard/counts`);
        if (res.data.status === 200) {
          const { best_selling_product, ...rest } = res.data.data;
          setCounts(rest);
          setBestSellingProduct(best_selling_product);
        }
      } catch (err) {
        console.error('Lỗi khi lấy thống kê:', err);
      }
    }
    fetchCounts();
  }, []);

  useEffect(() => {
  const params = {};
  if (customRange.from && customRange.to) {
    params.from = customRange.from;
    params.to = customRange.to;
  }

  (async () => {
  try {
    const params = {};
    if (customRange.from && customRange.to) {
      params.from = customRange.from;
      params.to = customRange.to;
    }

    const [statusRes, impactRes, topRes] = await Promise.all([
      axios.get(`${Constants.DOMAIN_API}/admin/dashboard/order-status`),
      axios.get(`${Constants.DOMAIN_API}/admin/dashboard/promo-impact`, { params }),
      axios.get(`${Constants.DOMAIN_API}/admin/dashboard/top-promotions`, { params: { ...params, limit: 5 } }),
    ]);

    setOrderStatus(statusRes.data?.data || null);

    // ---- Chuẩn hoá promoImpact ----
    const rawImpact = impactRes.data?.data || null;
    let normalizedImpact = null;

    if (rawImpact) {
      if (rawImpact.totals && rawImpact.revenue) {
        // API mới (có totals, revenue)
        normalizedImpact = {
          totalCompleted:    safeNumber(rawImpact.totals.totalCompleted),
          ordersWithPromo:   safeNumber(rawImpact.totals.promoOrderCount),
          ordersWithoutPromo:safeNumber(rawImpact.totals.ordersWithoutPromo),
          redemptionRate:    safeNumber(rawImpact.totals.redemptionRate),

          revenueWithPromo:    safeNumber(rawImpact.revenue.withPromo),
          revenueWithoutPromo: safeNumber(rawImpact.revenue.withoutPromo),
          totalDiscount:       safeNumber(rawImpact.revenue.totalDiscount),
          AOVWithPromo:        safeNumber(rawImpact.revenue.AOVWithPromo),
          AOVWithoutPromo:     safeNumber(rawImpact.revenue.AOVWithoutPromo),
        };
      } else {
        // API cũ (phẳng)
        normalizedImpact = {
          totalCompleted:      safeNumber(rawImpact.totalCompleted),
          ordersWithPromo:     safeNumber(rawImpact.ordersWithPromo),
          ordersWithoutPromo:  safeNumber(rawImpact.ordersWithoutPromo),
          redemptionRate:      safeNumber(rawImpact.redemptionRate),
          revenueWithPromo:    safeNumber(rawImpact.revenueWithPromo),
          revenueWithoutPromo: safeNumber(rawImpact.revenueWithoutPromo),
          totalDiscount:       safeNumber(rawImpact.totalDiscount),
          AOVWithPromo:        safeNumber(rawImpact.AOVWithPromo),
          AOVWithoutPromo:     safeNumber(rawImpact.AOVWithoutPromo),
        };
      }
    }

    setPromoImpact(normalizedImpact);
    setTopPromos(topRes.data?.data || []);
  } catch (e) {
    console.error('Fetch extra dashboard error:', e);
  }
})();

}, [customRange]);

  useEffect(() => {
    async function fetchRevenue() {
      try {
        if (!customRange.from || !customRange.to) {
          setRevenueData({
            labels: [],
            datasets: [{
              label: 'Doanh thu',
              data: [],
              backgroundColor: '#007bff',
              borderRadius: 5,
              borderColor: '#007bff',
              borderWidth: 1,
            }]
          });
          return;
        }

        const params = { from: customRange.from, to: customRange.to };

        const res = await axios.get(`${Constants.DOMAIN_API}/admin/dashboard/revenue`, { params });
        if (res.data.status === 200 && res.data.data) {
          let { items } = res.data.data;

          items = items.filter(item => item.revenue > 0);

          setRevenueData({
            labels: items.map(item => item.date),
            datasets: [{
              label: 'Doanh thu',
              data: items.map(item => item.revenue),
              backgroundColor: 'rgba(0, 123, 255, 0.5)',
              borderColor: 'rgba(0, 123, 255, 1)',
              borderRadius: 5,
              borderWidth: 1,
            }]
          });
        }
      } catch (err) {
        console.error('Lỗi khi lấy dữ liệu doanh thu:', err);
      }
    }

    fetchRevenue();
  }, [customRange]);

  const pieData = {
    labels: ['Người dùng', 'Loại sản phẩm', 'Sản phẩm', 'Bình luận', 'Đơn hàng', 'Khuyến mãi'],
    datasets: [{
      label: 'Số lượng',
      data: [
        counts.total_user,
        counts.total_category,
        counts.total_product,
        counts.total_comment,
        counts.total_order,
        counts.total_promotion,
      ],
      backgroundColor: [
        '#007bff', '#28a745', '#ffc107', '#dc3545', '#6610f2', '#212529'
      ],
      borderWidth: 1,
    }],
  };

  const totalStats = {
    labels: ['Người dùng', 'Loại sản phẩm', 'Sản phẩm', 'Bình luận', 'Đơn hàng', 'Khuyến mãi'],
    datasets: [{
      label: 'Số lượng',
      data: [
        counts.total_user,
        counts.total_category,
        counts.total_product,
        counts.total_comment,
        counts.total_order,
        counts.total_promotion || 0,
      ],
      backgroundColor: [
        '#007bff', '#28a745', '#ffc107', '#dc3545', '#6610f2', '#212529',
      ],
      borderRadius: 5,
    }],
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        callbacks: {
          label: ctx => ` Số lượng: ${ctx.parsed.y}`,
        },
      },
    }
  };

  const barOptionsWithCurrency = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        callbacks: {
          label: ctx => ` Giá tiền: ${formatVND(ctx.parsed.y)}`,
        },
      },
    }
  };

  const statsCards = [
    { key: 'total_user', icon: <FaUsers size={24} />, label: 'Người dùng', bg: 'bg-info' },
    {
      key: 'best_selling_count',
      icon: <FaCoffee size={24} />,
      label: 'Sản phẩm bán chạy',
      bg: 'bg-success',
      value: bestSellingProduct ? parseInt(bestSellingProduct.totalSold) : 0,
    },
    { key: 'total_product', icon: <FaCoffee size={24} />, label: 'Sản phẩm', bg: 'bg-warning' },
    { key: 'total_comment', icon: <FaComments size={24} />, label: 'Bình luận', bg: 'bg-danger' },
    { key: 'total_order', icon: <FaShoppingCart size={24} />, label: 'Đơn hàng', bg: 'bg-secondary' },
    { key: 'total_promotion', icon: <FaTag size={24} />, label: 'Khuyến mãi', bg: 'bg-dark' },
  ];

const orderStatusLabels = ['Chờ xác nhận','Đã xác nhận','Đang giao', 'Đã giao hàng thành công', 'Hoàn thành','Đã hủy'];
const orderStatusKeys   = ['pending','confirmed','shipping', 'delivered', 'completed','cancelled'];

const orderStatusData = orderStatus ? {
  labels: orderStatusLabels,
  datasets: [{
    label: 'Đơn hàng',
    data: orderStatusKeys.map(k => orderStatus[k] || 0),
    backgroundColor: ['#ffc107','#0d6efd','#17a2b8','#28a745','#dc3545','#6c757d'],
    borderWidth: 1
  }]
} : null;

const promoRevenueCompare = promoImpact ? {
  labels: ['Không có','Có'],
  datasets: [{
    label: 'Doanh thu',
    data: [
      safeNumber(promoImpact.revenueWithoutPromo),
      safeNumber(promoImpact.revenueWithPromo)
    ],
    backgroundColor: ['rgba(108,117,125,0.5)','rgba(40,167,69,0.5)'],
    borderColor:     ['rgba(108,117,125,1)','rgba(40,167,69,1)'],
    borderRadius: 6,
    borderWidth: 1
  }]
} : null;

const barCurrencyOpts = {
  responsive: true,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: { label: ctx => ` ${formatVND(ctx.parsed.y)}` }
    },
    title: { display: false }
  },
  scales: {
    y: { ticks: { callback: v => formatVND(v) } }
  }
};

const topPromosChart = topPromos?.length ? {
  labels: topPromos.map(p => `${p.name}${p.code ? ` (${p.code})` : ''}`),
  datasets: [{
    label: 'Số đơn dùng mã',
    data: topPromos.map(p => p.ordersCount),
    backgroundColor: 'rgba(13,110,253,0.5)',
    borderColor: 'rgba(13,110,253,1)',
    borderRadius: 6,
    borderWidth: 1
  }]
} : null;

const horizBarOpts = {
  indexAxis: 'y',
  responsive: true,
  plugins: {
    legend: { display: false },
    tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.x} đơn` } }
  }
};

const redemptionRateSafe = safeNumber(promoImpact?.redemptionRate);

  return (
    <div className="page-wrapper">
      <div className="page-breadcrumb">
        <div className="row">
          <div className="col-12 d-flex no-block align-items-center">
            <div className="ms-auto text-end">
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb">
                  <li className="breadcrumb-item"><a href="/admin">Trang chủ</a></li>
                  <li className="breadcrumb-item active" aria-current="page">Thống kê</li>
                </ol>
              </nav>
            </div>
          </div>
        </div>
      </div>

      <div className="container-fluid">
        
 <div className="row mt-4">
  <div className="col-lg-4">
    <div className="card h-100">
      <div className="card-header fw-semibold text-center">Trạng thái đơn hàng</div>
      <div className="card-body">
        {orderStatusData ? <Pie data={orderStatusData} /> : <div className="text-muted">Không có dữ liệu</div>}
      </div>
    </div>
  </div>

  <div className="col-lg-4">
    <div className="card h-100">
      <div className="card-header fw-semibold text-center">Doanh thu: Có khuyến mãi với không có khuyến mãi</div>
      <div className="card-body">
        {promoRevenueCompare ? <Bar data={promoRevenueCompare} options={barCurrencyOpts} /> : <div className="text-muted">Chọn khoảng ngày để xem</div>}
      </div>
    </div>
  </div>

  <div className="col-lg-4">
    <div className="card h-100">
      <div className="card-header fw-semibold text-center">Top 5 khuyến mãi được dùng nhiều</div>
      <div className="card-body">
        {topPromosChart ? <Bar data={topPromosChart} options={horizBarOpts} /> : <div className="text-muted">Chưa có dữ liệu</div>}
      </div>
    </div>
  </div>
</div>

{promoImpact && (
  <div className="row g-3 mt-3">
    <div className="col-md-3 h-30">
      <div className="card shadow-sm">
        <div className="card-body">
          <div className="text-muted small mb-1">Tỉ lệ dùng khuyến mãi</div>
         <div className="h4 mb-0">{redemptionRateSafe.toFixed(1)}% </div>
          <div className="small text-secondary mt-1">({promoImpact.ordersWithPromo}/{promoImpact.totalCompleted} đơn hoàn thành)</div>
        </div>
      </div>
    </div>
    <div className="col-md-3">
      <div className="card shadow-sm">
        <div className="card-body">
          <div className="text-muted small mb-1">Tổng giảm giá đã áp dụng</div>
          <div className="h4 mb-0">{formatVND(safeNumber(promoImpact?.totalDiscount))}</div>
        </div>
      </div>
    </div>
    <div className="col-md-3">
      <div className="card shadow-sm">
        <div className="card-body">
          <div className="text-muted small mb-1">Tổng đơn hàng có khuyến mãi</div>
          <div className="h4 mb-0">{formatVND(safeNumber(promoImpact?.AOVWithPromo))}</div>
        </div>
      </div>
    </div>
    <div className="col-md-3">
      <div className="card shadow-sm">
        <div className="card-body">
          <div className="text-muted small mb-1">Tổng đơn hàng không có khuyến mãi</div>
         <div className="h4 mb-0">{formatVND(safeNumber(promoImpact?.AOVWithoutPromo))}</div>
        </div>
      </div>
    </div>
  </div>
)}


        {/* <div className="row g-3">
          {statsCards.map(({ key, icon, label, bg }, idx) => (
            <div className="col-6 col-md-4 col-lg-2" key={idx}>
              <div className="card border-0 shadow-sm rounded-2">
                <div
                  className={`text-white text-center ${bg} rounded-2 py-3`}
                  title={label}
                  onMouseEnter={(e) => {
                    e.currentTarget.classList.add('shadow');
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.opacity = '0.9';
                    e.currentTarget.style.transition = 'all 0.2s ease';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.classList.remove('shadow');
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.opacity = '1';
                  }}
                >
                  <div className="d-flex justify-content-center align-items-center gap-2 mb-2">
                    <span className="fs-4">{counts[key]}</span>
                    <span>{icon}</span>
                  </div>
                  <div className="text-uppercase fw-semibold small">{label}</div>
                </div>
              </div>
            </div>
          ))}
        </div> */}


        {/* {bestSellingProduct ? (
  <div className="d-flex align-items-center justify-content-between">
    <div>
      <h5 className="fw-bold">{bestSellingProduct.variant?.name}</h5>
      <p className="mb-1">SKU: {bestSellingProduct.variant?.sku}</p>
      <p className="mb-1">Thuộc sản phẩm: {bestSellingProduct.variant?.product?.name}</p>
      <p className="mb-1">Giá: {formatVND(bestSellingProduct.variant?.price)}</p>
      <p className="mb-0">Đã bán: {bestSellingProduct.totalSold} lần</p>
    </div>
    <div className="text-end">
      <span className="badge bg-success fs-5">Bán chạy</span>
    </div>
  </div>
) : (
  <p>Không có dữ liệu sản phẩm bán chạy.</p>
)} */}

        <div className="row">
          <div className="col-lg-8 d-flex align-items-stretch">
            <div className="card w-100">
              <div className="card-body">
                <div className="d-sm-flex d-block align-items-center justify-content-between mb-9">
                  <div className="mb-3 mb-sm-0">
                    {customRange.from ? (
                      <h5 className="card-title fw-semibold">
                        Tổng Quan Doanh Thu: {formatVND(totalRevenueSelectedMonth)}
                      </h5>
                    ) : (
                      <h5 className="card-title fw-semibold text-danger">
                        Vui lòng chọn ngày bạn muốn xem doanh thu
                      </h5>
                    )}
                  </div>
                  <div>
                    <div className="d-flex gap-2 align-items-center">
                      <input
                        type="date"
                        className="form-control"
                        value={customRange.from}
                        onChange={(e) => setCustomRange({ ...customRange, from: e.target.value })}
                      />
                      <span>đến</span>
                      <input
                        type="date"
                        className="form-control"
                        value={customRange.to}
                        onChange={(e) => setCustomRange({ ...customRange, to: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                {customRange.from && (
                  <Bar data={revenueData} options={barOptionsWithCurrency} />
                )}
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="row">
              <div className="col-lg-12">
                <div className="card overflow-hidden">
                  <div className="card-body p-4">
                    <h5 className="card-title mb-9 fw-semibold">Tổng Kết Năm</h5>
                    <div className="row align-items-center">
                      <div className="col-8">
                        <h4 className="fw-semibold mb-3">
                          {counts ? formatVND(counts.revenueCurrentYear) : '...'}
                        </h4>
                        {counts && (
                          <div className="d-flex align-items-center pb-1">
                            <span className={`me-2 rounded-circle round-20 d-flex align-items-center justify-content-center ${changePercentYear >= 0 ? 'bg-light-success' : 'bg-light-danger'}`}>
                              <i className={`ti ${changePercentYear >= 0 ? 'ti-arrow-up-right text-success' : 'ti-arrow-down-right text-danger'}`}></i>
                            </span>
                            <p className={`text-dark me-1 fs-3 mb-0 ${changePercentYear >= 0 ? 'text-success' : 'text-danger'}`}>
                              {Math.abs(changePercentYear).toFixed(1)}%
                            </p>
                            <p className="fs-3 mb-0">so với năm trước</p>
                          </div>
                        )}
                      </div>
                      <div className="col-4">
                        <div className="d-flex justify-content-end">
                          <div className="text-white bg-secondary rounded-circle p-6 d-flex align-items-center justify-content-center">
                            <i className="ti ti-currency-dollar fs-6"></i>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-lg-12">
                <div className="card">
                  <div className="card-body">
                    <div className="row align-items-start">
                      <div className="col-8">
                        <h5 className="card-title mb-9 fw-semibold">Doanh Thu Tháng</h5>
                        <h4 className="fw-semibold mb-3">
                          {counts ? formatVND(counts.revenueCurrentMonth) : '...'}
                        </h4>
                        {counts && (
                          <div className="d-flex align-items-center pb-1">
                            <span className={`me-2 rounded-circle round-20 d-flex align-items-center justify-content-center ${changePercent >= 0 ? 'bg-light-success' : 'bg-light-danger'}`}>
                              <i className={`ti ${changePercent >= 0 ? 'ti-arrow-up-right text-success' : 'ti-arrow-down-right text-danger'}`}></i>
                            </span>
                            <p className={`text-dark me-1 fs-3 mb-0 ${changePercent >= 0 ? 'text-success' : 'text-danger'}`}>
                              {Math.abs(changePercent).toFixed(1)}%
                            </p>
                            <p className="fs-3 mb-0">so với tháng trước</p>
                          </div>
                        )}
                      </div>
                      <div className="col-4">
                        <div className="d-flex justify-content-end">
                          <div className="text-white bg-secondary rounded-circle p-6 d-flex align-items-center justify-content-center">
                            <i className="ti ti-currency-dollar fs-6"></i>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row mt-4">
          <div className="col-lg-6">
            <div className="card h-100">
              <div className="card-header">Biểu đồ tổng quan số lượng</div>
              <div className="card-body">
                <Pie data={pieData} />
              </div>
            </div>
          </div>

          <div className="col-lg-6">
            <div className="card h-100">
              <div className="card-header">Biểu đồ tổng quan số lượng</div>
              <div className="card-body d-flex justify-content-center align-items-center">
                <Bar data={totalStats} options={barOptions} />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Dashboard;