import { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { AuthModal } from "@/components/AuthModal";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const TOKEN_KEY = "wjp_token";

const setAuthHeader = (t) => {
  if (t) api.defaults.headers.common.Authorization = `Bearer ${t}`;
  else delete api.defaults.headers.common.Authorization;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(undefined); // undefined = loading, null = guest
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState("login");

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setUser(null);
      return;
    }
    setAuthHeader(token);
    api
      .get("/auth/me")
      .then((r) => setUser(r.data))
      .catch((err) => {
        if (err.response) {
          localStorage.removeItem(TOKEN_KEY);
          setAuthHeader("");
        }
        setUser(null);
      });
  }, []);

  const persist = (token, u) => {
    localStorage.setItem(TOKEN_KEY, token);
    setAuthHeader(token);
    setUser(u);
  };

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    persist(data.token, data.user);
    return data.user;
  };

  const adminLogin = async (password) => {
    const { data } = await api.post("/auth/admin-login", { password });
    persist(data.token, data.user);
    return data.user;
  };

  const register = async (email, password, name) => {
    const { data } = await api.post("/auth/register", { email, password, name });
    if (data.token) {
      persist(data.token, data.user);
    }
    return data;
  };

  const forgotPassword = async (email) => {
    const { data } = await api.post("/auth/forgot-password", { email });
    return data;
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setAuthHeader("");
    setUser(null);
  };

  const openAuth = (tab = "login") => {
    setAuthTab(tab);
    setAuthOpen(true);
  };

  const isWishlisted = (pid) => !!user?.wishlist?.includes(pid);

  const toggleWishlist = async (pid) => {
    if (!user) {
      openAuth("login");
      return;
    }
    try {
      const { data } = await api.post(`/me/wishlist/${pid}`);
      setUser((u) => ({ ...u, wishlist: data.wishlist }));
    } catch {
      toast.error("Gagal memperbarui wishlist. Coba lagi.");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        initializing: user === undefined,
        login,
        adminLogin,
        register,
        logout,
        openAuth,
        isWishlisted,
        toggleWishlist,
      }}
    >
      {children}
      <AuthModal
        open={authOpen}
        tab={authTab}
        setTab={setAuthTab}
        onClose={() => setAuthOpen(false)}
        onLogin={login}
        onRegister={register}
        onForgot={forgotPassword}
      />
    </AuthContext.Provider>
  );
};
