// helpers/wishlistEvents.js
export const notifyWishlistChanged = () => {
  try {
    // cập nhật trong tab hiện tại
    window.dispatchEvent(new Event("wishlist:changed"));
    // đồng bộ đa tab
    localStorage.setItem("wishlistUpdatedAt", String(Date.now()));
  } catch {}
};
