import { Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import BottomConnect from "./components/BottomConnect";
import ScrollRestoration from "./components/ScrollRestoration";
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
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <>
      <Header />

      <ScrollRestoration />

      <main className="app-content">
        <Routes>

          <Route path="/" element={<Home />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/packages" element={<PackagesTests />} />
          <Route path="/tests" element={<PackagesTests />} />
          <Route path="/package-info/:id" element={<PackageInfo />} />
          <Route path="/package-info" element={<PackageInfo />} />
          <Route path="/test-info/:id" element={<TestInfo />} />
          <Route path="/test-info" element={<TestInfo />} />
          <Route path="/package-booking/:id" element={<PackageBooking />} />
          <Route path="/package-booking" element={<PackageBooking />} />
          <Route path="/test-booking/:id" element={<TestBooking />} />
          <Route path="/test-booking" element={<TestBooking />} />
          <Route path="/book-test" element={<BookTest />} />
          <Route path="/booking-success" element={<BookingSuccess />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/key-features" element={<KeyFeatures />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <BottomConnect />
    </>
  );
}