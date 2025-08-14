import { useState } from "react";
import Swal from "sweetalert2";
import Accodion from "../Helpers/Accodion";
import InputFaq from "../Helpers/InputFaq";
import PageTitle from "../Helpers/PageTitle";
import Layout from "../Partials/LayoutHomeThree";

export default function Faq() {
  const [formData, setFormData] = useState({
    first_name: "",
    email: "",
    message: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  const { first_name, email, message } = formData;

  if (!first_name || !email || !message) {
    Swal.fire("Thiếu thông tin", "Vui lòng điền đầy đủ các trường.", "warning");
    return;
  }

  try {
    const res = await fetch("https://web-dong-ho-be.onrender.com/contact/faq", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    const data = await res.json();

    if (res.ok) {
      Swal.fire(" Gửi thành công!", data.message, "success");
      setFormData({ first_name: "", email: "", message: "" });
    } else {
      Swal.fire(" Lỗi", data.error || "Không thể gửi email.", "error");
    }
  } catch (error) {
    Swal.fire(" Lỗi hệ thống", "Không thể kết nối đến server.", "error");
  }
};


  return (
    <Layout childrenClasses="pt-0 pb-0">
      <div className="faq-page-wrapper w-full mb-10">
        <div className="page-title w-full">
          <PageTitle
            breadcrumb={[
              { name: "trang chủ", path: "/" },
              { name: "câu hỏi thường gặp", path: "/faq" },
            ]}
          />
        </div>
      </div>
      <div className="contact-wrapper w-full mb-10">
        <div className="container-x mx-auto">
          <div className="main-wrapper w-full lg:flex lg:space-x-[30px]">
            <div className="lg:w-1/2 w-full mb-10 lg:mb-0">
              <h1 className="text-qblack font-bold text-[22px] mb-4">
                Câu hỏi thường gặp
              </h1>
              <div className="flex flex-col space-y-7 justify-between">
                <Accodion
                  title="01. Tôi có thể thanh toán bằng những hình thức nào?"
                  des="Chúng tôi hỗ trợ các phương thức thanh toán như: Thanh toán khi nhận hàng (COD) và chuyển khoản ngân hàng"
                />
                <Accodion
                  init
                  title="02. Thời gian giao hàng mất bao lâu?"
                  des="Khu vực nội thành: 1-3 ngày làm việc. Còn các tỉnh thành khác: 3-5 ngày làm việc (Một số khu vực xa có thể mất thêm thời gian)"
                />
                <Accodion
                  title="03. Tôi có thể đổi trả sản phẩm không?"
                  des="Có. Bạn có thể đổi hoặc trả sản phẩm trong vòng 7 ngày kể từ khi nhận hàng, với điều kiện: sản phẩm còn nguyên hộp, chưa qua sử dụng, có hóa đơn mua hàng. Lưu ý: Không áp dụng cho các sản phẩm khuyến mãi, giảm giá."
                />
                <Accodion
                  title="04. Đồng hồ có được bảo hành không?"
                  des="Tất cả đồng hồ tại cửa hàng đều được bảo hành chính hãng từ 12 đến 24 tháng, tùy vào từng mẫu sản phẩm. Thông tin chi tiết được ghi rõ trong phiếu bảo hành đi kèm."
                />
                <Accodion
                  title="05. Làm sao để biết đồng hồ là hàng chính hãng?"
                  des="Chúng tôi cam kết 100% sản phẩm là hàng chính hãng, có đầy đủ: Tem bảo hành, Hộp, sổ, thẻ bảo hành chính hãng, Hóa đơn VAT nếu khách yêu cầu"
                />
              </div>
            </div>
            <div className="flex-1">
              <div className="bg-white sm:p-10 p-5">
                <div className="title flex flex-col items-center">
                  <h1 className="lg:text-[34px] text-xl font-bold text-qblack">
                    Có bất kỳ câu hỏi nào hãy liên hệ chúng tôi
                  </h1>
                  <span className="-mt-5 block">
                    <svg
                      width="354"
                      height="30"
                      viewBox="0 0 354 30"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M1 28.8027C17.6508 20.3626 63.9476 8.17089 113.509 17.8802C166.729 28.3062 341.329 42.704 353 1"
                        stroke="#FFBB38"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                </div>
                <div className="inputs mt-5">
                  <div className="mb-4">
                    <InputFaq
                      label="Tên Khách Hàng"
                      placeholder="Họ và tên của bạn"
                      name="first_name"
                      inputClasses="h-[50px]"
                      value={formData.first_name}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="mb-4">
                    <InputFaq
                      label="Địa Chỉ Email"
                      placeholder="điền email của bạn"
                      name="email"
                      inputClasses="h-[50px]"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="mb-5">
                    <h6 className="input-label text-qgray capitalize text-[13px] font-normal block mb-2 ">
                      Nội Dung
                    </h6>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="mời bạn nhập nội dung câu hỏi của mình"
                      className="w-full h-[105px] focus:ring-0 focus:outline-none p-3 border border-qgray-border placeholder:text-sm"
                    ></textarea>
                  </div>
                  <div>
                    <a href="#" onClick={handleSubmit}>
                      <div className="black-btn text-sm font-semibold w-full h-[50px] flex justify-center items-center">
                        <span>Gửi</span>
                      </div>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
