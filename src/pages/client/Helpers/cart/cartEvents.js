// helpers/cartEvents.js
export const notifyCartChanged = () => {
  try {
    window.dispatchEvent(new Event("cart:changed"));        // trong cùng tab
    localStorage.setItem("cartUpdatedAt", String(Date.now())); // đồng bộ đa tab
  } catch {}
};
