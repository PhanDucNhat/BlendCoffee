// import React, { useState, useEffect } from "react";
// import { Link } from "react-router-dom";
// import {
//   House,
//   LayoutList,
//   Clock,
//   Truck,
//   CheckCircle2,
//   CircleX,
//   ChevronRight,
// } from "lucide-react";
// const Dashboard = () => {
//   const [activeTab, setActiveTab] = useState("Sản phẩm");
//   const tabs = ["Sản phẩm", "Bài viết", "Voucher", "Nhân sự"];
//   const tabActions: Record<string, string[]> = {
//     "Sản phẩm": [
//       "Thêm mới sản phẩm",
//       "Chỉnh sửa sản phẩm",
//       "Xóa sản phẩm",
//       "Kích hoạt/hủy kích hoạt nhiều sản phẩm",
//     ],
//     "Bài viết": [
//       "Thêm mới bài viết",
//       "Chỉnh sửa bài viết",
//       "Xóa bài viết",
//       "Xuất bản bài viết",
//     ],
//     Voucher: [
//       "Thêm mới voucher",
//       "Chỉnh sửa voucher",
//       "Xóa voucher",
//       "Kích hoạt voucher",
//     ],
//     "Nhân sự": [
//       "Thêm nhân viên",
//       "Chỉnh sửa nhân viên",
//       "Xóa nhân viên",
//       "Phân quyền nhân viên",
//     ],
//   };
//   const [stats, setStats] = useState({
//     orderCount: 0,
//     revenue: 0,
//     statusCounts: { pending: 0, processing: 0, completed: 0, canceled: 0 },
//   });

//   interface Order {
//     _id: string;
//     status: "pending" | "processing" | "completed" | "canceled";
//     total?: number;
//     createdAt?: string;
//   }

//   useEffect(() => {
//     const fetchStats = async () => {
//       try {
//         const res = await fetch(
//           "http://localhost:5000/api/admin/dashboard-stats"
//         );
//         if (!res.ok) throw new Error("Fetch failed");
//         const data = await res.json();
//         setStats(data);

//         try {
//           const ordersRes = await fetch(
//             "http://localhost:5000/api/admin/orders"
//           );
//           if (ordersRes.ok) {
//             const orders = await ordersRes.json();
//             const canceledCount = orders.reduce(
//               (acc: number, o: Order) =>
//                 acc + (o.status === "canceled" ? 1 : 0),
//               0
//             );
//             setStats((prev) => ({
//               ...prev,
//               statusCounts: { ...prev.statusCounts, canceled: canceledCount },
//             }));
//           }
//         } catch (err) {
//           console.warn("Failed to fetch orders for canceled count:", err);
//         }
//       } catch (err) {
//         console.error("Error fetching dashboard stats:", err);
//       }
//     };
//     fetchStats();
//   }, []);

//   const statuses = [
//     {
//       icon: Clock,
//       color: "text-yellow-500",
//       label: "Chờ xác nhận",
//       count: stats.statusCounts.pending,
//     },
//     {
//       icon: Truck,
//       color: "text-orange-500",
//       label: "Đang giao",
//       count: stats.statusCounts.processing,
//     },
//     {
//       icon: CheckCircle2,
//       color: "text-green-500",
//       label: "Đã giao",
//       count: stats.statusCounts.completed,
//     },
//     {
//       icon: CircleX,
//       color: "text-red-500",
//       label: "Đã hủy",
//       count: stats.statusCounts.canceled,
//     },
//   ];
//   return (
//     <>
//       <div className="p-4 md:p-6 space-y-4">
//         <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
//           <nav className="flex text-sm text-gray-600">
//             <ol className="inline-flex items-center space-x-1 md:space-x-2">
//               <li className="inline-flex items-center font-bold">
//                 <Link
//                   to="/admin/dashboard"
//                   className="hover:text-gray-900 flex items-center gap-2"
//                 >
//                   <House className="h-4 w-4" />
//                   Trang chủ
//                 </Link>
//               </li>
//             </ol>
//           </nav>
//         </div>
//         <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-80">
//           <div className="lg:col-span-7 space-y-3">
//             <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
//               <h3 className="text-xl font-bold pb-2">Hướng dẫn sử dụng</h3>
//               <div className="-mx-3">
//                 <div className="flex gap-3 pb-3 px-3 overflow-x-auto">
//                   {tabs.map((tab) => (
//                     <button
//                       key={tab}
//                       onClick={() => setActiveTab(tab)}
//                       className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 whitespace-nowrap ${
//                         activeTab === tab
//                           ? "bg-blue-200 text-blue-800"
//                           : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
//                       }`}
//                     >
//                       {tab}
//                     </button>
//                   ))}
//                 </div>
//                 <div className="space-y-3">
//                   {tabActions[activeTab]?.map((action) => (
//                     <button key={action} className="w-full px-3 group">
//                       <div className="bg-white shadow-xl rounded-2xl px-4 py-2 transition-all duration-300 ease-in-out group-hover:shadow-2xl group-hover:-translate-y-1">
//                         <div className="flex gap-3">
//                           <div className="flex">
//                             <div className="w-12 h-12 rounded-full bg-gradient-to-tl from-blue-500 to-violet-500 flex items-center justify-center text-white">
//                               <LayoutList size={24} />
//                             </div>
//                           </div>
//                           <div className="my-auto">
//                             <p className="text-sm font-semibold text-slate-500 dark:text-slate-300">
//                               {action}
//                             </p>
//                           </div>
//                         </div>
//                       </div>
//                     </button>
//                   ))}
//                 </div>
//               </div>
//             </div>
//             <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 max-w-fulll">
//               <h3 className="text-xl font-bold mb-3">Có thể bạn quan tâm</h3>
//               <span className="inline-block text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-md mb-4">
//                 Tin tức
//               </span>
//               <div className="flex items-start gap-4">
//                 <div className="flex-1">
//                   <h4 className="font-semibold text-base mb-1">
//                     🚀 WORKSHOP: Tăng trưởng bứt phá mùa lễ hội với bán hàng đa
//                     kênh trên Facebook, Shopee và TikTok
//                   </h4>
//                   <p className="text-sm text-gray-700 mb-2">
//                     🎉 Bứt tốc mùa lễ hội cùng bán hàng đa kênh 2025–2026!
//                   </p>
//                   <p className="text-sm text-gray-600">
//                     Haravan chính thức đồng hành tại Triển lãm IBTE với workshop
//                     dành riêng cho nhà bán lẻ, thương hiệu, nhà phân phối & nhập
//                     khẩu ngành đồ chơi – sản phẩm trẻ em.
//                   </p>
//                 </div>
//               </div>
//               <div className="my-4 overflow-hidden rounded-lg border">
//                 <img
//                   src="/./images/bg_1.jpg"
//                   alt="Workshop banner"
//                   className="w-full object-cover"
//                 />
//               </div>
//               <div className="flex items-start gap-4">
//                 <div className="flex-1">
//                   <p className="text-sm text-gray-600">
//                     Mùa lễ hội 2025–2026 sẽ là “điểm nóng” tăng trưởng của ngành
//                     đồ chơi & sản phẩm trẻ em. Nhưng thị trường phân mảnh, hành
//                     vi mua sắm thay đổi nhanh và độ cạnh tranh cao đang tạo ra
//                     áp lực lớn cho các nhà bán lẻ, thương hiệu, nhà nhập khẩu và
//                     hệ thống phân phối.
//                   </p>
//                 </div>
//               </div>
//             </div>
//           </div>
//           <div className="lg:col-span-5 space-y-4">
//             <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
//               <h3 className="text-xl font-bold pb-2">
//                 Kết quả doanh thu hôm nay
//               </h3>
//               <div className="flex gap-2">
//                 <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 w-1/2">
//                   <h3 className="text-xl font-bold pb-2">Số đơn hàng</h3>
//                   <p>{stats.orderCount} đơn</p>
//                 </div>
//                 <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 w-1/2">
//                   <h3 className="text-xl font-bold pb-2">Doanh thu</h3>
//                   <p>
//                     {stats.revenue.toLocaleString("vi-VN", {
//                       style: "currency",
//                       currency: "VND",
//                     })}
//                   </p>
//                 </div>
//               </div>
//             </div>
//             <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
//               <h3 className="text-xl font-bold pb-2">Trạng thái đơn hàng</h3>

//               <div className="space-y-3">
//                 {statuses.map((status) => {
//                   const Icon = status.icon;
//                   return (
//                     <Link
//                       to={`/admin/order`}
//                       key={status.label}
//                       className="w-full bg-white rounded-2xl border border-gray-400 px-4 py-3 text-left flex justify-between mb-3
//                          transition-all duration-300 ease-in-out
//                          hover:shadow-lg hover:border-gray-500 hover:-translate-y-1
//                          group"
//                     >
//                       <p
//                         className={`flex gap-3 font-medium ${status.color} group-hover:brightness-110 transition-all`}
//                       >
//                         <Icon className="w-5 h-5" />
//                         {status.label} ({status.count} đơn)
//                       </p>

//                       <p className="my-auto">
//                         <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-gray-700 group-hover:translate-x-1 transition-all" />
//                       </p>
//                     </Link>
//                   );
//                 })}
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// };

// export default Dashboard;

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  House,
  LayoutList,
  Clock,
  Truck,
  CheckCircle2,
  CircleX,
  ChevronRight,
} from "lucide-react";
const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("Sản phẩm");
  const tabs = ["Sản phẩm", "Bài viết", "Voucher", "Nhân sự"];
  const tabActions: Record<string, string[]> = {
    "Sản phẩm": [
      "Thêm mới sản phẩm",
      "Chỉnh sửa sản phẩm",
      "Xóa sản phẩm",
      "Kích hoạt/hủy kích hoạt nhiều sản phẩm",
    ],
    "Bài viết": [
      "Thêm mới bài viết",
      "Chỉnh sửa bài viết",
      "Xóa bài viết",
      "Xuất bản bài viết",
    ],
    Voucher: [
      "Thêm mới voucher",
      "Chỉnh sửa voucher",
      "Xóa voucher",
      "Kích hoạt voucher",
    ],
    "Nhân sự": [
      "Thêm nhân viên",
      "Chỉnh sửa nhân viên",
      "Xóa nhân viên",
      "Phân quyền nhân viên",
    ],
  };
  const [stats, setStats] = useState({
    orderCount: 0,
    revenue: 0,
    statusCounts: { pending: 0, processing: 0, completed: 0, cancel: 0 },
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(
          "http://localhost:5000/api/admin/dashboard-stats"
        );
        if (!res.ok) throw new Error("Fetch failed");
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error("Error fetching dashboard stats:", err);
      }
    };
    fetchStats();
  }, []);

  const statuses = [
    {
      icon: Clock,
      color: "text-yellow-500",
      label: "Chờ xác nhận",
      count: stats.statusCounts.pending,
    },
    {
      icon: Truck,
      color: "text-orange-500",
      label: "Đang giao",
      count: stats.statusCounts.processing,
    },
    {
      icon: CheckCircle2,
      color: "text-green-500",
      label: "Đã giao",
      count: stats.statusCounts.completed,
    },
    {
      icon: CircleX,
      color: "text-red-500",
      label: "Đã hủy",
      count: stats.statusCounts.cancel,
    },
  ];
  return (
    <>
      <div className="p-4 md:p-6 space-y-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <nav className="flex text-sm text-gray-600">
            <ol className="inline-flex items-center space-x-1 md:space-x-2">
              <li className="inline-flex items-center font-bold">
                <Link
                  to="/admin/dashboard"
                  className="hover:text-gray-900 flex items-center gap-2"
                >
                  <House className="h-4 w-4" />
                  Trang chủ
                </Link>
              </li>
            </ol>
          </nav>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-80">
          <div className="lg:col-span-7 space-y-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
              <h3 className="text-xl font-bold pb-2">Hướng dẫn sử dụng</h3>
              <div className="-mx-3">
                <div className="flex gap-3 pb-3 px-3 overflow-x-auto">
                  {tabs.map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 whitespace-nowrap ${
                        activeTab === tab
                          ? "bg-blue-200 text-blue-800"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <div className="space-y-3">
                  {tabActions[activeTab]?.map((action) => (
                    <button key={action} className="w-full px-3 group">
                      <div className="bg-white shadow-xl rounded-2xl px-4 py-2 transition-all duration-300 ease-in-out group-hover:shadow-2xl group-hover:-translate-y-1">
                        <div className="flex gap-3">
                          <div className="flex">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-tl from-blue-500 to-violet-500 flex items-center justify-center text-white">
                              <LayoutList size={24} />
                            </div>
                          </div>
                          <div className="my-auto">
                            <p className="text-sm font-semibold text-slate-500 dark:text-slate-300">
                              {action}
                            </p>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 max-w-fulll">
              <h3 className="text-xl font-bold mb-3">Có thể bạn quan tâm</h3>
              <span className="inline-block text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-md mb-4">
                Tin tức
              </span>
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <h4 className="font-semibold text-base mb-1">
                    🚀 WORKSHOP: Tăng trưởng bứt phá mùa lễ hội với bán hàng đa
                    kênh trên Facebook, Shopee và TikTok
                  </h4>
                  <p className="text-sm text-gray-700 mb-2">
                    🎉 Bứt tốc mùa lễ hội cùng bán hàng đa kênh 2025–2026!
                  </p>
                  <p className="text-sm text-gray-600">
                    Haravan chính thức đồng hành tại Triển lãm IBTE với workshop
                    dành riêng cho nhà bán lẻ, thương hiệu, nhà phân phối & nhập
                    khẩu ngành đồ chơi – sản phẩm trẻ em.
                  </p>
                </div>
              </div>
              <div className="my-4 overflow-hidden rounded-lg border">
                <img
                  src="/./images/bg_1.jpg"
                  alt="Workshop banner"
                  className="w-full object-cover"
                />
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <p className="text-sm text-gray-600">
                    Mùa lễ hội 2025–2026 sẽ là “điểm nóng” tăng trưởng của ngành
                    đồ chơi & sản phẩm trẻ em. Nhưng thị trường phân mảnh, hành
                    vi mua sắm thay đổi nhanh và độ cạnh tranh cao đang tạo ra
                    áp lực lớn cho các nhà bán lẻ, thương hiệu, nhà nhập khẩu và
                    hệ thống phân phối.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
              <h3 className="text-xl font-bold pb-2">
                Kết quả doanh thu hôm nay
              </h3>
              <div className="flex gap-2">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 w-1/2">
                  <h3 className="text-xl font-bold pb-2">Số đơn hàng</h3>
                  <p>{stats.orderCount} đơn</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 w-1/2">
                  <h3 className="text-xl font-bold pb-2">Doanh thu</h3>
                  <p>{stats.revenue} đ</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
              <h3 className="text-xl font-bold pb-2">Trạng thái đơn hàng</h3>

              <div className="space-y-3">
                {statuses.map((status) => {
                  const Icon = status.icon;
                  return (
                    <Link
                      to={`/admin/order`}
                      key={status.label}
                      className="w-full bg-white rounded-2xl border border-gray-400 px-4 py-3 text-left flex justify-between mb-3 
                         transition-all duration-300 ease-in-out 
                         hover:shadow-lg hover:border-gray-500 hover:-translate-y-1 
                         group"
                    >
                      <p
                        className={`flex gap-3 font-medium ${status.color} group-hover:brightness-110 transition-all`}
                      >
                        <Icon className="w-5 h-5" />
                        {status.label} ({status.count} đơn)
                      </p>

                      <p className="my-auto">
                        <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-gray-700 group-hover:translate-x-1 transition-all" />
                      </p>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
