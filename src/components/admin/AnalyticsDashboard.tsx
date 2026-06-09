"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface AnalyticsRecord {
  id: string;
  clicks: number;
  time_spent: number;
  updated_at: string;
  profiles: {
    email: string;
    full_name: string;
  } | null;
  studies: {
    title: string;
  } | null;
}

export default function AnalyticsDashboard() {
  const [records, setRecords] = useState<AnalyticsRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("user_study_analytics")
        .select(`
          id,
          clicks,
          time_spent,
          updated_at,
          profiles (
            email,
            full_name
          ),
          studies (
            title
          )
        `)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setRecords((data as any) || []);
    } catch (err) {
      console.error(err);
      setErrorMsg("Erreur lors du chargement des statistiques.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const formatTime = (seconds: number) => {
    if (seconds === 0) return "0 s";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes === 0) {
      return `${remainingSeconds} s`;
    }
    return `${minutes} min ${remainingSeconds} s`;
  };

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Calculate static metrics from fetched records
  const totalClicks = records.reduce((sum, r) => sum + r.clicks, 0);
  const totalTimeSpent = records.reduce((sum, r) => sum + r.time_spent, 0);
  const uniqueInvestors = new Set(records.map(r => r.profiles?.email).filter(Boolean)).size;

  const studyCounts: { [title: string]: number } = {};
  records.forEach(r => {
    if (r.studies?.title) {
      studyCounts[r.studies.title] = (studyCounts[r.studies.title] || 0) + r.clicks;
    }
  });
  let topStudy = "-";
  let maxClicks = 0;
  Object.entries(studyCounts).forEach(([title, clicks]) => {
    if (clicks > maxClicks) {
      maxClicks = clicks;
      topStudy = title;
    }
  });

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-400 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {errorMsg && <div className="p-4 bg-red-50 text-red-700 text-sm rounded-md border border-red-100">{errorMsg}</div>}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Investisseurs Actifs</span>
            <div className="text-2xl font-bold text-gray-800">{uniqueInvestors}</div>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Total Consultations</span>
            <div className="text-2xl font-bold text-gray-800">{totalClicks}</div>
          </div>
          <div className="p-3 bg-green-50 text-green-600 rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
            </svg>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Temps de Lecture</span>
            <div className="text-2xl font-bold text-gray-800">{formatTime(totalTimeSpent)}</div>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Dossier le Plus Vu</span>
            <div className="text-sm font-bold text-gray-800 truncate max-w-[160px]" title={topStudy}>
              {topStudy}
            </div>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-base font-semibold text-gray-800">Activité des Investisseurs & Taux d&apos;Engagement</h3>
          <button
            onClick={fetchAnalytics}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
          >
            Rafraîchir
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Investisseur</th>
                <th className="p-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Étude consultée</th>
                <th className="p-4 font-semibold text-gray-500 uppercase tracking-wider text-xs text-right">Clics</th>
                <th className="p-4 font-semibold text-gray-500 uppercase tracking-wider text-xs text-right">Temps actif spent</th>
                <th className="p-4 font-semibold text-gray-500 uppercase tracking-wider text-xs text-right">Dernier accès</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-gray-400 italic">
                    Aucune statistique d&apos;activité enregistrée.
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/50">
                    <td className="p-4">
                      <div className="font-medium text-gray-800">{r.profiles?.full_name || "Sans nom"}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{r.profiles?.email || "Email inconnu"}</div>
                    </td>
                    <td className="p-4 font-medium text-gray-700">
                      {r.studies?.title || "Étude supprimée"}
                    </td>
                    <td className="p-4 text-right font-mono text-gray-800">
                      {r.clicks}
                    </td>
                    <td className="p-4 text-right font-medium text-gray-800">
                      {r.time_spent > 0 ? (
                        <div className="flex justify-end items-center gap-2">
                          <span className="text-xs">{formatTime(r.time_spent)}</span>
                          {/* Mini visual indicator bar */}
                          <div className="w-12 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className="bg-green-500 h-full" 
                              style={{ width: `${Math.min((r.time_spent / 600) * 100, 100)}%` }} // 10 minutes = 100%
                            />
                          </div>
                        </div>
                      ) : (
                        "0 s"
                      )}
                    </td>
                    <td className="p-4 text-right text-xs text-gray-400">
                      {formatDate(r.updated_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
