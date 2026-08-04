import { Routes, Route } from "react-router-dom";
import Background from "./components/Background.jsx";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import RegisterDoctor from "./pages/RegisterDoctor.jsx";
import RegisterAsha from "./pages/RegisterAsha.jsx";
import RegisterVillager from "./pages/RegisterVillager.jsx";

export default function App() {
  return (
    <div className="flex min-h-full flex-col">
      <Background />
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register/doctor" element={<RegisterDoctor />} />
          <Route path="/register/asha" element={<RegisterAsha />} />
          <Route path="/register/villager" element={<RegisterVillager />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
