"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/portal/Sidebar";
import StudyContent from "@/components/portal/StudyContent";
import AnalyticsTracker from "@/components/portal/AnalyticsTracker";
import ProjectOverview from "@/components/portal/ProjectOverview";

interface Study {
  id: string;
  slug: string;
  title: string;
  category?: string;
  intro_text?: string;
  pdf_path?: string;
  hasAccess?: boolean;
  order_index?: number;
}

// Minimalist, premium shimmer skeleton loader
function SkeletonLoader() {
  return (
    <div className="space-y-8 animate-pulse max-w-4xl">
      {/* Title skeleton */}
      <div className="h-8 bg-gray-200 rounded-md w-1/3"></div>
      
      {/* Paragraph skeleton */}
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded-md w-full"></div>
        <div className="h-4 bg-gray-200 rounded-md w-5/6"></div>
        <div className="h-4 bg-gray-200 rounded-md w-4/5"></div>
      </div>

      {/* Columns skeleton */}
      <div className="pt-6 border-t border-gray-100 space-y-4">
        <div className="h-5 bg-gray-200 rounded-md w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-32 bg-gray-200 rounded-xl"></div>
          <div className="h-32 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    </div>
  );
}

export default function PortalPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [studies, setStudies] = useState<Study[]>([]);
  const [activeStudySlug, setActiveStudySlug] = useState<string>("");
  const [contentLoading, setContentLoading] = useState(false);
  
  const [activeStudyContent, setActiveStudyContent] = useState<any>(null);
  const [activeStudyHasAccess, setActiveStudyHasAccess] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleSelectStudy = (slug: string) => {
    if (slug === activeStudySlug) return;
    setContentLoading(true);
    setActiveStudySlug(slug);
    setTimeout(() => {
      setContentLoading(false);
    }, 400);
  };

  const fetchStudies = async (currentUserId: string) => {
    try {
      // 1. Fetch metadata for all studies (bypass RLS via Security Definer function)
      const { data: allStudies, error: mError } = await supabase.rpc("get_all_studies_metadata");
      if (mError) throw mError;

      // 2. Fetch the access list for the current user
      const { data: accessList, error: aError } = await supabase
        .from("user_study_access")
        .select("study_id")
        .eq("user_id", currentUserId);

      if (aError) throw aError;

      const userAccessIds = new Set((accessList || []).map((item: any) => item.study_id));

      const fetchedStudies: Study[] = (allStudies || []).map((study: any) => ({
        ...study,
        hasAccess: userAccessIds.has(study.id)
      }));

      setStudies(fetchedStudies);
      
      // Update active study slug if it is not in the list anymore
      setActiveStudySlug((prevSlug) => {
        if (prevSlug === "") return "";
        const stillExists = fetchedStudies.some((s) => s.slug === prevSlug);
        return stillExists ? prevSlug : "";
      });
    } catch (err) {
      console.error("Error fetching studies:", err);
    }
  };

  // Synchronize study content based on active study slug & studies list
  useEffect(() => {
    const fetchStudyContent = async () => {
      if (!activeStudySlug) {
        setActiveStudyContent(null);
        setActiveStudyHasAccess(false);
        return;
      }

      const activeStudy = studies.find((s) => s.slug === activeStudySlug);
      if (!activeStudy) {
        setActiveStudyContent(null);
        setActiveStudyHasAccess(false);
        return;
      }

      const hasAccess = activeStudy.hasAccess || false;
      setActiveStudyHasAccess(hasAccess);

      if (hasAccess) {
        setContentLoading(true);
        try {
          const { data, error } = await supabase
            .from("studies")
            .select("content")
            .eq("slug", activeStudySlug)
            .single();

          if (error) throw error;
          setActiveStudyContent(data?.content || null);
        } catch (err) {
          console.error("Error fetching study content:", err);
          setActiveStudyContent(null);
        } finally {
          setContentLoading(false);
        }
      } else {
        setActiveStudyContent(null);
      }
    };

    fetchStudyContent();
  }, [activeStudySlug, studies]);

  // Global active session time tracking for overall site connection time
  useEffect(() => {
    if (!userId) return;

    const localSiteSeconds = { current: 0 };

    const siteTimer = setInterval(() => {
      if (document.visibilityState === "visible") {
        localSiteSeconds.current += 1;
      }
    }, 1000);

    const flushSiteTime = async () => {
      const secondsToIncrement = localSiteSeconds.current;
      if (secondsToIncrement === 0) return;

      localSiteSeconds.current = 0;
      try {
        const { error } = await supabase.rpc("increment_site_time", {
          p_time_spent: secondsToIncrement,
        });
        if (error) {
          localSiteSeconds.current += secondsToIncrement;
          console.error("Failed to sync global site time:", error);
        }
      } catch (err) {
        localSiteSeconds.current += secondsToIncrement;
        console.error("Failed to sync global site time:", err);
      }
    };

    const siteSyncInterval = setInterval(() => {
      flushSiteTime();
    }, 15000);

    return () => {
      clearInterval(siteTimer);
      clearInterval(siteSyncInterval);
      flushSiteTime();
    };
  }, [userId]);

  useEffect(() => {
    let realtimeChannel: any;

    const checkAuthAndFetchData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          router.replace("/");
          return;
        }

        setUserEmail(session.user.email || "");
        setUserId(session.user.id);

        // Fetch user profile role and active status
        const { data: profile, error: pError } = await supabase
          .from("profiles")
          .select("role, is_active")
          .eq("id", session.user.id)
          .single();

        if (pError || !profile) {
          router.replace("/");
          return;
        }

        if (profile.role === "admin") {
          router.replace("/admin");
          return;
        }

        if (profile.is_active === false) {
          await supabase.auth.signOut();
          router.replace("/");
          return;
        }

        // Fetch authorized studies and metadata
        await fetchStudies(session.user.id);

        // Set up real-time listener for access & profile changes on a single unique channel
        const channelName = `portal_realtime_${session.user.id}_${Date.now()}`;
        realtimeChannel = supabase
          .channel(channelName)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "user_study_access",
              filter: `user_id=eq.${session.user.id}`,
            },
            (payload) => {
              console.log("Realtime user_study_access event:", payload);
              fetchStudies(session.user.id);
            }
          )
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "profiles",
              filter: `id=eq.${session.user.id}`,
            },
            async (payload) => {
              console.log("Realtime profile event:", payload);
              const updatedProfile = payload.new as { is_active?: boolean };
              if (updatedProfile && updatedProfile.is_active === false) {
                // Sign out immediately
                await supabase.auth.signOut();
                router.replace("/");
              }
            }
          )
          .subscribe();

      } catch (err) {
        console.error("Error loading portal:", err);
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndFetchData();

    return () => {
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
      }
    };
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
          <p className="text-xs uppercase tracking-widest font-medium">Chargement du portail...</p>
        </div>
      </div>
    );
  }

  const activeStudy = studies.find((s) => s.slug === activeStudySlug);

  return (
    <div className="flex bg-gray-50 min-h-screen md:h-screen md:overflow-hidden text-gray-800 flex-col md:flex-row">
      {/* Mobile Sticky Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30 md:hidden flex-shrink-0">
        <div className="flex items-center gap-2">
          <img
            src="/images/logo.png"
            alt="MawaRif"
            className="h-8 w-auto object-contain"
          />
          <span className="font-serif text-sm tracking-widest text-[#1A3C34] font-bold">
            MAWARIF
          </span>
        </div>
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="p-1 rounded hover:bg-gray-100 text-[#1A3C34] cursor-pointer"
          title="Ouvrir le menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </header>

      <Sidebar
        studies={studies}
        activeStudySlug={activeStudySlug}
        onSelectStudy={(slug) => {
          handleSelectStudy(slug);
          setIsSidebarOpen(false);
        }}
        userEmail={userEmail}
        onLogout={handleLogout}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <main className="flex-1 p-6 md:p-10 overflow-y-auto h-auto md:h-screen flex flex-col justify-between">
        <div className="flex-1">
          {contentLoading ? (
            <SkeletonLoader />
          ) : activeStudySlug === "" ? (
            <ProjectOverview />
          ) : activeStudy ? (
            <>
              <StudyContent 
                study={activeStudy} 
                content={activeStudyContent}
                hasAccess={activeStudyHasAccess}
                userEmail={userEmail}
              />
              {activeStudyHasAccess && (
                <AnalyticsTracker userId={userId} studyId={activeStudy.id} />
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center text-gray-400">
              <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h2 className="text-lg font-medium text-gray-600">Dossier introuvable</h2>
              <p className="text-sm mt-1 max-w-sm">Le dossier d&apos;étude demandé n&apos;est plus disponible ou vos droits d&apos;accès ont été modifiés.</p>
            </div>
          )}
        </div>
        
        <footer className="mt-12 pt-6 border-t border-gray-200/50 flex justify-between items-center text-[10px] text-gray-400 font-medium uppercase tracking-wider flex-shrink-0">
          <span>© {new Date().getFullYear()} MawaRif</span>
          <span>
            By <a href="https://boom-digital.ma" target="_blank" rel="noopener noreferrer" className="hover:text-gray-600 transition-colors font-bold">BOOM</a>
          </span>
        </footer>
      </main>
    </div>
  );
}
