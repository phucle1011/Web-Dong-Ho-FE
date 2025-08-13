import React, { useState, useRef, useEffect } from "react";
import Constants from "./Constants";
import { Link } from "react-router-dom";
import { FaMicrophone } from "react-icons/fa";
import { FiPhone } from "react-icons/fi";

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

export default function GeminiChatbox() {
  const [show, setShow] = useState(false);
  const [messages, setMessages] = useState([]);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleVoiceInput = () => {
    if (!SpeechRecognition) {
      alert("Trình duyệt không hỗ trợ nhận diện giọng nói.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "vi-VN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setPrompt(transcript);
    };

    recognition.onerror = (event) => {
      console.error("Voice error:", event.error);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
    setIsListening(true);
    recognitionRef.current = recognition;
  };

  const sendPrompt = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    const newMessages = [...messages, { role: "user", text: prompt }];
    setMessages(newMessages);
    setPrompt("");
    setLoading(true);

    try {
      const res = await fetch(`${Constants.DOMAIN_API}/apiRoutes/chat/gemini`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();

      const botMessage = {
        role: "gemini",
        text: data.reply || "Không có phản hồi.",
        action: data.action || null,
      };

      if (data.products?.length > 0) {
        botMessage.products = data.products;
      }

      setMessages([...newMessages, botMessage]);
    } catch (error) {
      setMessages([
        ...newMessages,
        { role: "gemini", text: "Lỗi kết nối đến server." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    chatToggle: {
      position: "fixed",
      bottom: "20px",
      right: "20px",
      width: "64px",
      height: "64px",
      borderRadius: "50%",
      cursor: "pointer",
      zIndex: 999,
      boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
    },
    chatBox: {
      position: "fixed",
      bottom: "100px",
      right: "20px",
      width: "360px",
      height: "520px",
      background: "white",
      border: "1px solid #ccc",
      borderRadius: "10px",
      display: "flex",
      flexDirection: "column",
      boxShadow: "0 6px 20px rgba(0,0,0,0.2)",
      zIndex: 999,
      overflow: "hidden",
    },
    chatHeader: {
      background: "linear-gradient(86.7deg, #3353a2 0.85%, #31b7b7 98.94%)",
      color: "#fff",
      padding: "12px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      fontWeight: "bold",
      fontSize: "16px",
    },
    chatMessages: {
      flexGrow: 1,
      padding: "12px",
      overflowY: "auto",
      backgroundColor: "#f5f5f5",
      display: "flex",
      flexDirection: "column",
      gap: "10px",
    },
    bubble: {
      padding: "10px 14px",
      borderRadius: "20px",
      maxWidth: "80%",
      wordWrap: "break-word",
      display: "inline-block",
      fontSize: "14px",
    },
    userMsg: {
      alignSelf: "flex-end",
      background: "#ececec",
      color: "#000",
      borderTopRightRadius: "0px",
    },
    botMsg: {
      alignSelf: "flex-start",
      background: "#31b7b7",
      color: "#fff",
      borderTopLeftRadius: "0px",
    },
    chatForm: {
      display: "flex",
      borderTop: "1px solid #ddd",
      padding: "10px",
      background: "#fff",
    },
    chatInput: {
      flex: 1,
      padding: "10px",
      border: "1px solid #ccc",
      borderRadius: "20px",
      marginRight: "8px",
      outline: "none",
      paddingRight: "40px",
    },
    chatButton: {
      padding: "10px 16px",
      background: "#31b7b7",
      color: "white",
      border: "none",
      borderRadius: "20px",
      cursor: "pointer",
    },
  };

  return (
    <>
      <img
        src="https://agents.fpt.ai/live-chat/img/chatbot-icon.gif"
        alt="chatbot-icon"
        onClick={() => setShow(!show)}
        style={styles.chatToggle}
      />

      {show && (
        <div style={styles.chatBox}>
          <div style={styles.chatHeader}>
            <span>Hỗ trợ trực tuyến</span>
            <button
              onClick={() => setShow(false)}
              style={{ background: "none", border: "none", color: "white", fontSize: "20px", cursor: "pointer" }}
            >
              ×
            </button>
          </div>

          <div style={styles.chatMessages}>
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  ...styles.bubble,
                  ...(msg.role === "user" ? styles.userMsg : styles.botMsg),
                }}
              >
                <div>
                  <div>{msg.text}</div>
                  {msg.products?.length > 0 && (
                    <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "10px" }}>
                      {msg.products.map((product) => (
                        <Link
                          key={product.id}
                          to="/product"
                          state={{ productId: [product.id] }}
                          className="flex items-center gap-2 p-2 border rounded-md hover:shadow-sm transition bg-white no-underline text-black"
                        >
                          <img
                            src={product.thumbnail}
                            alt={product.name}
                            style={{
                              width: "50px",
                              height: "50px",
                              objectFit: "cover",
                              borderRadius: "4px",
                            }}
                          />
                          <div style={{ flexGrow: 1 }}>
                            <span className="block font-medium text-sm">{product.name}</span>
                            {product.final_price ? (
                              <span className="block text-sm">
                                <span className="line-through text-gray-500 mr-1">
                                  {product.price.toLocaleString()}₫
                                </span>
                                <span className="font-bold text-red-500">
                                  {product.final_price.toLocaleString()}₫
                                </span>
                              </span>
                            ) : (
                              <span className="block font-bold text-sm">
                                {product.price.toLocaleString()}₫
                              </span>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                  {msg.action === "contact" && (
                    <div style={{ marginTop: "10px" }}>
                      <Link
                        to="/contact"
                        className="inline-flex items-center gap-2 px-6 py-2 bg-yellow-500 text-white text-sm font-semibold rounded-full shadow hover:bg-yellow-600 transition duration-300">
                        <FiPhone className="text-lg" />
                        Liên hệ ngay
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ ...styles.bubble, ...styles.botMsg }}>
                <TypingDots />
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <form style={styles.chatForm} onSubmit={sendPrompt}>
            <div style={{ position: "relative", flex: 1 }}>
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Nhập câu hỏi..."
                required
                style={styles.chatInput}
              />
              <button
                type="button"
                onClick={handleVoiceInput}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: isListening ? "red" : "#555",
                }}
              >
                <FaMicrophone size={18} />
              </button>
            </div>
            <button type="submit" style={styles.chatButton}>
              Gửi
            </button>
          </form>
        </div>
      )}
    </>
  );
}

function TypingDots() {
  return (
    <span style={{ display: "inline-block", minWidth: "30px" }}>
      <span className="dot">.</span>
      <span className="dot">.</span>
      <span className="dot">.</span>
      <style>
        {`
          .dot {
            animation: blink 1.2s infinite;
            font-size: 18px;
          }
          .dot:nth-child(2) {
            animation-delay: 0.2s;
          }
          .dot:nth-child(3) {
            animation-delay: 0.4s;
          }
          @keyframes blink {
            0%, 100% { opacity: 0.2; }
            50% { opacity: 1; }
          }
        `}
      </style>
    </span>
  );
}