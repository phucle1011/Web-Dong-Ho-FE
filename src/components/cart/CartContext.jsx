import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import Constants from "../../Constants";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const token = localStorage.getItem("token");

  const fetchCart = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${Constants.DOMAIN_API}/carts`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setCartItems(res.data.data);
    } catch (err) {
      console.error("Lỗi fetch cart:", err);
    }
  };

  const updateQuantity = async (variantId, quantity) => {
    try {
      await axios.put(
        `${Constants.DOMAIN_API}/update-to-carts/${variantId}`,
        { quantity },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      await fetchCart();
    } catch (err) {
      console.error("Lỗi update:", err);
    }
  };

  const deleteItem = async (variantId) => {
    try {
      await axios.delete(`${Constants.DOMAIN_API}/delete-to-carts/${variantId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchCart();
    } catch (err) {
      console.error("Lỗi delete:", err);
    }
  };

//   useEffect(() => {
//     fetchCart();
//   }, []);

  return (
    <CartContext.Provider value={{ cartItems, fetchCart, updateQuantity, deleteItem }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
