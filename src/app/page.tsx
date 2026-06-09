"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Carousel from "@/components/portal/Carousel";
import LoginModal from "@/components/portal/LoginModal";

export default function Home() {
  const router = useRouter();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    // Check if user is already logged in and redirect accordingly
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // Fetch user profile to check role and status
          const { data: profile } = await supabase
            .from("profiles")
            .select("role, is_active")
            .eq("id", session.user.id)
            .single();

          if (profile?.is_active === false && profile?.role !== "admin") {
            await supabase.auth.signOut();
            setCheckingAuth(false);
            return;
          }

          if (profile?.role === "admin") {
            router.replace("/admin");
          } else {
            router.replace("/portal");
          }
        } else {
          setCheckingAuth(false);
        }
      } catch (err) {
        console.error(err);
        setCheckingAuth(false);
      }
    };

    checkUser();
  }, [router]);

  const handleLoginSuccess = async () => {
    // Re-trigger checking auth to redirect user to portal/admin
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, is_active")
        .eq("id", session.user.id)
        .single();

      if (profile?.is_active === false && profile?.role !== "admin") {
        await supabase.auth.signOut();
        return;
      }

      if (profile?.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/portal");
      }
    }
  };

  if (checkingAuth) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#FBFBF8] text-[#1A3C34]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1A3C34] border-t-transparent"></div>
          <p className="font-light tracking-widest text-sm uppercase">MawaRif</p>
        </div>
      </div>
    );
  }

  return (
    <div className="theme-mawarif">
      <nav>
        <a href="#" className="logo flex items-center justify-center">
          <img
            src="/images/logo.png"
            alt="MAWARIF"
            className="h-32 w-auto object-contain"
            style={{ filter: "brightness(0) invert(1)" }}
          />
        </a>
      </nav>

      <Carousel />

      <section className="manifesto-section">
        <img
          src="/images/logo.png"
          alt="MAWARIF"
          className="mx-auto block h-48 w-auto object-contain mb-6"
        />
        <div className="manifesto-subtitle">Une ascension immobile vers le silence.</div>
        <p className="manifesto-text">
          Là où la canopée séculaire du Rif frôle le sacré, notre sanctuaire se déploie, suspendu entre terre et ciel.
        </p>
        <p className="manifesto-text">
          Ici, l’élégance se fait murmure et l’architecture s’efface pour laisser place à la contemplation.
        </p>
        <p className="manifesto-text">
          Plus qu’un refuge d&apos;ultra-luxe, une retraite souveraine. Le lieu unique où l&apos;âme trouve sa paix intérieure.
        </p>
      </section>

      <div className="transition-footer">
        <div className="flex flex-col items-center gap-6">
          <a className="btn-confidence" onClick={() => setIsLoginOpen(true)}>
            Entrer dans la confidence
          </a>
          <a
            href="mailto:invest@mawarif.com"
            className="text-[10px] tracking-widest uppercase text-[#1A3C34]/50 hover:text-[#1A3C34] transition-colors font-semibold mt-2"
          >
            invest@mawarif.com
          </a>
        </div>
      </div>

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
