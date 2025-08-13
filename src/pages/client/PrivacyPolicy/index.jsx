import PageTitle from "../Helpers/PageTitle";
import Layout from "../Partials/LayoutHomeThree";

export default function PrivacyPolicy() {
  return (
    <Layout childrenClasses="pt-0 pb-0">
      <div className="terms-condition-page w-full bg-white pb-[30px]">
        <div className="w-full mb-[30px]">
          <PageTitle
            breadcrumb={[
              { name: "trang chủ", path: "/" },
              { name: "chính sách bảo mật", path: "privacy-policy" },
            ]}
          />
        </div>
        <div className="w-full">
  <div className="container-x mx-auto">
    <div className="content-item w-full mb-10">
      <h2 className="text-[18px] font-medium text-qblack mb-5">
        Chính Sách Bảo Mật
      </h2>
      <p className="text-[15px] text-qgraytwo leading-7">
        Chúng tôi cam kết bảo vệ quyền riêng tư và thông tin cá nhân của bạn khi truy cập và mua sắm tại website bán đồng hồ của chúng tôi. Chính sách bảo mật này giải thích cách chúng tôi thu thập, sử dụng và bảo vệ dữ liệu cá nhân của bạn.
      </p>
    </div>

    <div className="content-item w-full mb-10">
      <h2 className="text-[18px] font-medium text-qblack mb-5">
        1. Thông tin chúng tôi thu thập
      </h2>
      <ul className="list-disc ml-5 text-[15px] text-qgraytwo leading-7">
        <li>Họ tên, địa chỉ, số điện thoại, email</li>
        <li>Thông tin đơn hàng và địa chỉ giao hàng</li>
        <li>Thông tin thanh toán (qua các cổng thanh toán trung gian)</li>
        <li>Dữ liệu truy cập và hành vi người dùng trên website</li>
      </ul>
    </div>

    <div className="content-item w-full mb-10">
      <h2 className="text-[18px] font-medium text-qblack mb-5">
        2. Mục đích sử dụng thông tin
      </h2>
      <p className="text-[15px] text-qgraytwo leading-7">
        Thông tin cá nhân của bạn được sử dụng cho các mục đích sau:
      </p>
      <ul className="list-disc ml-5 text-[15px] text-qgraytwo leading-7">
        <li>Xử lý đơn hàng và giao hàng</li>
        <li>Hỗ trợ chăm sóc khách hàng</li>
        <li>Cung cấp thông tin khuyến mãi, sản phẩm mới (khi có sự đồng ý)</li>
        <li>Cải thiện trải nghiệm và chất lượng dịch vụ</li>
        <li>Ngăn ngừa hành vi gian lận và bảo vệ người dùng</li>
      </ul>
    </div>

    <div className="content-item w-full mb-10">
      <h2 className="text-[18px] font-medium text-qblack mb-5">
        3. Bảo mật và lưu trữ thông tin
      </h2>
      <p className="text-[15px] text-qgraytwo leading-7">
        Chúng tôi sử dụng các biện pháp bảo mật phù hợp để bảo vệ thông tin cá nhân của bạn khỏi việc truy cập, sử dụng hoặc tiết lộ trái phép. Dữ liệu được lưu trữ trên hệ thống máy chủ an toàn và chỉ có nhân viên được ủy quyền mới có quyền truy cập.
      </p>
    </div>

    <div className="content-item w-full mb-10">
      <h2 className="text-[18px] font-medium text-qblack mb-5">
        4. Chia sẻ thông tin với bên thứ ba
      </h2>
      <p className="text-[15px] text-qgraytwo leading-7">
        Chúng tôi không chia sẻ hoặc bán thông tin cá nhân của bạn cho bên thứ ba ngoại trừ:
      </p>
      <ul className="list-disc ml-5 text-[15px] text-qgraytwo leading-7">
        <li>Các đối tác vận chuyển để giao hàng</li>
        <li>Các nhà cung cấp dịch vụ thanh toán</li>
        <li>Cơ quan pháp luật khi có yêu cầu hợp lệ</li>
      </ul>
    </div>

    <div className="content-item w-full mb-10">
      <h2 className="text-[18px] font-medium text-qblack mb-5">
        5. Quyền của người dùng
      </h2>
      <p className="text-[15px] text-qgraytwo leading-7">
        Bạn có quyền kiểm tra, cập nhật, chỉnh sửa hoặc yêu cầu xóa thông tin cá nhân bất cứ lúc nào bằng cách liên hệ với chúng tôi.
      </p>
    </div>

    <div className="content-item w-full mb-10">
      <h2 className="text-[18px] font-medium text-qblack mb-5">
        6. Liên hệ
      </h2>
      <p className="text-[15px] text-qgraytwo leading-7">
        Nếu bạn có bất kỳ câu hỏi hoặc thắc mắc nào liên quan đến chính sách bảo mật, vui lòng liên hệ:
        <br />
       Email: <span className="text-qblack font-medium">timemasters@gmail.com</span>
        <br />
      Hotline: <span className="text-qblack font-medium">0123 456 789</span>
        <br />
       Địa chỉ: <span className="text-qblack font-medium">Toà nhà FPT Polytechnic, Đ. Số 22, Thường Thạnh, Cái Răng, Cần Thơ, Việt Nam</span>
      </p>
    </div>
  </div>
</div>

      </div>
    </Layout>
  );
}
