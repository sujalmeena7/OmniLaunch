"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAppStore } from "@/stores/appStore";
import type { UserProfile } from "@/types";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, setUser } = useAppStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = api.getToken();
    if (!token) {
      router.push("/login");
      return;
    }
    if (!user) {
      api
        .getMe()
        .then((data) => setUser(data as unknown as UserProfile))
        .catch(() => {
          api.clearToken();
          router.push("/login");
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user, router, setUser]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg-app)",
        }}
      >
        <div style={{ fontSize: "14px", color: "var(--text-primary)" }}>Loading...</div>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen dashboard-landing-bg"
    >
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <main
          className="flex-1 overflow-auto"
          style={{ padding: "32px" }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
