import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
} from "react";

const API = import.meta.env.VITE_API_URL as string;

const KEYS = {
  token: "accessToken",
  refreshToken: "refreshToken",
  user: "user",
  userId: "userId",
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  picture?: string;
  givenName?: string;
  familyName?: string;
  emailVerified?: boolean;
  googleId?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

type AuthAction =
  | { type: "AUTH_LOADING" }
  | { type: "LOGIN_SUCCESS"; payload: { user: User; token: string } }
  | { type: "LOGOUT" }
  | { type: "AUTH_ERROR"; payload: string }
  | { type: "CLEAR_ERROR" }
  | { type: "UPDATE_USER"; payload: Partial<User> };

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  fullName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  role: number; // 0 = Student, 1 = Instructor
}

interface AuthContextValue extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  loginWithGoogle: (user: User, token: string, refreshToken: string) => void;
  logout: () => void;
  clearError: () => void;
  updateUser: (data: Partial<User>) => void;
}

// ─── Reducer ──────────────────────────────────────────────────────────────────

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "AUTH_LOADING":
      return { ...state, isLoading: true, error: null };
    case "LOGIN_SUCCESS":
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case "LOGOUT":
      return { ...initialState, isLoading: false };
    case "AUTH_ERROR":
      return { ...state, isLoading: false, error: action.payload };
    case "CLEAR_ERROR":
      return { ...state, error: null };
    case "UPDATE_USER":
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      };
    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Rehydrate on mount
  useEffect(() => {
    try {
      const token = localStorage.getItem(KEYS.token);
      const userRaw = localStorage.getItem(KEYS.user);
      const userId = localStorage.getItem(KEYS.userId);
      if (token && userRaw && userId) {
        const stored = JSON.parse(userRaw);
        const user: User = { id: userId, ...stored };
        dispatch({ type: "LOGIN_SUCCESS", payload: { user, token } });
      } else {
        dispatch({ type: "LOGOUT" });
      }
    } catch {
      dispatch({ type: "LOGOUT" });
    }
  }, []);

  const persist = (user: User, token: string, refreshToken: string) => {
    localStorage.setItem(KEYS.token, token);
    localStorage.setItem(KEYS.refreshToken, refreshToken);
    localStorage.setItem(KEYS.userId, user.id);
    localStorage.setItem(KEYS.user, JSON.stringify(user));
  };

  const clearStorage = () =>
    Object.values(KEYS).forEach((k) => localStorage.removeItem(k));

  // ── Login ─────────────────────────────────────────────────────────────────

  const login = useCallback(async (credentials: LoginCredentials) => {
    dispatch({ type: "AUTH_LOADING" });
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.detail ?? "Invalid email or password.");
      }

      const data = await res.json();
      const user: User = {
        id: data.userId,
        name: data.fullName,
        email: data.email,
        role: data.role,
      };

      persist(user, data.accessToken, data.refreshToken);
      dispatch({
        type: "LOGIN_SUCCESS",
        payload: { user, token: data.accessToken },
      });
    } catch (err: unknown) {
      dispatch({
        type: "AUTH_ERROR",
        payload: err instanceof Error ? err.message : "Login failed.",
      });
    }
  }, []);

  // ── Register ──────────────────────────────────────────────────────────────

  const register = useCallback(async (data: RegisterData) => {
    dispatch({ type: "AUTH_LOADING" });
    try {
      const res = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.detail ?? "Registration failed.");
      }

      const result = await res.json();
      const user: User = {
        id: result.userId,
        name: result.fullName,
        email: result.email,
        role: result.role,
      };

      persist(user, result.accessToken, result.refreshToken);
      dispatch({
        type: "LOGIN_SUCCESS",
        payload: { user, token: result.accessToken },
      });
    } catch (err: unknown) {
      dispatch({
        type: "AUTH_ERROR",
        payload: err instanceof Error ? err.message : "Registration failed.",
      });
    }
  }, []);

  // ── Google Login ──────────────────────────────────────────────────────────

  const loginWithGoogle = useCallback(
    (user: User, token: string, refreshToken: string) => {
      persist(user, token, refreshToken);
      dispatch({ type: "LOGIN_SUCCESS", payload: { user, token } });
    },
    [],
  );

  // ── Logout ────────────────────────────────────────────────────────────────

  const logout = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem(KEYS.refreshToken);
      if (refreshToken) {
        await fetch(`${API}/auth/logout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });
      }
    } catch {
      // ignore
    }
    clearStorage();
    dispatch({ type: "LOGOUT" });
  }, []);

  const clearError = useCallback(() => dispatch({ type: "CLEAR_ERROR" }), []);

  const updateUser = useCallback((data: Partial<User>) => {
    dispatch({ type: "UPDATE_USER", payload: data });
    const stored = localStorage.getItem(KEYS.user);
    if (stored) {
      localStorage.setItem(
        KEYS.user,
        JSON.stringify({ ...JSON.parse(stored), ...data }),
      );
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        loginWithGoogle,
        logout,
        clearError,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
};

export default AuthContext;
