export default function AdminNavbar() {
  return (
    <header className="h-14 bg-white shadow-md flex items-center px-4 justify-between sticky top-0 z-10">
      <h1 className="text-lg font-semibold">Trang quản trị</h1>
      <button className="text-sm px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition">
        Logout
      </button>
    </header>
  );
}
