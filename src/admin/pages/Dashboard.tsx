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
  X,
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
    "Bài viết": ["Thêm mới bài viết", "Chỉnh sửa bài viết", "Xóa bài viết"],
    Voucher: [
      "Thêm mới voucher",
      "Chỉnh sửa voucher",
      "Xóa voucher",
      "Kích hoạt voucher",
    ],
    "Nhân sự": ["Thêm nhân sự", "Chỉnh sửa nhân sự", "Xóa nhân sự"],
  };
  const [stats, setStats] = useState({
    orderCount: 0,
    revenue: 0,
    statusCounts: { pending: 0, processing: 0, completed: 0, cancel: 0 },
  });
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string>("");
  const [currentVideoTitle, setCurrentVideoTitle] = useState<string>("");

  const videoGuides: Record<string, { title: string; url: string }> = {
    "Thêm mới sản phẩm": {
      title: "Hướng dẫn thêm mới sản phẩm",
      url: "/images/createproduct.mp4",
    },
    "Chỉnh sửa sản phẩm": {
      title: "Hướng dẫn chỉnh sửa sản phẩm",
      url: "/images/updateproduct.mp4",
    },
    "Xóa sản phẩm": {
      title: "Hướng dẫn xóa sản phẩm",
      url: "/images/deleteproduct.mp4",
    },
    "Kích hoạt/hủy kích hoạt nhiều sản phẩm": {
      title: "Hướng dẫn kích hoạt/hủy nhiều sản phẩm",
      url: "/images/bulkstatus.mp4",
    },
    "Thêm mới bài viết": {
      title: "Hướng dẫn thêm bài viết mới",
      url: "/images/createblog.mp4",
    },
    "Chỉnh sửa bài viết": {
      title: "Hướng dẫn chỉnh sửa bài viết",
      url: "/images/updateblog.mp4",
    },
    "Xóa bài viết": {
      title: "Hướng dẫn xóa bài viết",
      url: "/images/deleteblog.mp4",
    },
    "Thêm mới voucher": {
      title: "Hướng dẫn thêm voucher mới",
      url: "/images/createvoucher.mp4",
    },
    "Chỉnh sửa voucher": {
      title: "Hướng dẫn chỉnh sửa voucher",
      url: "/images/updatevoucher.mp4",
    },
    "Xóa voucher": {
      title: "Hướng dẫn xóa voucher",
      url: "/images/deletevoucher.mp4",
    },
    "Kích hoạt voucher": {
      title: "Hướng dẫn kích hoạt voucher",
      url: "/images/bulkstatusvoucher.mp4",
    },
    "Thêm nhân viên": {
      title: "Hướng dẫn thêm nhân viên mới",
      url: "/images/createuser.mp4",
    },
    "Chỉnh sửa nhân viên": {
      title: "Hướng dẫn chỉnh sửa thông tin nhân viên",
      url: "/images/updateuser.mp4",
    },
    "Xóa nhân viên": {
      title: "Hướng dẫn xóa nhân viên",
      url: "/images/deleteuser.mp4",
    },
  };

  const openVideoGuide = (action: string) => {
    const guide = videoGuides[action];
    if (guide) {
      setCurrentVideoTitle(guide.title);
      setCurrentVideoUrl(guide.url);
      setShowVideoModal(true);
    } else {
      alert("Video hướng dẫn đang được cập nhật!");
    }
  };

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
                    <button
                      key={action}
                      onClick={() => openVideoGuide(action)}
                      className="w-full px-3 group cursor-pointer"
                    >
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
                          <div className="ml-auto my-auto">
                            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-all" />
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
        {showVideoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-2 border-b bg-gradient-to-r from-blue-500 to-violet-600 text-white">
                <h3 className="text-xl font-bold">{currentVideoTitle}</h3>
                <button
                  onClick={() => setShowVideoModal(false)}
                  className="p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="aspect-w-16 aspect-h-9 bg-black">
                <iframe
                  src={currentVideoUrl + "?autoplay=1"}
                  title={currentVideoTitle}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full min-h-96"
                ></iframe>
              </div>

              <div className="p-4 bg-gray-50 text-center">
                <p className="text-sm text-gray-600">
                  Xem kỹ video để thực hiện đúng thao tác nhé!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Dashboard;
