import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
} from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  role: "student" | "instructor" | "admin";
  avatar?: string;
  enrolledCourses?: string[];
  createdAt: string;
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
  | { type: "REGISTER_SUCCESS"; payload: { user: User; token: string } }
  | { type: "LOGOUT" }
  | { type: "AUTH_ERROR"; payload: string }
  | { type: "CLEAR_ERROR" }
  | { type: "UPDATE_USER"; payload: Partial<User> };

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: "student" | "instructor";
}

interface AuthContextValue extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
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
    case "REGISTER_SUCCESS":
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

  // Rehydrate from localStorage on mount
  useEffect(() => {
    try {
      const token = localStorage.getItem("lms_token");
      const userRaw = localStorage.getItem("lms_user");
      if (token && userRaw) {
        const user: User = JSON.parse(userRaw);
        dispatch({ type: "LOGIN_SUCCESS", payload: { user, token } });
      } else {
        dispatch({ type: "LOGOUT" });
      }
    } catch {
      dispatch({ type: "LOGOUT" });
    }
  }, []);

  const persistSession = (user: User, token: string) => {
    localStorage.setItem("lms_token", token);
    localStorage.setItem("lms_user", JSON.stringify(user));
  };

  const clearSession = () => {
    localStorage.removeItem("lms_token");
    localStorage.removeItem("lms_user");
  };

  // ── Login ────────────────────────────────────────────────────────────────────
  const login = useCallback(async (credentials: LoginCredentials) => {
    dispatch({ type: "AUTH_LOADING" });
    try {
      // Replace this with your real API call:
      // const res = await api.post("/auth/login", credentials);
      await new Promise((r) => setTimeout(r, 900)); // simulate latency

      if (
        credentials.email === "demo@lms.com" &&
        credentials.password === "password"
      ) {
        const user: User = {
          id: "usr_001",
          name: "Alex Johnson",
          email: credentials.email,
          role: "student",
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${credentials.email}`,
          enrolledCourses: ["crs_001", "crs_002"],
          createdAt: new Date().toISOString(),
        };
        const token = "mock_jwt_token_" + Date.now();
        persistSession(user, token);
        dispatch({ type: "LOGIN_SUCCESS", payload: { user, token } });
      } else {
        throw new Error("Invalid email or password.");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login failed.";
      dispatch({ type: "AUTH_ERROR", payload: message });
    }
  }, []);

  // ── Register ─────────────────────────────────────────────────────────────────
  const register = useCallback(async (data: RegisterData) => {
    dispatch({ type: "AUTH_LOADING" });
    try {
      // Replace with: const res = await api.post("/auth/register", data);
      await new Promise((r) => setTimeout(r, 900));

      const user: User = {
        id: "usr_" + Date.now(),
        name: data.name,
        email: data.email,
        role: data.role ?? "student",
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.email}`,
        enrolledCourses: [],
        createdAt: new Date().toISOString(),
      };
      const token = "mock_jwt_token_" + Date.now();
      persistSession(user, token);
      dispatch({ type: "REGISTER_SUCCESS", payload: { user, token } });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Registration failed.";
      dispatch({ type: "AUTH_ERROR", payload: message });
    }
  }, []);

  // ── Logout ───────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    clearSession();
    dispatch({ type: "LOGOUT" });
  }, []);

  const clearError = useCallback(() => dispatch({ type: "CLEAR_ERROR" }), []);

  const updateUser = useCallback((data: Partial<User>) => {
    dispatch({ type: "UPDATE_USER", payload: data });
    const stored = localStorage.getItem("lms_user");
    if (stored) {
      const user = JSON.parse(stored);
      localStorage.setItem("lms_user", JSON.stringify({ ...user, ...data }));
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ ...state, login, register, logout, clearError, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
};

export default AuthContext;
