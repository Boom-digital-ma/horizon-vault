"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Study {
  id: string;
  slug: string;
  title: string;
  category?: string;
  intro_text?: string;
  content: any;
}

interface Category {
  name: string;
  intro_text: string;
  order_index?: number;
}

export default function StudyCrud() {
  const [studies, setStudies] = useState<Study[]>([]);
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states (Studies)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Bienvenue au cœur de la Vision MawaRif");
  const [introText, setIntroText] = useState("");
  const [contentJson, setContentJson] = useState("");

  // Form states (Categories)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryIntroText, setCategoryIntroText] = useState("");

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const fetchStudies = async () => {
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
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("order_index");

      if (error) throw error;
      setCategoriesList(data || []);
    } catch (err) {
      console.error(err);
      setErrorMsg("Erreur de chargement des rubriques.");
    }
  };

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchStudies(), fetchCategories()]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEditClick = (study: Study) => {
    setEditingId(study.id);
    setSlug(study.slug);
    setTitle(study.title);
    setCategory(study.category || "Bienvenue au cœur de la Vision MawaRif");
    setIntroText(study.intro_text || "");
    setContentJson(JSON.stringify(study.content, null, 2));
    setErrorMsg("");
    setSuccessMsg("");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setSlug("");
    setTitle("");
    setCategory("Bienvenue au cœur de la Vision MawaRif");
    setIntroText("");
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
          .update({ 
            slug, 
            title, 
            category, 
            intro_text: introText, 
            content: parsedContent 
          })
          .eq("id", editingId);

        if (error) throw error;
        setSuccessMsg("Étude mise à jour avec succès.");
      } else {
        // Create
        const { error } = await supabase
          .from("studies")
          .insert({ 
            slug, 
            title, 
            category, 
            intro_text: introText, 
            content: parsedContent 
          });

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

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    setErrorMsg("");
    setSuccessMsg("");

    try {
      const { error } = await supabase
        .from("categories")
        .update({ intro_text: categoryIntroText })
        .eq("name", editingCategory.name);

      if (error) throw error;

      setSuccessMsg("Présentation de la rubrique mise à jour avec succès.");
      setEditingCategory(null);
      await fetchCategories();
      // Sync studies list too
      await fetchStudies();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Erreur lors de la mise à jour de la rubrique.");
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

      {/* Form editing / creation (Studies) */}
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
                placeholder="Ex: Étude Financière & Budgétaire"
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
                placeholder="Ex: financiere"
                className="w-full text-sm px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Rubrique (Catégorie)</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                required
              >
                {categoriesList.map((cat) => (
                  <option key={cat.name} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Note / Description (Admin only)</label>
              <input
                type="text"
                value={introText}
                onChange={(e) => setIntroText(e.target.value)}
                placeholder="Ex: Document de travail"
                className="w-full text-sm px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Contenu JSON (Privé/Protégé)</label>
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

      {/* Categories Intros Management Section */}
      <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-800">Présentations Générales des Rubriques</h3>
          <p className="text-xs text-gray-400 mt-1">Modifiez les textes d&apos;introduction globaux visibles en haut de chaque rubrique du portail.</p>
        </div>
        
        {editingCategory ? (
          <form onSubmit={handleSaveCategory} className="p-6 space-y-4 bg-gray-50/30">
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase">Rubrique en cours de modification</span>
              <h4 className="font-semibold text-gray-800 text-sm mt-0.5">{editingCategory.name}</h4>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Texte de présentation (supporte les retours à la ligne)</label>
              <textarea
                value={categoryIntroText}
                onChange={(e) => setCategoryIntroText(e.target.value)}
                rows={8}
                className="w-full text-sm px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 font-light"
                required
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="py-2 px-4 bg-[#1A3C34] hover:bg-[#1A3C34]/95 text-white font-medium text-xs rounded-md transition-colors cursor-pointer"
              >
                Enregistrer la rubrique
              </button>
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium text-xs rounded-md transition-colors cursor-pointer"
              >
                Annuler
              </button>
            </div>
          </form>
        ) : (
          <div className="divide-y divide-gray-100">
            {categoriesList.map((cat) => (
              <div key={cat.name} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors">
                <div className="space-y-1.5 max-w-3xl">
                  <h4 className="font-semibold text-gray-800 text-sm">{cat.name}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed font-light line-clamp-3 whitespace-pre-line">
                    {cat.intro_text}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <button
                    onClick={() => {
                      setEditingCategory(cat);
                      setCategoryIntroText(cat.intro_text);
                    }}
                    className="text-xs font-semibold text-[#1A3C34] hover:text-[#1A3C34]/80 transition-colors border border-[#1A3C34]/20 hover:bg-[#1A3C34]/5 py-2 px-3 rounded-md cursor-pointer"
                  >
                    Modifier la présentation
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
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
            (() => {
              const categoryOrder = [
                "Bienvenue au cœur de la Vision MawaRif",
                "L'architecture de la performance",
                "Trajectoire D'investissement, L'art de l'allocation stratégique",
                "Gouvernance"
              ];
              
              const grouped = studies.reduce((acc, study) => {
                const cat = study.category || "Bienvenue au cœur de la Vision MawaRif";
                if (!acc[cat]) acc[cat] = [];
                acc[cat].push(study);
                return acc;
              }, {} as Record<string, Study[]>);

              return Object.entries(grouped)
                .sort(([catA], [catB]) => {
                  const idxA = categoryOrder.indexOf(catA);
                  const idxB = categoryOrder.indexOf(catB);
                  return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
                })
                .map(([category, items]) => (
                  <div key={category} className="bg-gray-50/20">
                    <div className="bg-gray-50/70 px-6 py-2.5 border-y border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      {category}
                    </div>
                    <div className="divide-y divide-gray-100">
                      {items.map((study) => (
                        <div key={study.id} className="p-6 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                          <div>
                            <h4 className="font-semibold text-gray-800 text-sm">{study.title}</h4>
                            <div className="flex gap-2 text-xs text-gray-400 mt-1 font-mono">
                              <span>Slug: {study.slug}</span>
                            </div>
                          </div>
                          <div className="flex gap-3">
                            <button
                              onClick={() => handleEditClick(study)}
                              className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                            >
                              Modifier
                            </button>
                            <button
                              onClick={() => handleDelete(study.id, study.title)}
                              className="text-xs font-semibold text-red-600 hover:text-red-800 transition-colors cursor-pointer"
                            >
                              Supprimer
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ));
            })()
          )}
        </div>
      </div>
    </div>
  );
}
