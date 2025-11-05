import React, { useEffect, useState } from "react";
import axios from "axios";
import { ShoppingCart, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

interface NavItem {
  id: number;
  name: string;
  link: string;
  order_index: number;
  is_active: number;
  parent_id?: number | null;
}

const Navbar: React.FC = () => {
  const [menuItems, setMenuItems] = useState<NavItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    axios
      .get<NavItem[]>("http://localhost:5000/api/navbar")
      .then((res) => setMenuItems(res.data))
      .catch((err) => console.error("Lỗi khi tải navbar:", err));
  }, []);

  const mainMenu = menuItems.filter(
    (item) => !item.parent_id && item.is_active === 1
  );
  const getSubMenu = (id: number) =>
    menuItems.filter((i) => i.parent_id === id && i.is_active === 1);

  return (
    <nav className="text-white fixed top-0 left-0 w-full z-50 shadow-md">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-10 py-3 flex items-center justify-between">
        <Link
          to="/"
          className="text-2xl font-bold uppercase leading-tight tracking-widest flex flex-col"
        >
          COFFEE
          <span className="text-xs font-light tracking-[0.25em] text-gray-300">
            BLEND
          </span>
        </Link>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-white focus:outline-none lg:hidden text-2xl"
        >
          ☰
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
                  {hasSub && <span className="ml-1">▾</span>}
                </Link>

                {hasSub && (
                  <ul className="absolute left-0 mt-2 w-48 bg-[#1d1f21] rounded-sm shadow-lg hidden group-hover:block border border-[#2a2c2e]">
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
            >
              <ShoppingCart className="inline-block w-5 h-5" />
              <span className="absolute -top-2 -right-3 bg-[#fbbf24] text-black text-xs font-bold px-1.5 rounded-full">
                1
              </span>
            </Link>
          </li>
          <li>
            <Link
              to="/login"
              className="relative hover:text-[#b6894b] transition duration-200"
            >
              <User className="inline-block w-5 h-5" />
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
