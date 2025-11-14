import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Download,
  AlertCircle,
  Edit,
  Trash2,
  X,
} from "lucide-react";

interface MenuItem {
  menu_id: number;
  name: string;
  description: string | null;
  image_url: string | null;
  category_name: string;
  category_id: number;
  status?: 1 | 0;
  prices: Record<string, number>;
  sizes: string[];
}

interface Category {
  category_id: number;
  category_name: string;
}

interface ApiMenuItem {
  menu_id: number;
  name: string;
  description: string | null;
  image_url: string | null;
  category_name: string;
  price: number;
  status: number;
  category_id: number;
  size: string;
}

export default function AdminMenu() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSize, setSelectedSize] = useState<string>("Medium");
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<MenuItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const itemsPerPage = 10;

  // === GỌI API ===
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [menuRes, catRes] = await Promise.all([
        fetch("http://localhost:5000/api/admin/menu-sizes"),
        fetch("http://localhost:5000/api/categories"),
      ]);

      if (!menuRes.ok)
        throw new Error(`HTTP ${menuRes.status}: Không thể tải menu`);
      if (!catRes.ok)
        throw new Error(`HTTP ${catRes.status}: Không thể tải danh mục`);

      const menuData: ApiMenuItem[] = await menuRes.json();
      const catData: Category[] = await catRes.json();

      const grouped = menuData.reduce((acc, item) => {
        const id = item.menu_id;

        if (!acc[id]) {
          acc[id] = {
            menu_id: id,
            name: item.name,
            description: item.description,
            image_url: item.image_url,
            category_name: item.category_name,
            category_id: item.category_id,
            status: item.status === 1 ? 1 : 0,
            prices: {},
            sizes: [],
          };
        }

        acc[id].prices[item.size] = item.price;
        if (!acc[id].sizes.includes(item.size)) {
          acc[id].sizes.push(item.size);
        }

        return acc;
      }, {} as Record<number, MenuItem>);

      const menuItems: MenuItem[] = Object.values(grouped);

      setMenuItems(menuItems);
      setFilteredItems(menuItems);
      setCategories(catData);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Lỗi kết nối";
      setError(message);
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let filtered = menuItems;

    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.category_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredItems(filtered);
    setCurrentPage(1);
  }, [searchTerm, menuItems]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const toggleSelectAll = () => {
    if (
      selectedItems.length === paginatedItems.length &&
      paginatedItems.length > 0
    ) {
      setSelectedItems([]);
    } else {
      setSelectedItems(paginatedItems.map((item) => item.menu_id));
    }
  };

  const toggleSelectItem = (id: number) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const openEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setShowEditModal(true);
  };

  const openDeleteModal = (item: MenuItem) => {
    setDeletingItem(item);
    setShowDeleteModal(true);
  };

  const closeModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setEditingItem(null);
    setDeletingItem(null);
    setImagePreview("");
  };

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const hasPrice =
      formData.get("price_small") ||
      formData.get("price_medium") ||
      formData.get("price_large");

    if (!hasPrice) {
      alert("Vui lòng nhập ít nhất 1 giá (Small, Medium hoặc Large)");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/admin/menu/add", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Thêm thất bại");

      alert("Thêm món thành công!");
      closeModals();
      await fetchData();
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert("Lỗi khi thêm món");
      }
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    } else {
      setImagePreview("");
    }
  };

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingItem) return;

    const formData = new FormData(e.currentTarget);

    const hasPrice =
      formData.get("price_small") ||
      formData.get("price_medium") ||
      formData.get("price_large");

    if (!hasPrice) {
      alert("Vui lòng nhập ít nhất 1 giá (Small, Medium hoặc Large)");
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:5000/api/admin/menu/${editingItem.menu_id}`,
        {
          method: "PUT",
          body: formData,
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Cập nhật thất bại");

      alert("Cập nhật món thành công!");
      closeModals();
      await fetchData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Lỗi khi cập nhật món");
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;

    try {
      const res = await fetch(
        `http://localhost:5000/api/admin/menu/${deletingItem.menu_id}`,
        { method: "DELETE" }
      );

      if (!res.ok) throw new Error("Xóa thất bại");
      alert("Xóa món thành công!");
      closeModals();
      await fetchData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Lỗi khi xóa món");
    }
  };

  const handleBulkStatus = async (newStatus: 0 | 1) => {
    if (selectedItems.length === 0) return;

    const action = newStatus === 1 ? "kích hoạt" : "hủy kích hoạt";
    if (
      !confirm(
        `Bạn có chắc muốn ${action} ${selectedItems.length} món này không?`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(
        "http://localhost:5000/api/admin/menu/bulk-status",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ids: selectedItems,
            status: newStatus,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Cập nhật thất bại");
      }

      alert(`Đã ${action} thành công ${selectedItems.length} món!`);
      setSelectedItems([]);
      fetchData();
    } catch (err) {
      console.error("Bulk status error:", err);
      alert("Lỗi khi cập nhật trạng thái. Vui lòng thử lại!");
    }
  };

  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  const handleBulkDelete = async () => {
    const ids = selectedItems.map(Number);

    const res = await fetch(
      "http://localhost:5000/api/admin/menu/bulk-delete",
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      }
    );

    const data = await res.json();
    alert(data.message);
    setSelectedItems([]);
    setShowBulkDeleteModal(false);
    await fetchData();
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
        <div className="mb-4">
          <nav className="flex text-sm text-gray-600">
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
                <span className="mx-1">/</span> Quản lý menu
              </li>
              <li>
                <span className="mx-1">/</span>{" "}
                <span className="text-gray-400">Danh sách</span>
              </li>
            </ol>
          </nav>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <input
            type="text"
            placeholder="Tìm kiếm món ăn..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:max-w-xs px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
          />
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => setShowAddModal(true)}
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

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {selectedItems.length > 0 && (
          <div className="mb-4 p-4 bg-cyan-50 border border-cyan-200 rounded-lg flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-cyan-900">
                Đã chọn <strong>{selectedItems.length}</strong> món
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
                onClick={() => handleBulkStatus(1)}
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
                Kích hoạt
              </button>

              <button
                onClick={() => handleBulkStatus(0)}
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
                Hủy kích hoạt
              </button>

              <button
                onClick={() => setShowBulkDeleteModal(true)}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Xóa ({selectedItems.length})
              </button>
            </div>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={
                      selectedItems.length === paginatedItems.length &&
                      paginatedItems.length > 0
                    }
                    onChange={toggleSelectAll}
                    className="w-4 h-4 text-cyan-600 rounded border-gray-300"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                  ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                  Tên món
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                  Danh mục
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                  <div className="flex items-center gap-2">
                    Giá / Size
                    <select
                      value={selectedSize}
                      onChange={(e) => setSelectedSize(e.target.value)}
                      className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-cyan-500 focus:border-cyan-500"
                    >
                      <option value="Small">Small</option>
                      <option value="Medium">Medium</option>
                      <option value="Large">Large</option>
                    </select>
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                  Trạng thái
                </th>
                <th className="pr-16 py-3 text-right text-xs font-medium text-gray-500">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedItems.map((item) => (
                <tr key={item.menu_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.menu_id)}
                      onChange={() => toggleSelectItem(item.menu_id)}
                      className="w-4 h-4 text-cyan-600 rounded border-gray-300"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    #{item.menu_id}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 border-2 border-dashed border-gray-400 overflow-hidden">
                        {item.image_url ? (
                          <img
                            src={`/${item.image_url}`}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : null}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {item.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {item.description || "Không có mô tả"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {item.category_name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {item.prices[selectedSize] !== undefined
                      ? `${item.prices[selectedSize].toLocaleString("vi-VN")} đ`
                      : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-medium ${
                        item.status ? "text-green-700" : "text-red-700"
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${
                          item.status ? "bg-green-500" : "bg-red-500"
                        }`}
                      />
                      {item.status ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-1">
                    <button
                      onClick={() => openEditModal(item)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-cyan-600 rounded hover:bg-cyan-700"
                    >
                      <Edit className="w-3.5 h-3.5" /> Sửa
                    </button>
                    <button
                      onClick={() => openDeleteModal(item)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Xóa
                    </button>
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
              {Math.min(currentPage * itemsPerPage, filteredItems.length)}
            </strong>{" "}
            trong <strong>{filteredItems.length}</strong>
          </span>
          <div className="flex gap-1 mt-2 sm:mt-0">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded border border-gray-300 bg-white disabled:opacity-50 hover:bg-gray-100"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
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
          <div className="relative w-full max-w-2xl p-3">
            <div className="bg-white rounded-lg shadow">
              <div className="flex items-start justify-between p-3 py-1 border-b">
                <h3 className="text-xl font-semibold">Thêm món mới</h3>
                <button
                  onClick={closeModals}
                  className="text-gray-400 hover:bg-gray-200 hover:text-gray-900 rounded-lg p-1.5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleAdd}>
                <div className="p-3 space-y-6 h-[600px] overflow-y-auto">
                  <div className="grid grid-cols-6 gap-6 text-left">
                    <div className="col-span-6 sm:col-span-3">
                      <label className="text-sm font-medium text-gray-900 block mb-2">
                        Tên món
                      </label>
                      <input
                        name="name"
                        type="text"
                        required
                        className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-cyan-600 focus:border-cyan-600 block w-full p-2.5"
                      />
                    </div>
                    <div className="col-span-6 sm:col-span-3">
                      <label className="text-sm font-medium text-gray-900 block mb-2">
                        Danh mục
                      </label>
                      <select
                        name="category_id"
                        required
                        className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-cyan-600 focus:border-cyan-600 block w-full p-2.5"
                      >
                        <option value="">Chọn danh mục</option>
                        {categories.map((cat) => (
                          <option key={cat.category_id} value={cat.category_id}>
                            {cat.category_name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-6">
                      <label className="text-sm font-medium text-gray-900 block mb-2">
                        Hình ảnh món ăn
                      </label>

                      <div className="w-full h-40 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-50 relative">
                        {imagePreview ? (
                          <>
                            <img
                              src={imagePreview}
                              alt="Preview"
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setImagePreview("");
                                const input = document.querySelector(
                                  'input[name="image"]'
                                ) as HTMLInputElement;
                                if (input) input.value = "";
                              }}
                              className="absolute top-2 right-2 w-7 h-7 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700 transition-all shadow-md"
                              title="Xóa ảnh"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full text-gray-500">
                            <svg
                              className="w-10 h-10 mb-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                              />
                            </svg>
                            <p className="text-sm">Tải ảnh lên</p>
                          </div>
                        )}
                      </div>

                      <input
                        type="file"
                        name="image"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="mt-2 block w-full text-sm text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cyan-600 file:text-white hover:file:bg-cyan-700"
                      />

                      {/* {imagePreview && (
                        <button
                          type="button"
                          onClick={() => {
                            setImagePreview("");
                            const input = document.querySelector(
                              'input[type="file"]'
                            ) as HTMLInputElement;
                            if (input) input.value = "";
                          }}
                          className="mt-2 text-xs text-red-600 hover:text-red-800"
                        >
                          Xóa ảnh
                        </button>
                      )} */}

                      <p className="mt-1 text-xs text-gray-500">
                        PNG, JPG, JPEG (tối đa 5MB)
                      </p>
                    </div>
                    <div className="col-span-6">
                      <label className="text-sm font-medium text-gray-900 block mb-2">
                        Mô tả
                      </label>
                      <textarea
                        name="description"
                        rows={3}
                        className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-cyan-600 focus:border-cyan-600 block w-full p-2.5"
                      ></textarea>
                    </div>
                    <div className="col-span-6">
                      <label className="text-sm font-medium text-gray-900 block mb-2">
                        Giá tiền
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="text-xs font-medium text-gray-700 block mb-1">
                            Small
                          </label>
                          <input
                            name="price_small"
                            type="number"
                            step="0.01"
                            min="0"
                            required
                            placeholder="0.00"
                            className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-cyan-600 focus:border-cyan-600 block w-full p-2.5"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-700 block mb-1">
                            Medium
                          </label>
                          <input
                            name="price_medium"
                            type="number"
                            step="0.01"
                            min="0"
                            required
                            placeholder="0.00"
                            className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-cyan-600 focus:border-cyan-600 block w-full p-2.5"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-700 block mb-1">
                            Large
                          </label>
                          <input
                            name="price_large"
                            type="number"
                            step="0.01"
                            min="0"
                            required
                            placeholder="0.00"
                            className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-cyan-600 focus:border-cyan-600 block w-full p-2.5"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center">
                    <input
                      id="status"
                      name="status"
                      type="checkbox"
                      defaultChecked
                      className="w-4 h-4 text-cyan-600 bg-gray-100 border-gray-300 rounded focus:ring-cyan-500 focus:ring-2"
                    />
                    <label
                      htmlFor="status"
                      className="ml-2 text-sm font-medium text-gray-900"
                    >
                      Kích hoạt món
                    </label>
                  </div>
                </div>
                <div className="flex items-center p-3 py-1 border-t border-gray-200 rounded-b space-x-2">
                  <button
                    type="submit"
                    className="text-white bg-cyan-600 hover:bg-cyan-700 focus:ring-4 focus:ring-cyan-200 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
                  >
                    Thêm món
                  </button>
                  <button
                    type="button"
                    onClick={closeModals}
                    className="text-gray-900 bg-white hover:bg-gray-100 focus:ring-4 focus:ring-cyan-200 border border-gray-200 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showEditModal && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="relative w-full max-w-2xl p-3">
            <div className="bg-white rounded-lg shadow">
              <div className="flex items-start justify-between p-3 py-1 border-b">
                <h3 className="text-xl font-semibold">Chỉnh sửa món</h3>
                <button
                  onClick={closeModals}
                  className="text-gray-400 hover:bg-gray-200 hover:text-gray-900 rounded-lg p-1.5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleEdit}>
                <input
                  type="hidden"
                  name="menu_id"
                  value={editingItem.menu_id}
                />

                <div className="p-3 space-y-6 h-[600px] overflow-y-auto">
                  <div className="grid grid-cols-6 gap-6 text-left">
                    <div className="col-span-6 sm:col-span-3">
                      <label className="text-sm font-medium text-gray-900 block mb-2">
                        Tên món
                      </label>
                      <input
                        name="name"
                        type="text"
                        defaultValue={editingItem.name}
                        required
                        className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-cyan-600 focus:border-cyan-600 block w-full p-2.5"
                      />
                    </div>
                    <div className="col-span-6 sm:col-span-3">
                      <label className="text-sm font-medium text-gray-900 block mb-2">
                        Danh mục
                      </label>
                      <select
                        name="category_id"
                        defaultValue={editingItem.category_id}
                        required
                        className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-cyan-600 focus:border-cyan-600 block w-full p-2.5"
                      >
                        <option value="">Chọn danh mục</option>
                        {categories.map((cat) => (
                          <option key={cat.category_id} value={cat.category_id}>
                            {cat.category_name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-6">
                      <label className="text-sm font-medium text-gray-900 block mb-2">
                        Hình ảnh món ăn
                      </label>
                      <div className="w-full h-40 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-50 relative">
                        {imagePreview || editingItem.image_url ? (
                          <>
                            <img
                              src={imagePreview || `/${editingItem.image_url}`}
                              alt="Preview"
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setImagePreview("");
                                const input = document.querySelector(
                                  'input[name="image"]'
                                ) as HTMLInputElement;
                                if (input) input.value = "";
                              }}
                              className="absolute top-2 right-2 w-7 h-7 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700 transition-all shadow-md"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full text-gray-500">
                            <svg
                              className="w-10 h-10 mb-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                              />
                            </svg>
                            <p className="text-sm">Tải ảnh lên</p>
                          </div>
                        )}
                      </div>

                      <input
                        type="file"
                        name="image"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="mt-2 block w-full text-sm text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cyan-600 file:text-white hover:file:bg-cyan-700"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        PNG, JPG, JPEG (tối đa 5MB)
                      </p>
                    </div>
                    <div className="col-span-6">
                      <label className="text-sm font-medium text-gray-900 block mb-2">
                        Mô tả
                      </label>
                      <textarea
                        name="description"
                        rows={3}
                        defaultValue={editingItem.description || ""}
                        className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-cyan-600 focus:border-cyan-600 block w-full p-2.5"
                      />
                    </div>

                    <div className="col-span-6">
                      <label className="text-sm font-medium text-gray-900 block mb-2">
                        Giá tiền
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {["Small", "Medium", "Large"].map((size) => (
                          <div key={size}>
                            <label className="text-xs font-medium text-gray-700 block mb-1">
                              {size}
                            </label>
                            <input
                              name={`price_${size.toLowerCase()}`}
                              type="number"
                              step="0.01"
                              min="0"
                              defaultValue={editingItem.prices[size] || ""}
                              placeholder="0.00"
                              className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-cyan-600 focus:border-cyan-600 block w-full p-2.5"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center">
                    <input
                      type="hidden"
                      name="status"
                      id="status_hidden"
                      value="0"
                    />
                    <input
                      id="status_edit"
                      type="checkbox"
                      defaultChecked={editingItem.status === 1}
                      onChange={(e) => {
                        const hidden = document.getElementById(
                          "status_hidden"
                        ) as HTMLInputElement;
                        if (hidden) hidden.value = e.target.checked ? "1" : "0";
                      }}
                      className="w-4 h-4 text-cyan-600 bg-gray-100 border-gray-300 rounded focus:ring-cyan-500 focus:ring-2"
                    />
                    <label
                      htmlFor="status_edit"
                      className="ml-2 text-sm font-medium text-gray-900"
                    >
                      Kích hoạt món
                    </label>
                  </div>
                </div>

                <div className="flex items-center p-3 py-1 border-t border-gray-200 rounded-b space-x-2">
                  <button
                    type="submit"
                    className="text-white bg-cyan-600 hover:bg-cyan-700 focus:ring-4 focus:ring-cyan-200 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
                  >
                    Lưu thay đổi
                  </button>
                  <button
                    type="button"
                    onClick={closeModals}
                    className="text-gray-900 bg-white hover:bg-gray-100 focus:ring-4 focus:ring-cyan-200 border border-gray-200 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="relative w-full max-w-md p-4">
            <div className="bg-white rounded-lg shadow">
              <div className="flex justify-end p-2">
                <button
                  onClick={closeModals}
                  className="text-gray-400 hover:bg-gray-200 hover:text-gray-900 rounded-lg p-1.5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 pt-0 text-center">
                <svg
                  className="w-20 h-20 text-red-600 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
                <h3 className="text-xl font-normal text-gray-500 mt-5 mb-6">
                  Bạn có chắc muốn xóa <strong>{deletingItem.name}</strong>?
                </h3>
                <button
                  onClick={handleDelete}
                  className="text-white bg-red-600 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-base inline-flex items-center px-3 py-2.5 text-center mr-2"
                >
                  Yes, I'm sure
                </button>
                <button
                  onClick={closeModals}
                  className="text-gray-900 bg-white hover:bg-gray-100 focus:ring-4 focus:ring-cyan-200 border border-gray-200 font-medium inline-flex items-center rounded-lg text-base px-3 py-2.5 text-center"
                >
                  No, cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="relative w-full max-w-md p-4">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 pt-3 text-center">
                <svg
                  className="w-20 h-20 text-red-600 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
                <h3 className="text-xl font-normal text-gray-500 mt-5 mb-6">
                  Bạn có chắc muốn xóa{" "}
                  <strong>{selectedItems.length} món ăn đã chọn không</strong>?
                </h3>
                <button
                  onClick={handleBulkDelete}
                  className="text-white bg-red-600 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-base inline-flex items-center px-3 py-2.5 text-center mr-2"
                >
                  Yes, I'm sure
                </button>
                <button
                  onClick={() => setShowBulkDeleteModal(false)}
                  className="text-gray-900 bg-white hover:bg-gray-100 focus:ring-4 focus:ring-cyan-200 border border-gray-200 font-medium inline-flex items-center rounded-lg text-base px-3 py-2.5 text-center"
                >
                  No, cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
