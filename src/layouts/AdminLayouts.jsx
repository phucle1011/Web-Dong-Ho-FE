import { Outlet } from "react-router-dom";
import Aside from "../components/admin/aside";
import Header from "../components/admin/Header";
// import "../styles/admin/css/styles.min.css";
import { useState, useEffect } from "react";

import { HashLoader } from "react-spinners";

// import "../styles/admin/js/app.min.ts";
// import "../styles/admin/js/sidebarmenu.js";

const loaderContainerStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  height: "100vh",
  backgroundColor: "#f0f4f8",
};

const AdminLayout = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      import("../styles/admin/css/styles.min.css");
      import("../styles/admin/js/app.min.ts");
      import("../styles/admin/js/sidebarmenu.js");
      setLoading(false);
    }, 500)
    return () => clearTimeout(timeout);
  }, []);

  return (
    <>
      {loading ? (
        <div style={loaderContainerStyle}>
          <HashLoader
            color="#0F3079"
            loading={loading}
            size={80}
          />
        </div>
      ) : (
        <div
          className="page-wrapper"
          id="main-wrapper"
          data-layout="vertical"
          data-navbarbg="skin6"
          data-sidebartype="full"
          data-sidebar-position="fixed"
          data-header-position="fixed"
        >
          <Aside />
          <div className="body-wrapper bg-gray-50">
            <Header />
            <div className="container-fluid bg-gray-50">
              <div className="row mt-2 rounded-1">
                <Outlet />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminLayout;
