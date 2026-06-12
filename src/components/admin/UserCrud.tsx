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
        .select("id, title, slug, category")
        .order("title");

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

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-400 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Messages */}
      {errorMsg && <div className="p-4 bg-red-50 text-red-700 text-sm rounded-md border border-red-100">{errorMsg}</div>}
      {successMsg && <div className="p-4 bg-green-50 text-green-700 text-sm rounded-md border border-green-100">{successMsg}</div>}

      {/* Form creation */}
      <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm space-y-4">
        <h3 className="text-base font-semibold text-gray-800">Ajouter un nouvel investisseur</h3>
        <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Nom complet</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ex: Jean Dupont"
              className="w-full text-sm px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Adresse email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ex: investor@mail.com"
              className="w-full text-sm px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full text-sm px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            disabled={actionLoading}
            className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-md transition-colors disabled:opacity-50"
          >
            {actionLoading ? "Création..." : "Créer le compte"}
          </button>
        </form>
      </div>

      {/* Users table */}
      <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-800">Gestion des Utilisateurs & Autorisations</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Utilisateur</th>
                <th className="p-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Rôle</th>
                <th className="p-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Statut</th>
                <th className="p-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Accès aux Études</th>
                <th className="p-4 font-semibold text-gray-500 uppercase tracking-wider text-xs text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50/50">
                  <td className="p-4">
                    <div className="font-medium text-gray-800">{u.full_name || "Sans nom"}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{u.email}</div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                      u.role === "admin" 
                        ? "bg-purple-50 text-purple-700 border border-purple-100" 
                        : "bg-blue-50 text-blue-700 border border-blue-100"
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4">
                    {u.role === "admin" ? (
                      <span className="text-xs text-gray-400 italic">Toujours actif</span>
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
                  </td>
                  <td className="p-4">
                    {u.role === "admin" ? (
                      <span className="text-xs text-gray-400 italic">Accès total (Administrateur)</span>
                    ) : (
                      <div className="space-y-3 max-w-xl">
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
                              <div key={category} className="space-y-1">
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                  {category}
                                </div>
                                <div className="flex flex-wrap gap-x-4 gap-y-1">
                                  {items.map((s) => {
                                    const isGranted = access[u.id]?.[s.id] || false;
                                    return (
                                      <label key={s.id} className="inline-flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={isGranted}
                                          onChange={() => handleToggleAccess(u.id, s.id, isGranted)}
                                          className="rounded text-blue-600 border-gray-300 focus:ring-blue-500 h-3.5 w-3.5"
                                        />
                                        {s.title}
                                      </label>
                                    );
                                  })}
                                </div>
                              </div>
                            ));
                        })()}
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    {u.email !== "admin@mawarif.com" && (
                      <button
                        onClick={() => handleDeleteUser(u.id, u.email)}
                        disabled={actionLoading}
                        className="text-xs font-semibold text-red-600 hover:text-red-800 transition-colors disabled:opacity-50"
                      >
                        Supprimer
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
