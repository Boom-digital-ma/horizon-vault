"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import UserCrud from "@/components/admin/UserCrud";
import StudyCrud from "@/components/admin/StudyCrud";
import AnalyticsDashboard from "@/components/admin/AnalyticsDashboard";

type AdminTab = "users" | "studies" | "analytics";

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [adminEmail, setAdminEmail] = useState("");
  const [activeTab, setActiveTab] = useState<AdminTab>("analytics");

  useEffect(() => {
    const verifyAdminRole = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          router.replace("/");
          return;
        }

        // Fetch user profile role to verify they are admin
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        if (error || profile?.role !== "admin") {
          // If not admin, redirect to portal (if user) or login (if guest)
          if (profile?.role === "user") {
            router.replace("/portal");
          } else {
            router.replace("/");
          }
          return;
        }

        setAdminEmail(session.user.email || "");
      } catch (err) {
        console.error("Error verifying admin:", err);
        router.replace("/");
      } finally {
        setLoading(false);
      }
    };

    verifyAdminRole();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/");
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-50 text-gray-500">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-400 border-t-transparent"></div>
          <p className="text-xs uppercase tracking-widest font-medium">Accès administration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col text-gray-800">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="w-full px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/images/logo.png"
              alt="MawaRif"
              className="h-11 w-11 rounded object-cover border border-gray-150 shadow-sm flex-shrink-0"
            />
            <div className="flex items-center gap-3">
              <h1 className="font-serif text-base tracking-widest text-[#1A3C34] font-bold uppercase">
                MAWARIF
              </h1>
              <span className="bg-red-50 text-red-700 text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded border border-red-100">
                Admin
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <span className="text-xs text-gray-500" title={adminEmail}>
              {adminEmail}
            </span>
            <button
              onClick={handleLogout}
              className="text-xs font-semibold text-gray-600 hover:text-red-600 transition-colors"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      {/* Main container */}
      <div className="w-full px-8 py-8 flex-1 flex flex-col md:flex-row gap-8">
        
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-56 flex flex-col gap-1.5 h-fit bg-white p-4 rounded-lg border border-gray-200/60 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 px-3">
            Menu de contrôle
          </p>
          <button
            onClick={() => setActiveTab("users")}
            className={`w-full text-left px-3 py-2.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
              activeTab === "users"
                ? "bg-[#1A3C34]/5 text-[#1A3C34] border-l-4 border-[#1A3C34] pl-2 rounded-l-none font-bold"
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            Utilisateurs & Accès
          </button>
          <button
            onClick={() => setActiveTab("studies")}
            className={`w-full text-left px-3 py-2.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
              activeTab === "studies"
                ? "bg-[#1A3C34]/5 text-[#1A3C34] border-l-4 border-[#1A3C34] pl-2 rounded-l-none font-bold"
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            Catalogue des Études
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`w-full text-left px-3 py-2.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
              activeTab === "analytics"
                ? "bg-[#1A3C34]/5 text-[#1A3C34] border-l-4 border-[#1A3C34] pl-2 rounded-l-none font-bold"
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            Activité & Tracking
          </button>
        </aside>

        {/* Content area */}
        <main className="flex-1">
          {activeTab === "users" && <UserCrud />}
          {activeTab === "studies" && <StudyCrud adminEmail={adminEmail} />}
          {activeTab === "analytics" && <AnalyticsDashboard />}
        </main>
      </div>
    </div>
  );
}
