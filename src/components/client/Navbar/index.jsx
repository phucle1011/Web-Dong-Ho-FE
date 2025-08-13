import { Link, useLocation, useNavigate } from "react-router";
import { Cookies } from "react-cookie";
import { useEffect, useState } from "react";


export default  function Navbar() {   
    const location = useLocation();
    const navigator = useNavigate();
    const [user, setUser] = useState(null);
     const logout = () => {
        setUser(null);
        navigator("/login");
        Cookies.remove("token", { path: "/" });
    };
    return (
        <ul className="space-y-4">
        <li className="border-2 border-gray-200 rounded-md">
            <Link to={"/profile"}
                className="block hover:bg-gray-300 p-2 rounded-md hover:text-[#043175] transition-colors duration-200">
                <i className="fas fa-user mr-2"></i> Thông tin cá nhân
            </Link>
        </li>
        <li className="border-2 border-gray-200 rounded-md">
            <Link to={"/bookingHistory"}
                className="block hover:bg-gray-300 p-2 rounded-md hover:text-[#043175] transition-colors duration-200">
                <i className="fas fa-history mr-2"></i> Lịch sử đặt vé
            </Link>
        </li>
        <li className="border-2 border-gray-200 rounded-md">
            <Link onClick={logout}
                className="block hover:bg-gray-300 p-2 rounded-md hover:text-[#043175] transition-colors duration-200">
                <i className="fas fa-sign-out-alt mr-2"></i> Đăng xuất
            </Link>
        </li>
    </ul>
    
    )

}