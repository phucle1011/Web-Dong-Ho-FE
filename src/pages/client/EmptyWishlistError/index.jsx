// FE/src/pages/client/Helpers/EmptyWishlistError.jsx
import { Link } from "react-router-dom";
import Empty from "./Empty";

export default function EmptyWishlistError() {
  return (
    <div className="wishlist-card-wrapper w-full mb-5">
      <div className="flex justify-center items-center w-full">
        <div>
          <div className="sm:mb-10 mb-0 transform sm:scale-100 scale-50">
            <Empty />
          </div>
          <div data-aos="fade-up" className="wishlist-content w-full">
            <h1 className="sm:text-xl text-base font-semibold text-center mb-5">
              Chưa có sản phẩm yêu thích nào
            </h1>
            <Link to="/">
              <div className="flex justify-center w-full">
                <div className="w-[180px] h-[50px]">
                  <span className="yellow-btn">
                    Quay về cửa hàng
                  </span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
