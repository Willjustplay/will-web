import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

const EMPTY = { games: [], loading: true, error: false };

/** Load the list of games that support top up (with fields + denominations). */
export const useTopupGames = () => {
  const [state, setState] = useState(EMPTY);

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: false }));
    try {
      const { data } = await api.get("/topup/games");
      setState({ games: Array.isArray(data) ? data : [], loading: false, error: false });
    } catch (err) {
      console.error(err);
      setState({ games: [], loading: false, error: true });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, reload: load };
};

/**
 * Validate the in-game destination (User ID / Server) against the game rules.
 * Resolves to `{ ok, checked, nickname, message }`; never throws.
 */
export const validateTopupDestination = async (gameSlug, destination) => {
  try {
    const { data } = await api.post("/topup/validate", {
      game: gameSlug,
      destination,
    });
    return {
      ok: !!data.valid,
      checked: !!data.checked,
      nickname: data.nickname || "",
      message: data.message || "",
      destination: data.destination || destination,
    };
  } catch (err) {
    const status = err.response?.status;
    if (status === 400 || status === 404) {
      return { ok: false, checked: false, message: err.response?.data?.detail || "Data tidak valid" };
    }
    return {
      ok: true,
      checked: false,
      message: "Validasi otomatis tidak tersedia. Lanjutkan, admin akan memverifikasi.",
    };
  }
};

/** Client-side mirror of the backend field rules, used for instant feedback. */
export const localFieldError = (field, value) => {
  const raw = String(value ?? "").trim();
  const label = field.label || field.key;
  if (!raw) return field.required === false ? "" : `${label} wajib diisi`;
  if (field.min_len && raw.length < field.min_len) return `${label} minimal ${field.min_len} karakter`;
  if (field.max_len && raw.length > field.max_len) return `${label} maksimal ${field.max_len} karakter`;
  if (field.pattern) {
    try {
      if (!new RegExp(field.pattern).test(raw)) return field.help || `Format ${label} tidak valid`;
    } catch {
      /* malformed pattern from admin — skip the check */
    }
  }
  return "";
};
