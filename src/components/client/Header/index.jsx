import { Link, useLocation } from "react-router";
import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useCookies } from "react-cookie";
import React from "react";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import AccountCircle from '@mui/icons-material/AccountCircle';
import ArrowDropDown from '@mui/icons-material/ArrowDropDown';
import Cookies from "js-cookie";
import axios from "axios";
import Select from "react-select";
import { useNavigate } from 'react-router-dom';
import Constants from "../../../Constants";

const URL = Constants.DOMAIN_API;
const ENDPOINT = "admin/routes";

function Header() {
    const [user, setUser] = useState(null);
    const [cookies] = useCookies(["token"]);
    const [anchorEl, setAnchorEl] = React.useState(null);
    const open = Boolean(anchorEl);
    const navigator = useNavigate();
    const [selectedDate, setSelectedDate] = useState('');


    useEffect(() => {
        checkCookie();
        getDataOptions();
    }, [])

    const checkCookie = () => {
        const token = cookies.token;
        if (token) {
            try {
                const decode = jwtDecode(token);
                setUser(decode);
            } catch (err) {
                console.error("Lỗi giải mã token:", err);
            }
        } else {
            setUser(null);
        }
    }

    const handleClose = () => {
        setAnchorEl(null);
    };
    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };
    const handleProfile = () => {
        navigator("/profile");
    };
    const handleHistory = () => {
        navigator("/bookingHistory");
    };
    const logout = () => {
        setUser(null);
        navigator("/login");
        Cookies.remove("token", { path: "/" });
    };



    //----------------------[ SREACH OPTION ]---------------------//
    const [startPointOptions, setStartPointOptions] = useState([]);
    const [endPointOptions, setEndPointOptions] = useState([]);
    const [selectedStartPoint, setSelectedStartPoint] = useState(null);
    const [selectedEndPoint, setSelectedEndPoint] = useState(null);

    const customStyles = {
        control: (provided) => ({
            ...provided,
            boxShadow: "none",
            border: "none",
            width: "100%",
        }),
        option: (provided, state) => ({
            ...provided,
            color: "gray",
            textAlign: "left",
            backgroundColor: state.isSelected
                ? "#f0f0f0"
                : state.isFocused
                    ? "#f9f9f9"
                    : "white",
        }),
        singleValue: (provided) => ({
            ...provided,
            color: "#0F3079",
        }),
    };

    const getDataOptions = async () => {
        try {
            const response = await axios.get(`${URL}/${ENDPOINT}/list`);
            const responseData = response.data;

            if (responseData && responseData.data && Array.isArray(responseData.data)) {
                const data = responseData.data;

                const startOptions = data.map(item => ({
                    value: item.startPoint,
                    label: item.startPoint
                }));

                const endOptions = data.map(item => ({
                    value: item.endPoint,
                    label: item.endPoint
                }));

                setStartPointOptions(startOptions);
                setEndPointOptions(endOptions);

                return data;
            }
        } catch (error) {
            console.error("Lỗi khi lấy dữ liệu:", error);
            setStartPointOptions([]);
            setEndPointOptions([]);
            return [];
        }
    };

    const handleSearch = async () => {
        try {
            const response = await axios.post('http://localhost:3000/bus/search', {
                startPoint: selectedStartPoint?.value || '',
                endPoint: selectedEndPoint?.value || '',
                travelTime: selectedDate
            });

            if (response.data.success) {
                navigator ('/bus', {
                    state: { tripsData: response.data.data }
                });
            } else {
                console.error('Lỗi từ server:', response.data.message);
            }
        } catch (err) {
            console.error('Lỗi khi tìm kiếm:', err.response?.data || err.message);
        }
    };

    return (

        <header className="p-0 mb-3">
            <div className="menu fixed top-0 left-0 w-full z-50" id="menu">
                <div
                    className="menu-top flex justify-between w-[80%] lg:w-[80%] mx-auto items-center py-3">
                    <div className="menu-top-left font-bold text-2xl">
                        <img src="/assets/images/main/logo.png" alt
                            className="w-1/2 md:w-[50%]" />
                    </div>
                    <div className="menu-top-right flex p-2">
                        <ul
                            className="flex flex-col md:flex-row gap-2 justify-between list-none items-center">
                            <li
                                className="hover:bg-black/10 px-4 py-2 cursor-pointer rounded-md">
                                <Link to="/contact">Hỗ trợ</Link></li>
                            <li
                                className="hover:bg-black/10 px-4 py-2 cursor-pointer rounded-md"><Link
                                    to="/bookingHistory">Đặt chỗ của
                                    tôi</Link></li>
                            {
                                user ? (
                                    <div>
                                        <Button
                                            id="basic-button"
                                            aria-controls={open ? 'basic-menu' : undefined}
                                            aria-haspopup="true"
                                            aria-expanded={open ? 'true' : undefined}
                                            onClick={handleClick}
                                        >
                                            {user.fullName}
                                            <i className="fas fa-angle-down ml-2"></i>
                                        </Button>
                                        <Menu
                                            id="basic-menu"
                                            anchorEl={anchorEl}
                                            open={open}
                                            onClose={handleClose}
                                            MenuListProps={{
                                                'aria-labelledby': 'basic-button',
                                            }}
                                        >
                                            <MenuItem onClick={() => { handleProfile(); handleClose(); }}>Tài khoản của tôi</MenuItem>
                                            <MenuItem onClick={() => { handleHistory(); handleClose(); }}>Lịch sử mua vé</MenuItem>
                                            <MenuItem onClick={() => { logout(); handleClose(); }}>Đăng xuất</MenuItem>

                                        </Menu>
                                    </div>) : (
                                    <>
                                        <li
                                            className="border border-white rounded-lg px-4 py-2 hover:bg-black/10 cursor-pointer">
                                            <Link
                                                to="/register" className="no-underline"><i
                                                    className="fas fa-user mr-2"></i> Đăng
                                                ký</Link></li>
                                        <li
                                            className="rounded-lg px-4 py-2 bg-sky-500 hover:text-white transition duration-300 font-bold hover:bg-sky-600/50">
                                            <Link to="/login" className="no-underline">Đăng nhập</Link>
                                        </li>
                                    </>
                                )
                            }
                        </ul>
                    </div>
                </div>
                <hr className="border-gray-500 opacity-50" />
                <div
                    className="menu-bottom flex justify-start w-[80%] lg:w-[80%] mx-auto items-center py-1">
                    <ul
                        className="flex flex-wrap gap-1 justify-center md:justify-start list-none items-center font-bold">
                        <li
                            className="hover:bg-black/10 px-4 py-2 cursor-pointer rounded-md"><Link to="/">Đặt
                                vé xe</Link></li>
                        <li
                            className="hover:bg-black/10 px-4 py-2 cursor-pointer rounded-md"><Link to="/about">Về
                                chúng tôi</Link></li>
                        <li
                            class="hover:bg-black/10 px-4 py-2 cursor-pointer rounded-md"><Link
                                to="/bus">Lịch trình</Link></li>
                        <li
                            class="hover:bg-black/10 px-4 py-2 cursor-pointer rounded-md"><Link to="/blog">Tin
                                tức</Link></li>
                        <li
                            class="hover:bg-black/10 px-4 py-2 cursor-pointer rounded-md"><Link to="/contact">Liên
                                hệ</Link></li>
                    </ul>
                </div>
                <hr className="border-gray-500 opacity-50" />
            </div>

            <div id="mobileMenu" className=" w-full z-50 bg-[#043175] text-white ">
                <div
                    className="menu-top flex justify-between w-[90%] mx-auto items-center py-4">
                    <div className="menu-top-left font-bold text-2xl">
                        <img src="../../public/assets/images/main/logo.png"
                            alt="Logo" className="w-1/2 md:w-[50%]" />
                    </div>

                    <button id="menu-toggle"
                        className="block md:hidden p-2 text-white">
                        <svg xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6 text-gray-700" fill="none"
                            viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round"
                                stroke-width="2"
                                d="M4 6h16M4 12h16m-7 6h7"></path>
                        </svg>
                    </button>
                </div>

                <hr className="border-gray-500 opacity-50" />

                <div id="mobileDropdownMenu" className="hidd shadow-md">
                    <ul className="flex flex-col text-center font-bold py-4">
                        <li
                            className="hover:bg-black/10 px-4 py-2 cursor-pointer rounded-md">Đặt
                            vé xe</li>
                        <li
                            className="hover:bg-black/10 px-4 py-2 cursor-pointer rounded-md">Về
                            chúng tôi</li>
                        <li
                            className="hover:bg-black/10 px-4 py-2 cursor-pointer rounded-md"><Link
                                to="./bus.html">Lịch trình</Link></li>
                        <li
                            className="hover:bg-black/10 px-4 py-2 cursor-pointer rounded-md">Tin
                            tức</li>
                        <li
                            className="hover:bg-black/10 px-4 py-2 cursor-pointer rounded-md">Liên
                            hệ</li>
                    </ul>
                </div>
            </div>

            <div id="homeHeader"
                className="w-full h-[300px] md:h-[500px] bg-cover bg-center relative text-white flex justify-center items-center">
                <div
                    className="absolute w-full md:w-3/4 max-w-[1000px] text-center mt-[13%] px-4 header-content">
                    <h1 className="text-2xl md:text-4xl font-bold mb-8 text-white">Khám Phá
                        Việt Nam, Theo Cách Của Bạn</h1>
                    <div
                        className="w-full flex justify-center items-center rounded-[16px] border-[6px] border-gray-100/10">
                        <div className="flex flex-col md:flex-row bg-white shadow-md rounded-lg w-full gap-2 p-4 items-center">
                            <div className="flex flex-col md:flex-row w-full md:w-[95%] items-center justify-between gap-4">
                                <div className="flex flex-col w-full md:w-[30%]">
                                    <label className="text-blue-950 text-sm text-left px-2 font-semibold mb-1">Từ</label>
                                    <div className="flex justify-center items-center p-2 rounded">
                                        <i className="fas fa-bus text-lg text-sky-700"></i>
                                        <Select
                                            options={startPointOptions}
                                            value={selectedStartPoint}
                                            onChange={(selectedOption) => setSelectedStartPoint(selectedOption)}
                                            placeholder="Nhập điểm đi"
                                            className="outline-none w-full bg-transparent ml-2 py-1 text-blue-950"
                                            styles={customStyles}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-center md:w-[5%] h-full">
                                    <i className="fas fa-exchange-alt text-sky-700 text-lg cursor-pointer hover:text-gray-700"></i>
                                </div>

                                <div className="flex flex-col w-full md:w-[30%]">
                                    <label className="text-blue-950 text-sm text-left px-2 font-semibold mb-1">Đến</label>
                                    <div className="flex items-center bg-white p-2 rounded">
                                        <i className="fas fa-bus text-lg text-sky-700"></i>
                                        <Select
                                            options={endPointOptions}
                                            value={selectedEndPoint}
                                            onChange={(selectedOption) => setSelectedEndPoint(selectedOption)}
                                            placeholder="Nhập điểm đến"
                                            className="outline-none w-full bg-transparent ml-2 py-1 text-blue-950"
                                            styles={customStyles}
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col w-full md:w-[30%]">
                                    <label className="text-blue-950 text-sm text-left px-2 font-semibold mb-1">Ngày khởi hành</label>
                                    <div className="flex items-center bg-white p-2 rounded relative">
                                        <i
                                            className="fas fa-calendar-alt text-lg text-sky-700 absolute left-2 top-1/2 transform -translate-y-1/2 cursor-pointer"
                                            onClick={() => document.getElementById('departure-date').showPicker()}
                                        ></i>
                                        <input value={selectedDate}
                                            onChange={(e) => setSelectedDate(e.target.value)}
                                            type="date"
                                            id="departure-date"
                                            className="outline-none w-full bg-transparent pl-8 text-blue-950 cursor-pointer appearance-none [&::-webkit-calendar-picker-indicator]:hidden"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex md:w-[5%] items-end h-full">
                                <button
                                    onClick={handleSearch}
                                    className="bg-orange-500 hover:bg-orange-600 w-full text-white p-2 rounded transition duration-300"
                                >
                                    <i className="fas fa-search"></i>
                                </button>
                            </div>
                        </div>


                    </div>
                    <div
                        className="w-full md:w-[80%] flex flex-wrap items-center gap-2 mt-4 text-white justify-start">
                        <span className="font-bold">Tìm kiếm</span>
                        <Link to="#"
                            className="flex items-center gap-1 bg-gray-500 text-white px-3 py-1 rounded text-sm">Khám
                            phá ý tưởng chuyến đi</Link>
                        <Link to="#"
                            className="flex items-center gap-1 bg-gray-500 text-white px-3 py-1 rounded text-sm">Tin
                            tức</Link>
                    </div>
                </div>
            </div>

            <div className="w-auto text-center mb-7" id="homeComment">
                <div id="comment-container"
                    className="inline-block bg-gray-100 p-3 rounded-lg text-sm text-gray-700 italic">
                    <p>“Tuyến Sài Gòn - Đà Lạt dịch vụ tốt, tài xế vui vẻ, xe
                        sạch sẽ! ⭐⭐⭐⭐⭐”</p>
                </div>
            </div>

        </header>
    )
}

export default Header;