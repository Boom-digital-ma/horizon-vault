"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: "user" | "admin";
  created_at: string;
  is_active: boolean;
}

interface Study {
  id: string;
  title: string;
  slug: string;
  category?: string;
  order_index?: number;
}

interface AccessMap {
  [userId: string]: {
    [studyId: string]: boolean;
  };
}

export default function UserCrud() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [studies, setStudies] = useState<Study[]>([]);
  const [access, setAccess] = useState<AccessMap>({});
  const [loading, setLoading] = useState(true);

  // Modal and Collapse states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch profiles
      const { data: profiles, error: pError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (pError) throw pError;
      setUsers(profiles || []);

      // 2. Fetch studies
      const { data: allStudies, error: sError } = await supabase
        .from("studies")
        .select("id, title, slug, category, order_index")
        .order("order_index", { ascending: true })
        .order("title", { ascending: true });

      if (sError) throw sError;
      setStudies(allStudies || []);

      // 3. Fetch study access mapping
      const { data: allAccess, error: aError } = await supabase
        .from("user_study_access")
        .select("user_id, study_id");

      if (aError) throw aError;

      // Construct a mapped lookup object
      const lookup: AccessMap = {};
      profiles?.forEach((p) => {
        lookup[p.id] = {};
        allStudies?.forEach((s) => {
          lookup[p.id][s.id] = false;
        });
      });

      allAccess?.forEach((acc) => {
        if (lookup[acc.user_id]) {
          lookup[acc.user_id][acc.study_id] = true;
        }
      });

      setAccess(lookup);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Erreur lors du chargement des utilisateurs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setErrorMsg("Session expirée. Veuillez vous reconnecter.");
        return;
      }

      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ email, password, fullName }),
      });

      const body = await res.json();

      if (!res.ok) {
        throw new Error(body.error || "Échec de la création de l'utilisateur.");
      }

      setSuccessMsg("Utilisateur créé avec succès !");
      setEmail("");
      setPassword("");
      setFullName("");
      setIsCreateModalOpen(false);
      await fetchData(); // Refresh list
    } catch (err: any) {
      setErrorMsg(err.message || "Une erreur est survenue.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (id: string, userEmail: string) => {
    if (userEmail === "admin@mawarif.com") {
      alert("L'administrateur principal ne peut pas être supprimé.");
      return;
    }

    if (!confirm(`Voulez-vous vraiment supprimer l'utilisateur ${userEmail} ?`)) {
      return;
    }

    setActionLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setErrorMsg("Session expirée.");
        return;
      }

      const res = await fetch(`/api/admin/users?id=${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const body = await res.json();

      if (!res.ok) {
        throw new Error(body.error || "Échec de la suppression.");
      }

      setSuccessMsg("Utilisateur supprimé avec succès.");
      setExpandedUserId(null);
      await fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || "Une erreur est survenue.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleAccess = async (userId: string, studyId: string, isCurrentlyGranted: boolean) => {
    try {
      if (isCurrentlyGranted) {
        // Remove access
        const { error } = await supabase
          .from("user_study_access")
          .delete()
          .eq("user_id", userId)
          .eq("study_id", studyId);

        if (error) throw error;
      } else {
        // Grant access
        const { error } = await supabase
          .from("user_study_access")
          .insert({ user_id: userId, study_id: studyId });

        if (error) throw error;
      }

      // Update state locally
      setAccess((prev) => ({
        ...prev,
        [userId]: {
          ...prev[userId],
          [studyId]: !isCurrentlyGranted,
        },
      }));
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la mise à jour des accès.");
    }
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_active: !currentStatus })
        .eq("id", userId);

      if (error) throw error;

      // Update state locally
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_active: !currentStatus } : u))
      );
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la mise à jour du statut.");
    }
  };

  const toggleExpand = (userId: string) => {
    setExpandedUserId((prev) => (prev === userId ? null : userId));
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-400 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Messages */}
      {errorMsg && <div className="p-4 bg-red-50 text-red-700 text-sm rounded-md border border-red-100 animate-fadeIn">{errorMsg}</div>}
      {successMsg && <div className="p-4 bg-green-50 text-green-700 text-sm rounded-md border border-green-100 animate-fadeIn">{successMsg}</div>}

      {/* Action Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-lg border border-gray-200/60 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-gray-800 uppercase tracking-wider">Investisseurs & Rôles</h2>
          <p className="text-xs text-gray-400 mt-1">Créez des comptes investisseurs et configurez précisément leurs accès.</p>
        </div>
        <button
          onClick={() => {
            setErrorMsg("");
            setSuccessMsg("");
            setIsCreateModalOpen(true);
          }}
          className="py-2.5 px-5 bg-[#1A3C34] hover:bg-[#1A3C34]/95 text-white font-semibold text-xs uppercase tracking-wider rounded-md transition-all shadow-sm flex items-center gap-2 cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
          </svg>
          Ajouter un investisseur
        </button>
      </div>

      {/* Users table */}
      <div className="bg-white rounded-lg border border-gray-200/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200/60 text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                <th className="p-4">Investisseur</th>
                <th className="p-4 w-28">Rôle</th>
                <th className="p-4 w-28">Statut</th>
                <th className="p-4 w-32 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => {
                const isExpanded = expandedUserId === u.id;
                return (
                  <tr key={u.id} className="hover:bg-gray-50/30 transition-colors">
                    <td colSpan={4} className="p-0">
                      {/* Main Collapsed Row */}
                      <div className="flex items-center justify-between p-4 min-h-[72px]">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-800 text-sm">{u.full_name || "Sans nom"}</div>
                          <div className="text-xs text-gray-400 font-mono mt-0.5">{u.email}</div>
                        </div>

                        <div className="w-28 flex-shrink-0">
                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            u.role === "admin" 
                              ? "bg-purple-50 text-purple-700 border border-purple-100" 
                              : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                          }`}>
                            {u.role}
                          </span>
                        </div>

                        <div className="w-28 flex-shrink-0">
                          {u.role === "admin" ? (
                            <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider italic">Toujours actif</span>
                          ) : (
                            <button
                              onClick={() => handleToggleActive(u.id, u.is_active !== false)}
                              className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                u.is_active !== false ? "bg-green-600" : "bg-gray-200"
                              }`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                  u.is_active !== false ? "translate-x-4" : "translate-x-0"
                                }`}
                              />
                            </button>
                          )}
                        </div>

                        <div className="w-32 flex-shrink-0 text-right flex justify-end gap-2">
                          <button
                            onClick={() => toggleExpand(u.id)}
                            className={`px-3 py-1.5 rounded border text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                              isExpanded
                                ? "bg-gray-100 text-gray-700 border-gray-300"
                                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                            }`}
                          >
                            <span>Gérer</span>
                            <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Expanded Accordion Panel */}
                      {isExpanded && (
                        <div className="bg-[#FBFBF8] border-t border-b border-gray-150 p-6 space-y-6 animate-fadeIn">
                          <div className="space-y-4">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200/60 pb-2">
                              Droits d&apos;accès aux documents
                            </h4>
                            {u.role === "admin" ? (
                              <p className="text-xs text-gray-400 italic">Les administrateurs disposent d&apos;un accès complet et permanent à l&apos;intégralité des études.</p>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {(() => {
                                  const categoryOrder = [
                                    "Bienvenue au cœur de la Vision MawaRif",
                                    "L'architecture de la performance",
                                    "Trajectoire D'investissement, L'art de l'allocation stratégique",
                                    "Gouvernance"
                                  ];
                                  return Object.entries(
                                    studies.reduce((acc, s) => {
                                      const cat = s.category || "Dossier d'Investissement";
                                      if (!acc[cat]) acc[cat] = [];
                                      acc[cat].push(s);
                                      return acc;
                                    }, {} as Record<string, Study[]>)
                                  )
                                    .sort(([catA], [catB]) => {
                                      const idxA = categoryOrder.indexOf(catA);
                                      const idxB = categoryOrder.indexOf(catB);
                                      return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
                                    })
                                    .map(([category, items]) => (
                                      <div key={category} className="space-y-2 bg-white p-4 rounded-lg border border-gray-200/50 shadow-sm">
                                        <div className="text-[10px] font-bold text-[#8B5E3C] uppercase tracking-widest border-b border-gray-100 pb-1.5 mb-2">
                                          {category}
                                        </div>
                                        <div className="flex flex-col gap-2">
                                          {items
                                            .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
                                            .map((s) => {
                                            const isGranted = access[u.id]?.[s.id] || false;
                                            return (
                                              <label key={s.id} className="inline-flex items-center gap-2.5 text-xs text-gray-700 cursor-pointer hover:text-gray-900 select-none">
                                                <input
                                                  type="checkbox"
                                                  checked={isGranted}
                                                  onChange={() => handleToggleAccess(u.id, s.id, isGranted)}
                                                  className="rounded text-[#1A3C34] border-gray-300 focus:ring-[#1A3C34] h-4 w-4 cursor-pointer"
                                                />
                                                <span className="font-light">{s.title}</span>
                                              </label>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    ));
                                })()}
                              </div>
                            )}
                          </div>

                          {/* Delete Account Area */}
                          {u.email !== "admin@mawarif.com" && (
                            <div className="pt-4 border-t border-gray-200/60 flex justify-between items-center">
                              <div className="text-xs text-gray-400">
                                Supprimer définitivement ce compte investisseur et ses accès.
                              </div>
                              <button
                                onClick={() => handleDeleteUser(u.id, u.email)}
                                disabled={actionLoading}
                                className="py-1.5 px-4 border border-red-200 text-red-600 hover:bg-red-50 font-semibold text-xs uppercase tracking-wider rounded-md transition-all cursor-pointer disabled:opacity-50"
                              >
                                Supprimer le compte
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Creation Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-[100] animate-fadeIn p-4">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200/80 w-full max-w-lg overflow-hidden animate-scaleIn">
            <div className="p-6 border-b border-gray-200/60 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-gray-800 uppercase tracking-wider">Créer un nouvel investisseur</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">Créez des identifiants confidentiels pour votre partenaire.</p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Nom complet</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ex: Reda Ouaradane"
                  className="w-full text-sm px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#1A3C34] focus:border-[#1A3C34]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Adresse email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ex: reda@mawarif.com"
                  className="w-full text-sm px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#1A3C34] focus:border-[#1A3C34]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Mot de passe provisoire</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-sm px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#1A3C34] focus:border-[#1A3C34]"
                  required
                />
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold text-xs uppercase tracking-wider rounded-md transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="py-2.5 px-5 bg-[#1A3C34] hover:bg-[#1A3C34]/95 text-white font-semibold text-xs uppercase tracking-wider rounded-md transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {actionLoading ? "Création en cours..." : "Créer le compte"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
