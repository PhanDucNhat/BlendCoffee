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

interface BlogItem {
  blog_id: number;
  title: string;
  description: string | null;
  image_url: string | null;
  post_date: string;
  comments_count: number;
}

export default function AdminBlog() {
  const [blogs, setBlogs] = useState<BlogItem[]>([]);
  const [filteredBlogs, setFilteredBlogs] = useState<BlogItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [editingItem, setEditingItem] = useState<BlogItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<BlogItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const itemsPerPage = 10;

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("http://localhost:5000/api/blog");
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(
          `HTTP ${res.status}: ${errText || "Không thể tải bài viết"}`
        );
      }
      const data = (await res.json()) as BlogItem[];
      setBlogs(data);
      setFilteredBlogs(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Lỗi kết nối server";
      setError(errorMessage);
      console.error("Fetch blogs error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  useEffect(() => {
    const filtered = blogs.filter(
      (blog) =>
        blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (blog.description?.toLowerCase().includes(searchTerm.toLowerCase()) ??
          false)
    );
    setFilteredBlogs(filtered);
    setCurrentPage(1);
  }, [searchTerm, blogs]);

  const totalPages = Math.ceil(filteredBlogs.length / itemsPerPage);
  const paginatedBlogs = filteredBlogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const toggleSelectAll = () => {
    if (
      selectedItems.length === paginatedBlogs.length &&
      paginatedBlogs.length > 0
    ) {
      setSelectedItems([]);
    } else {
      setSelectedItems(paginatedBlogs.map((b) => b.blog_id));
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
      alert("Vui lòng nhập tiêu đề bài viết!");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/admin/blog/add", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          (data as { error?: string }).error || "Thêm bài viết thất bại"
        );
      alert("Thêm bài viết thành công!");
      closeModals();
      fetchBlogs();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Lỗi khi thêm bài viết";
      alert(message);
    }
  };

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingItem) return;

    const formData = new FormData(e.currentTarget);
    if (!formData.get("title")?.toString().trim()) {
      alert("Vui lòng nhập tiêu đề!");
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:5000/api/admin/blog/${editingItem.blog_id}`,
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
      alert("Cập nhật bài viết thành công!");
      closeModals();
      fetchBlogs();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Lỗi khi cập nhật";
      alert(message);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    try {
      const res = await fetch(
        `http://localhost:5000/api/admin/blog/${deletingItem.blog_id}`,
        {
          method: "DELETE",
        }
      );
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Xóa thất bại");
      }
      alert("Xóa bài viết thành công!");
      closeModals();
      fetchBlogs();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Lỗi khi xóa";
      alert(message);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return;
    try {
      const res = await fetch(
        "http://localhost:5000/api/admin/blog/bulk-delete",
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
      fetchBlogs();
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
              <span className="mx-1">/</span> Quản lý bài viết
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
            placeholder="Tìm kiếm bài viết..."
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
                      selectedItems.length === paginatedBlogs.length &&
                      paginatedBlogs.length > 0
                    }
                    onChange={toggleSelectAll}
                    className="w-4 h-4 text-cyan-600 rounded border-gray-300"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                  ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                  Tiêu đề
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                  Ngày đăng
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                  Bình luận
                </th>
                <th className="pr-16 py-3 text-right text-xs font-medium text-gray-500">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedBlogs.map((blog) => (
                <tr key={blog.blog_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(blog.blog_id)}
                      onChange={() => toggleSelectItem(blog.blog_id)}
                      className="w-4 h-4 text-cyan-600 rounded border-gray-300"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    #{blog.blog_id}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-20 h-20 rounded bg-gray-200 border-2 border-dashed border-gray-400 overflow-hidden">
                        {blog.image_url ? (
                          <img
                            src={`${blog.image_url}`}
                            alt={blog.title}
                            className="w-full h-full object-cover"
                          />
                        ) : null}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {blog.title}
                        </div>
                        <div className="text-xs text-gray-500">
                          {blog.description
                            ? blog.description.slice(0, 80) + "..."
                            : "Không có mô tả"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {new Date(blog.post_date).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {blog.comments_count}
                  </td>
                  <td className="px-4 py-3 text-right space-x-1">
                    <button
                      onClick={() => {
                        setEditingItem(blog);
                        setImagePreview(
                          blog.image_url ? `${blog.image_url}` : ""
                        );
                        setShowEditModal(true);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-cyan-600 rounded hover:bg-cyan-700"
                    >
                      <Edit className="w-3.5 h-3.5" /> Sửa
                    </button>
                    <button
                      onClick={() => {
                        setDeletingItem(blog);
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
              {Math.min(currentPage * itemsPerPage, filteredBlogs.length)}
            </strong>{" "}
            trong <strong>{filteredBlogs.length}</strong>
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
                <h3 className="text-xl font-semibold">Thêm bài viết mới</h3>
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
                      Tiêu đề bài viết
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
                      rows={6}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    ></textarea>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-900 block mb-2">
                      Hình ảnh
                    </label>
                    <div className="w-full h-80 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-50 relative">
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
                </div>
                <div className="flex justify-end gap-3 p-4 border-t">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-cyan-600 text-white font-medium rounded-lg hover:bg-cyan-700"
                  >
                    Thêm bài viết
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
                <h3 className="text-xl font-semibold">Chỉnh sửa bài viết</h3>
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
                      Tiêu đề
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
                      Mô tả
                    </label>
                    <textarea
                      name="description"
                      rows={6}
                      defaultValue={editingItem.description || ""}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                    ></textarea>
                  </div>
                  <div className="col-span-6">
                    <label className="text-sm font-medium text-gray-900 block mb-2">
                      Hình ảnh món ăn
                    </label>
                    <div className="w-full h-96 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-50 relative">
                      {imagePreview || editingItem.image_url ? (
                        <>
                          <img
                            src={imagePreview || `${editingItem.image_url}`}
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
                Bạn có chắc muốn xóa bài viết{" "}
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
                Xóa <strong>{selectedItems.length}</strong> bài viết đã chọn?
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
