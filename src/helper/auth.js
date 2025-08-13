// src/helpers/auth.js
export function setAuthData({ token, rememberToken }) {
  localStorage.setItem("token", token);
  if (rememberToken) {
    // nếu bạn dùng tokenExpire để refresh hoặc auto-logout
    localStorage.setItem("tokenExpire", rememberToken);
  }
}
