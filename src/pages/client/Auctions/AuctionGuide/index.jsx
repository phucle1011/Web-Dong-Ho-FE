import { useEffect, useState } from "react";
import Layout from "../../Partials/LayoutHomeThree";
import {
    FaGavel,
    FaBookOpen,
    FaShieldAlt,
    FaWallet,
    FaUserCheck,
    FaBell,
    FaClock,
    FaCheckCircle,
    FaInfoCircle,
} from "react-icons/fa";
import { Link } from "react-router-dom";

const MIN_BALANCE = 10_000_000;

export default function AuctionGuide() {
    const [faqOpen, setFaqOpen] = useState(null);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const faqs = [
        {
            q: "Nếu tôi không thắng đấu giá thì sao?",
            a: "Bạn không bị trừ tiền mua hàng. Nếu có khoản tạm giữ/cọc (nếu áp dụng), hệ thống sẽ hoàn về ví theo chính sách trong vòng 1–3 ngày làm việc.",
        },
        {
            q: "Làm sao biết mình thắng?",
            a: "Khi phiên kết thúc, người đặt giá cao nhất sẽ thắng. Hệ thống gửi thông báo tại mục Thông báo, kèm email/SMS (nếu bật). Bạn cũng có thể xem tại trang Lịch sử đấu giá.",
        },
        {
            q: "Có cần OTP để vào phòng đấu giá không?",
            a: "Có. Vì lý do bảo mật, hệ thống sẽ gửi OTP đến email/tài khoản của bạn khi vào phòng. OTP có hiệu lực trong 10 phút.",
        },
        {
            q: "Tôi có thể hủy/thu hồi giá đã đặt?",
            a: "Không. Mọi lượt đặt giá là không thể hủy để đảm bảo công bằng. Hãy cân nhắc kỹ trước khi đặt.",
        },
        {
            q: "Khi nào tôi cần thanh toán sau khi thắng?",
            a: "Bạn cần thanh toán trong thời hạn quy định (ví dụ 48 giờ). Quá hạn, lượt thắng có thể bị hủy theo chính sách.",
        },
    ];

    return (
        <Layout>
            <div className="w-full">

                <section
                    className="relative bg-cover bg-center rounded-b-[60px] text-white"
                    style={{
                        backgroundImage:
                            'url("https://images.unsplash.com/photo-1510070009289-b5bc34383727?q=80&w=1600&auto=format&fit=crop")',
                    }}
                >
                    <div className="absolute inset-0 bg-black/40" />
                    <div className="container-x mx-auto px-4 py-16 relative">
                        <div className="max-w-3xl">
                            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur px-3 py-1 rounded-full mb-4 ring-1 ring-white/20">
                                <FaBookOpen className="text-yellow-300" />
                                <span className="text-sm">Trang hướng dẫn đấu giá</span>
                            </div>
                            <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight">
                                Hướng Dẫn Đấu Giá
                            </h1>
                            <p className="mt-4 text-white/90 text-lg">
                                Hiểu rõ cách tham gia, quy trình, điều kiện và mẹo giúp bạn tự
                                tin đặt giá &amp; tối ưu cơ hội chiến thắng.
                            </p>

                            <div className="mt-8 flex flex-wrap gap-3">
                                <Link
                                    to="/auctions"
                                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-fuchsia-600 text-white font-semibold shadow hover:from-pink-600 hover:to-fuchsia-700 transition"
                                >
                                    <FaGavel />
                                    Xem danh sách đấu giá
                                </Link>
                                <Link
                                    to="/profile#payment"
                                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/90 text-gray-900 font-semibold shadow hover:bg-white transition"
                                >
                                    <FaWallet />
                                    Nạp tiền vào ví
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="container-x mx-auto px-4 -mt-12 mb-12 relative z-10">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-white rounded-2xl p-6 shadow-xl ring-1 ring-black/5 hover:shadow-2xl transition">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-xl bg-blue-50">
                                    <FaUserCheck className="text-blue-600 text-xl" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Bước 1</p>
                                    <h3 className="font-semibold">Đăng ký/Đăng nhập</h3>
                                </div>
                            </div>
                            <p className="mt-3 text-gray-600">
                                Tạo tài khoản và hoàn tất xác minh cơ bản để bắt đầu tham gia.
                            </p>
                        </div>

                        <div className="bg-white rounded-2xl p-6 shadow-xl ring-1 ring-black/5 hover:shadow-2xl transition">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-xl bg-emerald-50">
                                    <FaWallet className="text-emerald-600 text-xl" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Bước 2</p>
                                    <h3 className="font-semibold">Nạp tiền vào ví</h3>
                                </div>
                            </div>
                            <p className="mt-3 text-gray-600">
                                Yêu cầu tối thiểu{" "}
                                <b>{MIN_BALANCE.toLocaleString("vi-VN")}₫</b> để vào phòng đấu giá.
                            </p>
                        </div>

                        <div className="bg-white rounded-2xl p-6 shadow-xl ring-1 ring-black/5 hover:shadow-2xl transition">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-xl bg-pink-50">
                                    <FaBell className="text-pink-600 text-xl" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Bước 3</p>
                                    <h3 className="font-semibold">Vào phòng (OTP)</h3>
                                </div>
                            </div>
                            <p className="mt-3 text-gray-600">
                                Nhập OTP được gửi đến email để bảo mật trước khi đấu giá.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="container-x mx-auto px-4 mb-12">
                    <div className="bg-[#f5f7ff] rounded-2xl p-8 shadow-md">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold text-gray-800">
                                Quy Trình Tham Gia
                            </h2>
                            <p className="text-gray-500 mt-2">
                                6 bước đơn giản để bắt đầu đấu giá
                            </p>
                        </div>

                        <ol className="relative border-s-2 border-indigo-200 ps-6 space-y-8">
                            {[
                                {
                                    icon: <FaUserCheck />,
                                    title: "Đăng ký/Đăng nhập",
                                    desc: "Tạo tài khoản, cập nhật thông tin và bật thông báo.",
                                },
                                {
                                    icon: <FaWallet />,
                                    title: "Nạp tiền vào ví",
                                    desc: `Đảm bảo số dư ≥ ${MIN_BALANCE.toLocaleString(
                                        "vi-VN"
                                    )}₫ để vào phòng đấu giá.`,
                                },
                                {
                                    icon: <FaBookOpen />,
                                    title: "Đọc hướng dẫn & quy định",
                                    desc: "Nắm rõ bước giá, giá khởi điểm, thời gian kết thúc và chính sách.",
                                },
                                {
                                    icon: <FaGavel />,
                                    title: "Vào phòng & đặt giá",
                                    desc: "Nhập OTP để vào phòng. Đặt giá cao hơn mức hiện tại theo bước giá.",
                                },
                                {
                                    icon: <FaClock />,
                                    title: "Theo dõi phiên",
                                    desc: "Hệ thống gửi thông báo khi có người đặt giá cao hơn bạn.",
                                },
                                {
                                    icon: <FaCheckCircle />,
                                    title: "Kết thúc & thanh toán",
                                    desc: "Người đặt giá cao nhất thắng. Thanh toán trong thời hạn quy định.",
                                },
                            ].map((step, idx) => (
                                <li key={idx}>
                                    <div className="absolute -start-4 top-1.5 w-7 h-7 rounded-full bg-white ring-2 ring-indigo-200 flex items-center justify-center text-indigo-600">
                                        {step.icon}
                                    </div>
                                    <div className="bg-white rounded-xl p-5 shadow-sm ring-1 ring-black/5">
                                        <h3 className="font-semibold text-gray-900">
                                            {idx + 1}. {step.title}
                                        </h3>
                                        <p className="text-gray-600 mt-1">{step.desc}</p>
                                    </div>
                                </li>
                            ))}
                        </ol>

                        <div className="mt-8 flex flex-wrap justify-center gap-3">
                            {/* <Link
                                to="/room"
                                className="px-5 py-3 rounded-xl bg-indigo-600 text-white font-semibold shadow hover:bg-indigo-700 transition"
                            >
                                Vào phòng đấu giá
                            </Link> */}
                            <Link
                                to="/auctions"
                                className="px-5 py-3 rounded-xl bg-white text-gray-900 font-semibold shadow ring-1 ring-black/5 hover:bg-gray-50 transition"
                            >
                                Xem phiên sắp diễn ra
                            </Link>
                        </div>
                    </div>
                </section>

                <section className="container-x mx-auto px-4 mb-12">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-white rounded-2xl p-8 shadow-md ring-1 ring-black/5">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 rounded-xl bg-amber-50">
                                    <FaShieldAlt className="text-amber-600 text-xl" />
                                </div>
                                <h3 className="text-2xl font-bold">Quy định &amp; Lưu ý</h3>
                            </div>
                            <ul className="space-y-3 text-gray-700">
                                <li className="flex gap-2">
                                    <FaInfoCircle className="mt-1 text-gray-400" />
                                    <span>
                                        Mọi lượt đặt giá <b>không thể hủy</b>. Hãy kiểm tra kỹ số
                                        tiền trước khi xác nhận.
                                    </span>
                                </li>
                                <li className="flex gap-2">
                                    <FaInfoCircle className="mt-1 text-gray-400" />
                                    <span>
                                        Số dư ví phải đủ trước khi đặt giá. Nếu thiếu, hãy{" "}
                                        <Link
                                            to="/profile#payment"
                                            className="underline text-indigo-600 hover:text-indigo-700"
                                        >
                                            nạp thêm
                                        </Link>
                                        .
                                    </span>
                                </li>
                                <li className="flex gap-2">
                                    <FaInfoCircle className="mt-1 text-gray-400" />
                                    <span>
                                        Người thắng cần thanh toán trong thời hạn ({" "}
                                        <b>24 giờ</b>). Quá hạn có sẽ bị hủy lượt thắng và bị trừ 10% ví tiền dựa vào số tiền đấu giá thắng cuộc.
                                        Nếu như 3 lần đấu giá thành công mà không thanh toán sẽ bị cấm tham giá đấu giá trong vòng 3 tháng!
                                    </span>
                                </li>
                                <li className="flex gap-2">
                                    <FaInfoCircle className="mt-1 text-gray-400" />
                                    <span>
                                        Hệ thống có thể yêu cầu xác minh bổ sung (OTP) để đảm
                                        bảo an toàn giao dịch.
                                    </span>
                                </li>
                            </ul>
                        </div>

                        <div className="bg-gradient-to-br from-sky-50 to-purple-50 rounded-2xl p-8 shadow-md ring-1 ring-black/5">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 rounded-xl bg-white">
                                    <FaCheckCircle className="text-emerald-600 text-xl" />
                                </div>
                                <h3 className="text-2xl font-bold">Mẹo giúp bạn thắng</h3>
                            </div>
                            <ul className="list-disc list-inside text-gray-700 space-y-2">
                                <li>Xem kỹ giá khởi điểm &amp; bước giá trước khi đặt.</li>
                                <li>
                                    Theo dõi sát thời điểm sắp kết thúc để tối ưu lượt đặt giá.
                                </li>
                                <li>Bật thông báo để không bỏ lỡ khi có người vượt giá.</li>
                                <li>
                                    Đặt ngân sách tối đa cho bản thân và tuân thủ để tránh vượt
                                    kế hoạch.
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                <section className="container-x mx-auto px-4 mb-16">
                    <div className="bg-white rounded-2xl p-8 shadow-md ring-1 ring-black/5">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold text-gray-800">
                                Câu Hỏi Thường Gặp
                            </h2>
                            <p className="text-gray-500 mt-2">Giải đáp nhanh các thắc mắc phổ biến</p>
                        </div>

                        <div className="space-y-4">
                            {faqs.map((item, idx) => {
                                const open = faqOpen === idx;
                                return (
                                    <div
                                        key={idx}
                                        className="bg-blue-50 rounded-xl shadow-sm border border-blue-100"
                                    >
                                        <button
                                            className="w-full flex items-center justify-between px-4 py-3 text-left"
                                            onClick={() => setFaqOpen(open ? null : idx)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white flex items-center justify-center text-sm font-bold">
                                                    ?
                                                </div>
                                                <span className="font-semibold text-gray-800">{item.q}</span>
                                            </div>

                                            <span
                                                className={`flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white text-lg font-bold transform transition ${open ? "rotate-180" : ""
                                                    }`}
                                            >
                                                {open ? "−" : "+"}
                                            </span>
                                        </button>

                                        {open && (
                                            <div className="px-12 pb-3 text-gray-700 text-sm leading-relaxed">
                                                {item.a}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-8 flex flex-wrap justify-center gap-3">
                            <Link
                                to="/contact"
                                className="px-5 py-3 rounded-xl bg-gray-100 text-gray-900 font-semibold shadow hover:bg-gray-200 transition"
                            >
                                Liên hệ hỗ trợ
                            </Link>
                            {/* <Link
                                to="/auctions"
                                className="px-5 py-3 rounded-xl bg-indigo-600 text-white font-semibold shadow hover:bg-indigo-700 transition"
                            >
                                Tôi đã sẵn sàng, bắt đầu đấu giá
                            </Link> */}
                        </div>
                    </div>
                </section>

            </div>
        </Layout>
    );
}
