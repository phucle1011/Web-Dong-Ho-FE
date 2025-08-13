import { Link, useNavigate } from "react-router-dom";
import Arrow from "../../Helpers/icons/Arrow";
import Selectbox from "../../Helpers/Selectbox";
import { decodeToken } from "../../Helpers/jwtDecode";
import { useState } from "react";
import ConfirmLogoutModal from "../../../../components/client/Confirm/ConfirmLogoutModal";

export default function TopBar({ className }) {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const decoded = token ? decodeToken(token) : null;

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("tokenExpire");
    setShowLogoutModal(false);
    navigate("/");
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <>
      <div
        className={`w-full bg-white h-10 border-b border-qgray-border ${className || ""}`}
      >
        <div className="container-x mx-auto h-full">
          <div className="flex justify-between items-center h-full">
            <div className="topbar-nav">
              <ul className="flex space-x-6">
                {!decoded ? (
                  <li>
                    <Link to="/login">
                      <span className="text-xs leading-6 text-qblack font-500 inline-flex items-center hover:text-qgray transition-colors">
                        Tài khoản
                      </span>
                    </Link>
                  </li>
                ) : (
                  <li className="relative text-xs leading-6">
                    <button
                      onClick={toggleDropdown}
                      className="text-xs leading-6 text-qblack font-500 flex items-center space-x-1 focus:outline-none hover:text-qgray transition-colors"
                    >
                      <span>Xin chào, {decoded.name}</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        fill="currentColor"
                        viewBox="0 0 16 16"
                      >
                        <path
                          fillRule="evenodd"
                          d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"
                        />
                      </svg>
                    </button>

                    {/* Dropdown menu */}
                    <ul
                      className={`absolute left-0 mt-1 w-48 bg-white border rounded-lg shadow-lg z-50 ${
                        isDropdownOpen ? "block" : "hidden"
                      }`}
                    >
                      {decoded.role === "admin" && (
                        <li>
                          <Link
                            to="/admin"
                            className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                            onClick={() => setIsDropdownOpen(false)}
                          >
                           Trang quản lý
                          </Link>
                        </li>
                      )}
                      <li>
                        <button
                          onClick={handleLogout}
                          className="w-full text-left block px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          Đăng xuất
                        </button>
                      </li>
                    </ul>

                    {/* Hiển thị modal nếu showLogoutModal === true */}
                    {showLogoutModal && (
                      <ConfirmLogoutModal
                        onConfirm={confirmLogout}
                        onCancel={cancelLogout}
                      />
                    )}
                  </li>
                )}
                {/* <li>
                  <Link to="/tracking-order">
                    <span className="text-xs leading-6 text-qblack font-500 hover:text-qgray transition-colors">
                      Theo dõi đơn hàng
                    </span>
                  </Link>
                </li> */}
                <li>
                  <Link to="/faq">
                    <span className="text-xs leading-6 text-qblack font-500 hover:text-qgray transition-colors">
                      Câu hỏi thường gặp
                    </span>
                  </Link>
                </li>
              </ul>
            </div>
            {/* <div className="topbar-dropdowns sm:block hidden">
              <div className="flex space-x-6">
                <div className="country-select flex space-x-1 items-center">
                  <div>
                    <img
                      src={`${process.env.REACT_APP_PUBLIC_URL}/assets/images/country-logo-16x16.png`}
                      width="16"
                      height="16"
                      alt="country logo"
                      className="overflow-hidden rounded-full"
                    />
                  </div>
                  <Selectbox
                    className="w-fit"
                    datas={["United State", "Bangladesh", "India"]}
                  />
                  <div>
                    <Arrow className="fill-current qblack" />
                  </div>
                </div>
                <div className="currency-select flex space-x-1 items-center">
                  <Selectbox className="w-fit" datas={["USD", "BDT"]} />
                  <Arrow className="fill-current qblack" />
                </div>
                <div className="language-select flex space-x-1 items-center">
                  <Selectbox className="w-fit" datas={["Bangla", "English"]} />
                  <Arrow className="fill-current qblack" />
                </div>
              </div>
            </div> */}
          </div>
        </div>
      </div>
    </>
  );
}