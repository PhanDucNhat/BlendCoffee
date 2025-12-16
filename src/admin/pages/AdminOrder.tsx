import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import {
  getProvinces,
  Province,
  District,
  Ward,
} from "../../../backend/src/data/vietnam";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Plus,
  Download,
  AlertCircle,
  Edit,
  Trash2,
  X,
  Layers2,
  Clock,
  Truck,
  CheckCircle2,
  CircleX,
  Eye,
  Asterisk,
  User,
  Phone,
  MapPin,
  Ticket,
} from "lucide-react";
import { PrintOrder } from "..";

type OrderStatus = "pending" | "processing" | "completed" | "canceled";
type FilterStatus = OrderStatus | "all";

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  size?: string;
  image_url: string;
}

interface Order {
  order_id: number;
  user_id: number;
  username: string;
  subtotal: number;
  delivery_fee: number;
  discount: number;
  total: number;
  payment_method: "cash" | "bank_transfer";
  status: OrderStatus;
  created_at: string;
  fullname: string;
  phone: string;
  full_address: string;
  voucher_code?: string | null;
  items: OrderItem[];
}

interface MenuItem {
  menu_id: number;
  name: string;
  description: string | null;
  image_url: string | null;
  category_id: number;
  status: number;
  category_name: string | null;
  size: string | null;
  price: number | null;
}

const itemsPerPage = 10;
const sizeOptions: ("Small" | "Medium" | "Large")[] = [
  "Small",
  "Medium",
  "Large",
];
const statusInfo = {
  completed: {
    label: "Đã giao",
    icon: CheckCircle2,
    color: "text-green-400",
  },
  processing: { label: "Đang giao", icon: Truck, color: "text-orange-400" },
  pending: { label: "Chờ xác nhận", icon: Clock, color: "text-yellow-400" },
  canceled: { label: "Đã hủy", icon: CircleX, color: "text-red-400" },
};

export default function AdminOrder() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(
    null
  );
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(
    null
  );
  const [selectedWard, setSelectedWard] = useState<Ward | null>(null);
  const [detailAddress, setDetailAddress] = useState("");
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<Record<number, string>>(
    {}
  );
  const [menuItemPrices, setMenuItemPrices] = useState<
    Record<number, Record<string, number>>
  >({});
  const [menuItemQuantities, setMenuItemQuantities] = useState<
    Record<number, number>
  >({});
  const [menuSearchTerm, setMenuSearchTerm] = useState("");
  const [selectedMenuItems, setSelectedMenuItems] = useState<MenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);
  const [menuSearchInputRef, setMenuSearchInputRef] =
    useState<HTMLInputElement | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "bank_transfer">(
    "cash"
  );
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const reactToPrintFn = useReactToPrint({ contentRef });
  const [vouchers, setVouchers] = useState<
    Array<{
      voucher_id: number;
      title: string;
      description?: string | null;
      image_url: string | null;
      quantity: number;
      start_date: string;
      end_date: string;
      status?: 1 | 0;
      discount_type: string;
      discount_value?: number;
    }>
  >([]);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<string>("");
  const [adminUser, setAdminUser] = useState<{
    id: number;
    username?: string;
  } | null>(null);

  const statusCounts = useMemo(() => {
    const counts: Record<FilterStatus, number> = {
      all: orders.length,
      pending: 0,
      processing: 0,
      completed: 0,
      canceled: 0,
    };

    orders.forEach((order) => {
      if (order.status in counts) {
        counts[order.status as OrderStatus] += 1;
      }
    });
    return counts;
  }, [orders]);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getFilterButtonClasses = (key: FilterStatus) =>
    [
      "flex flex-col items-center justify-center gap-x-2 gap-y-0 px-4 py-2 text-sm font-medium min-w-[120px] rounded-lg border transition",
      statusFilter === key
        ? "bg-cyan-600 text-white border-cyan-700 shadow-sm"
        : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50",
    ].join(" ");

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("http://localhost:5000/api/admin/orders");
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(
          `HTTP ${res.status}: ${errText || "Không thể tải danh sách đơn hàng"}`
        );
      }
      const data = (await res.json()) as Order[];
      const normalized = data.map((order) => ({
        ...order,
        status: order.status,
        delivery_fee: Number(order.delivery_fee ?? 0),
        discount: Number(order.discount ?? 0),
        subtotal: Number(order.subtotal ?? 0),
        total: Number(order.total ?? 0),
        fullname: order.fullname ?? "",
        phone: order.phone ?? "",
        full_address: order.full_address ?? "Chưa cập nhật",
      }));
      setOrders(normalized);
      setFilteredOrders(normalized);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Lỗi kết nối server";
      setError(errorMessage);
      console.error("Fetch order error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    const keyword = searchTerm.trim().toLowerCase();
    const startTime = startDate
      ? new Date(`${startDate}T00:00:00`).getTime()
      : null;
    const endTime = endDate ? new Date(`${endDate}T23:59:59`).getTime() : null;

    const filtered = orders.filter((order) => {
      const username = order.username?.toLowerCase() ?? "";
      const fullname = order.fullname?.toLowerCase() ?? "";
      const phone = order.phone?.toLowerCase() ?? "";
      const orderId = `#${order.order_id}`;

      const matchesStatus =
        statusFilter === "all" || order.status === statusFilter;
      const matchesKeyword =
        username.includes(keyword) ||
        fullname.includes(keyword) ||
        phone.includes(keyword) ||
        orderId.toLowerCase().includes(keyword);

      const createdAtTime = new Date(order.created_at).getTime();
      const validStart =
        startTime !== null && Number.isFinite(startTime)
          ? createdAtTime >= startTime
          : true;
      const validEnd =
        endTime !== null && Number.isFinite(endTime)
          ? createdAtTime <= endTime
          : true;

      return matchesStatus && matchesKeyword && validStart && validEnd;
    });
    setFilteredOrders(filtered);
    setCurrentPage(1);
  }, [searchTerm, orders, statusFilter, startDate, endDate]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".dropdown-container")) {
        setOpenDropdownId(null);
      }
    };

    if (openDropdownId !== null) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [openDropdownId]);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return;

    try {
      const parsed = JSON.parse(storedUser) as {
        id?: number;
        username?: string;
      };
      if (parsed?.id) {
        setAdminUser({ id: parsed.id, username: parsed.username });
      }
    } catch (err) {
      console.error("Không thể đọc thông tin admin:", err);
      setAdminUser(null);
    }
  }, []);

  useEffect(() => {
    getProvinces()
      .then(setProvinces)
      .catch((err) => console.error("Lỗi tải tỉnh/thành:", err));
  }, []);

  const fetchMenuItems = async () => {
    try {
      setMenuLoading(true);
      const res = await fetch("http://localhost:5000/api/menu");
      if (!res.ok) {
        throw new Error("Không thể tải danh sách món");
      }
      const data = (await res.json()) as MenuItem[];
      setMenuItems(data);
    } catch (err) {
      console.error("Lỗi khi tải menu:", err);
      alert("Lỗi khi tải danh sách món");
    } finally {
      setMenuLoading(false);
    }
  };

  useEffect(() => {
    if (showAddModal) {
      fetchMenuItems();
      fetchVouchers();
      setSelectedMenuItems([]);
      setMenuSearchTerm("");
      setShowMenuDropdown(false);
      setSelectedSizes({});
      setMenuItemPrices({});
      setMenuItemQuantities({});
      setSelectedVoucher("");
    }
  }, [showAddModal]);

  const fetchVouchers = async () => {
    try {
      setVoucherLoading(true);
      const res = await fetch("http://localhost:5000/api/voucher");
      if (!res.ok) {
        throw new Error("Không thể tải danh sách voucher");
      }
      const data = await res.json();
      const activeVouchers = data.filter(
        (v: { status?: 1 | 0 }) => v.status === 1
      );
      setVouchers(activeVouchers);
    } catch (err) {
      console.error("Lỗi khi tải voucher:", err);
      alert("Lỗi khi tải danh sách voucher");
    } finally {
      setVoucherLoading(false);
    }
  };

  useEffect(() => {
    if (showVoucherModal) {
      fetchVouchers();
    }
  }, [showVoucherModal]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuSearchInputRef &&
        !menuSearchInputRef.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest(".menu-dropdown")
      ) {
        setShowMenuDropdown(false);
      }
    };

    if (showMenuDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showMenuDropdown, menuSearchInputRef]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const filteredMenuItems = useMemo(() => {
    const keyword = menuSearchTerm.trim().toLowerCase();
    const selectedIds = selectedMenuItems.map((item) => item.menu_id);
    const availableItems = menuItems.filter(
      (item) => !selectedIds.includes(item.menu_id)
    );

    if (!keyword) return availableItems;
    return availableItems.filter(
      (item) =>
        item.name?.toLowerCase().includes(keyword) ||
        item.category_name?.toLowerCase().includes(keyword)
    );
  }, [menuItems, menuSearchTerm, selectedMenuItems]);

  const subtotal = useMemo(() => {
    return selectedMenuItems.reduce((sum, item) => {
      const currentSize = selectedSizes[item.menu_id] || "Medium";
      const pricesForItem = menuItemPrices[item.menu_id];
      const currentPrice = pricesForItem?.[currentSize] ?? item.price ?? 0;
      const quantity = menuItemQuantities[item.menu_id] || 1;
      return sum + currentPrice * quantity;
    }, 0);
  }, [selectedMenuItems, selectedSizes, menuItemPrices, menuItemQuantities]);

  const deliveryFee = 0;
  const appliedVoucher = useMemo(() => {
    if (!selectedVoucher.trim()) return null;
    const voucher = vouchers.find((v) => v.title === selectedVoucher.trim());
    if (!voucher) return null;

    const now = new Date();
    const start = new Date(voucher.start_date);
    const end = new Date(voucher.end_date);
    const isActive =
      voucher.status === 1 &&
      voucher.quantity > 0 &&
      now >= start &&
      now <= end;

    return isActive ? voucher : null;
  }, [selectedVoucher, vouchers]);

  const discount = useMemo(() => {
    if (!appliedVoucher) return 0;
    const value = Number(appliedVoucher.discount_value ?? 0);
    if (appliedVoucher.discount_type === "percent") {
      return Math.min((subtotal * value) / 100, subtotal);
    }
    return Math.min(value, subtotal);
  }, [appliedVoucher, subtotal]);

  const total = useMemo(
    () => subtotal + deliveryFee - discount,
    [subtotal, deliveryFee, discount]
  );

  const addMenuItem = async (item: MenuItem) => {
    setSelectedMenuItems((prev) => {
      const exists = prev.some((selected) => selected.menu_id === item.menu_id);
      if (exists) return prev;
      return [...prev, item];
    });
    setMenuItemQuantities((prev) => ({
      ...prev,
      [item.menu_id]: 1,
    }));

    try {
      const res = await fetch(`http://localhost:5000/api/menu/${item.menu_id}`);
      if (res.ok) {
        const sizesData = (await res.json()) as Array<{
          menu_id: number;
          size: string;
          price: number;
        }>;
        const pricesBySize: Record<string, number> = {};
        sizesData.forEach((sizeItem) => {
          pricesBySize[sizeItem.size] = Number(sizeItem.price);
        });
        setMenuItemPrices((prev) => ({
          ...prev,
          [item.menu_id]: pricesBySize,
        }));
      }
    } catch (err) {
      console.error("Lỗi khi tải giá theo size:", err);
    }

    setMenuSearchTerm("");
    setShowMenuDropdown(false);
  };

  const removeMenuItem = (menuId: number) => {
    setSelectedMenuItems((prev) =>
      prev.filter((item) => item.menu_id !== menuId)
    );
    setSelectedSizes((prev) => {
      const updated = { ...prev };
      delete updated[menuId];
      return updated;
    });
    setMenuItemPrices((prev) => {
      const updated = { ...prev };
      delete updated[menuId];
      return updated;
    });
    setMenuItemQuantities((prev) => {
      const updated = { ...prev };
      delete updated[menuId];
      return updated;
    });
  };

  const toggleSelectAll = () => {
    if (
      selectedItems.length === paginatedOrders.length &&
      paginatedOrders.length > 0
    ) {
      setSelectedItems([]);
    } else {
      setSelectedItems(paginatedOrders.map((b) => b.order_id));
    }
  };

  const toggleSelectItem = (id: number) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const closeModals = () => {
    setShowAddModal(false);
    setDetailOrder(null);
  };

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const fullname = formData.get("fullname")?.toString().trim() || "";
    const phone = formData.get("phone")?.toString().trim() || "";
    const note = formData.get("note")?.toString().trim() || "";

    if (!adminUser?.id) {
      alert("Không tìm thấy thông tin người dùng đang đăng nhập.");
      return;
    }

    if (selectedMenuItems.length === 0) {
      alert("Vui lòng chọn ít nhất một món để tạo đơn hàng.");
      return;
    }

    if (!fullname || !phone || !detailAddress.trim()) {
      alert("Vui lòng nhập đầy đủ họ tên, số điện thoại và địa chỉ.");
      return;
    }

    if (!selectedProvince || !selectedDistrict || !selectedWard) {
      alert("Vui lòng chọn đầy đủ tỉnh/thành, quận/huyện, phường/xã.");
      return;
    }

    const itemsPayload = selectedMenuItems.map((item) => ({
      menu_id: item.menu_id,
      size: selectedSizes[item.menu_id] || "Medium",
      quantity: menuItemQuantities[item.menu_id] || 1,
    }));

    const payload = {
      adminId: adminUser.id,
      items: itemsPayload,
      fullname,
      phone,
      detail_address: detailAddress.trim(),
      provinceName: selectedProvince?.Name || "",
      districtName: selectedDistrict?.Name || "",
      wardName: selectedWard?.Name || "",
      paymentMethod,
      voucherCode: appliedVoucher ? appliedVoucher.title : null,
      note,
    };

    try {
      const res = await fetch("http://localhost:5000/api/admin/orders/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          (data as { message?: string; error?: string }).message ||
            (data as { error?: string }).error ||
            "Thêm đơn hàng thất bại"
        );
      alert("Thêm đơn hàng thành công!");
      closeModals();
      fetchOrders();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Lỗi khi thêm đơn hàng";
      alert(message);
    }
  };

  const confirmStatusChange = (
    count: number,
    newStatus: "pending" | "processing" | "completed" | "canceled"
  ) => {
    const actionLabel =
      newStatus === "processing"
        ? "đang giao"
        : newStatus === "completed"
        ? "hoàn thành"
        : newStatus === "canceled"
        ? "hủy đơn"
        : "cập nhật trạng thái";

    const itemLabel = count === 1 ? "đơn hàng này" : `${count} đơn hàng`;

    return confirm(
      `Bạn có chắc muốn đổi trạng thái ${actionLabel} ${itemLabel} không?`
    );
  };

  const handleBulkStatus = async (
    newStatus: "pending" | "processing" | "completed" | "canceled"
  ) => {
    if (selectedItems.length === 0) return;

    if (!confirmStatusChange(selectedItems.length, newStatus)) {
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/admin/orders/status", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ids: selectedItems,
          status: newStatus,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || "Cập nhật thất bại");
      }

      alert(data.message || "Đã cập nhật trạng thái đơn hàng");
      setSelectedItems([]);
      fetchOrders();
    } catch (err) {
      console.error("Bulk status error:", err);
      alert("Lỗi khi cập nhật trạng thái. Vui lòng thử lại!");
    }
  };

  const updateSingleStatus = async (
    orderId: number,
    newStatus: "processing" | "completed" | "canceled"
  ) => {
    if (!confirmStatusChange(1, newStatus)) {
      return;
    }
    try {
      const res = await fetch("http://localhost:5000/api/admin/orders/status", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ids: [orderId],
          status: newStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || "Cập nhật thất bại");
      }

      alert(data.message || "Đã cập nhật trạng thái đơn hàng");
      setOpenDropdownId(null);
      fetchOrders();
    } catch (err) {
      console.error("Update status error:", err);
      alert("Không thể cập nhật trạng thái. Vui lòng thử lại!");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-600"></div>
        <span className="ml-3 text-gray-600">Đang tải dữ liệu...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-red-600">
        <AlertCircle className="w-12 h-12 mb-2" />
        <p>Lỗi: {error}</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <nav className="flex text-sm text-gray-600 mb-4">
          <ol className="inline-flex items-center space-x-1 md:space-x-2">
            <li className="inline-flex items-center">
              <Link
                to="/admin/dashboard"
                className="hover:text-gray-900 flex items-center"
              >
                <svg
                  className="w-4 h-4 mr-1.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
                </svg>
                Trang chủ
              </Link>
            </li>
            <li>
              <span className="mx-1">/</span> Quản lý đơn đặt hàng
            </li>
            <li>
              <span className="mx-1">/</span>{" "}
              <span className="text-gray-400">Danh sách</span>
            </li>
          </ol>
        </nav>

        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <input
            type="text"
            placeholder="Tìm kiếm đơn hàng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:max-w-xs px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
          />
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                setShowAddModal(true);
              }}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 text-sm font-medium"
            >
              <Plus className="w-4 h-4" /> Thêm mới
            </button>
            <a
              href="#"
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
            >
              <Download className="w-4 h-4" /> Xuất
            </a>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => setStatusFilter("all")}
              className={getFilterButtonClasses("all")}
            >
              <div className="flex items-center gap-2">
                <Layers2 className="w-4 h-4" />
                <span>Tất cả</span>
              </div>
              <div className="text-xs opacity-90 italic">
                ({statusCounts.all} đơn hàng)
              </div>
            </button>
            <button
              onClick={() => setStatusFilter("pending")}
              className={getFilterButtonClasses("pending")}
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Chờ xác nhận</span>
              </div>
              <div className="text-xs opacity-90 italic">
                ({statusCounts.pending} đơn hàng)
              </div>
            </button>
            <button
              onClick={() => setStatusFilter("processing")}
              className={getFilterButtonClasses("processing")}
            >
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4" />
                <span>Đang giao</span>
              </div>
              <div className="text-xs opacity-90 italic">
                ({statusCounts.processing} đơn hàng)
              </div>
            </button>
            <button
              onClick={() => setStatusFilter("completed")}
              className={getFilterButtonClasses("completed")}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Đã giao</span>
              </div>
              <div className="text-xs opacity-90 italic">
                ({statusCounts.completed} đơn hàng)
              </div>
            </button>
            <button
              onClick={() => setStatusFilter("canceled")}
              className={getFilterButtonClasses("canceled")}
            >
              <div className="flex items-center gap-2">
                <CircleX className="w-4 h-4" />
                <span>Đã hủy</span>
              </div>
              <div className="text-xs opacity-90 italic">
                ({statusCounts.canceled} đơn hàng)
              </div>
            </button>
          </div>
          <div className="flex gap-4">
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">
                Từ ngày
              </label>
              <input
                name="start_date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-cyan-600 focus:border-cyan-600 block w-full p-2.5"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">
                Đến ngày
              </label>
              <input
                name="end_date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-cyan-600 focus:border-cyan-600 block w-full p-2.5"
              />
            </div>
          </div>
        </div>
      </div>
      {selectedItems.length > 0 && (
        <div className="p-4 bg-cyan-50 border border-cyan-200 rounded-lg flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-cyan-900">
              Đã chọn <strong>{selectedItems.length}</strong> đơn hàng
            </span>
            <button
              onClick={() => setSelectedItems([])}
              className="text-xs text-cyan-700 hover:text-cyan-900 underline"
            >
              Bỏ chọn tất cả
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleBulkStatus("processing")}
              className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Xác nhận
            </button>

            <button
              onClick={() => handleBulkStatus("canceled")}
              className="px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded-lg hover:bg-yellow-700 transition flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m0 12.728a9 9 0 0112.728-12.728m-12.728 12.728L18.364 5.636"
                />
              </svg>
              Hủy đơn
            </button>

            <button className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              Xóa ({selectedItems.length})
            </button>
          </div>
        </div>
      )}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={
                      selectedItems.length === paginatedOrders.length &&
                      paginatedOrders.length > 0
                    }
                    onChange={toggleSelectAll}
                    className="w-4 h-4 text-cyan-600 rounded border-gray-300"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                  ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                  Tài khoản
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                  Tên/SĐT khách hàng
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                  Ngày đặt
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                  Tổng tiền
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                  Phương thức thanh toán
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                  Trạng thái đơn hàng
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">
                  Chi tiết đơn hàng
                </th>
                <th className="pr-16 py-3 text-right text-xs font-medium text-gray-500">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedOrders.map((order) => (
                <tr key={order.order_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(order.order_id)}
                      onChange={() => toggleSelectItem(order.order_id)}
                      className="w-4 h-4 text-cyan-600 rounded border-gray-300"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    #DH{order.order_id.toString().padStart(6, "0")}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {order.username}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="font-medium text-gray-900">
                          {order.fullname}
                        </div>
                        <div className="text-xs text-gray-500">
                          {order.phone}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {new Date(order.created_at).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {order.total.toFixed(2)}đ
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {order.payment_method}
                  </td>
                  <td className="px-4 py-3">
                    {(() => {
                      const config =
                        statusInfo[order.status] || statusInfo.pending;
                      const Icon = config.icon;
                      return (
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-medium ${config.color}`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {config.label}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="py-3 text-center space-x-1">
                    <button
                      onClick={() => setDetailOrder(order)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-orange-600 rounded hover:bg-orange-700"
                    >
                      <Eye className="w-3.5 h-3.5" /> Xem
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right space-x-1">
                    <div className="relative inline-block dropdown-container">
                      <button
                        onClick={() => {
                          if (["completed", "canceled"].includes(order.status))
                            return;
                          setOpenDropdownId(
                            openDropdownId === order.order_id
                              ? null
                              : order.order_id
                          );
                        }}
                        disabled={
                          order.status === "completed" ||
                          order.status === "canceled"
                        }
                        className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white rounded transition-all
                        ${
                          order.status === "completed" ||
                          order.status === "canceled"
                            ? "bg-gray-400 cursor-not-allowed opacity-60 hover:bg-gray-400"
                            : "bg-cyan-600 hover:bg-cyan-700"
                        }
                      `}
                      >
                        <Edit className="w-3.5 h-3.5" />
                        Cập nhật
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform ${
                            openDropdownId === order.order_id
                              ? "rotate-180"
                              : ""
                          }`}
                        />
                      </button>
                      {openDropdownId === order.order_id && (
                        <div className="absolute mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 z-50 py-1 right-0">
                          <button
                            onClick={() =>
                              updateSingleStatus(order.order_id, "processing")
                            }
                            disabled={
                              order.status === "processing" ||
                              order.status === "completed" ||
                              order.status === "canceled"
                            }
                            className={`w-full text-left p-2 text-xs flex items-center gap-2 transition-colors
                              ${
                                order.status === "processing" ||
                                order.status === "completed" ||
                                order.status === "canceled"
                                  ? "text-gray-400 cursor-not-allowed"
                                  : "text-gray-700 hover:bg-orange-50 hover:text-orange-700"
                              }
                            `}
                          >
                            <Truck className="w-3.5 h-3.5" />
                            Đang giao
                          </button>
                          <button
                            onClick={() =>
                              updateSingleStatus(order.order_id, "completed")
                            }
                            disabled={order.status === "completed"}
                            className={`w-full text-left p-2 text-xs flex items-center gap-2 transition-colors
                              ${
                                order.status === "completed"
                                  ? "text-gray-400 cursor-not-allowed"
                                  : "text-gray-700 hover:bg-green-50 hover:text-green-700"
                              }
                            `}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Đã giao
                          </button>
                          <button
                            onClick={() =>
                              updateSingleStatus(order.order_id, "canceled")
                            }
                            disabled={
                              order.status === "processing" ||
                              order.status === "completed" ||
                              order.status === "canceled"
                            }
                            className={`w-full text-left p-2 text-xs flex items-center gap-2 transition-colors
                              ${
                                order.status === "processing" ||
                                order.status === "completed"
                                  ? "text-gray-400 cursor-not-allowed"
                                  : "text-gray-700 hover:bg-red-50 hover:text-red-700"
                              }
                            `}
                          >
                            <CircleX className="w-3.5 h-3.5" />
                            Hủy
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between text-sm text-gray-700">
          <span>
            Hiển thị{" "}
            <strong>
              {(currentPage - 1) * itemsPerPage + 1}-
              {Math.min(currentPage * itemsPerPage, filteredOrders.length)}
            </strong>{" "}
            trong <strong>{filteredOrders.length}</strong>
          </span>
          <div className="flex gap-1 mt-2 sm:mt-0">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded border border-gray-300 bg-white disabled:opacity-50 hover:bg-gray-100"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded border border-gray-300 bg-white disabled:opacity-50 hover:bg-gray-100"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="relative max-w-7xl p-3">
            <div className="bg-white rounded-lg shadow-lg">
              <div className="flex items-start justify-between px-4 py-2 border-b">
                <h3 className="text-xl font-semibold">Thêm đơn hàng</h3>
                <button
                  onClick={closeModals}
                  className="text-gray-400 hover:bg-gray-200 hover:text-gray-900 rounded-lg p-1.5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleAdd}>
                <div className="p-6 max-h-[600px] overflow-y-auto">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
                      <div className="flex items-center">
                        <div className="flex text-xs">
                          <p className="font-semibold text-gray-900 mr-2">
                            Danh sách món
                          </p>
                          <p className="text-gray-500">
                            (Nhập tên món để tìm kiếm)
                          </p>
                        </div>
                      </div>
                      <div className="relative">
                        <input
                          ref={(el) => setMenuSearchInputRef(el)}
                          placeholder="Tìm kiếm món, danh mục..."
                          value={menuSearchTerm}
                          onChange={(e) => {
                            setMenuSearchTerm(e.target.value);
                            setShowMenuDropdown(true);
                          }}
                          onFocus={() => {
                            if (
                              menuSearchTerm ||
                              filteredMenuItems.length > 0
                            ) {
                              setShowMenuDropdown(true);
                            }
                          }}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                        />
                        {showMenuDropdown &&
                          menuSearchTerm &&
                          !menuLoading &&
                          filteredMenuItems.length > 0 && (
                            <div className="menu-dropdown absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                              {filteredMenuItems.map((item) => (
                                <div
                                  key={item.menu_id}
                                  onClick={() => addMenuItem(item)}
                                  className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                                >
                                  <img
                                    src={
                                      item.image_url ||
                                      "/images/placeholder.jpg"
                                    }
                                    alt={item.name}
                                    className="w-10 h-10 rounded-lg object-cover bg-gray-800"
                                  />
                                  <div className="flex-1">
                                    <p className="text-sm font-semibold text-gray-900">
                                      {item.name}
                                    </p>
                                    <div className="text-xs flex items-center">
                                      <span className="text-gray-500">
                                        {item.category_name ||
                                          "Không có danh mục"}
                                      </span>
                                      <span className="text-gray-400 mx-2">
                                        -
                                      </span>
                                      <span className="text-gray-500">
                                        Size: {item.size || "Medium"}
                                      </span>
                                    </div>
                                  </div>
                                  <p className="font-medium text-gray-900">
                                    {item.price
                                      ? `${parseFloat(
                                          String(item.price)
                                        ).toFixed(2)}đ`
                                      : "0.00đ"}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        {showMenuDropdown &&
                          menuSearchTerm &&
                          !menuLoading &&
                          filteredMenuItems.length === 0 && (
                            <div className="menu-dropdown absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center text-sm text-gray-500">
                              Không tìm thấy món nào
                            </div>
                          )}
                      </div>
                      <div className="space-y-3 max-h-[410px] overflow-y-auto pr-1">
                        {menuLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-600"></div>
                            <span className="ml-2 text-sm text-gray-600">
                              Đang tải...
                            </span>
                          </div>
                        ) : selectedMenuItems.length === 0 ? (
                          <div className="text-center py-8 text-sm text-gray-500">
                            Chưa có món nào được chọn
                          </div>
                        ) : (
                          selectedMenuItems.map((item) => {
                            const currentSize =
                              selectedSizes[item.menu_id] || "Medium";
                            const handleSizeClick = (size: string) => {
                              setSelectedSizes((prev) => ({
                                ...prev,
                                [item.menu_id]: size,
                              }));
                            };

                            const pricesForItem = menuItemPrices[item.menu_id];
                            const currentPrice =
                              pricesForItem?.[currentSize] ?? item.price ?? 0;

                            return (
                              <div
                                key={item.menu_id}
                                className="border border-gray-200 bg-white rounded-lg px-3 py-4 space-y-3"
                              >
                                <div className="flex items-center justify-between text-sm">
                                  <div className="flex items-center gap-3 text-gray-900">
                                    <img
                                      src={
                                        item.image_url ||
                                        "/images/placeholder.jpg"
                                      }
                                      alt={item.name}
                                      className="w-10 h-10 rounded-lg object-cover bg-gray-800"
                                    />
                                    <div className="flex-1">
                                      <p className="text-sm font-semibold">
                                        {item.name}
                                      </p>
                                      <div className="text-xs flex mt-1 gap-2">
                                        <p className="my-auto">Size:</p>
                                        {sizeOptions.map((size) => (
                                          <button
                                            key={size}
                                            type="button"
                                            onClick={() =>
                                              handleSizeClick(size)
                                            }
                                            className={`py-1 px-3 rounded-full text-xs font-medium transition-all shadow-sm ${
                                              currentSize === size
                                                ? "bg-cyan-600 text-white"
                                                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                            }`}
                                          >
                                            {size}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <div>
                                      <input
                                        name="quantity"
                                        type="number"
                                        min="1"
                                        required
                                        value={
                                          menuItemQuantities[item.menu_id] || 1
                                        }
                                        onChange={(e) => {
                                          const quantity = Math.max(
                                            1,
                                            parseInt(e.target.value) || 1
                                          );
                                          setMenuItemQuantities((prev) => ({
                                            ...prev,
                                            [item.menu_id]: quantity,
                                          }));
                                        }}
                                        className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg w-14 p-2"
                                      />
                                    </div>
                                    <p className="font-medium">
                                      {(() => {
                                        const quantity =
                                          menuItemQuantities[item.menu_id] || 1;
                                        const totalPrice =
                                          currentPrice * quantity;
                                        return totalPrice
                                          ? `${parseFloat(
                                              String(totalPrice)
                                            ).toFixed(2)}đ`
                                          : "0.00đ";
                                      })()}
                                    </p>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        removeMenuItem(item.menu_id)
                                      }
                                      className="text-red-600 hover:text-red-700 p-1"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        <div className="lg:col-span-8">
                          <div className="relative">
                            <input
                              type="text"
                              name="voucher_code"
                              value={selectedVoucher}
                              onChange={(e) =>
                                setSelectedVoucher(e.target.value)
                              }
                              className="w-full bg-transparent text-black placeholder-gray-500 outline-none"
                              placeholder="Thêm khuyến mãi"
                              disabled={loading}
                            />
                            <button
                              type="button"
                              onClick={() => setShowVoucherModal(true)}
                              className="absolute right-0 -translate-y-3/4 flex items-center gap-1 bg-blue-500 text-white rounded-lg px-3 py-1 text-sm font-medium hover:bg-blue-600"
                            >
                              <Ticket className="w-4 h-4" />
                              Gợi ý
                            </button>
                            <hr className="border-gray-600 max-w-full ml-auto mt-2" />
                          </div>
                        </div>
                        <div className="lg:col-span-4">
                          <div className="space-y-3 text-sm">
                            <div className="grid grid-cols-2 gap-1 max-w-xs ml-auto">
                              <span className="text-gray-400 text-right">
                                Subtotal
                              </span>
                              <span className="text-right">
                                {subtotal.toFixed(2)}đ
                              </span>
                              <span className="text-gray-400 text-right">
                                Delivery
                              </span>
                              <span className="text-right">
                                {deliveryFee.toFixed(2)}đ
                              </span>
                              <span className="text-gray-400 text-right">
                                Discount
                              </span>
                              <span className="text-right text-green-500 font-medium">
                                -{discount.toFixed(2)}đ
                              </span>
                            </div>
                            <hr className="border-gray-600 max-w-xs ml-auto" />
                            <div className="grid grid-cols-2 max-w-xs ml-auto text-lg font-bold">
                              <span className="text-right">TOTAL</span>
                              <span className="text-right text-yellow-400 drop-shadow glow">
                                {total.toFixed(2)}đ
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div className="grid grid-cols-6 gap-6 text-left">
                        <div className="sm:col-span-3">
                          <label className="flex text-sm font-medium text-gray-900 mb-2">
                            Fullname
                            <Asterisk className="text-red-600 h-3 w-3"></Asterisk>
                          </label>
                          <input
                            name="fullname"
                            type="text"
                            required
                            className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-cyan-600 focus:border-cyan-600 block w-full p-2.5"
                          />
                        </div>
                        <div className="sm:col-span-3">
                          <label className="flex text-sm font-medium text-gray-900 mb-2">
                            Phone
                            <Asterisk className="text-red-600 h-3 w-3"></Asterisk>
                          </label>
                          <input
                            name="phone"
                            type="text"
                            required
                            className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-cyan-600 focus:border-cyan-600 block w-full p-2.5"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="text-xs font-medium text-gray-700 block mb-1">
                            City
                          </label>
                          <select
                            required
                            value={selectedProvince?.Id ?? ""}
                            onChange={(e) => {
                              const p =
                                provinces.find(
                                  (p) => p.Id === e.target.value
                                ) || null;
                              setSelectedProvince(p);
                              setSelectedDistrict(null);
                              setSelectedWard(null);
                            }}
                            className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-cyan-600 focus:border-cyan-600 block w-full p-2.5"
                          >
                            <option value="">-- Chọn tỉnh/thành --</option>
                            {provinces.map((p) => (
                              <option key={p.Id} value={p.Id}>
                                {p.Name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-700 block mb-1">
                            District
                          </label>
                          <select
                            required
                            value={selectedDistrict?.Id ?? ""}
                            onChange={(e) => {
                              const d =
                                selectedProvince?.Districts.find(
                                  (d) => d.Id === e.target.value
                                ) || null;
                              setSelectedDistrict(d);
                              setSelectedWard(null);
                            }}
                            disabled={!selectedProvince}
                            className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-cyan-600 focus:border-cyan-600 block w-full p-2.5"
                          >
                            <option value="">-- Chọn quận/huyện --</option>
                            {selectedProvince?.Districts.map((d) => (
                              <option key={d.Id} value={d.Id}>
                                {d.Name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-700 block mb-1">
                            Ward
                          </label>
                          <select
                            required
                            value={selectedWard?.Id ?? ""}
                            onChange={(e) => {
                              const w =
                                selectedDistrict?.Wards.find(
                                  (w) => w.Id === e.target.value
                                ) || null;
                              setSelectedWard(w);
                            }}
                            disabled={!selectedDistrict}
                            className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-cyan-600 focus:border-cyan-600 block w-full p-2.5"
                          >
                            <option value="">-- Chọn phường/xã --</option>
                            {selectedDistrict?.Wards.map((w) => (
                              <option key={w.Id} value={w.Id}>
                                {w.Name}
                                {w.Level &&
                                  ` (${w.Level.replace("Ward", "Phường")
                                    .replace("Commune", "Xã")
                                    .replace("Town", "Thị trấn")})`}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-900 block mb-2">
                          Address
                        </label>
                        <input
                          type="text"
                          required
                          value={detailAddress}
                          onChange={(e) => setDetailAddress(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                        />
                      </div>
                      <div>
                        <div className="flex">
                          <label className="text-sm font-medium text-gray-900 block mb-2">
                            Note
                          </label>
                          <p className="text-gray-400 text-sm italic pl-2">
                            (Không bắt buộc)
                          </p>
                        </div>
                        <textarea
                          name="note"
                          rows={3}
                          defaultValue={""}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                        ></textarea>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-900 block mb-2">
                          Payment method
                        </label>
                        <div className="space-y-3">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="radio"
                              name="payment"
                              className="w-4 h-4 text-cyan-500"
                              value="cash"
                              checked={paymentMethod === "cash"}
                              onChange={() => setPaymentMethod("cash")}
                            />
                            <span className="text-sm">
                              Cash on Delivery (COD)
                            </span>
                          </label>
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="radio"
                              name="payment"
                              className="w-4 h-4 text-cyan-500"
                              value="bank_transfer"
                              checked={paymentMethod === "bank_transfer"}
                              onChange={() => setPaymentMethod("bank_transfer")}
                            />
                            <span className="text-sm">VNPay</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3 py-2 px-4 border-t">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-cyan-600 text-white font-medium rounded-lg hover:bg-cyan-700"
                  >
                    Thêm đơn
                  </button>
                  <button
                    type="button"
                    onClick={closeModals}
                    className="px-6 py-2.5 bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {detailOrder && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-white border rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-2 flex justify-between items-center">
              <h2 className="text-xl font-bold text-black">
                Chi tiết đơn DH
                {detailOrder.order_id.toString().padStart(6, "0")}
              </h2>
              <button
                onClick={() => setDetailOrder(null)}
                className="p-2 hover:bg-gray-500 rounded-lg"
              >
                <X className="w-5 h-5 text-black" />
              </button>
            </div>

            <div className="p-3 space-y-6">
              <div className="flex">
                <h3 className="font-bold text-black">Thời gian đặt hàng:</h3>
                <p className="pl-3">
                  {formatTime(detailOrder.created_at)},
                  {new Date(detailOrder.created_at).toLocaleDateString("vi-VN")}
                </p>
              </div>
              <div className="bg-gray-850 rounded-xl">
                <h3 className="font-bold text-black mb-3">
                  Thông tin nhận hàng
                </h3>
                <div className="space-y-3 text-sm text-black">
                  <div className="flex gap-3">
                    <User className="w-4 h-4" /> {detailOrder.fullname}
                  </div>
                  <div className="flex gap-3">
                    <Phone className="w-4 h-4" /> {detailOrder.phone}
                  </div>
                  <div className="flex gap-3">
                    <MapPin className="w-4 h-4" /> {detailOrder.full_address}
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-bold text-black mb-3">Sản phẩm</h3>
                {detailOrder.items.map((item, i) => (
                  <div
                    key={i}
                    className="flex gap-4 bg-gray-300 rounded-lg p-2 mb-3 text-black"
                  >
                    <img
                      src={item.image_url || "/images/placeholder.jpg"}
                      alt=""
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      {item.size && (
                        <p className="text-sm text-gray-600">
                          Size: {item.size}
                        </p>
                      )}
                      <p className="text-sm text-gray-600">
                        Số lượng: {item.quantity}
                      </p>
                    </div>
                    <p className="font-bold text-lg my-auto">
                      {item.price.toFixed(2)}đ
                    </p>
                  </div>
                ))}
              </div>
              <div className="bg-gray-850 rounded-xl p-1">
                <h3 className="font-bold text-black mb-3">
                  Chi tiết thanh toán
                </h3>
                <div className="space-y-2 text-sm text-black">
                  <div className="flex justify-between">
                    <span>Tổng tiền hàng</span>
                    <span>
                      {detailOrder.items
                        .reduce(
                          (sum, item) => sum + item.price * item.quantity,
                          0
                        )
                        .toFixed(2)}
                      đ
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Phí vận chuyển</span>
                    <span>
                      {(detailOrder.delivery_fee || 0) === 0
                        ? "Miễn phí"
                        : detailOrder.delivery_fee!}
                    </span>
                  </div>
                  {detailOrder.discount && detailOrder.discount > 0 && (
                    <div className="flex justify-between text-red-400">
                      <span>
                        Giảm giá
                        {detailOrder.voucher_code &&
                          `(${detailOrder.voucher_code})`}
                      </span>
                      <span>-{detailOrder.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="pt-3 border-t border-gray-700 flex justify-between text-lg font-bold text-yellow-600">
                    <span>Thành tiền</span>
                    <span>{detailOrder.total.toFixed(2)}đ</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 py-2 px-3 border-t">
              <button
                onClick={reactToPrintFn}
                type="submit"
                className="flex px-4 py-2.5 bg-cyan-600 text-white font-medium rounded-lg hover:bg-cyan-700"
              >
                In hóa đơn
              </button>
              <button
                type="button"
                onClick={closeModals}
                className="px-6 py-2.5 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
      {showVoucherModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="relative max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="bg-white rounded-lg shadow-lg">
              <div className="flex items-start justify-between px-6 py-2 border-b">
                <h3 className="text-xl font-semibold">Chọn Voucher</h3>
                <button
                  onClick={() => setShowVoucherModal(false)}
                  className="text-gray-400 hover:bg-gray-200 hover:text-gray-900 rounded-lg p-1.5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                {voucherLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
                    <span className="ml-3 text-gray-600">
                      Đang tải voucher...
                    </span>
                  </div>
                ) : vouchers.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    Không có voucher nào khả dụng
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {vouchers.map((voucher) => {
                      const isSelected = selectedVoucher === voucher.title;
                      const now = new Date();
                      const startDate = new Date(voucher.start_date);
                      const endDate = new Date(voucher.end_date);
                      const isValid =
                        now >= startDate &&
                        now <= endDate &&
                        voucher.quantity > 0;

                      return (
                        <div
                          key={voucher.voucher_id}
                          onClick={() => {
                            if (isValid) {
                              setSelectedVoucher(voucher.title);
                            }
                          }}
                          className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                            isSelected
                              ? "border-cyan-600 bg-cyan-50"
                              : isValid
                              ? "border-gray-200 hover:border-cyan-400 hover:bg-gray-50"
                              : "border-gray-200 opacity-50 cursor-not-allowed"
                          }`}
                        >
                          <div className="flex gap-4">
                            {voucher.image_url && (
                              <img
                                src={voucher.image_url}
                                alt={voucher.title}
                                className="w-20 h-20 rounded-lg object-cover"
                              />
                            )}
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="font-semibold text-gray-900">
                                  {voucher.title}
                                </h4>
                                {isSelected && (
                                  <div className="ml-2 bg-cyan-600 text-white text-xs px-2 py-1 rounded">
                                    Đã chọn
                                  </div>
                                )}
                              </div>
                              {voucher.description && (
                                <p className="text-sm text-gray-600">
                                  {voucher.description}
                                </p>
                              )}
                              <span className="text-sm text-gray-600 flex gap-1">
                                Còn lại:
                                <p className="text-red-500">
                                  {voucher.quantity}
                                </p>
                                mã
                              </span>
                              <div className="text-xs text-gray-500 italic">
                                (Áp dụng từ{" "}
                                {startDate.toLocaleDateString("vi-VN")} đến{" "}
                                {endDate.toLocaleDateString("vi-VN")})
                              </div>
                              {!isValid && (
                                <div className="text-xs text-red-500 mt-2">
                                  Voucher không còn hiệu lực hoặc đã hết số
                                  lượng
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 py-4 px-6 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowVoucherModal(false);
                  }}
                  className="px-6 py-2.5 bg-gray-200 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Đóng
                </button>
                {selectedVoucher && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowVoucherModal(false);
                    }}
                    className="px-6 py-2.5 bg-cyan-600 text-white font-medium rounded-lg hover:bg-cyan-700"
                  >
                    Xác nhận
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {detailOrder && (
        <div className="hidden print:block" ref={contentRef}>
          <PrintOrder order={detailOrder} />
        </div>
      )}
    </div>
  );
}
