"use client";

import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

interface AnalyticsTrackerProps {
  userId: string;
  studyId: string;
}

export default function AnalyticsTracker({ userId, studyId }: AnalyticsTrackerProps) {
  const localClicks = useRef(0);
  const localSeconds = useRef(0);

  const baseClicks = useRef(0);
  const baseSeconds = useRef(0);

  // References to keep callbacks updated without re-running effects
  const userIdRef = useRef(userId);
  const studyIdRef = useRef(studyId);

  useEffect(() => {
    userIdRef.current = userId;
    studyIdRef.current = studyId;
  }, [userId, studyId]);

  useEffect(() => {
    // 1. Fetch current database totals on mount / study change
    const fetchBaseAnalytics = async () => {
      localClicks.current = 0;
      localSeconds.current = 0;
      baseClicks.current = 0;
      baseSeconds.current = 0;

      try {
        const { data, error } = await supabase
          .from("user_study_analytics")
          .select("clicks, time_spent")
          .eq("user_id", userId)
          .eq("study_id", studyId)
          .single();

        if (data) {
          baseClicks.current = data.clicks;
          baseSeconds.current = data.time_spent;
        }
      } catch (err) {
        console.error("Error fetching analytics baseline:", err);
      }
    };

    fetchBaseAnalytics();

    // 2. Time Tracker (pauses when tab is hidden or blur)
    const timer = setInterval(() => {
      if (document.visibilityState === "visible" && document.hasFocus()) {
        localSeconds.current += 1;
      }
    }, 1000);

    // 3. Click Tracker (listens on document body for user clicks)
    const handleDocumentClick = () => {
      localClicks.current += 1;
    };
    document.addEventListener("click", handleDocumentClick);

    // 4. Function to flush changes to database
    const flushAnalytics = async () => {
      const cUserId = userIdRef.current;
      const cStudyId = studyIdRef.current;
      const clicksToSend = baseClicks.current + localClicks.current;
      const timeToSend = baseSeconds.current + localSeconds.current;

      if (localClicks.current === 0 && localSeconds.current === 0) return;

      try {
        await supabase.from("user_study_analytics").upsert(
          {
            user_id: cUserId,
            study_id: cStudyId,
            clicks: clicksToSend,
            time_spent: timeToSend,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,study_id" }
        );
      } catch (err) {
        console.error("Failed to sync analytics:", err);
      }
    };

    // 5. Periodic Sync (every 15 seconds)
    const syncInterval = setInterval(() => {
      flushAnalytics();
    }, 15000);

    // 6. Cleanup (flushes immediately upon leaving the page or changing studies)
    return () => {
      clearInterval(timer);
      clearInterval(syncInterval);
      document.removeEventListener("click", handleDocumentClick);
      flushAnalytics(); // Save final state of this session
    };
  }, [userId, studyId]);

  return null; // Invisible component
}
