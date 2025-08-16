import { Link } from "react-router-dom";
import Facebook from "../../Helpers/icons/Facebook";
import Instagram from "../../Helpers/icons/Instagram";
import Youtube from "../../Helpers/icons/Youtube";

export default function Footer({ type }) {
  return (
    <footer className="footer-section-wrapper bg-white print:hidden">
      <div className="container-x block mx-auto pt-[56px]">
        <div className="w-full flex flex-col items-center mb-[50px]">
          {/* logo area */}
          <div className="mb-[40px]">
            {type === 3 ? (
              <Link to="/">
                <img
                  width="152"
                  height="36"
                  src='https://res.cloudinary.com/disgf4yl7/image/upload/v1755192506/l5p21sv5fnoobblwdwia.png'
                  alt="logo"
                />
              </Link>
            ) : (
              <Link to="/">
                <img
                  width="152"
                  height="36"
                  src={`https://res.cloudinary.com/disgf4yl7/image/upload/v1755192506/l5p21sv5fnoobblwdwia.png`}
                  alt="logo"
                />
              </Link>
            )}
          </div>
          <div className="w-full h-[1px] bg-[#E9E9E9]"></div>
        </div>
        <div className="lg:flex justify-between mb-[50px]">
          <div className="lg:w-[424px]  ml-0 w-full mb-10 lg:mb-0">
            <h1 className="text-[18] font-500 text-[#2F2F2F] mb-5">Về chúng tôi</h1>
            <p className="text-[#9A9A9A] text-[15px] w-[247px] leading-[28px]">
             Chúng tôi không chỉ bán đồng hồ - chúng tôi mang đến đẳng cấp và phong cách. Tự hào là thương hiệu đáng tin cậy trong ngành đồng hồ chính hãng.
            </p>
          </div>
          <div className="flex-1 lg:flex">
            <div className="lg:w-1/3 w-full mb-10 lg:mb-0">
              <div className="mb-5">
                <h6 className="text-[18] font-500 text-[#2F2F2F]">Tính năng</h6>
              </div>
              <div>
                <ul className="flex flex-col space-y-4 ">
                  <li>
                    <Link to="/about">
                      <span className="text-[#9A9A9A] text-[15px] border-b border-transparent cursor-pointer capitalize">
                        Về chúng tôi
                      </span>
                    </Link>
                  </li>
                  <li>
                    <Link to="/terms-condition">
                      <span className="text-[#9A9A9A] text-[15px] border-b border-transparent cursor-pointer capitalize">
                        Điều khoản & Điều kiện
                      </span>
                    </Link>
                  </li>
                  <li>
                    <Link to="/all-products">
                      <span className="text-[#9A9A9A] text-[15px] border-b border-transparent cursor-pointer capitalize">
                        Sản phẩm tốt nhất
                      </span>
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className="lg:w-1/3 lg:flex lg:flex-col items-center w-full mb-10 lg:mb-0 ">
              <div>
                <div className="mb-5">
                  <h6 className="text-[18] font-500 text-[#2F2F2F]">
                    Liên kết chung
                  </h6>
                </div>
                <div>
                  <ul className="flex flex-col space-y-4 ">
                    <li>
                      <Link to="/blogs">
                        <span className="text-[#9A9A9A] text-[15px] border-b border-transparent cursor-pointer capitalize">
                          Tin tức
                        </span>
                      </Link>
                    </li>
                    <li>
                      <Link to="/profile#order">
                        <span className="text-[#9A9A9A] text-[15px] border-b border-transparent cursor-pointer capitalize">
                          Đơn hàng
                        </span>
                      </Link>
                    </li>
                    <li>
                      <Link to="/products-compaire">
                        <span className="text-[#9A9A9A] text-[15px] border-b border-transparent cursor-pointer capitalize">
                          So sánh sản phẩm
                        </span>
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="lg:w-1/3 lg:flex lg:flex-col items-center w-full mb-10 lg:mb-0">
              <div>
                <div className="mb-5">
                  <h6 className="text-[18] font-500 text-[#2F2F2F]">Hữu ích</h6>
                </div>
                <div>
                  <ul className="flex flex-col space-y-4 ">
                    <li>
                      <Link to="/flash-sale">
                        <span className="text-[#9A9A9A] text-[15px] border-b border-transparent cursor-pointer capitalize">
                          Giảm giá chớp nhoáng
                        </span>
                      </Link>
                    </li>
                    <li>
                      <Link to="/faq">
                        <span className="text-[#9A9A9A] text-[15px] border-b border-transparent cursor-pointer capitalize">
                          Câu hỏi thường gặp
                        </span>
                      </Link>
                    </li>
                    <li>
                      <Link to="/contact">
                        <span className="text-[#9A9A9A] text-[15px] border-b border-transparent cursor-pointer capitalize">
                          Hổ trợ
                        </span>
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="bottom-bar border-t border-qgray-border lg:h-[82px] lg:flex justify-between items-center">
          <div className="flex lg:space-x-5 justify-between items-center mb-3">
            {/* <div className="flex space-x-5 items-center">
              <a href="#">
                <Instagram className="fill-current text-qgray" />
              </a>
              <a href="#">
                <Facebook className="fill-current text-qgray" />
              </a>
              <a href="#">
                <Youtube className="fill-current text-qgray" />
              </a>
            </div> */}
            <span className="sm:text-base text-[10px] text-qgray font-300">
              ©2025
              <a
                href="https://quomodosoft.com/"
                target="_blank"
                rel="noreferrer"
                className="font-500 text-qblack mx-1"
              >
                TimeMasters
              </a>
              Mọi quyền được bảo lưu
            </span>
          </div>
          {/* <div className="">
            <a href="#">
              <img
                width="318"
                height="28"
                src={`${process.env.REACT_APP_PUBLIC_URL}/assets/images/payment-getways.png`}
                alt="payment-getways"
              />
            </a>
          </div> */}
        </div>
      </div>
    </footer>
  );
}
