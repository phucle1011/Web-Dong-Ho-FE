import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { toast } from "react-toastify";
import DrawerThree from "../pages/client/Mobile/DrawerThree";

export default function ClientLayout({ childrenClasses, type }) {
  const [drawer, setDrawer] = useState(false);

  useEffect(() => {
    const handleTokenExpired = () => {
      toast.error("Phiên đăng nhập đã hết hạn hoặc token không hợp lệ!", {
        autoClose: 2000,
      });
    };

    window.addEventListener("tokenExpired", handleTokenExpired);

    return () => {
      window.removeEventListener("tokenExpired", handleTokenExpired);
    };
  }, []);

  return (
    <>
      <DrawerThree open={drawer} action={() => setDrawer(!drawer)} />
      <div className="w-full overflow-x-hidden">
        <div type={3} drawerAction={() => setDrawer(!drawer)} />
        <div className={`w-full  ${childrenClasses || " pb-[60px]"}`}>
          <Outlet />
        </div>
        <div type={type} />
      </div>
    </>
  );
}