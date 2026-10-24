import axios from "axios";

const backendUrl = typeof process !== "undefined" && process.env?.REACT_APP_BACKEND_URL
  ? process.env.REACT_APP_BACKEND_URL
  : (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_BACKEND_URL) || "";

export const API = backendUrl ? `${backendUrl}/api` : "/api";

export const api = axios.create({ baseURL: API });

const savedToken = typeof localStorage !== "undefined" ? localStorage.getItem("wjp_token") : null;
if (savedToken) api.defaults.headers.common.Authorization = `Bearer ${savedToken}`;

export const formatApiError = (detail) => {
  if (detail == null) return "Terjadi kesalahan. Coba lagi.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail.map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e))).filter(Boolean).join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
};

export const formatIDR = (n) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n || 0);

export const WA_NUMBER = "6285693161480";
export const FB_URL = "https://www.facebook.com/share/1Ey74rNDVi/";
export const FB_LOGO_URL = "https://www.facebook.com/share/1DNMWVGsG5/";

export const waLink = (text) =>
  `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;

export const imgSrc = (url) => {
  if (!url) return "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns='http://www.w3.org/2000/svg'/%3E";
  if (url.startsWith("http") || url.startsWith("data:")) return url;
  return backendUrl ? `${backendUrl}${url}` : url;
};
