import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import datas from "../../../../data/products.json";
import BreadcrumbCom from "../../BreadcrumbCom";
import Layout from "../../Partials/LayoutHomeThree";
import IcoAdress from "./icons/IcoAdress";
import IcoCart from "./icons/IcoCart";
import IcoDashboard from "./icons/IcoDashboard";
import IcoLogout from "./icons/IcoLogout";
import IcoLove from "./icons/IcoLove";
import IcoPassword from "./icons/IcoPassword";
import IcoPayment from "./icons/IcoPayment";
import IcoPeople from "./icons/IcoPeople";
import IcoReviewHand from "./icons/IcoReviewHand";
import IcoSupport from "./icons/IcoSupport";
import AddressesTab from "./tabs/AddressesTab";
import Dashboard from "./tabs/Dashboard";
import OrderTab from "./tabs/OrderTab";
import PasswordTab from "./tabs/PasswordTab";
import Payment from "./tabs/Payment";
import ProfileTab from "./tabs/ProfileTab";
import ReviewTab from "./tabs/ReviewTab";
import SupportTab from "./tabs/SupportTab";
import WishlistTab from "./tabs/WishlistTab";
import ConfirmLogoutModal from "../../../../components/client/Confirm/ConfirmLogoutModal";


export default function Profile() {
  const [switchDashboard, setSwitchDashboard] = useState(false);
  const location = useLocation();
  const getHashContent = location.hash.split("#");
  const [active, setActive] = useState("dashboard");
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  useEffect(() => {
    setActive(
      getHashContent && getHashContent.length > 1
        ? getHashContent[1]
        : "dashboard"
    );
  }, [getHashContent]);

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

  return (
    <Layout childrenClasses="pt-0 pb-0">
      <div className="profile-page-wrapper w-full">
        <div className="container-x mx-auto">
          <div className="w-full my-10">
            <BreadcrumbCom
              paths={[
                { name: "Trang chủ", path: "/" },
                { name: "hồ sơ", path: "/profile" },
              ]}
            />
            <div className="w-full bg-white px-10 py-9">
              <div className="title-area w-full flex justify-between items-center">
                <h1 className="text-[22px] font-bold text-qblack">
                  Bảng điều khiển của bạn
                </h1>
              </div>
              <div className="profile-wrapper w-full mt-8 flex space-x-10">
                <div className="w-[236px] min-h-[600px] border-r border-[rgba(0, 0, 0, 0.1)]">
                  <div className="flex flex-col space-y-10">
                    <div className="item group">
                      <Link to="/profile#dashboard">
                        <div className="flex space-x-3 items-center text-qgray hover:text-qblack">
                          <span>
                            <IcoDashboard />
                          </span>
                          <span className=" font-normal text-base">
                            Bảng điều khiển
                          </span>
                        </div>
                      </Link>
                    </div>
                    <div className="item group">
                      <Link to="/profile#profile">
                        <div className="flex space-x-3 items-center text-qgray hover:text-qblack">
                          <span>
                            <IcoPeople />
                          </span>
                          <span className=" font-normal text-base">
                            Trang Cá Nhân
                          </span>
                        </div>
                      </Link>
                    </div>

                    <div className="item group">
                      <Link to="/profile#payment">
                        <div className="flex space-x-3 items-center text-qgray hover:text-qblack">
                          <span>
                            <IcoPayment />
                          </span>
                          <span className=" font-normal text-base">
                            Ví tiền
                          </span>
                        </div>
                      </Link>
                    </div>
                    <div className="item group">
                      <Link to="/profile#order">
                        <div className="flex space-x-3 items-center text-qgray hover:text-qblack">
                          <span>
                            <IcoCart />
                          </span>
                          <span className=" font-normal text-base">Đơn hàng</span>
                        </div>
                      </Link>
                    </div>
                    <div className="item group">
                      <Link to="/profile#wishlist">
                        <div className="flex space-x-3 items-center text-qgray hover:text-qblack">
                          <span>
                            <IcoLove />
                          </span>
                          <span className=" font-normal text-base">
                            Danh sách yêu thích
                          </span>
                        </div>
                      </Link>
                    </div>
                    <div className="item group">
                      <Link to="/profile#address">
                        <div className="flex space-x-3 items-center text-qgray hover:text-qblack">
                          <span>
                            <IcoAdress />
                          </span>
                          <span className=" font-normal text-base">
                            Địa chỉ
                          </span>
                        </div>
                      </Link>
                    </div>
                    <div className="item group">
                      <Link to="/profile#review">
                        <div className="flex space-x-3 items-center text-qgray hover:text-qblack">
                          <span>
                            <IcoReviewHand />
                          </span>
                          <span className=" font-normal text-base">
                            Đánh giá
                          </span>
                        </div>
                      </Link>
                    </div>
                    <div className="item group">
                      <Link to="/profile#password">
                        <div className="flex space-x-3 items-center text-qgray hover:text-qblack">
                          <span>
                            <IcoPassword />
                          </span>
                          <span className=" font-normal text-base">
                            Thay Đổi Mật Khẩu
                          </span>
                        </div>
                      </Link>
                    </div>
                    {/* <div className="item group">
                      <Link to="/profile#support">
                        <div className="flex space-x-3 items-center text-qgray hover:text-qblack">
                          <span>
                            <IcoSupport />
                          </span>
                          <span className=" font-normal text-base">
                            Support Ticket
                          </span>
                        </div>
                      </Link>
                    </div> */}
                    <div className="item group">
                      <Link
                        to="/login"
                        onClick={(e) => {
                          e.preventDefault();
                          handleLogout();
                        }}
                      >
                        <div className="flex space-x-3 items-center text-qgray hover:text-qblack cursor-pointer">
                          <span><IcoLogout /></span>
                          <span className="font-normal text-base">Đăng xuất</span>
                        </div>
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="item-body dashboard-wrapper w-full">
                    {active === "dashboard" ? (
                      <Dashboard />
                    ) : active === "profile" ? (
                      <>
                        <ProfileTab />
                      </>
                    ) : active === "payment" ? (
                      <>
                        <Payment />
                      </>
                    ) : active === "order" ? (
                      <>
                        <OrderTab />
                      </>
                    ) : active === "wishlist" ? (
                      <>
                        <WishlistTab />
                      </>
                    ) : active === "address" ? (
                      <>
                        <AddressesTab />
                      </>
                    ) : active === "password" ? (
                      <>
                        <PasswordTab />
                      </>
                    ) : active === "support" ? (
                      <>
                        <SupportTab />
                      </>
                    ) : active === "review" ? (
                      <>
                        <ReviewTab products={datas.products} />
                      </>
                    ) : (
                      ""
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {showLogoutModal && (
          <ConfirmLogoutModal
            onConfirm={confirmLogout}
            onCancel={cancelLogout}
          />
        )}
      </div>
    </Layout>
  );
}
