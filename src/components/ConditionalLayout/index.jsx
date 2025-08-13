import AdminLayout from "../../layouts/AdminLayouts";
import ClientLayout from "../../layouts/ClientLayouts";
import { useLocation, Outlet } from "react-router-dom";

const ConditionalLayout = () => {
  const location = useLocation();

  const isAdminPath = location.pathname.startsWith("/admin");

  if (isAdminPath) {
    return <AdminLayout><Outlet /></AdminLayout>;
  }

  return <ClientLayout><Outlet /></ClientLayout>;
};

export default ConditionalLayout;