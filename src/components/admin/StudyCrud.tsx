"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Study {
  id: string;
  slug: string;
  title: string;
  content: any;
}

export default function StudyCrud() {
  const [studies, setStudies] = useState<Study[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [contentJson, setContentJson] = useState("");

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const fetchStudies = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("studies")
        .select("*")
        .order("title");

      if (error) throw error;
      setStudies(data || []);
    } catch (err) {
      console.error(err);
      setErrorMsg("Erreur de chargement des études.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudies();
  }, []);

  const handleEditClick = (study: Study) => {
    setEditingId(study.id);
    setSlug(study.slug);
    setTitle(study.title);
    setContentJson(JSON.stringify(study.content, null, 2));
    setErrorMsg("");
    setSuccessMsg("");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setSlug("");
    setTitle("");
    setContentJson("");
    setErrorMsg("");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    let parsedContent;
    try {
      parsedContent = JSON.parse(contentJson);
    } catch (err) {
      setErrorMsg("Format JSON invalide dans le champ contenu.");
      return;
    }

    try {
      if (editingId) {
        // Update
        const { error } = await supabase
          .from("studies")
          .update({ slug, title, content: parsedContent })
          .eq("id", editingId);

        if (error) throw error;
        setSuccessMsg("Étude mise à jour avec succès.");
      } else {
        // Create
        const { error } = await supabase
          .from("studies")
          .insert({ slug, title, content: parsedContent });

        if (error) throw error;
        setSuccessMsg("Nouvelle étude créée avec succès.");
      }

      handleCancelEdit();
      await fetchStudies();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Erreur lors de l'enregistrement.");
    }
  };

  const handleDelete = async (id: string, studyTitle: string) => {
    if (!confirm(`Voulez-vous vraiment supprimer l'étude "${studyTitle}" ?`)) {
      return;
    }

    setErrorMsg("");
    setSuccessMsg("");

    try {
      const { error } = await supabase.from("studies").delete().eq("id", id);
      if (error) throw error;

      setSuccessMsg("Étude supprimée avec succès.");
      await fetchStudies();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Erreur lors de la suppression.");
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

      {/* Form editing / creation */}
      <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm space-y-4">
        <h3 className="text-base font-semibold text-gray-800">
          {editingId ? "Modifier l'étude" : "Créer une nouvelle étude"}
        </h3>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Titre de l&apos;étude</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Étude Marketing"
                className="w-full text-sm px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Slug (Identifiant URL)</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="Ex: marketing"
                className="w-full text-sm px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Contenu JSON</label>
            <textarea
              value={contentJson}
              onChange={(e) => setContentJson(e.target.value)}
              placeholder='{\n  "description": "Exemple de structure..."\n}'
              className="w-full text-sm px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
              rows={8}
              required
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-md transition-colors"
            >
              {editingId ? "Enregistrer" : "Créer l'étude"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium text-sm rounded-md transition-colors"
              >
                Annuler
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Studies list */}
      <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-800">Catalogue des Études d&apos;Investissement</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {studies.length === 0 ? (
            <p className="p-6 text-sm text-gray-400 italic text-center">Aucune étude enregistrée.</p>
          ) : (
            studies.map((study) => (
              <div key={study.id} className="p-6 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                <div>
                  <h4 className="font-semibold text-gray-800 text-sm">{study.title}</h4>
                  <p className="text-xs text-gray-400 mt-1 font-mono">Slug: {study.slug}</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleEditClick(study)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDelete(study.id, study.title)}
                    className="text-xs font-semibold text-red-600 hover:text-red-800 transition-colors"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
