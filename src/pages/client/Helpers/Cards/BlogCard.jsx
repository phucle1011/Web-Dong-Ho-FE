import { Link } from "react-router-dom";

export default function BlogCard({ className, datas }) {
  // Hàm để lấy đoạn text ngắn từ content (loại bỏ tag HTML)
  const getPlainText = (html) => {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent || div.innerText || "";
  };

  return (
    <div className={`blog-card-wrapper w-full border border-[#D3D3D3] ${className || ""}`}>
      <div className="img w-full h-[340px]">
        <img
          src={datas.image_url}
          alt={datas.title}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-[24px]">
        <div className="short-data flex flex-wrap gap-6 items-center mb-3 text-base text-qgraytwo">
          <div className="flex items-center gap-2">
            {/* Icon user */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              className="text-qgray"
              viewBox="0 0 16 16"
            >
              <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
            </svg>
            <span className="capitalize">By User {datas.user_id}</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Icon calendar */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              className="text-qgray"
              viewBox="0 0 16 16"
            >
              <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1.5A1.5 1.5 0 0 1 16 2.5v11A1.5 1.5 0 0 1 14.5 15h-13A1.5 1.5 0 0 1 0 13.5v-11A1.5 1.5 0 0 1 1.5 1H3V.5a.5.5 0 0 1 .5-.5zM1.5 2A.5.5 0 0 0 1 2.5V4h14V2.5a.5.5 0 0 0-.5-.5H13v.5a.5.5 0 0 1-1 0V2H4v.5a.5.5 0 0 1-1 0V2H1.5zM15 5H1v8.5a.5.5 0 0 0 .5.5h13a.5.5 0 0 0 .5-.5V5z"/>
            </svg>
            <span>
              {new Date(datas.created_at).toLocaleDateString("vi-VN")}
            </span>
          </div>

          {/* Nếu có comments_length thì hiện */}
          {datas.comments_length !== undefined && (
            <div className="flex items-center gap-2">
              {/* icon comment */}
              <svg
                width="16"
                height="15"
                viewBox="0 0 16 15"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3.73636 12.2092C3.29706 12.1112 2.89189 11.9493 2.52936 11.698C1.55268 11.0206 1.02382 10.0834 1.01102 8.89479C0.989696 7.06292 0.993961 5.23105 1.00676 3.39919C1.02382 1.68235 2.23934 0.297797 3.94108 0.0379278C4.11168 0.0123668 4.29081 0.00384653 4.46567 0.00384653C7.15688 0.00384653 9.8481 -0.000413627 12.5393 0.00384653C14.2069 0.00810668 15.5717 1.10723 15.9172 2.73034C15.9684 2.97317 15.9897 3.22452 15.9897 3.47587C15.994 5.25236 15.9982 7.0331 15.994 8.80958C15.9897 10.5136 14.8637 11.8939 13.2047 12.2134C12.9701 12.2603 12.7312 12.2688 12.4924 12.2688C11.2939 12.2731 10.0997 12.2731 8.90127 12.2731C7.65448 12.2731 6.40768 12.2731 5.16089 12.2731C4.86004 12.2731 4.56443 12.2731 3.73636 12.2092ZM3.74414 9.77847C4.27131 9.77642 4.79463 9.79949 5.31795 9.7961C6.462 9.78663 7.60605 9.7814 8.7501 9.78663C10.5721 9.79488 12.328 9.79949 14.0722 9.78663C14.2239 9.78323 14.3921 9.74145 14.5282 9.65244C14.8747 9.43383 15.0303 9.06129 15.0355 8.56568C15.044 6.96401 15.0397 5.36234 15.0397 3.75465C15.0397 3.61045 15.0131 3.46407 14.9783 3.3145C14.9371 3.13262 14.8533 3.03331 14.6638 3.02897C12.3824 3.00923 10.101 3.00888 7.81968 3.0141C6.95894 3.0162 6.0982 3.02046 5.23747 3.01841C4.38439 3.0162 3.55761 3.37083 3.04248 4.06115C2.56019 4.7006 2.39529 5.49959 2.39529 6.31434C2.39153 7.93444 2.39023 9.55454 2.39345 11.1746C2.39345 11.3453 2.41652 11.5186 2.44776 11.6893C2.49541 12.0109 2.7942 12.1613 3.10387 12.1341C3.27503 12.117 3.45309 12.1112 3.74414 12.1112V9.77847Z"
                  fill="#FFBB38"
                />
              </svg>
              <span className="text-base text-qgraytwo">{datas.comments_length}</span>
            </div>
          )}
        </div>
        <h3 className="text-2xl font-semibold mb-3">
          <Link
            to={`/blogs/${datas.id}`}
            className="text-qblack hover:text-qyellow transition duration-300"
          >
            {datas.title}
          </Link>
        </h3>
        <p className="text-qgraytwo text-base leading-7 max-h-[7rem] overflow-hidden text-ellipsis">
          {/* Nếu có meta_description thì ưu tiên dùng */}
          {datas.meta_description
            ? datas.meta_description
            : getPlainText(datas.content).slice(0, 140) + "..."}
        </p>
      </div>
    </div>
  );
}
