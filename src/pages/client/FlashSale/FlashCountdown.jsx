import React, { memo, useMemo } from "react";
import useCountDown from "../Helpers/CountDown";

/** Giống hệt UI cũ trong FlashSale:
 * - Wrapper có sm:mr-[75px]
 * - 4 vòng tròn: Ngày / Giờ / Phút / Giây với màu y như trước
 * Tuỳ biến nhẹ qua props nếu cần.
 */
function CountCircle({ value, label, color }) {
  return (
    <div className="countdown-item">
      <div className="countdown-number sm:w-[100px] sm:h-[100px] w-[50px] h-[50px] rounded-full bg-white flex justify-center items-center">
        <span className="font-700 sm:text-[30px] text-base" style={{ color }}>
          {value}
        </span>
      </div>
      <p className="sm:text-[18px] text-xs font-500 text-center leading-8 text-white">
        {label}
      </p>
    </div>
  );
}

function FlashCountdownInner({
  endDate,
  wrapperClass = "sm:mr-[75px]",
  gapClass = "w-full flex sm:space-x-6 space-x-3 sm:justify-between justify-evenly",
  colors = {
    day: "#EB5757",
    hour: "#2F80ED",
    minute: "#219653",
    second: "#EF5DA8",
  },
}) {
  const { showDate, showHour, showMinute, showSecound } = useCountDown(endDate);

  // Giữ đúng thứ tự + màu như bản cũ
  const items = useMemo(
    () => [
      { label: "Ngày",  value: showDate,   color: colors.day },
      { label: "Giờ",   value: showHour,   color: colors.hour },
      { label: "Phút",  value: showMinute, color: colors.minute },
      { label: "Giây",  value: showSecound,color: colors.second },
    ],
    [showDate, showHour, showMinute, showSecound, colors]
  );

  return (
    <div className={wrapperClass}>
      <div className={`countdown-wrapper ${gapClass}`}>
        {items.map((it) => (
          <CountCircle
            key={it.label}
            label={it.label}
            value={it.value}
            color={it.color}
          />
        ))}
      </div>
    </div>
  );
}

// memo để chỉ re-render khi endDate/props đổi (không ảnh hưởng cả trang)
const FlashCountdown = memo(FlashCountdownInner);
export default FlashCountdown;
