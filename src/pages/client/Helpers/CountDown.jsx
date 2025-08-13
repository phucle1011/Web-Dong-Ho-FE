import { useEffect, useState } from "react";

export default function useCountDown(lastDate) {
  const [timeLeft, setTimeLeft] = useState({
    showDate: "00",
    showHour: "00",
    showMinute: "00",
    showSecound: "00",
  });
  

  useEffect(() => {
  if (!lastDate) return;

  const target = new Date(lastDate).getTime();
  let timer; // ✅ đặt ở đây

  const updateCountdown = () => {
    const now = new Date().getTime();
    const distance = target - now;

    if (distance < 0) {
      clearInterval(timer); // ✅ timer đã được khai báo
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((distance / (1000 * 60)) % 60);
    const seconds = Math.floor((distance / 1000) % 60);

    setTimeLeft({
      showDate: String(days).padStart(2, "0"),
      showHour: String(hours).padStart(2, "0"),
      showMinute: String(minutes).padStart(2, "0"),
      showSecound: String(seconds).padStart(2, "0"),
    });
  };

  updateCountdown();
  timer = setInterval(updateCountdown, 1000); // ✅ gán sau cùng

  return () => clearInterval(timer);
}, [lastDate]);


  return timeLeft;
}
