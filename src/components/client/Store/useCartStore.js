import { create } from "zustand";
import Constants from "../../../Constants";

const useCartStore = create((set) => ({
  cartItems: [], 
  fetchCart: async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const res = await fetch(`${Constants.DOMAIN_API}/carts`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();

    set({ cartItems: data.data });
  },
  updateQuantity: async (productVariantId, newQuantity) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    await fetch(`${Constants.DOMAIN_API}/update-to-carts/${productVariantId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ quantity: newQuantity }),
    });

    set((state) => ({
      cartItems: state.cartItems.map((item) =>
        item.product_variant_id === productVariantId
          ? { ...item, quantity: newQuantity }
          : item
      ),
    }));
  },
}));

export default useCartStore;