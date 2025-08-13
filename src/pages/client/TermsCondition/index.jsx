import PageTitle from "../Helpers/PageTitle";
import Layout from "../Partials/LayoutHomeThree";

export default function TermsCondition() {
  return (
    <Layout childrenClasses="pt-0 pb-0">
      <div className="terms-condition-page w-full bg-white pb-[30px]">
        <div className="w-full mb-[30px]">
          <PageTitle
            breadcrumb={[
              { name: "trang chủ", path: "/" },
              { name: "Điều kiện - Điều khoản", path: "/terms-conditions" },
            ]}
          />
        </div>
        <div className="w-full">
          <div className="container-x mx-auto">
            <div className="content-item w-full mb-10">
              <h2 className="text-[18px] font-medium text-qblack mb-5">
                1. Thông tin sản phẩm
              </h2>
              <p className="text-[15px] text-qgraytwo leading-7">
                - Tất cả hình ảnh, mô tả và giá cả sản phẩm đều được cung cấp một cách trung thực và rõ ràng.
              </p>
              <p className="text-[15px] text-qgraytwo leading-7">
                - Chúng tôi có quyền thay đổi thông tin sản phẩm mà không cần thông báo trước.
              </p>
            </div>
            <div className="content-item w-full mb-10">
              <h2 className="text-[18px] font-medium text-qblack mb-5">
                2. Giá cả và thanh toán
              </h2>
              <p className="text-[15px] text-qgraytwo leading-7">
              - Giá sản phẩm được niêm yết trên website là giá cuối cùng, đã bao gồm thuế
              </p>
              <p className="text-[15px] text-qgraytwo leading-7">
              - Khách hàng có thể lựa chọn các hình thức thanh toán như: COD, chuyển khoản.
              </p>
              <p className="text-[15px] text-qgraytwo leading-7 mb-10">
              - Đơn hàng chỉ được xử lý khi chúng tôi xác nhận đã nhận được thanh toán (trừ phương thức COD).
              </p>
              <div>
                <h2 className="text-[18px] font-medium text-qblack mb-5">
                  3. Chính sách giao hàng
                </h2>

                <p className="text-[15px] text-qgraytwo leading-7">
              - Thời gian giao hàng từ 1–5 ngày làm việc tùy khu vực.
              </p>
              <p className="text-[15px] text-qgraytwo leading-7 mb-10">
              - Trong một số trường hợp bất khả kháng (dịch bệnh, thiên tai), thời gian có thể kéo dài.
              </p>
              </div>
            </div>

            <div className="content-item w-full mb-10">
              <h2 className="text-[18px] font-medium text-qblack mb-5">
                4. Chính sách đổi trả
              </h2>
              <p className="text-[15px] text-qgraytwo leading-7">
              - Đổi/trả trong vòng 70 ngày kể từ ngày nhận hàng.
              </p>
              <p className="text-[15px] text-qgraytwo leading-7">
              - Sản phẩm phải còn nguyên vẹn, chưa qua sử dụng, có hóa đơn và đầy đủ phụ kiện đi kèm.
              </p>
              <p className="text-[15px] text-qgraytwo leading-7 mb-10">
              - Không áp dụng đổi/trả với các sản phẩm khuyến mãi, giảm giá mạnh (trừ khi bị lỗi do nhà sản xuất).
              </p>
            </div>
            <div className="content-item w-full mb-10">
              <h2 className="text-[18px] font-medium text-qblack mb-5">
                5. Chính sách bảo hành
              </h2>
              <p className="text-[15px] text-qgraytwo leading-7">
              - Sản phẩm được bảo hành từ 12–24 tháng tùy theo loại đồng hồ.
              </p>
              <p className="text-[15px] text-qgraytwo leading-7 mb-10">
              - Bảo hành không áp dụng với các lỗi do người dùng gây ra như: rơi vỡ, vào nước, trầy xước...
              </p>
            </div>
            <div className="content-item w-full mb-10">
              <h2 className="text-[18px] font-medium text-qblack mb-5">
                6.Quyền sở hữu trí tuệ
              </h2>
              <p className="text-[15px] text-qgraytwo leading-7">
                Mọi nội dung (hình ảnh, logo, mô tả sản phẩm...) thuộc quyền sở hữu của chúng tôi. Nghiêm cấm sao chép hoặc sử dụng lại nếu không có sự đồng ý bằng văn bản.
              </p>
            </div>
            <div className="content-item w-full mb-10">
              <h2 className="text-[18px] font-medium text-qblack mb-5">
                7. Quy định về tài khoản người dùng
              </h2>
              <p className="text-[15px] text-qgraytwo leading-7">
              - Khách hàng tự chịu trách nhiệm bảo mật tài khoản đăng nhập.
              </p>
              <p className="text-[15px] text-qgraytwo leading-7 mb-10">
              - Không sử dụng website vào mục đích gian lận, phá hoại hoặc lừa đảo.
              </p>
            </div>
            <div className="content-item w-full mb-10">
              <h2 className="text-[18px] font-medium text-qblack mb-5">
                8. Thay đổi điều khoản
              </h2>
              <p className="text-[15px] text-qgraytwo leading-7 mb-10">
              Chúng tôi có quyền cập nhật, thay đổi điều khoản bất kỳ lúc nào. Những thay đổi sẽ được công bố công khai trên website.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
