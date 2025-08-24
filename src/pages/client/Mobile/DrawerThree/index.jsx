import { useState } from "react";
import Compair from "../../Helpers/icons/Compair";
import ThinLove from "../../Helpers/icons/ThinLove";
import { Link } from "react-router-dom";
import Arrow from "../../Helpers/icons/Arrow";
import { FaRegUser } from "react-icons/fa";
export default function DrawerThree({ className, open, action, type }) {
  const [tab, setTab] = useState("category");
  const [isSubMenuOpen, setIsSubMenuOpen] = useState(false);

  return (
    <div
      className={`drawer-wrapper w-full block lg:hidden h-full relative ${
        className || ""
      }`}
    >
      {open && (
        <div
          onClick={action}
          className="w-full h-screen bg-black bg-opacity-40 z-40 left-0 top-0 fixed"
        ></div>
      )}

      <div
        className={`w-[280px] transition-all duration-300 ease-in-out h-screen overflow-y-auto bg-white fixed top-0 z-50 ${
          open ? "left-0" : "-left-[280px]"
        }`}
      >
        {/* Header icons */}
        <div className="w-full px-5 mt-5 mb-4">
          <div className="flex justify-between items-center">
            <div className="flex space-x-5 items-center">
              <Link to="/products-compaire">
                <Compair />
              </Link>
              <Link to="/wishlist">
                <ThinLove />
              </Link>
              <Link to="/profile">
<FaRegUser/>              
</Link>
            </div>
            <button onClick={action} type="button">
<span className="text-xl text-red-500 cursor-pointer">&times;</span>
                          </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="nav mt-5 px-5">
         <ul className="flex flex-col space-y-1">
  <li>
    <Link
      to="/"
      className={`block w-full text-sm font-600 px-2 py-2 rounded-md transition-all duration-200 ${
        type === 3 ? "text-white" : "text-qblacktext"
      } hover:bg-blue-100 hover:text-blue-600`}
    >
      Trang chủ
    </Link>
  </li>

  <li>
    <Link
      to="/all-products"
      className={`block w-full text-sm font-600 px-2 py-2 rounded-md transition-all duration-200 ${
        type === 3 ? "text-white" : "text-qblacktext"
      } hover:bg-blue-100 hover:text-blue-600`}
    >
      Sản phẩm
    </Link>
  </li>

  <li>
    <button
      onClick={() => setIsSubMenuOpen(!isSubMenuOpen)}
      className={`block w-full flex items-center justify-between text-sm font-600 px-2 py-2 rounded-md transition-all duration-200 ${
        isSubMenuOpen
          ? "bg-blue-100 text-blue-600"
          : type === 3
          ? "text-white"
          : "text-qblacktext"
      } hover:bg-blue-100 hover:text-blue-600`}
    >
      Trang
      <Arrow
        className={`ml-1 fill-current transform transition-transform duration-200 ${
          isSubMenuOpen ? "rotate-90" : ""
        }`}
      />
    </button>

    {isSubMenuOpen && (
      <div className="sub-menu mt-2 bg-white shadow-lg p-4 rounded ml-2 border-l border-qgray border-opacity-50">
        <ul className="flex flex-col space-y-2">
          <li>
            <Link
              to="/privacy-policy"
              className="block text-sm px-2 py-1 rounded hover:bg-blue-100 hover:text-blue-600"
            >
              Chính sách bảo mật
            </Link>
          </li>
          <li>
            <Link
              to="/terms-condition"
              className="block text-sm px-2 py-1 rounded hover:bg-blue-100 hover:text-blue-600"
            >
              Điều khoản - Điều kiện
            </Link>
          </li>
          <li>
            <Link
              to="/faq"
              className="block text-sm px-2 py-1 rounded hover:bg-blue-100 hover:text-blue-600"
            >
              Câu hỏi thường gặp
            </Link>
          </li>
        </ul>
      </div>
    )}
  </li>

  <li>
    <Link
      to="/about"
      className={`block w-full text-sm font-600 px-2 py-2 rounded-md transition-all duration-200 ${
        type === 3 ? "text-white" : "text-qblacktext"
      } hover:bg-blue-100 hover:text-blue-600`}
    >
      Về chúng tôi
    </Link>
  </li>

  <li>
    <Link
      to="/blogs"
      className={`block w-full text-sm font-600 px-2 py-2 rounded-md transition-all duration-200 ${
        type === 3 ? "text-white" : "text-qblacktext"
      } hover:bg-blue-100 hover:text-blue-600`}
    >
      Tin tức
    </Link>
  </li>

  <li>
    <Link
      to="/contact"
      className={`block w-full text-sm font-600 px-2 py-2 rounded-md transition-all duration-200 ${
        type === 3 ? "text-white" : "text-qblacktext"
      } hover:bg-blue-100 hover:text-blue-600`}
    >
      Liên hệ
    </Link>
  </li>

  <li>
    <Link
      to="/auctions"
      className={`block w-full text-sm font-600 px-2 py-2 rounded-md transition-all duration-200 ${
        type === 3 ? "text-white" : "text-qblacktext"
      } hover:bg-blue-100 hover:text-blue-600`}
    >
      Đấu giá
    </Link>
  </li>
</ul>


        </div>
      </div>
    </div>
  );
}
