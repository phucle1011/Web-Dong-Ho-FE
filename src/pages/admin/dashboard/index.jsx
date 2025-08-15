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
import CountUp from 'react-countup';
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
  const [topLimit, setTopLimit] = useState(4);
  const [bestSellers, setBestSellers] = useState([]);
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
    async function fetchTopBestSellers() {
      try {
        const res = await axios.get(`${Constants.DOMAIN_API}/admin/dashboard/best-sellers`, {
          params: { limit: topLimit }
        });
        if (res.data.status === 200) {
          setBestSellers(res.data.data);
        }
      } catch (err) {
        console.error("Lỗi khi lấy top sản phẩm bán chạy:", err);
      }
    }

    fetchTopBestSellers();
  }, [topLimit]);

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
              totalCompleted: safeNumber(rawImpact.totals.totalCompleted),
              ordersWithPromo: safeNumber(rawImpact.totals.promoOrderCount),
              ordersWithoutPromo: safeNumber(rawImpact.totals.ordersWithoutPromo),
              redemptionRate: safeNumber(rawImpact.totals.redemptionRate),

              revenueWithPromo: safeNumber(rawImpact.revenue.withPromo),
              revenueWithoutPromo: safeNumber(rawImpact.revenue.withoutPromo),
              totalDiscount: safeNumber(rawImpact.revenue.totalDiscount),
              AOVWithPromo: safeNumber(rawImpact.revenue.AOVWithPromo),
              AOVWithoutPromo: safeNumber(rawImpact.revenue.AOVWithoutPromo),
            };
          } else {
            // API cũ (phẳng)
            normalizedImpact = {
              totalCompleted: safeNumber(rawImpact.totalCompleted),
              ordersWithPromo: safeNumber(rawImpact.ordersWithPromo),
              ordersWithoutPromo: safeNumber(rawImpact.ordersWithoutPromo),
              redemptionRate: safeNumber(rawImpact.redemptionRate),
              revenueWithPromo: safeNumber(rawImpact.revenueWithPromo),
              revenueWithoutPromo: safeNumber(rawImpact.revenueWithoutPromo),
              totalDiscount: safeNumber(rawImpact.totalDiscount),
              AOVWithPromo: safeNumber(rawImpact.AOVWithPromo),
              AOVWithoutPromo: safeNumber(rawImpact.AOVWithoutPromo),
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

  const orderStatusLabels = ['Chờ xác nhận', 'Đã xác nhận', 'Đang giao', 'Đã giao hàng thành công', 'Hoàn thành', 'Đã hủy'];
  const orderStatusKeys = ['pending', 'confirmed', 'shipping', 'delivered', 'completed', 'cancelled'];

  const orderStatusData = orderStatus ? {
    labels: orderStatusLabels,
    datasets: [{
      label: 'Đơn hàng',
      data: orderStatusKeys.map(k => orderStatus[k] || 0),
      backgroundColor: ['#ffc107', '#0d6efd', '#17a2b8', '#28a745', '#dc3545', '#6c757d'],
      borderWidth: 1
    }]
  } : null;

  const promoRevenueCompare = promoImpact ? {
    labels: ['Không có', 'Có'],
    datasets: [{
      label: 'Doanh thu',
      data: [
        safeNumber(promoImpact.revenueWithoutPromo),
        safeNumber(promoImpact.revenueWithPromo)
      ],
      backgroundColor: ['rgba(108,117,125,0.5)', 'rgba(40,167,69,0.5)'],
      borderColor: ['rgba(108,117,125,1)', 'rgba(40,167,69,1)'],
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

  function PromoStatCard({ title, value, percentage = 0, pathColor = "#10b981" }) {
    const pct = Number.isFinite(+percentage) ? Math.max(0, Math.min(100, +percentage)) : 0;

    const waveFillPath = React.useMemo(() => {
      const W = 360;
      const H = 120;
      const amplitude = 8;
      const baseline = (1 - pct / 100) * (H - 20) + 10;
      const steps = 24;
      const dx = W / steps;

      let d = `M0,${baseline}`;
      for (let i = 0; i <= steps; i++) {
        const x = i * dx;
        const y = baseline + Math.sin((i / steps) * Math.PI * 2) * amplitude;
        d += ` L${x},${y}`;
      }
      d += ` L${W},${H} L0,${H} Z`;
      return d;
    }, [pct]);

    const waveStrokePath = React.useMemo(() => {
      const W = 360;
      const H = 120;
      const amplitude = 8;
      const baseline = (1 - pct / 100) * (H - 20) + 10;
      const steps = 48;
      const dx = W / steps;

      let d = `M0,${baseline}`;
      for (let i = 0; i <= steps; i++) {
        const x = i * dx;
        const y = baseline + Math.sin((i / steps) * Math.PI * 2) * amplitude;
        d += ` L${x},${y}`;
      }
      return d;
    }, [pct]);

    return (
      <div
        className="bg-white rounded-3 shadow-sm px-4 py-3 d-flex flex-column justify-content-between"
        style={{ position: "relative", overflow: "hidden", minHeight: 140 }}
      >
        <div>
          <div className="text-muted small fw-semibold text-uppercase">{title}</div>
          <div className="h4 mb-0">{value}</div>
        </div>

        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 60 }}>
          <svg width="100%" height="100%" viewBox="0 0 360 120" preserveAspectRatio="none">
            <path d={waveFillPath} fill={pathColor} opacity="0.15" />
            <path d={waveStrokePath} stroke={pathColor} strokeWidth="2" fill="none" />
          </svg>
        </div>
      </div>
    );
  }

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
        {promoImpact && (
          <div className="row g-3 mt-3 mb-5">
            <div className="col-md-3">
              <PromoStatCard
                title="Tỉ lệ dùng khuyến mãi"
                value={`${redemptionRateSafe.toFixed(1)}%`}
                percentage={
                  promoImpact.totalCompleted === 0
                    ? 0
                    : ((promoImpact.ordersWithPromo - promoImpact.ordersWithoutPromo) / promoImpact.totalCompleted) * 100
                }
                isUp={promoImpact.ordersWithPromo >= promoImpact.ordersWithoutPromo}
                pathColor="#0ea5e9"
              />
            </div>
            <div className="col-md-3">
              <PromoStatCard
                title="Tổng giảm giá đã áp dụng"
                value={formatVND(promoImpact.totalDiscount)}
                percentage={
                  (promoImpact.totalDiscount / (promoImpact.revenueWithPromo + promoImpact.totalDiscount)) * 100
                }
                isUp={true}
                pathColor="#10b981"
              />
            </div>
            <div className="col-md-3">
              <PromoStatCard
                title="AOV có khuyến mãi"
                value={formatVND(promoImpact.AOVWithPromo)}
                percentage={
                  promoImpact.AOVWithoutPromo === 0
                    ? 0
                    : ((promoImpact.AOVWithPromo - promoImpact.AOVWithoutPromo) / promoImpact.AOVWithoutPromo) * 100
                }
                isUp={promoImpact.AOVWithPromo >= promoImpact.AOVWithoutPromo}
                pathColor="#f59e0b"
              />
            </div>
            <div className="col-md-3">
              <PromoStatCard
                title="AOV không khuyến mãi"
                value={formatVND(promoImpact.AOVWithoutPromo)}
                percentage={
                  promoImpact.AOVWithPromo === 0
                    ? 0
                    : ((promoImpact.AOVWithoutPromo - promoImpact.AOVWithPromo) / promoImpact.AOVWithPromo) * 100
                }
                isUp={promoImpact.AOVWithoutPromo >= promoImpact.AOVWithPromo}
                pathColor="#ef4444"
              />
            </div>
          </div>
        )}

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

        {bestSellers.length > 0 && (
          <div className="row mt-4">
            <div className="col-12">
              <div className="card">
                <div className="card-header d-flex justify-content-between align-items-center fw-semibold">
                  <span>Top {topLimit} Sản phẩm bán chạy</span>
                  <select
                    className="form-select form-select-sm w-auto"
                    value={topLimit}
                    onChange={(e) => setTopLimit(Number(e.target.value))}
                  >
                    {[4, 5, 10, 20, 50].map((n) => (
                      <option key={n} value={n}>
                        Top {n}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="card-body">
                  {bestSellers.map((item, index) => {
                    const product = item.variant?.product;
                    const imageUrl = product?.thumbnail || "/images/no-image.png";
                    return (
                      <div
                        key={index}
                        className="d-flex mb-4 p-3 border rounded shadow-sm align-items-center"
                      >
                        <img
                          src={imageUrl}
                          alt={product?.name}
                          className="rounded me-3"
                          style={{ width: 60, height: 60, objectFit: "cover" }}
                        />
                        <div className="flex-grow-1">
                          <strong>{product?.name}</strong> – Đã bán{" "}
                          <strong>{item.totalSold}</strong> lần
                          <div className="text-muted small">
                            SKU: {item.variant?.sku}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default Dashboard;