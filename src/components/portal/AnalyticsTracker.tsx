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

  // References to keep callbacks updated without re-running effects
  const studyIdRef = useRef(studyId);

  useEffect(() => {
    studyIdRef.current = studyId;
  }, [studyId]);

  useEffect(() => {
    // Reset local counters on mount or study change
    localClicks.current = 0;
    localSeconds.current = 0;

    // 1. Time Tracker (pauses when tab is hidden)
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") {
        localSeconds.current += 1;
      }
    }, 1000);

    // 2. Click Tracker (listens on document body for user clicks)
    const handleDocumentClick = () => {
      localClicks.current += 1;
    };
    document.addEventListener("click", handleDocumentClick);

    // 3. Function to flush changes to database via atomic RPC increment
    const flushAnalytics = async () => {
      const cStudyId = studyIdRef.current;
      const clicksToIncrement = localClicks.current;
      const secondsToIncrement = localSeconds.current;

      if (clicksToIncrement === 0 && secondsToIncrement === 0) return;

      // Reset local session counters immediately to prevent double counting
      localClicks.current = 0;
      localSeconds.current = 0;

      try {
        const { error } = await supabase.rpc("increment_study_analytics", {
          p_study_id: cStudyId,
          p_clicks: clicksToIncrement,
          p_time_spent: secondsToIncrement,
        });

        if (error) {
          // If RPC fails, restore the counters so they can be retried on next flush
          localClicks.current += clicksToIncrement;
          localSeconds.current += secondsToIncrement;
          console.error("Failed to sync analytics via RPC:", error);
        }
      } catch (err) {
        localClicks.current += clicksToIncrement;
        localSeconds.current += secondsToIncrement;
        console.error("Failed to sync analytics via RPC:", err);
      }
    };

    // 4. Periodic Sync (every 15 seconds)
    const syncInterval = setInterval(() => {
      flushAnalytics();
    }, 15000);

    // 5. Cleanup (flushes immediately upon leaving the page or changing studies)
    return () => {
      clearInterval(timer);
      clearInterval(syncInterval);
      document.removeEventListener("click", handleDocumentClick);
      flushAnalytics(); // Save final state of this session
    };
  }, [studyId]); // Re-run effect only when studyId changes

  return null; // Invisible component
}
