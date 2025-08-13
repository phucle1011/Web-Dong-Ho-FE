import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import useCountDown from "../Helpers/CountDown";

export default function CampaignCountDown({ flashSales = [], className }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const timer = useRef(null);

  if (!flashSales.length) return null;

  const notification = flashSales[selectedIndex];
  const isUpcoming = notification.status === 0;
  const isActive = notification.status === 1;

  const countdownTarget = isUpcoming
    ? notification.start_date
    : notification.end_date;

  const { showDate, showHour, showMinute, showSecound } = useCountDown(countdownTarget);

  const startAuto = useCallback(() => {
    clearInterval(timer.current);
    timer.current = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setSelectedIndex((p) => (p + 1) % flashSales.length);
        setFade(true);
      }, 300);
    }, 5000);
  }, [flashSales.length]);

  useEffect(() => {
    startAuto();
    return () => clearInterval(timer.current);
  }, [startAuto]);

  const prev = () => {
    clearInterval(timer.current);
    setFade(false);
    setTimeout(() => {
      setSelectedIndex((p) => (p === 0 ? flashSales.length - 1 : p - 1));
      setFade(true);
      startAuto();
    }, 300);
  };

  const next = () => {
    clearInterval(timer.current);
    setFade(false);
    setTimeout(() => {
      setSelectedIndex((p) => (p + 1) % flashSales.length);
      setFade(true);
      startAuto();
    }, 300);
  };

  return (
    <div className={`w-full ${className || ""}`}>
      <div className="relative w-full h-[300px] sm:h-[450px] overflow-hidden">
        <div
          key={selectedIndex}
          className={`absolute inset-0 bg-cover bg-center transition-opacity duration-200 ${
            fade ? "opacity-100" : "opacity-75"
          }`}
          style={{ backgroundImage: `url(${notification?.thumbnail})` }}
        />
        <div className="absolute inset-0 bg-black/30" />

        <Nav pos="left" onClick={prev} />
        <Nav pos="right" onClick={next} />

        <div className="absolute top-4 right-4 sm:top-8 sm:right-10 z-20 flex items-center gap-2 sm:gap-3 text-white">
          <h2 className="text-2xl sm:text-4xl font-bold drop-shadow mb-3 break-words">
            {isActive ? "Kết thúc sau:" : "Bắt đầu sau:"}
          </h2>
          <div className="flex gap-2 sm:gap-3">
            <Circle label="Ngày" value={showDate} color="#EB5757" />
            <Circle label="Giờ" value={showHour} color="#2F80ED" />
            <Circle label="Phút" value={showMinute} color="#219653" />
            <Circle label="Giây" value={showSecound} color="#EF5DA8" />
          </div>
        </div>

        <div className="absolute inset-0 flex flex-col justify-center pl-6 sm:pl-20 z-20 text-white">
          <div className="max-w-[420px]">
            <h2 className="text-2xl sm:text-4xl font-bold drop-shadow mb-3 break-words">
              {notification.title}
            </h2>

            {isActive ? (
              <Link
                to="/flash-sale"
                state={{ notification }}
                className="inline-flex bg-yellow-400 text-black font-semibold px-4 py-2 rounded hover:bg-yellow-300 transition text-sm sm:text-base"
              >
                Xem ngay
              </Link>
            ) : (
              <p className="text-yellow-300 font-medium text-sm sm:text-base italic">
                Khuyến mãi sắp diễn ra
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-center mt-3 gap-2">
        {flashSales.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === selectedIndex ? "w-8 bg-black" : "w-3 bg-gray-400"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function Circle({ value, label, color }) {
  return (
    <div className="text-center">
      <div
        className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-2 flex items-center justify-center bg-white/90 shadow"
        style={{ borderColor: color }}
      >
        <span className="text-base sm:text-xl font-bold" style={{ color }}>
          {value}
        </span>
      </div>
      <p className="text-[10px] sm:text-xs font-medium text-white drop-shadow">
        {label}
      </p>
    </div>
  );
}

function Nav({ pos, onClick }) {
  const sideClasses = pos === 'left' ? 'left-2 sm:left-5' : 'right-2 sm:right-5';

  return (
    <button
      onClick={onClick}
      className={`absolute ${sideClasses} top-1/2 -translate-y-1/2 z-30 rounded-full p-2`}
    >
      {pos === 'left' ? (
        // Left arrow
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-6 h-6 text-qblack"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      ) : (
        // Right arrow
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-6 h-6 text-qblack"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      )}
    </button>
  );
}
