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

interface voucherItem {
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
}

export default function AdminVoucher() {
  const [vouchers, setVouchers] = useState<voucherItem[]>([]);
  const [filteredVouchers, setFilteredVouchers] = useState<voucherItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [editingItem, setEditingItem] = useState<voucherItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<voucherItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const itemsPerPage = 10;

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("http://localhost:5000/api/voucher");
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(
          `HTTP ${res.status}: ${errText || "Không thể tải voucher"}`
        );
      }
      const data = (await res.json()) as voucherItem[];
      setVouchers(data);
      setFilteredVouchers(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Lỗi kết nối server";
      setError(errorMessage);
      console.error("Fetch voucher error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  useEffect(() => {
    const filtered = vouchers.filter(
      (voucher) =>
        voucher.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (voucher.description
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ??
          false)
    );
    setFilteredVouchers(filtered);
    setCurrentPage(1);
  }, [searchTerm, vouchers]);

  const totalPages = Math.ceil(filteredVouchers.length / itemsPerPage);
  const paginatedVouchers = filteredVouchers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const toggleSelectAll = () => {
    if (
      selectedItems.length === paginatedVouchers.length &&
      paginatedVouchers.length > 0
    ) {
      setSelectedItems([]);
    } else {
      setSelectedItems(paginatedVouchers.map((b) => b.voucher_id));
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
    setImagePreview("");
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    if (!formData.get("title")?.toString().trim()) {
      alert("Vui lòng nhập tên voucher!");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/admin/voucher/add", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          (data as { error?: string }).error || "Thêm voucher thất bại"
        );
      alert("Thêm voucher thành công!");
      closeModals();
      fetchVouchers();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Lỗi khi thêm voucher";
      alert(message);
    }
  };

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingItem) return;

    const formData = new FormData(e.currentTarget);
    if (!formData.get("title")?.toString().trim()) {
      alert("Vui lòng nhập tên voucher!");
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:5000/api/admin/voucher/${editingItem.voucher_id}`,
        {
          method: "PUT",
          body: formData,
        }
      );
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          (data as { error?: string }).error || "Cập nhật thất bại"
        );
      alert("Cập nhật voucher thành công!");
      closeModals();
      fetchVouchers();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Lỗi khi cập nhật";
      alert(message);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    try {
      const res = await fetch(
        `http://localhost:5000/api/admin/voucher/${deletingItem.voucher_id}`,
        {
          method: "DELETE",
        }
      );
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Xóa thất bại");
      }
      alert("Xóa voucher thành công!");
      closeModals();
      fetchVouchers();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Lỗi khi xóa";
      alert(message);
    }
  };

  const handleBulkStatus = async (newStatus: 0 | 1) => {
    if (selectedItems.length === 0) return;

    const action = newStatus === 1 ? "kích hoạt" : "hủy kích hoạt";
    if (
      !confirm(
        `Bạn có chắc muốn ${action} ${selectedItems.length} voucher này không?`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(
        "http://localhost:5000/api/admin/voucher/bulk-status",
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

      alert(`Đã ${action} thành công ${selectedItems.length} voucher!`);
      setSelectedItems([]);
      fetchVouchers();
    } catch (err) {
      console.error("Bulk status error:", err);
      alert("Lỗi khi cập nhật trạng thái. Vui lòng thử lại!");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return;

    if (!confirm(`Xóa ${selectedItems.length} voucher đã chọn?`)) return;

    try {
      const res = await fetch(
        "http://localhost:5000/api/admin/voucher/bulk-delete",
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: selectedItems }),
        }
      );

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Xóa thất bại");

      alert(data.message || "Xóa thành công!");
      setSelectedItems([]);
      setShowBulkDeleteModal(false);
      fetchVouchers();
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
              <span className="mx-1">/</span> Quản lý voucher
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
            placeholder="Tìm kiếm voucher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:max-w-xs px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
          />
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                setShowAddModal(true);
                setImagePreview("");
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
      {selectedItems.length > 0 && (
        <div className="p-4 bg-cyan-50 border border-cyan-200 rounded-lg flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-cyan-900">
              Đã chọn <strong>{selectedItems.length}</strong> voucher
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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={
                      selectedItems.length === paginatedVouchers.length &&
                      paginatedVouchers.length > 0
                    }
                    onChange={toggleSelectAll}
                    className="w-4 h-4 text-cyan-600 rounded border-gray-300"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                  ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                  Tên mã
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                  Ngày bắt đầu
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                  Ngày kết thúc
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                  Số lượng
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                  Số tiền giảm
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
              {paginatedVouchers.map((voucher) => (
                <tr key={voucher.voucher_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(voucher.voucher_id)}
                      onChange={() => toggleSelectItem(voucher.voucher_id)}
                      className="w-4 h-4 text-cyan-600 rounded border-gray-300"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    #{voucher.voucher_id}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-20 h-20 rounded bg-gray-200 border-2 border-dashed border-gray-400 overflow-hidden">
                        {voucher.image_url ? (
                          <img
                            src={`${voucher.image_url}`}
                            alt={voucher.title}
                            className="w-full h-full object-cover"
                          />
                        ) : null}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {voucher.title}
                        </div>
                        <div className="text-xs text-gray-500">
                          {voucher.description
                            ? voucher.description.slice(0, 80)
                            : "Không có mô tả"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {new Date(voucher.start_date).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {new Date(voucher.end_date).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {voucher.quantity}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    - {voucher.discount_value}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-medium ${
                        voucher.status ? "text-green-700" : "text-red-700"
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${
                          voucher.status ? "bg-green-500" : "bg-red-500"
                        }`}
                      />
                      {voucher.status ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-1">
                    <button
                      onClick={() => {
                        setEditingItem(voucher);
                        setImagePreview(
                          voucher.image_url ? `${voucher.image_url}` : ""
                        );
                        setShowEditModal(true);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-cyan-600 rounded hover:bg-cyan-700"
                    >
                      <Edit className="w-3.5 h-3.5" /> Sửa
                    </button>
                    <button
                      onClick={() => {
                        setDeletingItem(voucher);
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
              {Math.min(currentPage * itemsPerPage, filteredVouchers.length)}
            </strong>{" "}
            trong <strong>{filteredVouchers.length}</strong>
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
                <h3 className="text-xl font-semibold">Thêm voucher</h3>
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
                      Tên voucher
                    </label>
                    <input
                      name="title"
                      type="text"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-900 block mb-2">
                      Mô tả / Nội dung ngắn
                    </label>
                    <textarea
                      name="description"
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    ></textarea>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-900 block mb-2">
                      Hình ảnh
                    </label>
                    <div className="w-full h-52 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-50 relative">
                      {imagePreview ? (
                        <>
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => setImagePreview("")}
                            className="absolute top-2 right-2 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500">
                          <svg
                            className="w-12 h-14 mb-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M7 16a4 4 0 01-.88-7.903A5.5 5.5 0 1116 6a5.5 5.5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                            />
                          </svg>
                          <p className="text-sm">Click để tải ảnh lên</p>
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      name="image"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="mt-2 block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cyan-600 file:text-white hover:file:bg-cyan-700"
                    />
                  </div>
                  <div className="col-span-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs font-medium text-gray-700 block mb-1">
                          Ngày bắt đầu
                        </label>
                        <input
                          name="start_date"
                          type="date"
                          required
                          className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-cyan-600 focus:border-cyan-600 block w-full p-2.5"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-700 block mb-1">
                          Ngày kết thúc
                        </label>
                        <input
                          name="end_date"
                          type="date"
                          required
                          className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-cyan-600 focus:border-cyan-600 block w-full p-2.5"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-700 block mb-1">
                          Số lượng
                        </label>
                        <input
                          name="quantity"
                          type="number"
                          min="1"
                          required
                          placeholder="0"
                          className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-cyan-600 focus:border-cyan-600 block w-full p-2.5"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-700 block mb-1">
                          Loại áp dụng giảm giá
                        </label>
                        <select
                          name="discount_type"
                          required
                          className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-cyan-600 focus:border-cyan-600 block w-full p-2.5"
                        >
                          <option value="">Chọn loại giảm giá</option>
                          <option value="percent">percent</option>
                          <option value="fixed">fixed</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-700 block mb-1">
                          Số tiển giảm
                        </label>
                        <input
                          name="discount_value"
                          type="number"
                          min="1"
                          required
                          placeholder="0.00"
                          className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-cyan-600 focus:border-cyan-600 block w-full p-2.5"
                        />
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
                      Kích hoạt
                    </label>
                  </div>
                </div>
                <div className="flex justify-end gap-3 p-4 border-t">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-cyan-600 text-white font-medium rounded-lg hover:bg-cyan-700"
                  >
                    Thêm voucher
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
                <h3 className="text-xl font-semibold">Chỉnh sửa voucher</h3>
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
                      Tên voucher
                    </label>
                    <input
                      name="title"
                      type="text"
                      defaultValue={editingItem.title}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-900 block mb-2">
                      Mô tả / Nội dung ngắn
                    </label>
                    <textarea
                      name="description"
                      rows={3}
                      defaultValue={editingItem.description || ""}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                    ></textarea>
                  </div>
                  <div className="col-span-6">
                    <label className="text-sm font-medium text-gray-900 block mb-2">
                      Hình ảnh
                    </label>
                    <div className="w-full h-52 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-50 relative">
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
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs font-medium text-gray-700 block mb-1">
                          Ngày bắt đầu
                        </label>
                        <input
                          name="start_date"
                          type="date"
                          defaultValue={
                            editingItem.start_date
                              ? new Date(editingItem.start_date)
                                  .toISOString()
                                  .split("T")[0]
                              : ""
                          }
                          required
                          className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-cyan-600 focus:border-cyan-600 block w-full p-2.5"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-700 block mb-1">
                          Ngày kết thúc
                        </label>
                        <input
                          name="end_date"
                          type="date"
                          defaultValue={
                            editingItem.end_date
                              ? new Date(editingItem.end_date)
                                  .toISOString()
                                  .split("T")[0]
                              : ""
                          }
                          required
                          className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-cyan-600 focus:border-cyan-600 block w-full p-2.5"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-700 block mb-1">
                          Số lượng
                        </label>
                        <input
                          name="quantity"
                          type="number"
                          min="1"
                          defaultValue={editingItem.quantity}
                          required
                          placeholder="0"
                          className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-cyan-600 focus:border-cyan-600 block w-full p-2.5"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-700 block mb-1">
                          Loại áp dụng giảm giá
                        </label>
                        <select
                          name="discount_type"
                          defaultValue={editingItem.discount_type}
                          required
                          className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-cyan-600 focus:border-cyan-600 block w-full p-2.5"
                        >
                          <option value="percent">percent</option>
                          <option value="fixed">fixed</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-700 block mb-1">
                          Số tiển giảm
                        </label>
                        <input
                          name="discount_value"
                          type="number"
                          defaultValue={editingItem.discount_value}
                          min="1"
                          required
                          placeholder="0.00"
                          className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-cyan-600 focus:border-cyan-600 block w-full p-2.5"
                        />
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
                      Kích hoạt
                    </label>
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
                Bạn có chắc muốn xóa voucher{" "}
                <strong>"{deletingItem.title}"</strong>?
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
                Xóa <strong>{selectedItems.length}</strong> voucher đã chọn?
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
