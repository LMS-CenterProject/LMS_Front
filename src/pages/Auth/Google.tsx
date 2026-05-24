import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import type { User } from "../../context/AuthContext";

declare global {
  interface Window {
    google: any;
  }
}

interface GoogleCredentialResponse {
  credential: string;
}

export interface GoogleProfile {
  sub: string;
  name: string;
  given_name: string;
  family_name: string;
  email: string;
  email_verified: boolean;
  picture: string;
}
interface Props {
  onNewUser?: (idToken: string, profile: GoogleProfile) => void;
}
// interface ApiResponse {
//   userId: string;
//   fullName: string;
//   email: string;
//   role: string;
//   accessToken: string;
//   refreshToken: string;
// }

type Status =
  | { type: "idle" }
  | { type: "loading"; message: string }
  | { type: "success"; message: string }
  | { type: "error"; message: string };

const API = import.meta.env.VITE_API_URL as string;
// let googleInitialized = false;

const decodeJwt = (token: string): GoogleProfile => {
  const base64 = token.split(".")[1];
  const json = decodeURIComponent(
    atob(base64.replace(/-/g, "+").replace(/_/g, "/"))
      .split("")
      .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join(""),
  );
  return JSON.parse(json);
};

const buildCallback =
  (
    navigate: ReturnType<typeof useNavigate>,
    setStatus: (s: Status) => void,
    loginWithGoogle: (user: User, token: string, refreshToken: string) => void,
    onNewUser?: (idToken: string, profile: GoogleProfile) => void,
  ) =>
  async (response: GoogleCredentialResponse) => {
    const idToken = response.credential;
    const googleProfile = decodeJwt(idToken);

    // If onNewUser is provided (register page), always show role picker first
    if (onNewUser) {
      onNewUser(idToken, googleProfile);
      return;
    }

    // No onNewUser = login page, go straight to auth
    setStatus({ type: "loading", message: "Signing you in..." });
    try {
      const res = await fetch(`${API}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus({ type: "error", message: data?.detail ?? "Login failed." });
        return;
      }

      const user: User = {
        id: data.userId,
        name: data.fullName,
        email: data.email,
        role: data.role,
        picture: googleProfile.picture,
        givenName: googleProfile.given_name,
        familyName: googleProfile.family_name,
        emailVerified: googleProfile.email_verified,
        googleId: googleProfile.sub,
      };
      loginWithGoogle(user, data.accessToken, data.refreshToken);
      setStatus({
        type: "success",
        message: `Welcome back, ${googleProfile.given_name}!`,
      });
      setTimeout(() => navigate("/dashboard"), 800);
    } catch {
      setStatus({ type: "error", message: "Network error." });
    }
  };
function GoogleLoginButton({ onNewUser }: Props) {
  const clientID = import.meta.env.VITE_CLIENT_ID as string;
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuth();
  const navigateRef = useRef(navigate);
  const loginRef = useRef(loginWithGoogle);
  const [status, setStatus] = useState<Status>({ type: "idle" });
  const [scriptReady, setScriptReady] = useState(false);

  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);
  useEffect(() => {
    loginRef.current = loginWithGoogle;
  }, [loginWithGoogle]);
  const onNewUserRef = useRef(onNewUser);
  useEffect(() => {
    onNewUserRef.current = onNewUser;
  }, [onNewUser]);

  useEffect(() => {
    if (!clientID) return;

    const init = () => {
      if (!window.google) return;

      // Reset so re-initialization picks up the latest refs
      // googleInitialized = false;

      window.google.accounts.id.initialize({
        client_id: clientID,
        callback: (r: GoogleCredentialResponse) =>
          buildCallback(
            navigateRef.current,
            setStatus,
            loginRef.current,
            onNewUserRef.current, // ← this was missing
          )(r),
      });

      const el = document.getElementById("googleBtn");
      if (el) {
        window.google.accounts.id.renderButton(el, {
          theme: "outline",
          size: "large",
          width: el.offsetWidth,
        });
      }
      setScriptReady(true);
      // googleInitialized = true;
    };

    if (window.google) {
      init();
      return;
    }

    const script = document.querySelector(
      'script[src="https://accounts.google.com/gsi/client"]',
    ) as HTMLScriptElement | null;

    if (script) {
      script.addEventListener("load", init);
      return () => script.removeEventListener("load", init);
    }
  }, [clientID]);

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <div id="googleBtn" className="w-full flex justify-center" />

      {!scriptReady && (
        <p className="text-xs text-slate-500">Loading Google sign-in...</p>
      )}

      {status.type === "loading" && (
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8z"
            />
          </svg>
          {status.message}
        </div>
      )}

      {status.type === "success" && (
        <div className="flex items-center gap-2 text-sm text-green-400">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          {status.message}
        </div>
      )}

      {status.type === "error" && (
        <div className="flex items-center gap-2 text-sm text-red-400 text-center">
          <svg
            className="w-4 h-4 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          {status.message}
        </div>
      )}
    </div>
  );
}

export default GoogleLoginButton;
