import React from "react";
import { Link } from "react-router-dom";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import type { ChartOptions } from "chart.js";
import { DateRangePicker, createStaticRanges } from "react-date-range";
import type { Range, RangeKeyDict } from "react-date-range";
import { vi } from "date-fns/locale";
import {
  format,
  startOfDay,
  endOfDay,
  subDays,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfQuarter,
  endOfQuarter,
  subQuarters,
} from "date-fns";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { FaChevronDown } from "react-icons/fa";
import { House } from "lucide-react";
import axios from "axios";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface StatisticsData {
  summary: {
    orderCount: number;
    productCount: number;
    revenue: number;
  };
  categoryChart: { label: string; order_count: number }[];
  topUsers: {
    username: string;
    email?: string | null;
    order_count: number;
    total_spent: number;
  }[];
  topProducts: {
    name: string;
    image_url: string;
    sold_count: number;
    revenue: number;
  }[];
}

const AdminStatistical: React.FC = () => {
  const [dateRange, setDateRange] = React.useState<Range[]>([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: "selection",
    },
  ]);

  const [tempRange, setTempRange] = React.useState<Range[]>(dateRange);
  const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);
  const [stats, setStats] = React.useState<StatisticsData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [employeeId, setEmployeeId] = React.useState<string>("");

  const datePickerRef = React.useRef<HTMLDivElement | null>(null);

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      const res = await axios.get<StatisticsData>("/api/admin/statistics", {
        params: {
          start_date: format(dateRange[0].startDate!, "yyyy-MM-dd"),
          end_date: format(dateRange[0].endDate!, "yyyy-MM-dd"),
          employee_id: employeeId || undefined,
        },
      });
      setStats(res.data);
    } catch (err) {
      console.error("Lỗi tải thống kê:", err);
      alert("Không thể tải dữ liệu thống kê");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchStatistics();
  }, [dateRange, employeeId]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isDatePickerOpen &&
        datePickerRef.current &&
        !datePickerRef.current.contains(event.target as Node)
      ) {
        setIsDatePickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDatePickerOpen]);

  const formattedRange = `${format(
    dateRange[0].startDate!,
    "dd/MM/yyyy"
  )} - ${format(dateRange[0].endDate!, "dd/MM/yyyy")}`;

  const today = new Date();

  const customStaticRanges = [
    {
      label: "Hôm nay",
      range: () => ({
        startDate: startOfDay(today),
        endDate: endOfDay(today),
      }),
    },
    {
      label: "Hôm qua",
      range: () => {
        const yesterday = subDays(today, 1);
        return {
          startDate: startOfDay(yesterday),
          endDate: endOfDay(yesterday),
        };
      },
    },
    {
      label: "7 ngày trước",
      range: () => ({
        startDate: startOfDay(subDays(today, 6)),
        endDate: endOfDay(today),
      }),
    },
    {
      label: "30 ngày trước",
      range: () => ({
        startDate: startOfDay(subDays(today, 29)),
        endDate: endOfDay(today),
      }),
    },
    {
      label: "Tháng này",
      range: () => ({
        startDate: startOfMonth(today),
        endDate: endOfDay(today),
      }),
    },
    {
      label: "Tháng trước",
      range: () => {
        const lastMonth = subMonths(today, 1);
        return {
          startDate: startOfMonth(lastMonth),
          endDate: endOfMonth(lastMonth),
        };
      },
    },
    {
      label: "Quý này",
      range: () => ({
        startDate: startOfQuarter(today),
        endDate: endOfQuarter(today),
      }),
    },
    {
      label: "Quý trước",
      range: () => {
        const lastQuarter = subQuarters(today, 1);
        return {
          startDate: startOfQuarter(lastQuarter),
          endDate: endOfQuarter(lastQuarter),
        };
      },
    },
  ];

  const staticRanges = createStaticRanges(customStaticRanges);

  const handleApply = () => {
    setDateRange(tempRange);
    setIsDatePickerOpen(false);
  };

  const handleCancel = () => {
    setTempRange(dateRange);
    setIsDatePickerOpen(false);
  };

  const chartData = {
    labels: stats?.categoryChart.map((c) => c.label) || [],
    datasets: [
      {
        label: "Số sản phẩm đã bán",
        data: stats?.categoryChart.map((c) => c.order_count) || [],
        backgroundColor: [
          "rgba(54, 162, 235, 0.6)",
          "rgba(255, 99, 132, 0.6)",
          "rgba(123, 55, 132, 0.6)",
          "rgba(75, 211, 132, 0.6)",
          "rgba(255, 206, 86, 0.6)",
        ],
        borderRadius: 6,
      },
    ],
  };

  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => ` ${context.parsed.y} sản phẩm đã bán`,
        },
      },
    },
    scales: {
      x: { title: { display: true, text: "Danh mục" } },
      y: {
        beginAtZero: true,
        title: { display: true, text: "Số lượng sản phẩm đã bán" },
      },
    },
  };

  if (loading) {
    return <div className="p-6 text-center">Đang tải dữ liệu thống kê...</div>;
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <nav className="flex text-sm text-gray-600">
          <ol className="inline-flex items-center space-x-1 md:space-x-2">
            <li className="inline-flex items-center">
              <Link
                to="/admin/dashboard"
                className="hover:text-gray-900 flex items-center gap-2"
              >
                <House className="h-4 w-4" />
                Trang chủ
              </Link>
            </li>
            <li>
              <span className="mx-1">/</span> Báo cáo thống kê
            </li>
          </ol>
        </nav>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex gap-4">
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">
                Thời gian
              </label>
              <div className="relative inline-block" ref={datePickerRef}>
                <button
                  type="button"
                  className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg w-52 p-2.5 flex items-center justify-between"
                  onClick={() => setIsDatePickerOpen((prev) => !prev)}
                >
                  <span className="truncate text-left text-xs">
                    {formattedRange}
                  </span>
                  <FaChevronDown className="w-3 h-3 text-gray-500 flex-shrink-0" />
                </button>
                {isDatePickerOpen && (
                  <div className="absolute z-20 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg">
                    <div className="p-2 font-bold">
                      <DateRangePicker
                        ranges={tempRange}
                        onChange={(ranges: RangeKeyDict) => {
                          const selection = ranges.selection;
                          if (selection) {
                            setTempRange([selection]);
                          }
                        }}
                        staticRanges={staticRanges}
                        inputRanges={[]}
                        moveRangeOnFirstSelection={false}
                        locale={vi}
                        rangeColors={["#2563eb"]}
                        showDateDisplay={true}
                        months={2}
                        direction="horizontal"
                      />
                      <div className="flex justify-end gap-2 mt-2">
                        <button
                          onClick={handleCancel}
                          className="px-3 py-1.5 text-xs rounded border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                        >
                          Hủy
                        </button>
                        <button
                          onClick={handleApply}
                          className="px-3 py-1.5 text-xs rounded bg-blue-600 text-white hover:bg-blue-700"
                        >
                          Áp dụng
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">
                Nhân viên
              </label>
              <select
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-52 p-2"
              >
                <option value="">-- Tất cả --</option>
                <option value="admin">admin</option>
                <option value="employee">employee</option>
                <option value="user">user</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 h-32">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
          <h3 className="text-xl font-bold pb-2">Số đơn hàng</h3>
          <p>{stats?.summary.orderCount ?? 0} đơn</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
          <h3 className="text-xl font-bold pb-2">Số sản phẩm</h3>
          <p>{stats?.summary.productCount ?? 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
          <h3 className="text-xl font-bold pb-2">Doanh thu thuần</h3>
          <p>{(stats?.summary.revenue ?? 0).toFixed(3)}đ</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 bg-white rounded-lg shadow-sm border border-gray-200 p-3">
          <h3 className="text-xl font-bold pb-2">
            Số sản phẩm đã bán theo danh mục
          </h3>
          <div className="h-[500px] pt-4 px-3">
            <Bar data={chartData} options={options} />
          </div>
        </div>

        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
            <h3 className="text-xl font-bold pb-2">Top người dùng đặt hàng</h3>
            {stats?.topUsers.length === 0 ? (
              <p className="text-gray-500 py-4 text-center">Chưa có dữ liệu</p>
            ) : (
              stats?.topUsers.map((user, idx) => (
                <div key={idx} className="justify-between flex py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                      <img
                        src="/images/avatar.png"
                        alt="avatar"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h5 className="text-gray-900 font-medium">
                        {user.username}
                      </h5>
                      <p className="text-sm italic">
                        Đã mua {user.order_count} đơn
                      </p>
                    </div>
                  </div>
                  <div className="my-auto">
                    <p>{user.total_spent.toFixed(3)}đ</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
            <h3 className="text-xl font-bold pb-2">Top sản phẩm bán chạy</h3>
            {stats?.topProducts.length === 0 ? (
              <p className="text-gray-500 py-4 text-center">Chưa có dữ liệu</p>
            ) : (
              stats?.topProducts.map((product, idx) => (
                <div key={idx} className="justify-between flex py-2">
                  <div className="flex items-center gap-3">
                    <div className="w-[53px] h-[53px] rounded-lg bg-gray-200 border-2 border-dashed border-gray-400 overflow-hidden">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {product.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {product.sold_count} đã bán
                      </div>
                    </div>
                  </div>
                  <div className="my-auto">
                    <p>{product.revenue.toFixed(3)}đ</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminStatistical;
