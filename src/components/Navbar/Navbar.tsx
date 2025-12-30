import React, { useEffect, useState } from "react";
import { ShoppingCart, User, LogOut } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

interface NavItem {
  id: number;
  name: string;
  link: string;
  order_index: number;
  is_active: number;
  parent_id?: number | null;
}

interface LoggedInUser {
  id: number;
  username: string;
  role: string;
}

const Navbar: React.FC = () => {
  const [menuItems, setMenuItems] = useState<NavItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<LoggedInUser | null>(null);
  const location = useLocation();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const loggedInUser = localStorage.getItem("user");
    if (loggedInUser) {
      try {
        setUser(JSON.parse(loggedInUser) as LoggedInUser);
      } catch {
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }, [location]);

  useEffect(() => {
    const fetchNavbar = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/navbar");
        if (!response.ok) {
          throw new Error("Lỗi khi tải navbar");
        }
        const data: NavItem[] = await response.json();
        setMenuItems(data);
      } catch (error) {
        console.error("Lỗi khi tải navbar:", error);
      }
    };
    fetchNavbar();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetch("http://localhost:5000/api/cart", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((data) => setCartCount(data.length))
        .catch(() => setCartCount(0));
    }
  }, [location]);

  const mainMenu = menuItems.filter(
    (item) => !item.parent_id && item.is_active === 1
  );

  const getSubMenu = (id: number) =>
    menuItems.filter((i) => i.parent_id === id && i.is_active === 1);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    window.location.href = "/";
  };

  return (
    <nav className="text-white fixed top-0 left-0 w-full z-50 shadow-md">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-10 py-3 flex items-center justify-between">
        <Link
          to="/"
          className="text-2xl font-bold uppercase leading-tight tracking-widest flex flex-col"
        >
          COFFEE
          <span className="text-xs font-light tracking-[0.25em] text-gray-300 text-center">
            BLEND
          </span>
        </Link>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-white focus:outline-none lg:hidden text-2xl"
        >
          Menu
        </button>

        <ul
          className={`${
            isOpen
              ? "absolute top-full left-0 w-full bg-[#343a40] flex flex-col space-y-4 p-4"
              : "hidden lg:flex"
          } uppercase tracking-wider text-sm font-medium lg:space-x-8 items-center`}
        >
          {mainMenu.map((item) => {
            const subMenu = getSubMenu(item.id);
            const hasSub = subMenu.length > 0;
            const isActive = location.pathname === item.link;

            return (
              <li
                key={item.id}
                className={`relative group ${
                  isActive ? "text-[#b6894b]" : "hover:text-[#b6894b]"
                } transition duration-200`}
              >
                <Link to={item.link} className="px-1 py-2 inline-block">
                  {item.name}
                </Link>

                {hasSub && (
                  <ul className="absolute left-0 mt-1 w-48 bg-[#1d1f21] rounded-sm shadow-lg hidden group-hover:block border border-[#2a2c2e]">
                    {subMenu.map((sub) => (
                      <li key={sub.id}>
                        <Link
                          to={sub.link}
                          className="block px-1 py-2 text-sm text-gray-200 hover:text-[#b6894b] hover:bg-[#2a2c2e] transition duration-200 text-left text-[12px]"
                        >
                          {sub.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}

          <li>
            <Link
              to="/cart"
              className="relative hover:text-[#b6894b] transition duration-200"
              title="Giỏ hàng"
            >
              <ShoppingCart className="inline-block w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-3 bg-[#fbbf24] text-black text-xs font-bold px-1.5 rounded-full">
                  {cartCount}
                </span>
              )}
            </Link>
          </li>

          <li className="relative group hover:text-[#b6894b] transition duration-200">
            <button className="flex items-center">
              <User className="inline-block w-5 h-5" />
            </button>

            <ul className="absolute -right-16 w-56 bg-[#1d1f21] rounded-sm shadow-lg hidden group-hover:block border border-[#2a2c2e] text-left">
              {user ? (
                <>
                  <li className="px-4 py-3 border-b border-[#2a2c2e] text-sm flex">
                    <span className="text-gray-400 mr-1">Xin chào </span>
                    <p className="font-medium text-[#b6894b]">
                      {user.username}
                    </p>
                  </li>
                  {user.role === "admin" && (
                    <li>
                      <Link
                        to="/admin/dashboard"
                        className="block px-3 py-2 text-sm text-yellow-400 hover:text-yellow-300 hover:bg-[#2a2c2e] transition duration-200 font-medium"
                      >
                        Trang quản trị viên
                      </Link>
                    </li>
                  )}

                  <li>
                    <Link
                      to={`/profile/${user.id}`}
                      className="block px-3 py-2 text-sm text-gray-200 hover:text-[#b6894b] hover:bg-[#2a2c2e] transition duration-200"
                    >
                      Thông tin tài khoản
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/order"
                      className="block px-3 py-2 text-sm text-gray-200 hover:text-[#b6894b] hover:bg-[#2a2c2e] transition duration-200"
                    >
                      Đơn hàng
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/changepassword"
                      className="block px-3 py-2 text-sm text-gray-200 hover:text-[#b6894b] hover:bg-[#2a2c2e] transition duration-200"
                    >
                      Đổi mật khẩu
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/addresses"
                      className="block px-3 py-2 text-sm text-gray-200 hover:text-[#b6894b] hover:bg-[#2a2c2e] transition duration-200"
                    >
                      Sổ địa chỉ
                    </Link>
                  </li>
                  <li className="flex text-red-500">
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left p-2 text-sm hover:text-red-400 hover:bg-[#2a2c2e] transition duration-200"
                    >
                      <LogOut className="inline-block w-5 h-5 mx-2" />
                      Đăng xuất
                    </button>
                  </li>
                </>
              ) : (
                <li>
                  <Link
                    to="/login"
                    className="block px-3 py-2 text-sm text-gray-200 hover:text-[#b6894b] hover:bg-[#2a2c2e] transition duration-200"
                  >
                    Đăng nhập
                  </Link>
                </li>
              )}
            </ul>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
