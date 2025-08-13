import Swiper from "swiper"; 
import "swiper/css";


document.addEventListener("DOMContentLoaded", function () {
   const commentContainer = document.getElementById("comment-container");

   if (commentContainer) {
      const comments = [
         "“Tuyến Sài Gòn - Đà Lạt dịch vụ tốt, tài xế vui vẻ, xe sạch sẽ! ⭐⭐⭐⭐⭐”",
         "“Xe chạy êm, đặt vé nhanh chóng. Rất hài lòng! 👍”",
         "“Tài xế thân thiện, dịch vụ chuyên nghiệp. ⭐⭐⭐⭐”",
         "“Giá cả hợp lý, đặt vé tiện lợi. Chắc chắn sẽ quay lại! ❤️”",
         "“Chuyến đi thoải mái, không bị say xe. Rất tuyệt vời! 🌟”"
      ];

      let currentIndex = 0;
      function updateComment() {
         commentContainer.textContent = comments[currentIndex];
      }

      function nextComment() {
         currentIndex = (currentIndex + 1) % comments.length;
         updateComment();
      }

      setInterval(nextComment, 3000);
   } else {
      console.error("Lỗi: Không tìm thấy phần tử 'comment-container'");
   }

   const swiper = new Swiper(".mySwiper", {
      slidesPerView: 4,
      spaceBetween: 10,
      loop: true,
      pagination: {
         el: ".swiper-pagination",
         clickable: true,
      },
      autoplay: {
         delay: 3000,
         disableOnInteraction: false,
      },
   });

   // --------------- Hiệu ứng menu ---------------------
   const menu = document.getElementById("menu");
   if (menu) {
      window.addEventListener("scroll", function () {
         if (window.scrollY > 50) {
            menu.classList.remove("bg-transparent");
            menu.classList.add("bg-[#043175]");
         } else {
            menu.classList.remove("bg-[#043175]");
            menu.classList.add("bg-transparent");
         }
      });
   }

   // -------------- di chuyển xe ------------------------
   const bus = document.getElementById("bus");
   if (bus) {
      const observer = new IntersectionObserver(entries => {
         entries.forEach(entry => {
            if (entry.isIntersecting) {
               bus.classList.add("bus-move");
            }
         });
      }, { threshold: 0.5 });

      observer.observe(bus);
   }

   // Hàm mở & đóng  hủy vé xe
   window.openCancelModal = function () {
      document.getElementById("cancelModal").classList.remove("hidden");
   };

   window.closeCancelModal = function () {
      document.getElementById("cancelModal").classList.add("hidden");
   };

   window.toggleTextarea = function (show) {
      const otherTextarea = document.getElementById("otherReason");
      if (show) {
         otherTextarea.classList.remove("hidden");
      } else {
         otherTextarea.classList.add("hidden");
      }
   };
});
