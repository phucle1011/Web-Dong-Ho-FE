import { useState } from "react";
import { Link } from "react-router-dom";
import { useEffect } from "react";
import { useCookies } from "react-cookie";
import { jwtDecode } from "jwt-decode";
import Cookies from "js-cookie";
function Header() {
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [cookies] = useCookies(["token"]);
  const [user, setUser] = useState(null);

  const toggleDropdown = () => {
    setDropdownOpen(!isDropdownOpen);
  };

  useEffect(() => {
    const token = cookies.token;
    if (token) {
      try {
        const decode = jwtDecode(token);
        setUser(decode);
      } catch (err) {
        console.error("Lỗi giải mã token:", err);
      }
    }
  }, []);
  const logout = () => {
    setUser(null);
    navigator("/login");
    Cookies.remove("token", { path: "/" });
  };
  return (
    <header className="app-header">
      <nav className="navbar navbar-expand-lg navbar-light">
        <ul className="navbar-nav">
          <li className="nav-item d-block d-xl-none">

          </li>
          <li className="nav-item">

          </li>
        </ul>
        <div className="navbar-collapse justify-content-end px-0" id="navbarNav">
          <ul className="navbar-nav flex-row ms-auto align-items-center justify-content-end">
            <Link to="/admin/profile" className="text-nowrap logo-img">
              <img
                src="/assets/images/profile/login.png"
                alt="Ảnh đại diện"
                width="35"
                height="35"
                className="rounded-full border"
              />
            </Link>
          </ul>
        </div>
      </nav>
    </header>
  );
}

export default Header;
