import { useEffect, useState } from "react";

type StartupState =
  | "loading"
  | "login"
  | "dashboard";

export function StartupRouter() {
  const [state, setState] = useState<StartupState>("loading");

  useEffect(() => {
    async function initialise() {
      try {
        const stored = localStorage.getItem("kdos_session");

        if (stored) {
          setState("dashboard");
        } else {
          setState("login");
        }
      } catch {
        setState("login");
      }
    }

    void initialise();
  }, []);

  if (state === "loading") {
    return (
      <div
        style={{
          height: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#09090B",
          color: "#ffffff",
        }}
      >
        Starting KDOS...
      </div>
    );
  }

  if (state === "login") {
    return (
      <div
        style={{
          height: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#09090B",
          color: "#ffffff",
        }}
      >
        Login Screen
      </div>
    );
  }

  return (
    <div
      style={{
        height: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#09090B",
        color: "#ffffff",
      }}
    >
      Dashboard
    </div>
  );
}