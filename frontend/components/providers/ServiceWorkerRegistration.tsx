"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            console.log("Service worker registered for scope:", reg.scope);
          })
          .catch((err) => {
            console.error("Service worker registration failed:", err);
          });
      });
    }
  }, []);

  return null;
}
