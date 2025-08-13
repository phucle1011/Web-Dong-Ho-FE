import { useRef } from "react";
import { Link } from "react-router-dom";
import SimpleSlider from "../Helpers/SliderCom";

export default function Banner({ className }) {
  const sliderRef = useRef(null);
  const settings = {
    dots: false,
    infinite: true,
    autoplay: true,
    fade: true,
    arrows: false,
  };
  return (
    <>
      <div className={`w-full xl:h-[733px] h-[500px] ${className || ""}`}>
        <div className="main-wrapper w-full h-full">
          <div className="hero-slider-wrapper xl:h-full mb-20 xl:mb-0  w-full relative">
            <div className="absolute left-0 top-0 w-full h-full items-center justify-between hidden xl:flex">
              <button
                type="button"
                onClick={() => sliderRef.current.slickPrev()}
                className="relative hover:text-qh3-blue text-[#8cb1f6] 2xl:left-32 left-5 cursor-pointer z-10"
              >
                <svg
                  className="fill-current"
                  width="84"
                  height="68"
                  viewBox="0 0 84 68"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-qblack" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </svg>
              </button>
              <button
                type="button"
                onClick={() => sliderRef.current.slickNext()}
                className="relative hover:text-qh3-blue text-[#8cb1f6]  2xl:right-32 right-5 cursor-pointer z-10"
              >
                <svg
                  width="84"
                  height="68"
                  viewBox="0 0 84 68"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className={`fill-current`}
                >
               
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-qblack" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </svg>
              </button>
            </div>
            <SimpleSlider settings={settings} selector={sliderRef}>
              <div className="item w-full xl:h-[733px] h-[500px]">
                <video
                  className="absolute top-0 left-0 w-full h-full object-cover"
                  src="https://cdn.citizen-vietnam.vn/wp-content/uploads/2024/12/Series8-890Mechanical-NB6060-58L-2.mp4"
                  autoPlay
                  muted
                  loop
                  playsInline
                ></video>
              </div>
              <div className="item w-full xl:h-[733px] h-[500px]">
                <div
                  className="w-full h-full relative"
                  style={{
                    backgroundImage: `url(https://res.cloudinary.com/disgf4yl7/image/upload/v1752810680/fcigrmxfhz4w1eym9s78.jpg)`,
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "cover",
                  }}
                >
                  <div className="container-x mx-auto flex items-center  h-full">
                    <div className="w-full h-full xl:flex items-center pt-20 xl:pt-0">
                      <div className="xl:w-[626px] w-full">
                        {/* <p className="md:text-[34px] text-[20px] font-medium text-white mb-[7px]">
                          VR BOX 3D Glass
                        </p>
                        <h1 className="md:text-[66px] text-[40px]  font-bold text-white md:leading-[80px] leading-[40px] mb-[44px]">
                          Explore Our Tech Collection Perfect Gadget
                        </h1> */}

                        {/* <Link to="#" passhref="true">
                          <div rel="noopener noreferrer">
                            <div
                              className={`w-[160px] h-[52px] flex justify-center items-center group rounded bg-qh3-blue text-white relative transition-all duration-300 ease-in-out overflow-hidden cursor-pointer ${
                                className || ""
                              }`}
                            >
                              <div className="flex space-x-1 items-center transition-all duration-300 ease-in-out relative z-10">
                                <span className="text-sm font-600 tracking-wide leading-7 mr-2">
                                  Mua Ngay
                                </span>
                                <span>
                                  <svg
                                    width="7"
                                    height="11"
                                    viewBox="0 0 7 11"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="fill-current"
                                  >
                                    <rect
                                      x="2.08984"
                                      y="0.636719"
                                      width="6.94219"
                                      height="1.54271"
                                      transform="rotate(45 2.08984 0.636719)"
                                    ></rect>
                                    <rect
                                      x="7"
                                      y="5.54492"
                                      width="6.94219"
                                      height="1.54271"
                                      transform="rotate(135 7 5.54492)"
                                    ></rect>
                                  </svg>
                                </span>
                              </div>
                              <div
                                style={{
                                  transition: `transform 0.25s ease-in-out`,
                                }}
                                className="w-full h-full bg-black absolute top-0 left-0 right-0 bottom-0 transform scale-x-0 group-hover:scale-x-100 origin-[center_left] group-hover:origin-[center_right]"
                              ></div>
                            </div>
                          </div>
                        </Link> */}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="item w-full xl:h-[733px] h-[500px]">
                <div
                  style={{
                    backgroundImage: `url(https://res.cloudinary.com/disgf4yl7/image/upload/v1752810678/svqbqjrt6xdwf1yr9eus.jpg)`,
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "cover",
                  }}
                  className="w-full h-full relative"
                >
                  {/*<div className="container-x mx-auto flex items-center  h-full">
                    <div className="w-full h-full xl:flex items-center pt-20 xl:pt-0">
                      <div className="xl:w-[626px] w-full">
                        <p className="md:text-[34px] text-[20px] font-medium text-qh3-blue mb-[7px]">
                          Đồng Hồ Rolex
                        </p>
                        <h1 className="md:text-[66px] text-[40px]  font-bold text-qblack md:leading-[80px] leading-[40px] mb-[44px]">
                          Khám phá bộ sưu tập đồng hồ – Phong cách hoàn hảo dành cho bạn
                        </h1>

                        <Link to="#" passhref="true">
                          <div rel="noopener noreferrer">
                            <div
                              className={`w-[160px] h-[52px] flex justify-center items-center group rounded bg-qh3-blue text-white relative transition-all duration-300 ease-in-out overflow-hidden cursor-pointer ${
                                className || ""
                              }`}
                            >
                              <div className="flex space-x-1 items-center transition-all duration-300 ease-in-out relative z-10">
                                <span className="text-sm font-600 tracking-wide leading-7 mr-2">
                                 Mua ngay
                                </span>
                                <span>
                                  <svg
                                    width="7"
                                    height="11"
                                    viewBox="0 0 7 11"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="fill-current"
                                  >
                                    <rect
                                      x="2.08984"
                                      y="0.636719"
                                      width="6.94219"
                                      height="1.54271"
                                      transform="rotate(45 2.08984 0.636719)"
                                    ></rect>
                                    <rect
                                      x="7"
                                      y="5.54492"
                                      width="6.94219"
                                      height="1.54271"
                                      transform="rotate(135 7 5.54492)"
                                    ></rect>
                                  </svg>
                                </span>
                              </div>
                              <div
                                style={{
                                  transition: `transform 0.25s ease-in-out`,
                                }}
                                className="w-full h-full bg-black absolute top-0 left-0 right-0 bottom-0 transform scale-x-0 group-hover:scale-x-100 origin-[center_left] group-hover:origin-[center_right]"
                              ></div>
                            </div>
                          </div>
                        </Link>
                      </div>
                    </div>
                  </div>*/}
                </div>
              </div>
            </SimpleSlider>
          </div>
        </div>
      </div>
    </>
  );
}
