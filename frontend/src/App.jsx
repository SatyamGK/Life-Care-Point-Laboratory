import { Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import BottomConnect from "./components/BottomConnect";
import Home from "./pages/Home";
import Achievements from "./pages/Achievements";
import PackagesTests from "./pages/PackagesTests";
import PackageInfo from "./pages/PackageInfo";
import TestInfo from "./pages/TestInfo";
import PackageBooking from "./pages/PackageBooking";
import TestBooking from "./pages/TestBooking";
import BookTest from "./pages/BookTest";
import BookingSuccess from "./pages/BookingSuccess";
import Contact from "./pages/Contact";
import Menu from "./pages/Menu";
import KeyFeatures from "./pages/KeyFeatures";

export default function App() {
  return (
    <>
      <Header />

      <main className="app-content">

        <Routes>

          {/* Home */}
          <Route path="/" element={<Home />} />

          {/* Achievements */}
          <Route path="/achievements" element={<Achievements />} />

          {/* Packages */}
          <Route path="/packages" element={<PackagesTests />} />

          {/* Tests */}
          <Route path="/tests" element={<PackagesTests />} />

          {/* Package Information */}
          <Route path="/package-info" element={<PackageInfo />} />

          {/* Test Information */}
          <Route path="/test-info" element={<TestInfo />} />

          {/* Package Booking */}
          <Route path="/package-booking" element={<PackageBooking />} />

          {/* Test Booking */}
          <Route path="/test-booking" element={<TestBooking />} />

          {/* Generic Book Test */}
          <Route path="/book-test" element={<BookTest />} />

          {/* Booking Success */}
          <Route path="/booking-success" element={<BookingSuccess />} />

          {/* Contact */}
          <Route path="/contact" element={<Contact />} />

          {/* Menu */}
          <Route path="/menu" element={<Menu />} />

          {/* KEY FEATURES */}
          <Route path="/key-features" element={<KeyFeatures />} />

          {/* Fallback */}
          <Route path="*" element={<Home />} />

        </Routes>

      </main>

      <BottomConnect />
    </>
  );
}