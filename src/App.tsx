import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
// import "./App.css";
import Navbar from "./components/Navbar/Navbar";
import Banner from "./components/Banner/Banner.tsx";
import Contact from "./components/Contact/Contact";
import About from "./components/About/About";
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
import { AdminLayout, Dashboard, AdminLogin, AdminMenu } from "./admin";
import React from "react";

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
              <About />
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
        {/* <Route path="/singleproduct" element={<SingleProduct />} /> */}
        <Route path="/singleproduct/:id" element={<SingleProduct />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="adminmenu" element={<AdminMenu />} />
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
