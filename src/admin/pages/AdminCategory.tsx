import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  AlertCircle,
  Edit,
  Trash2,
  X,
  House,
} from "lucide-react";

interface CategoryItem {
  category_id: number;
  category_name: string;
  status?: 1 | 0;
  display: number;
}

export default function AdminCategory() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<CategoryItem[]>(
    []
  );
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [editingItem, setEditingItem] = useState<CategoryItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<CategoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localStatuses, setLocalStatuses] = useState<{
    [key: number]: boolean;
  }>({});

  const itemsPerPage = 10;

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("http://localhost:5000/api/categories");
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(
          `HTTP ${res.status}: ${errText || "Không thể tải danh mục"}`
        );
      }
      const data = (await res.json()) as CategoryItem[];
      setCategories(data);
      setFilteredCategories(data);
      const initialStatuses: { [key: number]: boolean } = {};
      data.forEach((category) => {
        initialStatuses[category.category_id] = category.status === 1;
      });
      setLocalStatuses(initialStatuses);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Lỗi kết nối server";
      setError(errorMessage);
      console.error("Fetch categories error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const filtered = categories.filter(
      (category) =>
        category.category_name
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ?? false
    );
    setFilteredCategories(filtered);
    setCurrentPage(1);
  }, [searchTerm, categories]);

  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const paginatedCategories = filteredCategories.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleToggleStatus = async (categoryId: number) => {
    const currentStatus = localStatuses[categoryId];
    const newStatus = !currentStatus;
    setLocalStatuses((prev) => ({ ...prev, [categoryId]: newStatus }));

    try {
      const res = await fetch(
        `http://localhost:5000/api/admin/category/${categoryId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus ? "1" : "0" }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Cập nhật trạng thái thất bại");
      }
      setCategories((prev) =>
        prev.map((c) =>
          c.category_id === categoryId ? { ...c, status: newStatus ? 1 : 0 } : c
        )
      );
    } catch (err) {
      setLocalStatuses((prev) => ({ ...prev, [categoryId]: currentStatus }));
      alert(err instanceof Error ? err.message : "Lỗi cập nhật trạng thái");
    }
  };

  const toggleSelectAll = () => {
    if (
      selectedItems.length === paginatedCategories.length &&
      paginatedCategories.length > 0
    ) {
      setSelectedItems([]);
    } else {
      setSelectedItems(paginatedCategories.map((c) => c.category_id));
    }
  };

  const toggleSelectItem = (id: number) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const closeModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setShowBulkDeleteModal(false);
    setEditingItem(null);
    setDeletingItem(null);
  };

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const category_name = formData.get("category_name")?.toString().trim();
    const display = formData.get("display")?.toString();
    const status = formData.get("status") ? "1" : "0";

    if (!category_name) {
      alert("Vui lòng nhập tên danh mục!");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/admin/category/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category_name,
          display: Number(display) || 0,
          status,
        }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          (data as { error?: string }).error || "Thêm danh mục thất bại"
        );
      alert("Thêm danh mục thành công!");
      closeModals();
      fetchCategories();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Lỗi khi thêm danh mục";
      alert(message);
    }
  };

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingItem) return;

    const formData = new FormData(e.currentTarget);
    const category_name = formData.get("category_name")?.toString().trim();
    const display = formData.get("display")?.toString();

    if (!category_name) {
      alert("Vui lòng nhập tên danh mục!");
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:5000/api/admin/category/${editingItem.category_id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category_name,
            display: Number(display) || 0,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          (data as { error?: string }).error || "Cập nhật thất bại"
        );
      alert("Cập nhật danh mục thành công!");
      closeModals();
      fetchCategories();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Lỗi khi cập nhật";
      alert(message);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    try {
      const res = await fetch(
        `http://localhost:5000/api/admin/category/${deletingItem.category_id}`,
        {
          method: "DELETE",
        }
      );
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Xóa thất bại");
      }
      alert("Xóa danh mục thành công!");
      closeModals();
      fetchCategories();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Lỗi khi xóa";
      alert(message);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return;
    try {
      const res = await fetch(
        "http://localhost:5000/api/admin/category/bulk-delete",
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: selectedItems }),
        }
      );
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          (data as { error?: string }).error || "Xóa hàng loạt thất bại"
        );
      alert(data.message || "Xóa thành công!");
      setSelectedItems([]);
      setShowBulkDeleteModal(false);
      fetchCategories();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Lỗi khi xóa hàng loạt";
      alert(message);
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
                className="hover:text-gray-900 flex items-center gap-2"
              >
                <House className="h-4 w-4" />
                Trang chủ
              </Link>
            </li>
            <li>
              <span className="mx-1">/</span> Quản lý danh mục
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
            placeholder="Tìm kiếm danh mục..."
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
          </div>
        </div>
      </div>
      {selectedItems.length > 0 && (
        <div className="p-4 bg-cyan-50 border border-cyan-200 rounded-lg flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-cyan-900">
              Đã chọn <strong>{selectedItems.length}</strong> bài viết
            </span>
            <button
              onClick={() => setSelectedItems([])}
              className="text-xs text-cyan-700 hover:text-cyan-900 underline"
            >
              Bỏ chọn tất cả
            </button>
          </div>
          <button
            onClick={() => setShowBulkDeleteModal(true)}
            className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" /> Xóa ({selectedItems.length})
          </button>
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
                      selectedItems.length === paginatedCategories.length &&
                      paginatedCategories.length > 0
                    }
                    onChange={toggleSelectAll}
                    className="w-4 h-4 text-cyan-600 rounded border-gray-300"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                  ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                  Tên danh mục
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                  Thứ tự hiển thị
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
              {paginatedCategories.map((category) => (
                <tr key={category.category_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(category.category_id)}
                      onChange={() => toggleSelectItem(category.category_id)}
                      className="w-4 h-4 text-cyan-600 rounded border-gray-300"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    #{category.category_id}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {category.category_name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {category.display}
                  </td>
                  <td className="px-4 py-3">
                    <div className="relative inline-block w-11 h-5">
                      <input
                        checked={localStatuses[category.category_id] || false}
                        id={`switch-${category.category_id}`}
                        type="checkbox"
                        onChange={() =>
                          handleToggleStatus(category.category_id)
                        }
                        className="peer appearance-none w-11 h-5 bg-slate-100 rounded-full checked:bg-green-600 cursor-pointer transition-colors duration-300"
                      />
                      <label
                        htmlFor={`switch-${category.category_id}`}
                        className="absolute top-0 left-0 w-5 h-5 bg-white rounded-full border border-slate-300 shadow-sm transition-transform duration-300 peer-checked:translate-x-6 peer-checked:border-slate-800 cursor-pointer"
                      ></label>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right space-x-1">
                    <button
                      onClick={() => {
                        setEditingItem(category);
                        setShowEditModal(true);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-cyan-600 rounded hover:bg-cyan-700"
                    >
                      <Edit className="w-3.5 h-3.5" /> Sửa
                    </button>
                    <button
                      onClick={() => {
                        setDeletingItem(category);
                        setShowDeleteModal(true);
                      }}
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
              {Math.min(currentPage * itemsPerPage, filteredCategories.length)}
            </strong>{" "}
            trong <strong>{filteredCategories.length}</strong>
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
          <div className="relative w-full max-w-2xl p-3">
            <div className="bg-white rounded-lg shadow-lg">
              <div className="flex items-start justify-between p-4 border-b">
                <h3 className="text-xl font-semibold">Thêm danh mục</h3>
                <button
                  onClick={closeModals}
                  className="text-gray-400 hover:bg-gray-200 hover:text-gray-900 rounded-lg p-1.5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleAdd}>
                <div className="p-6 space-y-6 max-h-[600px] overflow-y-auto">
                  <div>
                    <label className="text-sm font-medium text-gray-900 block mb-2">
                      Tên danh mục
                    </label>
                    <input
                      name="category_name"
                      type="text"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-900 block mb-2">
                      Thứ tự hiển thị
                    </label>
                    <input
                      name="display"
                      type="number"
                      min="1"
                      required
                      placeholder="1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    ></input>
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
                      Kích hoạt
                    </label>
                  </div>
                </div>
                <div className="flex justify-end gap-3 p-4 border-t">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-cyan-600 text-white font-medium rounded-lg hover:bg-cyan-700"
                  >
                    Thêm danh mục
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
      {showEditModal && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="relative w-full max-w-2xl p-3">
            <div className="bg-white rounded-lg shadow-lg">
              <div className="flex items-start justify-between p-4 border-b">
                <h3 className="text-xl font-semibold">Chỉnh sửa danh mục</h3>
                <button
                  onClick={closeModals}
                  className="text-gray-400 hover:bg-gray-200 hover:text-gray-900 rounded-lg p-1.5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleEdit}>
                <div className="p-6 space-y-6 max-h-[600px] overflow-y-auto">
                  <div>
                    <label className="text-sm font-medium text-gray-900 block mb-2">
                      Tên danh mục
                    </label>
                    <input
                      name="category_name"
                      type="text"
                      defaultValue={editingItem.category_name}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700 block mb-1">
                      Thứ tự hiển thị
                    </label>
                    <input
                      name="display"
                      type="number"
                      min="1"
                      defaultValue={editingItem.display}
                      required
                      placeholder="0"
                      className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-cyan-600 focus:border-cyan-600 block w-full p-2.5"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 p-4 border-t">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-cyan-600 text-white font-medium rounded-lg hover:bg-cyan-700"
                  >
                    Lưu thay đổi
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
      {showDeleteModal && deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="relative w-full max-w-md p-4">
            <div className="bg-white rounded-lg shadow-lg p-6 text-center">
              <div className="w-20 h-20 mx-auto text-red-600">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="mt-5 text-xl font-normal text-gray-700">
                Bạn có chắc muốn xóa danh mục
                <strong>"{deletingItem.category_name}"</strong>?
              </h3>
              <div className="mt-6 flex justify-center gap-4">
                <button
                  onClick={handleDelete}
                  className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Xóa
                </button>
                <button
                  onClick={closeModals}
                  className="px-6 py-2.5 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="relative w-full max-w-md p-4">
            <div className="bg-white rounded-lg shadow-lg p-6 text-center">
              <div className="w-20 h-20 mx-auto text-red-600">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="mt-5 text-xl font-normal text-gray-700">
                Xóa <strong>{selectedItems.length}</strong> danh mục đã chọn?
              </h3>
              <div className="mt-6 flex justify-center gap-4">
                <button
                  onClick={handleBulkDelete}
                  className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Xóa tất cả
                </button>
                <button
                  onClick={() => setShowBulkDeleteModal(false)}
                  className="px-6 py-2.5 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
