import ApexCharts from "apexcharts";

export const profitChartOptions = {
  series: [
    { name: "Earnings this month:", data: [355, 390, 300, 350, 390, 180, 355, 390] },
    { name: "Expense this month:", data: [280, 250, 325, 215, 250, 310, 280, 250] },
  ],
  chart: {
    type: "bar",
    height: 345,
    offsetX: -15,
    toolbar: { show: true },
    foreColor: "#adb0bb",
    fontFamily: "inherit",
    sparkline: { enabled: false },
  },
  colors: ["#5D87FF", "#49BEFF"],
  plotOptions: {
    bar: {
      horizontal: false,
      columnWidth: "35%",
      borderRadius: [6],
      borderRadiusApplication: "end",
      borderRadiusWhenStacked: "all",
    },
  },
  markers: { size: 0 },
  dataLabels: { enabled: false },
  legend: { show: false },
  grid: {
    borderColor: "rgba(0,0,0,0.1)",
    strokeDashArray: 3,
    xaxis: { lines: { show: false } },
  },
  xaxis: {
    type: "category",
    categories: ["16/08", "17/08", "18/08", "19/08", "20/08", "21/08", "22/08", "23/08"],
    labels: { style: { cssClass: "grey--text lighten-2--text fill-color" } },
  },
  yaxis: {
    show: true,
    min: 0,
    max: 400,
    tickAmount: 4,
    labels: { style: { cssClass: "grey--text lighten-2--text fill-color" } },
  },
  stroke: { show: true, width: 3, lineCap: "butt", colors: ["transparent"] },
  tooltip: { theme: "light" },
  responsive: [{ breakpoint: 600, options: { plotOptions: { bar: { borderRadius: 3 } } } }],
};

export const breakupChartOptions = {
  series: [65, 35],
  chart: {
    type: 'donut',
    width: 120,
  },
  labels: ["2023", "2024"],
  colors: ["#5D87FF", "#ECF2FF"],
  responsive: [{
    breakpoint: 480,
    options: {
      chart: {
        
      },
    }
  }],
  plotOptions: {
    pie: {
      donut: {
        size: '70%',
        labels: {
          show: true,
          total: {
            show: true,
            label: '',
            formatter: function(w) {
              return w.globals.seriesTotals.reduce((a, b) => a + b, 0);
            }
          }
        }
      }
    }
  },
  dataLabels: {
    enabled: false,
  },
  legend: {
    show: false,
  },
  tooltip: {
    y: {
      formatter: function(value) {
        return value + ' vé';
      }
    }
  }
};


export const earningChartOptions = {
  series: [{
    name: "Doanh thu",
    data: [20, 35, 45, 30, 50, 45, 60, 70]
  }],
  chart: {
    type: 'area',
    height: 100,
    sparkline: {
      enabled: true
    },
  },
  colors: ['#49BEFF'],
  stroke: {
    curve: 'smooth',
    width: 2,
  },
  fill: {
    type: 'gradient',
    gradient: {
      shadeIntensity: 1,
      opacityFrom: 0.7,
      opacityTo: 0.3,
    },
  },
  tooltip: {
    y: {
      formatter: function(val) {
        return val.toLocaleString('vi-VN') + 'k VND';
      }
    }
  },
  xaxis: {
    type: 'datetime',
    categories: [
      '2023-01-01', '2023-02-01', '2023-03-01', '2023-04-01',
      '2023-05-01', '2023-06-01', '2023-07-01', '2023-08-01'
    ],
  },
};

export const renderChart = ({ selector, options }) => {
  const chartElement = document.querySelector(selector);
  if (chartElement) {
    return new ApexCharts(chartElement, options);
  }
  return null;
};