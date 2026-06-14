"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import PDFViewer from "../portal/PDFViewer";

interface Study {
  id: string;
  slug: string;
  title: string;
  category?: string;
  intro_text?: string;
  content: any;
  pdf_path?: string;
  order_index?: number;
}

interface Category {
  name: string;
  intro_text: string;
  order_index?: number;
}

export default function StudyCrud({ adminEmail = "admin@mawarif.com" }: { adminEmail?: string }) {
  const [studies, setStudies] = useState<Study[]>([]);
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal and preview states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewSlug, setPreviewSlug] = useState("");
  const [previewTitle, setPreviewTitle] = useState("");

  // Form states (Studies)
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Bienvenue au cœur de la Vision MawaRif");
  const [introText, setIntroText] = useState("");
  const [contentJson, setContentJson] = useState("");
  const [pdfPath, setPdfPath] = useState("");
  const [orderIndex, setOrderIndex] = useState(0);
  const [uploading, setUploading] = useState(false);

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
        .order("order_index", { ascending: true })
        .order("title", { ascending: true });

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
    setErrorMsg("");
    setSuccessMsg("");
    setEditingId(study.id);
    setSlug(study.slug);
    setTitle(study.title);
    setCategory(study.category || "Bienvenue au cœur de la Vision MawaRif");
    setIntroText(study.intro_text || "");
    setContentJson(JSON.stringify(study.content, null, 2));
    setPdfPath(study.pdf_path || "");
    setOrderIndex(study.order_index || 0);
    setIsFormModalOpen(true);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setSlug("");
    setTitle("");
    setCategory("Bienvenue au cœur de la Vision MawaRif");
    setIntroText("");
    setContentJson("");
    setPdfPath("");
    setOrderIndex(0);
    setIsFormModalOpen(false);
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const fileExt = file.name.split(".").pop();
      const safeSlug = slug.trim() || "document";
      const fileName = `etudes/${safeSlug}-${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
          .from("studies")
          .upload(fileName, file, {
            cacheControl: "3600",
            upsert: true,
          });

      if (error) throw error;

      setPdfPath(fileName);
      setSuccessMsg("Fichier PDF téléversé avec succès !");
    } catch (err: any) {
      console.error("Upload error:", err);
      setErrorMsg(err.message || "Erreur lors du téléversement.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    let parsedContent = {};
    if (contentJson.trim()) {
      try {
        parsedContent = JSON.parse(contentJson);
      } catch (err) {
        setErrorMsg("Format JSON invalide.");
        return;
      }
    }

    try {
      if (editingId) {
        const { error } = await supabase
          .from("studies")
          .update({ 
            slug, title, category, intro_text: introText, 
            content: parsedContent, pdf_path: pdfPath.trim() || null,
            order_index: Number(orderIndex)
          })
          .eq("id", editingId);
        if (error) throw error;
        setSuccessMsg("Étude mise à jour.");
      } else {
        const { error } = await supabase
          .from("studies")
          .insert({ 
            slug, title, category, intro_text: introText, 
            content: parsedContent, pdf_path: pdfPath.trim() || null,
            order_index: Number(orderIndex)
          });
        if (error) throw error;
        setSuccessMsg("Nouvelle étude créée.");
      }
      handleCancelEdit();
      await fetchStudies();
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur lors de l'enregistrement.");
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    try {
      const { error } = await supabase
        .from("categories")
        .update({ intro_text: categoryIntroText })
        .eq("name", editingCategory.name);
      if (error) throw error;
      setSuccessMsg("Présentation mise à jour.");
      setEditingCategory(null);
      await fetchCategories();
      await fetchStudies();
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur mise à jour rubrique.");
    }
  };

  const handleDelete = async (id: string, studyTitle: string) => {
    if (!confirm(`Supprimer "${studyTitle}" ?`)) return;
    try {
      const { error } = await supabase.from("studies").delete().eq("id", id);
      if (error) throw error;
      setSuccessMsg("Étude supprimée.");
      await fetchStudies();
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur lors de la suppression.");
    }
  };

  const openPreview = (study: Study) => {
    setPreviewSlug(study.slug);
    setPreviewTitle(study.title);
    setIsPreviewModalOpen(true);
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
      {errorMsg && <div className="p-4 bg-red-50 text-red-700 text-sm rounded-md border border-red-100 animate-fadeIn">{errorMsg}</div>}
      {successMsg && <div className="p-4 bg-green-50 text-green-700 text-sm rounded-md border border-green-100 animate-fadeIn">{successMsg}</div>}

      <div className="flex justify-between items-center bg-white p-6 rounded-lg border border-gray-200/60 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-gray-800 uppercase tracking-wider">Catalogue des Études</h2>
          <p className="text-xs text-gray-400 mt-1">Créez et organisez vos documents d&apos;investissement.</p>
        </div>
        <button
          onClick={() => {
            setErrorMsg("");
            setSuccessMsg("");
            setIsFormModalOpen(true);
          }}
          className="py-2.5 px-5 bg-[#1A3C34] hover:bg-[#1A3C34]/95 text-white font-semibold text-xs uppercase tracking-wider rounded-md transition-all shadow-sm flex items-center gap-2 cursor-pointer"
        >
          Créer une étude
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200/60 shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-150">
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
                .map(([category, items]) => {
                  const catInfo = categoriesList.find((c) => c.name === category);
                  return (
                    <div key={category} className="bg-gray-50/10">
                      <div className="bg-gray-50/50 px-6 py-3 border-y border-gray-200/60 flex items-center justify-between gap-4">
                        <span className="text-[10px] font-bold text-[#8B5E3C] uppercase tracking-widest">
                          {category}
                        </span>
                        {catInfo && (
                          <button
                            onClick={() => {
                              setEditingCategory(catInfo);
                              setCategoryIntroText(catInfo.intro_text);
                            }}
                            className="text-[9px] font-semibold text-[#1A3C34] hover:bg-[#1A3C34]/5 border border-[#1A3C34]/20 py-1 px-2.5 rounded transition-colors flex-shrink-0 cursor-pointer uppercase tracking-wider"
                          >
                            Modifier l&apos;introduction
                          </button>
                        )}
                      </div>
                      <div className="divide-y divide-gray-100">
                        {items
                          .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
                          .map((study) => (
                            <div key={study.id} className="p-5 flex items-center justify-between hover:bg-gray-50/30 transition-colors">
                              <div className="flex items-center gap-3">
                                <div>
                                  <h4 className="font-semibold text-gray-800 text-sm">{study.title}</h4>
                                  <div className="flex gap-2 text-[10px] text-gray-400 mt-1 font-mono">
                                    <span>Slug: {study.slug}</span>
                                  </div>
                                </div>
                                {study.pdf_path && (
                                  <span className="bg-emerald-50 text-emerald-700 text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded border border-emerald-100">
                                    PDF
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-4">
                                {study.pdf_path && (
                                  <button
                                    onClick={() => openPreview(study)}
                                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 transition-colors cursor-pointer"
                                  >
                                    Aperçu
                                  </button>
                                )}
                                <button
                                  onClick={() => handleEditClick(study)}
                                  className="text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
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
                  );
                })
            })()
          )}
        </div>
      </div>

      {isFormModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-[100] animate-fadeIn p-4">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200/80 w-full max-w-2xl overflow-hidden animate-scaleIn max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-200/60 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-gray-800 uppercase tracking-wider">
                  {editingId ? "Modifier l'étude" : "Créer une nouvelle étude"}
                </h3>
              </div>
              <button onClick={handleCancelEdit} className="text-gray-400 hover:text-gray-600 transition-colors p-1 cursor-pointer">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Titre de l&apos;étude</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Étude Financière & Budgétaire"
                    className="w-full text-sm px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#1A3C34] focus:border-[#1A3C34]"
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
                    className="w-full text-sm px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#1A3C34] focus:border-[#1A3C34]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Rubrique (Catégorie)</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-sm px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#1A3C34] focus:border-[#1A3C34] bg-white"
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
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Ordre d&apos;affichage</label>
                  <input
                    type="number"
                    value={orderIndex}
                    onChange={(e) => setOrderIndex(Number(e.target.value))}
                    placeholder="Ex: 1"
                    className="w-full text-sm px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#1A3C34] focus:border-[#1A3C34]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Note / Description (Admin only)</label>
                  <input
                    type="text"
                    value={introText}
                    onChange={(e) => setIntroText(e.target.value)}
                    placeholder="Ex: Document de travail"
                    className="w-full text-sm px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#1A3C34] focus:border-[#1A3C34]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end border-t border-gray-100 pt-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                    Téléverser un fichier PDF
                  </label>
                  <input
                    type="file"
                    disabled={uploading}
                    accept=".pdf"
                    onChange={handlePdfUpload}
                    className="w-full text-xs file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 border border-gray-200 rounded-md p-1 focus:outline-none"
                  />
                  {uploading && <p className="text-[10px] text-emerald-600 mt-1 animate-pulse">Téléversement en cours...</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                    Ou saisir le chemin / URL direct
                  </label>
                  <input
                    type="text"
                    value={pdfPath}
                    onChange={(e) => setPdfPath(e.target.value)}
                    placeholder="Ex: etudes/financiere.pdf"
                    className="w-full text-sm px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#1A3C34] focus:border-[#1A3C34]"
                  />
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Contenu JSON (Optionnel si PDF lié)</label>
                <textarea
                  value={contentJson}
                  onChange={(e) => setContentJson(e.target.value)}
                  placeholder='{\n  "description": "Exemple de structure..."\n}'
                  className="w-full text-sm px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#1A3C34] focus:border-[#1A3C34] font-mono"
                  rows={6}
                  required={!pdfPath}
                />
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold text-xs uppercase tracking-wider rounded-md transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 bg-[#1A3C34] hover:bg-[#1A3C34]/95 text-white font-semibold text-xs uppercase tracking-wider rounded-md transition-colors shadow-sm cursor-pointer"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingCategory && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-[100] animate-fadeIn p-4">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200/80 w-full max-w-2xl p-6">
            <h3 className="font-bold text-gray-800 mb-4">{editingCategory.name}</h3>
            <textarea value={categoryIntroText} onChange={(e) => setCategoryIntroText(e.target.value)} rows={8} className="w-full border rounded-md p-2 mb-4" />
            <div className="flex justify-end gap-3">
              <button onClick={() => setEditingCategory(null)} className="px-4 py-2 bg-gray-100 rounded-md">Annuler</button>
              <button onClick={handleSaveCategory} className="px-4 py-2 bg-[#1A3C34] text-white rounded-md">Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {isPreviewModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h3 className="font-bold">{previewTitle}</h3>
              <button onClick={() => setIsPreviewModalOpen(false)} className="text-gray-500">Fermer</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
              <PDFViewer slug={previewSlug} userEmail={adminEmail} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
