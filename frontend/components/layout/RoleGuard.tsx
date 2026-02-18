"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  children: ReactNode;
  role: "admin" | "citizen";
}

export default function RoleGuard({ children, role }: Props) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("iwis-token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.role === role) {
        setAuthorized(true);
      } else {
        router.push("/dashboard");
      }
    } catch {
      router.push("/login");
    }
  }, []);

  if (!authorized) return null;

  return <>{children}</>;
}
