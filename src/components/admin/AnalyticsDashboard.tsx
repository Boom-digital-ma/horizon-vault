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
    category?: string;
  } | null;
}

export default function AnalyticsDashboard() {
  const [records, setRecords] = useState<AnalyticsRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

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
            title,
            category
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

  // Group records by user email
  const userGroups = Object.values(
    records.reduce((acc, record) => {
      const email = record.profiles?.email || "Email inconnu";
      const fullName = record.profiles?.full_name || "Sans nom";
      
      if (!acc[email]) {
        acc[email] = {
          email,
          fullName,
          totalClicks: 0,
          totalTimeSpent: 0,
          lastActive: record.updated_at,
          studies: [],
        };
      }
      
      acc[email].totalClicks += record.clicks;
      acc[email].totalTimeSpent += record.time_spent;
      if (new Date(record.updated_at) > new Date(acc[email].lastActive)) {
        acc[email].lastActive = record.updated_at;
      }
      
      acc[email].studies.push({
        id: record.id,
        title: record.studies?.title || "Étude supprimée",
        clicks: record.clicks,
        timeSpent: record.time_spent,
        updatedAt: record.updated_at,
        category: record.studies?.category || "Bienvenue au cœur de la Vision MawaRif",
      });
      
      return acc;
    }, {} as Record<string, {
      email: string;
      fullName: string;
      totalClicks: number;
      totalTimeSpent: number;
      lastActive: string;
      studies: {
        id: string;
        title: string;
        clicks: number;
        timeSpent: number;
        updatedAt: string;
        category: string;
      }[];
    }>)
  ).sort((a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime());

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
          <div className="p-3 bg-[#1A3C34]/10 text-[#1A3C34] rounded-lg">
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
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 transition-colors cursor-pointer"
          >
            Rafraîchir
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Investisseur</th>
                <th className="p-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Dossiers consultés</th>
                <th className="p-4 font-semibold text-gray-500 uppercase tracking-wider text-xs text-right">Total Clics</th>
                <th className="p-4 font-semibold text-gray-500 uppercase tracking-wider text-xs text-right">Temps total</th>
                <th className="p-4 font-semibold text-gray-500 uppercase tracking-wider text-xs text-right">Dernière activité</th>
                <th className="p-4 font-semibold text-gray-500 uppercase tracking-wider text-xs text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {userGroups.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-400 italic">
                    Aucune statistique d&apos;activité enregistrée.
                  </td>
                </tr>
              ) : (
                userGroups.map((group) => {
                  const isExpanded = expandedUser === group.email;
                  return (
                    <tr key={group.email} className="hover:bg-gray-50/50">
                      <td colSpan={6} className="p-0">
                        <div className="flex items-center justify-between p-4 border-b border-gray-100">
                          <div className="w-1/3">
                            <div className="font-semibold text-gray-800">{group.fullName}</div>
                            <div className="text-xs text-gray-400 mt-0.5">{group.email}</div>
                          </div>
                          <div className="text-xs text-gray-600 w-1/6">
                            {group.studies.length} dossier(s)
                          </div>
                          <div className="text-right font-mono text-gray-800 font-medium text-xs w-1/12 pr-4">
                            {group.totalClicks}
                          </div>
                          <div className="text-right text-xs text-gray-800 font-medium w-1/6 pr-4">
                            {formatTime(group.totalTimeSpent)}
                          </div>
                          <div className="text-right text-xs text-gray-400 w-1/6 pr-4">
                            {formatDate(group.lastActive)}
                          </div>
                          <div className="text-right w-1/12">
                            <button
                              onClick={() => setExpandedUser(isExpanded ? null : group.email)}
                              className="text-xs font-semibold text-[#1A3C34] hover:bg-[#1A3C34]/5 border border-[#1A3C34]/20 py-1 px-3 rounded transition-colors cursor-pointer uppercase tracking-wider"
                            >
                              {isExpanded ? "Fermer" : "Détails"}
                            </button>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="bg-gray-50/30 p-4 border-b border-gray-100 space-y-4">
                            {(() => {
                              const categoryOrder = [
                                "Bienvenue au cœur de la Vision MawaRif",
                                "L'architecture de la performance",
                                "Trajectoire D'investissement, L'art de l'allocation stratégique",
                                "Gouvernance"
                              ];
                              const groupedStudies = group.studies.reduce((sAcc, s) => {
                                const cat = s.category || "Bienvenue au cœur de la Vision MawaRif";
                                if (!sAcc[cat]) sAcc[cat] = [];
                                sAcc[cat].push(s);
                                return sAcc;
                              }, {} as Record<string, typeof group.studies>);

                              return Object.entries(groupedStudies)
                                .sort(([catA], [catB]) => {
                                  const idxA = categoryOrder.indexOf(catA);
                                  const idxB = categoryOrder.indexOf(catB);
                                  return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
                                })
                                .map(([category, items]) => (
                                  <div key={category} className="bg-white rounded-lg border border-gray-200/50 shadow-xs overflow-hidden">
                                    <div className="bg-gray-50/50 px-4 py-2 border-b border-gray-200/60 text-[9px] font-bold text-[#8B5E3C] uppercase tracking-widest">
                                      {category}
                                    </div>
                                    <table className="w-full text-left border-collapse text-xs">
                                      <thead>
                                        <tr className="bg-gray-50/20 border-b border-gray-150">
                                          <th className="p-3 font-semibold text-gray-500 uppercase tracking-wider text-[10px] w-2/5">Étude consultée</th>
                                          <th className="p-3 font-semibold text-gray-500 uppercase tracking-wider text-[10px] text-right w-1/5">Clics</th>
                                          <th className="p-3 font-semibold text-gray-500 uppercase tracking-wider text-[10px] text-right w-1/5">Temps actif spent</th>
                                          <th className="p-3 font-semibold text-gray-500 uppercase tracking-wider text-[10px] text-right w-1/5">Dernier accès</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-100">
                                        {items.map((s) => (
                                          <tr key={s.id} className="hover:bg-gray-50/40">
                                            <td className="p-3 font-medium text-gray-700">{s.title}</td>
                                            <td className="p-3 text-right font-mono text-gray-800">{s.clicks}</td>
                                            <td className="p-3 text-right text-gray-800 font-medium">
                                              {s.timeSpent > 0 ? (
                                                <div className="flex justify-end items-center gap-2">
                                                  <span>{formatTime(s.timeSpent)}</span>
                                                  <div className="w-12 bg-gray-100 h-1 rounded-full overflow-hidden">
                                                    <div 
                                                      className="bg-green-500 h-full" 
                                                      style={{ width: `${Math.min((s.timeSpent / 600) * 100, 100)}%` }}
                                                    />
                                                  </div>
                                                </div>
                                              ) : (
                                                "0 s"
                                              )}
                                            </td>
                                            <td className="p-3 text-right text-gray-400">{formatDate(s.updatedAt)}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                ));
                            })()}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
