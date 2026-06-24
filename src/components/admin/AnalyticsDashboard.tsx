"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface StudyAnalytic {
  id: string;
  clicks: number;
  time_spent: number;
  updated_at: string;
  studies: {
    title: string;
    category?: string;
  } | null;
}

interface ProfileRecord {
  id: string;
  email: string;
  full_name: string;
  role: string;
  last_login_at: string | null;
  total_time_on_site: number;
  user_study_analytics: StudyAnalytic[];
}

export default function AnalyticsDashboard() {
  const [records, setRecords] = useState<ProfileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          id,
          email,
          full_name,
          role,
          last_login_at,
          total_time_on_site,
          user_study_analytics (
            id,
            clicks,
            time_spent,
            updated_at,
            studies (
              title,
              category
            )
          )
        `)
        .eq("role", "user");

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

  const handleReset = async (userId: string, userEmail: string) => {
    if (!confirm(`Voulez-vous vraiment réinitialiser toutes les statistiques (temps et clics) de l'investisseur ${userEmail} ?`)) {
      return;
    }
    
    setErrorMsg("");
    try {
      const { error } = await supabase.rpc("reset_user_analytics", {
        p_user_id: userId,
      });

      if (error) throw error;
      
      // Refresh local analytics state after successful reset
      await fetchAnalytics();
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Erreur lors de la réinitialisation des statistiques.");
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds || seconds === 0) return "0 s";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes === 0) {
      return `${remainingSeconds} s`;
    }
    return `${minutes} min ${remainingSeconds} s`;
  };

  const formatDate = (isoString: string | null) => {
    if (!isoString) return "Jamais connecté";
    const d = new Date(isoString);
    return d.toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Calculate global metrics from profiles list
  const totalClicks = records.reduce((sum, p) => {
    const pClicks = p.user_study_analytics?.reduce((s, a) => s + a.clicks, 0) || 0;
    return sum + pClicks;
  }, 0);

  const totalDocsTime = records.reduce((sum, p) => {
    const pTime = p.user_study_analytics?.reduce((s, a) => s + a.time_spent, 0) || 0;
    return sum + pTime;
  }, 0);

  const totalSiteTime = records.reduce((sum, p) => sum + (p.total_time_on_site || 0), 0);
  const totalInvestors = records.length;
  const activeInvestors = records.filter(p => p.total_time_on_site > 0).length;

  const sortedProfiles = [...records].sort((a, b) => {
    const dateA = a.last_login_at ? new Date(a.last_login_at).getTime() : 0;
    const dateB = b.last_login_at ? new Date(b.last_login_at).getTime() : 0;
    return dateB - dateA;
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
        {/* Card 1: Investors count */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Investisseurs Actifs</span>
            <div className="text-2xl font-bold text-gray-800">{activeInvestors} / {totalInvestors}</div>
          </div>
          <div className="p-3 bg-[#1A3C34]/10 text-[#1A3C34] rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        </div>

        {/* Card 2: Total Clicks */}
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

        {/* Card 3: Docs reading time */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Temps sur les Documents</span>
            <div className="text-2xl font-bold text-gray-800">{formatTime(totalDocsTime)}</div>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        {/* Card 4: Global site connection time */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Temps connecté sur le site</span>
            <div className="text-2xl font-bold text-gray-800">{formatTime(totalSiteTime)}</div>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-base font-semibold text-gray-800">Activité des Investisseurs & Taux d&apos;Engagement</h3>
          <button
            onClick={fetchAnalytics}
            className="text-xs font-semibold text-[#1A3C34] hover:text-[#1A3C34]/85 transition-colors cursor-pointer"
          >
            Rafraîchir
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Investisseur</th>
                <th className="p-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Dernière Connexion</th>
                <th className="p-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Temps connecté sur le site</th>
                <th className="p-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Temps passé sur les docs</th>
                <th className="p-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Dossiers consultés</th>
                <th className="p-4 font-semibold text-gray-500 uppercase tracking-wider text-xs text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedProfiles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-400 italic">
                    Aucun investisseur enregistré.
                  </td>
                </tr>
              ) : (
                sortedProfiles.map((profile) => {
                  const isExpanded = expandedUser === profile.email;
                  const totalProfileDocsTime = profile.user_study_analytics?.reduce((sum, a) => sum + a.time_spent, 0) || 0;

                  return (
                    <tr key={profile.email} className="hover:bg-gray-50/50">
                      <td colSpan={6} className="p-0">
                        <div className="flex items-center justify-between p-4 border-b border-gray-100">
                          <div className="w-1/4">
                            <div className="font-semibold text-gray-800">{profile.full_name || "Sans nom"}</div>
                            <div className="text-xs text-gray-400 mt-0.5">{profile.email}</div>
                          </div>
                          <div className="text-xs text-gray-600 w-1/6">
                            {formatDate(profile.last_login_at)}
                          </div>
                          <div className="text-xs text-gray-800 font-semibold w-1/6">
                            {formatTime(profile.total_time_on_site)}
                          </div>
                          <div className="text-xs text-gray-800 font-semibold w-1/6">
                            {formatTime(totalProfileDocsTime)}
                          </div>
                          <div className="text-xs text-gray-600 w-1/12">
                            {profile.user_study_analytics?.length || 0} doc(s)
                          </div>
                          <div className="text-right w-1/12">
                            <button
                              onClick={() => setExpandedUser(isExpanded ? null : profile.email)}
                              className="text-xs font-semibold text-[#1A3C34] hover:bg-[#1A3C34]/5 border border-[#1A3C34]/20 py-1 px-3 rounded transition-colors cursor-pointer uppercase tracking-wider"
                            >
                              {isExpanded ? "Fermer" : "Détails"}
                            </button>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="bg-gray-50/30 p-4 border-b border-gray-100 space-y-4">
                            <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-100 shadow-xs">
                              <span className="text-xs font-semibold text-gray-500">Statistiques détaillées de {profile.full_name || profile.email}</span>
                              <button
                                onClick={() => handleReset(profile.id, profile.email)}
                                className="text-[10px] font-bold text-red-600 hover:text-white hover:bg-red-600 border border-red-200 hover:border-red-600 py-1 px-3 rounded transition-all cursor-pointer uppercase tracking-wider flex items-center gap-1.5"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Réinitialiser l&apos;activité
                              </button>
                            </div>

                            {(() => {
                              const categoryOrder = [
                                "Bienvenue au cœur de la Vision MawaRif",
                                "L'architecture de la performance",
                                "Trajectoire D'investissement, L'art de l'allocation stratégique",
                                "Gouvernance"
                              ];
                              const groupedStudies = (profile.user_study_analytics || []).reduce((sAcc, s) => {
                                const cat = s.studies?.category || "Bienvenue au cœur de la Vision MawaRif";
                                if (!sAcc[cat]) sAcc[cat] = [];
                                sAcc[cat].push(s);
                                return sAcc;
                              }, {} as Record<string, typeof profile.user_study_analytics>);

                              if (Object.keys(groupedStudies).length === 0) {
                                return (
                                  <div className="text-xs text-gray-400 italic p-2">Aucun document consulté pour le moment.</div>
                                );
                              }

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
                                            <td className="p-3 font-medium text-gray-700">{s.studies?.title || "Étude supprimée"}</td>
                                            <td className="p-3 text-right font-mono text-gray-800">{s.clicks}</td>
                                            <td className="p-3 text-right text-gray-800 font-medium">
                                              {s.time_spent > 0 ? (
                                                <div className="flex justify-end items-center gap-2">
                                                  <span>{formatTime(s.time_spent)}</span>
                                                  <div className="w-12 bg-gray-100 h-1 rounded-full overflow-hidden">
                                                    <div 
                                                      className="bg-green-500 h-full" 
                                                      style={{ width: `${Math.min((s.time_spent / 600) * 100, 100)}%` }}
                                                    />
                                                  </div>
                                                </div>
                                              ) : (
                                                "0 s"
                                              )}
                                            </td>
                                            <td className="p-3 text-right text-gray-400">
                                              {s.updated_at ? formatDate(s.updated_at) : "-"}
                                            </td>
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
