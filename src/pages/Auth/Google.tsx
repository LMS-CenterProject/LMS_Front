import { useEffect, useRef } from "react";

declare global {
  interface Window {
    google: any;
  }
}

interface GoogleResponse {
  credential: string;
}



interface ApiResponse {
  userId: string;
  fullName: string;
  email: string;
  role: string;
  accessToken: string;
  refreshToken: string;
}

const handleCredentialResponse = (response: GoogleResponse) => {
  const idToken = response.credential; // ✅ THIS is correct

  console.log("JWT TOKEN:", idToken);

  fetch("https://smart-lms.runasp.net/api/auth/google", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      idToken: idToken, // ✅ send JWT ONLY
    }),
  })
    .then((res) => {
      if (!res.ok) throw new Error("Backend rejected token");
      return res.json();
    })
    .then((data: ApiResponse) => {
      console.log("Backend response:", data);

      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.setItem("userId", data.userId);

      window.location.href = "/dashboard";
    })
    .catch((err) => console.error(err));
};

function GoogleLoginButton() {
  const clientID = import.meta.env.VITE_CLIENT_ID as string;
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    if (!window.google) return;

    const el = document.getElementById("googleBtn");
    if (!el) return;

    window.google.accounts.id.initialize({
      client_id: clientID,
      callback: handleCredentialResponse,
    });

    window.google.accounts.id.renderButton(el, {
      theme: "outline",
      size: "large",
    });
  }, [clientID]);

  return <div id="googleBtn"></div>;
}

export default GoogleLoginButton;
