import { Link } from "react-router-dom";

export default function AdminSidebar() {
  return (
    <div className="w-64 bg-gray-800 text-white flex flex-col text-center sticky top-0 z-20">
      <div className="p-4 border-b border-gray-700">
        <Link
          to="/admin/dashboard"
          className="text-2xl font-bold uppercase leading-tight tracking-widest flex flex-col"
        >
          COFFEE
          <span className="text-xs font-light tracking-[0.25em] text-gray-300">
            BLEND
          </span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-3 overflow-y-auto">
        <Link
          to="/admin/dashboard"
          className="flex items-center hover:bg-gray-700 p-2 rounded transition"
        >
          <i className="fa-solid fa-house mr-3 w-5"></i>
          Trang chủ
        </Link>
        <Link
          to="/admin/adminmenu"
          className="flex items-center hover:bg-gray-700 p-2 rounded transition"
        >
          <i className="fa-solid fa-bars mr-3 w-5"></i>
          Quản lý menu
        </Link>
        <Link
          to="/admin/blog"
          className="flex items-center hover:bg-gray-700 p-2 rounded transition"
        >
          <i className="fa-solid fa-pen-to-square mr-3 w-5"></i>
          Quản lý bài viết
        </Link>
        <Link
          to="/admin/user"
          className="flex items-center hover:bg-gray-700 p-2 rounded transition"
        >
          <i className="fa-solid fa-user mr-3 w-5"></i>
          Quản lý nhân sự
        </Link>
        <Link
          to="/admin/voucher"
          className="flex items-center hover:bg-gray-700 p-2 rounded transition"
        >
          <i className="fa-solid fa-ticket mr-3 w-5"></i>
          Quản lý voucher
        </Link>
      </nav>
      <div className="p-4 space-y-3 overflow-y-auto text-red-500">
        <Link
          to="/login"
          className="flex items-center hover:bg-gray-700 p-2 rounded transition "
        >
          <i className="fa-solid fa-arrow-right-from-bracket mr-3 w-5"></i>
          Đăng xuất
        </Link>
      </div>
    </div>
  );
}
