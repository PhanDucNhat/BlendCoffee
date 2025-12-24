import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";
// import "./App.css";
import Navbar from "./components/Navbar/Navbar";
import Banner from "./components/Banner/Banner.tsx";
import Contact from "./components/Contact/Contact";
// import About from "./components/About/About";
import Voucher from "./components/Voucher/Voucher";
import Seller from "./components/Seller/Seller";
import Product from "./components/Product/Product";
import Blog from "./components/Blog/Blog";
import Footer from "./components/Footer/Footer";
import Menu from "./pages/Menu";
import BlogPage from "./pages/Blog";
import AboutPage from "./pages/About";
import ContactPage from "./pages/Contact";
import CartPage from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Login from "./pages/Login";
import ShopPage from "./pages/Shop";
import SingleProduct from "./pages/SingleProduct";
import Profile from "./pages/user/Profile";
import Order from "./pages/user/Order";
import Change from "./pages/user/ChangePassword";
import Address from "./pages/user/Addresses";
import {
  AdminLayout,
  Dashboard,
  AdminCategory,
  AdminMenu,
  AdminBlog,
  AdminUser,
  AdminVoucher,
  AdminOrder,
  PrintOrder,
  AdminStatistical,
} from "./admin";
import React from "react";

interface LoggedInUser {
  id: number;
  username: string;
  role: string;
}

const AdminRoute: React.FC<{ children: React.ReactElement }> = ({
  children,
}) => {
  const location = useLocation();
  const storedUser = localStorage.getItem("user");

  if (!storedUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  try {
    const user: LoggedInUser = JSON.parse(storedUser);
    if (user.role !== "admin") {
      return <Navigate to="/" replace />;
    }
  } catch {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const AppContent: React.FC = () => {
  const location = useLocation();

  const hideLayout =
    location.pathname.startsWith("/login") ||
    location.pathname.startsWith("/admin");

  return (
    <>
      {!hideLayout && <Navbar />}

      <Routes>
        <Route
          path="/"
          element={
            <>
              <Banner />
              <Contact />
              {/* <About /> */}
              <Voucher />
              <Seller />
              <Product />
              <Blog />
            </>
          }
        />
        <Route path="/menu" element={<Menu />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/profile/:id" element={<Profile />} />
        <Route path="/order" element={<Order />} />
        <Route path="/changepassword" element={<Change />} />
        <Route path="/addresses" element={<Address />} />
        {/* <Route path="/singleproduct" element={<SingleProduct />} /> */}
        <Route path="/singleproduct/:id" element={<SingleProduct />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="category" element={<AdminCategory />} />
          <Route path="adminmenu" element={<AdminMenu />} />
          <Route path="blog" element={<AdminBlog />} />
          <Route path="user" element={<AdminUser />} />
          <Route path="voucher" element={<AdminVoucher />} />
          <Route path="order" element={<AdminOrder />} />
          <Route path="order/print/:orderId" element={<PrintOrder />} />
          <Route path="statistical" element={<AdminStatistical />} />
        </Route>
      </Routes>

      {!hideLayout && <Footer />}
    </>
  );
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
