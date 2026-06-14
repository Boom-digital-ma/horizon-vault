"use client";

import { useState } from "react";
import PDFViewer from "./PDFViewer";

interface StudyContentProps {
  study: {
    slug: string;
    title: string;
    category?: string;
    intro_text?: string;
    pdf_path?: string;
  };
  content: any;
  hasAccess: boolean;
  userEmail?: string;
}

export default function StudyContent({ study, content, hasAccess, userEmail = "investor@mawarif.com" }: StudyContentProps) {
  const { slug, title, category, intro_text, pdf_path } = study;

  // React state for sub-navigation tabs within complex studies
  const [capexTab, setCapexTab] = useState<string>("synthesis");
  const [capexLot, setCapexLot] = useState<string>("a");
  const [techTab, setTechTab] = useState<string>("implantation");

  // Split category intro text into a main title and body paragraphs
  const getParsedIntro = () => {
    if (!intro_text) return { title: "", paragraphs: [] };
    const lines = intro_text.split("\n").map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return { title: "", paragraphs: [] };
    
    // Check if the first line is a title hook
    const firstLine = lines[0];
    const hasColon = firstLine.includes(":");
    // If it's a short/sentence line, treat it as the title
    if (hasColon || firstLine.length < 100) {
      return {
        title: firstLine,
        paragraphs: lines.slice(1)
      };
    }
    return {
      title: "",
      paragraphs: lines
    };
  };

  const { title: introTitle, paragraphs: introParagraphs } = getParsedIntro();

  // Render study specific details (only when hasAccess is true)
  const renderDetails = () => {
    if (!content) return null;

    // Study: ÉTUDE FINANCIÈRE / CAPEX
    if (slug === "financiere") {
      const kpis = content.kpis || [];
      const capexTable = content.capex_table || [];
      const intro = content.intro || {};
      const sections = content.sections || {};
      const contractualisation = content.contractualisation || {};

      // If it's the V2 payload with full text details, render the custom tabbed view
      if (intro.text) {
        return (
          <div className="space-y-8 animate-fadeIn text-gray-800">
            {/* KPIs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {kpis.map((kpi: any, idx: number) => (
                <div key={idx} className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">{kpi.label}</p>
                  <p className="text-2xl font-bold text-[#1A3C34] mt-2">{kpi.value}</p>
                </div>
              ))}
            </div>

            {/* Main Tabs Navigation */}
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setCapexTab("synthesis")}
                className={`py-3 px-6 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
                  capexTab === "synthesis"
                    ? "border-[#1A3C34] text-[#1A3C34]"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                1. Synthèse Financière
              </button>
              <button
                onClick={() => setCapexTab("lots")}
                className={`py-3 px-6 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
                  capexTab === "lots"
                    ? "border-[#1A3C34] text-[#1A3C34]"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                2. Détail des Lots (A-F)
              </button>
              <button
                onClick={() => setCapexTab("contract")}
                className={`py-3 px-6 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
                  capexTab === "contract"
                    ? "border-[#1A3C34] text-[#1A3C34]"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                3. Recommandations d&apos;Achat
              </button>
            </div>

            {/* TAB CONTENT: SYNTHESIS */}
            {capexTab === "synthesis" && (
              <div className="space-y-8 animate-fadeIn">
                {/* Introduction texts */}
                <div className="bg-[#FBFBF8] p-6 rounded-lg border border-gray-150 shadow-sm space-y-4">
                  <p className="text-xs md:text-sm text-gray-600 leading-relaxed font-light">{intro.text}</p>
                  <p className="text-xs text-gray-500 leading-relaxed font-light pl-4 border-l-2 border-[#8B5E3C]">{intro.legal_text}</p>
                  <p className="text-[11px] text-gray-400 leading-relaxed italic">{intro.posture_text}</p>
                </div>

                {/* Main Table */}
                <div className="bg-white rounded-lg border border-gray-200/60 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-gray-200/60">
                    <h3 className="text-base font-semibold text-[#1A3C34] font-headings">Matrice de Synthèse Budgétaire</h3>
                    <p className="text-xs text-gray-400 mt-1">Comparatif d&apos;arbitrage entre les allocations initiales et estimées réelles.</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200/60">
                          <th className="p-4 font-semibold text-gray-500 uppercase tracking-wider text-[10px] w-48">Rubrique Budgétaire</th>
                          <th className="p-4 font-semibold text-gray-500 uppercase tracking-wider text-[10px] text-right w-24">Initial (MAD)</th>
                          <th className="p-4 font-semibold text-gray-500 uppercase tracking-wider text-[10px] text-right w-24">Estimé Réel (MAD)</th>
                          <th className="p-4 font-semibold text-gray-500 uppercase tracking-wider text-[10px] text-right w-24">Écart (MAD)</th>
                          <th className="p-4 font-semibold text-gray-500 uppercase tracking-wider text-[10px] w-64">Stratégie d&apos;Optimisation & Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {capexTable.map((row: any, idx: number) => (
                          <tr key={idx} className="hover:bg-gray-50/50">
                            <td className="p-4 font-semibold text-gray-900">{row.category}</td>
                            <td className="p-4 text-right font-mono text-gray-700">{row.budget.toLocaleString("fr-FR")}</td>
                            <td className="p-4 text-right font-mono text-gray-900 font-medium">{row.cost_est.toLocaleString("fr-FR")}</td>
                            <td className={`p-4 text-right font-mono font-semibold ${row.diff >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                              {row.diff >= 0 ? "+" : ""}{row.diff.toLocaleString("fr-FR")}
                            </td>
                            <td className="p-4 text-gray-600 leading-relaxed font-light text-[11px]">{row.opt}</td>
                          </tr>
                        ))}
                        {/* Summary Row */}
                        <tr className="bg-gray-50 font-bold border-t border-gray-200/60 text-gray-900">
                          <td className="p-4">TOTAL CAPEX</td>
                          <td className="p-4 text-right font-mono">{(80500000).toLocaleString("fr-FR")}</td>
                          <td className="p-4 text-right font-mono text-[#1A3C34]">{(66655000).toLocaleString("fr-FR")}</td>
                          <td className="p-4 text-right font-mono text-emerald-600">+{(13845000).toLocaleString("fr-FR")}</td>
                          <td className="p-4 text-[#1A3C34] font-headings text-[11px] font-normal leading-relaxed">
                            Excédent net global de 13 845 000 MAD (~17,2% du CAPEX), absorbant le déficit réglementaire et offrant un matelas d&apos;optimisation exceptionnel.
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: LOTS */}
            {capexTab === "lots" && (
              <div className="space-y-6 animate-fadeIn">
                {/* Secondary Pill Navigation */}
                <div className="flex flex-wrap gap-2 bg-gray-50 p-1.5 rounded-lg border border-gray-150">
                  {["a", "b", "c", "d", "e", "f"].map((lot) => (
                    <button
                      key={lot}
                      onClick={() => setCapexLot(lot)}
                      className={`px-3 py-1.5 rounded text-[11px] font-semibold uppercase tracking-wider transition-all ${
                        capexLot === lot
                          ? "bg-[#1A3C34] text-white shadow-sm"
                          : "text-gray-500 hover:text-gray-800"
                      }`}
                    >
                      Lot {lot.toUpperCase()} : {
                        lot === "a" ? "Génie Civil" :
                        lot === "b" ? "Hébergements" :
                        lot === "c" ? "Logistique" :
                        lot === "d" ? "Bien-être & Spa" :
                        lot === "e" ? "Conception" : "Marketing & BFR"
                      }
                    </button>
                  ))}
                </div>

                {/* Sub tab details */}
                {capexLot === "a" && sections.genie_civil && (
                  <div className="bg-white p-6 rounded-lg border border-gray-200/60 shadow-sm space-y-6 animate-fadeIn">
                    <div className="flex flex-wrap justify-between items-center border-b border-gray-100 pb-3 gap-2">
                      <h4 className="text-sm font-semibold text-[#1A3C34]">Lot A : Génie Civil, Fondations Réversibles et Passerelles</h4>
                      <div className="flex gap-4 text-xs font-mono">
                        <span>Budget: <strong className="text-gray-500">{sections.genie_civil.budget}</strong></span>
                        <span>Estimé: <strong className="text-[#1A3C34]">{sections.genie_civil.real}</strong></span>
                        <span>Écart: <strong className="text-emerald-600">{sections.genie_civil.diff}</strong></span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed font-light">{sections.genie_civil.desc}</p>
                    
                    <div className="bg-[#8B5E3C]/5 border-l-4 border-l-[#8B5E3C] p-4 rounded-r text-xs leading-relaxed text-gray-700">
                      {sections.genie_civil.comparison}
                    </div>

                    <div className="space-y-3">
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Matrice de Sourcing Bois (Lames de passerelles)</span>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-[11px] border border-gray-100">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                              <th className="p-3 font-semibold text-gray-600">Essence</th>
                              <th className="p-3 font-semibold text-gray-600">Provenance</th>
                              <th className="p-3 font-semibold text-gray-600">Spécifications Techniques</th>
                              <th className="p-3 font-semibold text-gray-600 text-right">Lames (MAD/m²)</th>
                              <th className="p-3 font-semibold text-gray-600 text-right">Posé (MAD/m²)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {sections.genie_civil.wood_table?.map((wood: any, idx: number) => (
                              <tr key={idx} className="hover:bg-gray-50/50">
                                <td className="p-3 font-semibold text-gray-800">{wood.essence}</td>
                                <td className="p-3 text-gray-500">{wood.origin}</td>
                                <td className="p-3 text-gray-500 font-light leading-normal">{wood.specs}</td>
                                <td className="p-3 text-right font-mono">{wood.price_m2}</td>
                                <td className="p-3 text-right font-mono font-medium">{wood.price_pilotis}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100 text-xs leading-relaxed font-light text-gray-600">
                      <div>
                        <span className="text-[9px] font-bold text-[#1A3C34] uppercase tracking-widest block mb-1">Calcul d&apos;Emprise & Maillage Pieux</span>
                        <p className="whitespace-pre-line">{sections.genie_civil.calculation}</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-[#1A3C34] uppercase tracking-widest block mb-1">Passerelles & Aménagements Globaux</span>
                        <p>{sections.genie_civil.walkways}</p>
                      </div>
                    </div>
                  </div>
                )}

                {capexLot === "b" && sections.hebergements && (
                  <div className="bg-white p-6 rounded-lg border border-gray-200/60 shadow-sm space-y-6 animate-fadeIn">
                    <div className="flex flex-wrap justify-between items-center border-b border-gray-100 pb-3 gap-2">
                      <h4 className="text-sm font-semibold text-[#1A3C34]">Lot B : Hébergements Prestige (Superstructures Nues)</h4>
                      <div className="flex gap-4 text-xs font-mono">
                        <span>Budget: <strong className="text-gray-500">{sections.hebergements.budget}</strong></span>
                        <span>Estimé: <strong className="text-[#1A3C34]">{sections.hebergements.real}</strong></span>
                        <span>Écart: <strong className="text-emerald-600">{sections.hebergements.diff}</strong></span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed font-light">{sections.hebergements.desc}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gray-50 p-4 rounded border border-gray-100">
                        <span className="text-[9px] font-bold text-[#8B5E3C] uppercase tracking-widest block mb-1">25 Bungalows Victoria (A-Frame)</span>
                        <p className="text-xs text-gray-600 font-light leading-relaxed">{sections.hebergements.bungalows_victoria}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded border border-gray-100">
                        <span className="text-[9px] font-bold text-[#8B5E3C] uppercase tracking-widest block mb-1">15 Grands Bungalows Horizon (U-Shape)</span>
                        <p className="text-xs text-gray-600 font-light leading-relaxed">{sections.hebergements.bungalows_horizon}</p>
                      </div>
                    </div>

                    <div className="text-xs text-gray-600 font-light leading-relaxed pt-2">
                      {sections.hebergements.pricing_note}
                    </div>

                    <div className="bg-amber-50/40 border-l-4 border-l-[#8B5E3C] p-4 rounded-r text-xs leading-relaxed text-gray-700">
                      <h5 className="font-bold text-[#8B5E3C] uppercase tracking-wider text-[10px] mb-1">Note Spécifique de Sourcing Intérieur (FF&E)</h5>
                      {sections.hebergements.sourcing_note}
                    </div>
                  </div>
                )}

                {capexLot === "c" && sections.logistique && (
                  <div className="bg-white p-6 rounded-lg border border-gray-200/60 shadow-sm space-y-6 animate-fadeIn">
                    <div className="flex flex-wrap justify-between items-center border-b border-gray-100 pb-3 gap-2">
                      <h4 className="text-sm font-semibold text-[#1A3C34]">Lot C : Logistique, Sécurité et Flotte d&apos;Exploitation</h4>
                      <div className="flex gap-4 text-xs font-mono">
                        <span>Budget: <strong className="text-gray-500">{sections.logistique.budget}</strong></span>
                        <span>Estimé: <strong className="text-[#1A3C34]">{sections.logistique.real}</strong></span>
                        <span>Écart: <strong className="text-emerald-600">{sections.logistique.diff}</strong></span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed font-light mb-4">{sections.logistique.desc}</p>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-[11px] border border-gray-100">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="p-3 font-semibold text-gray-600">Équipement / Prestation</th>
                            <th className="p-3 font-semibold text-gray-600">Spécifications Techniques</th>
                            <th className="p-3 font-semibold text-gray-600 text-right">Prix Unitaire</th>
                            <th className="p-3 font-semibold text-gray-600 text-right">Budget Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {sections.logistique.table?.map((item: any, idx: number) => (
                            <tr key={idx} className="hover:bg-gray-50/50">
                              <td className="p-3 font-semibold text-gray-800">{item.item}</td>
                              <td className="p-3 text-gray-500 font-light leading-relaxed">{item.specs}</td>
                              <td className="p-3 text-right font-mono text-gray-600">{item.unit_price}</td>
                              <td className="p-3 text-right font-mono font-medium text-gray-800">{item.total_price}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {capexLot === "d" && sections.bien_etre && (
                  <div className="bg-white p-6 rounded-lg border border-gray-200/60 shadow-sm space-y-6 animate-fadeIn">
                    <div className="flex flex-wrap justify-between items-center border-b border-gray-100 pb-3 gap-2">
                      <h4 className="text-sm font-semibold text-[#1A3C34]">Lot D : Équipements de Bien-être, Spa, Hammam et Lac</h4>
                      <div className="flex gap-4 text-xs font-mono">
                        <span>Budget: <strong className="text-gray-500">{sections.bien_etre.budget}</strong></span>
                        <span>Estimé: <strong className="text-[#1A3C34]">{sections.bien_etre.real}</strong></span>
                        <span>Écart: <strong className="text-emerald-600">{sections.bien_etre.diff}</strong></span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed font-light">{sections.bien_etre.desc}</p>
                    
                    <div className="space-y-4 text-xs leading-relaxed font-light text-gray-600">
                      <div className="bg-gray-50 p-4 rounded border border-gray-100 space-y-1">
                        <span className="text-[9px] font-bold text-[#1A3C34] uppercase tracking-widest block">Hammam Éco-Thermique</span>
                        <p>{sections.bien_etre.hammam}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded border border-gray-100 space-y-1">
                        <span className="text-[9px] font-bold text-[#1A3C34] uppercase tracking-widest block">Pôle Bio-Hacking</span>
                        <p>{sections.bien_etre.bio_hacking}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded border border-gray-100 space-y-1">
                        <span className="text-[9px] font-bold text-[#1A3C34] uppercase tracking-widest block">Lac Éco-Réservoir</span>
                        <p>{sections.bien_etre.lac}</p>
                      </div>
                    </div>
                  </div>
                )}

                {capexLot === "e" && sections.conception && (
                  <div className="bg-white p-6 rounded-lg border border-gray-200/60 shadow-sm space-y-6 animate-fadeIn">
                    <div className="flex flex-wrap justify-between items-center border-b border-gray-100 pb-3 gap-2">
                      <h4 className="text-sm font-semibold text-[#1A3C34]">Lot E : Conception, Honoraires, Juridique et Administratif</h4>
                      <div className="flex gap-4 text-xs font-mono">
                        <span>Budget: <strong className="text-gray-500">{sections.conception.budget}</strong></span>
                        <span>Estimé: <strong className="text-[#1A3C34]">{sections.conception.real}</strong></span>
                        <span>Écart: <strong className="text-red-600">{sections.conception.diff}</strong></span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed font-light">{sections.conception.desc}</p>
                    
                    <div className="space-y-3">
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Ventilation des Postes de Maîtrise d&apos;Œuvre</span>
                      <ul className="space-y-2.5 text-xs text-gray-600 leading-relaxed font-light pl-4 list-disc">
                        {sections.conception.details?.map((detail: string, idx: number) => (
                          <li key={idx}>{detail}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {capexLot === "f" && sections.marketing && (
                  <div className="bg-white p-6 rounded-lg border border-gray-200/60 shadow-sm space-y-6 animate-fadeIn">
                    <div className="flex flex-wrap justify-between items-center border-b border-gray-100 pb-3 gap-2">
                      <h4 className="text-sm font-semibold text-[#1A3C34]">Lot F : Marketing de Lancement et Besoin en Fonds de Roulement (BFR)</h4>
                      <div className="flex gap-4 text-xs font-mono">
                        <span>Budget: <strong className="text-gray-500">{sections.marketing.budget}</strong></span>
                        <span>Estimé: <strong className="text-[#1A3C34]">{sections.marketing.real}</strong></span>
                        <span>Écart: <strong className="text-emerald-600">{sections.marketing.diff}</strong></span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed font-light">{sections.marketing.desc}</p>
                    
                    <div className="space-y-3">
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Stratégie d&apos;Optimisation du BFR & Acomptes</span>
                      <ul className="space-y-2.5 text-xs text-gray-600 leading-relaxed font-light pl-4 list-disc">
                        {sections.marketing.details?.map((detail: string, idx: number) => (
                          <li key={idx}>{detail}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: CONTRACTUALISATION */}
            {capexTab === "contract" && (
              <div className="space-y-8 animate-fadeIn text-xs leading-relaxed font-light text-gray-600">
                {/* Section 1: Allotissement */}
                <div className="bg-white p-6 rounded-lg border border-gray-200/60 shadow-sm space-y-3">
                  <h4 className="text-sm font-semibold text-[#1A3C34] font-headings">{contractualisation.allotissement?.title}</h4>
                  <p>{contractualisation.allotissement?.text}</p>
                </div>

                {/* Section 2: Facturation Timeline */}
                <div className="bg-white p-6 rounded-lg border border-gray-200/60 shadow-sm space-y-6">
                  <div>
                    <h4 className="text-sm font-semibold text-[#1A3C34] font-headings">{contractualisation.facturation?.title}</h4>
                    <p className="mt-1">{contractualisation.facturation?.text}</p>
                  </div>
                  
                  {/* Vertical Timeline */}
                  <div className="relative pl-6 border-l-2 border-gray-150 space-y-8 mt-4 ml-2">
                    {contractualisation.facturation?.steps?.map((step: any, idx: number) => (
                      <div key={idx} className="relative">
                        <div className="absolute -left-[32px] top-1 w-4 h-4 rounded-full bg-[#8B5E3C] text-white flex items-center justify-center font-bold text-[8px]">
                          {idx + 1}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-[#8B5E3C] uppercase tracking-wider">{step.percent} du marché</span>
                          <p className="text-xs text-gray-600 mt-1 leading-relaxed font-light">{step.trigger}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 3: Risques */}
                <div className="bg-white p-6 rounded-lg border border-gray-200/60 shadow-sm border-l-4 border-l-red-500/50 space-y-3">
                  <h4 className="text-sm font-semibold text-gray-800 font-headings">{contractualisation.risques?.title}</h4>
                  <p>{contractualisation.risques?.text}</p>
                </div>
              </div>
            )}
          </div>
        );
      }

      // V1 Fallback CAPEX rendering
      const totalBudget = capexTable.reduce((sum: number, row: any) => sum + (Number(row.budget) || 0), 0);
      return (
        <div className="space-y-8 animate-fadeIn">
          {/* KPIs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {kpis.map((kpi: any, idx: number) => (
              <div key={idx} className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{kpi.label}</p>
                <p className="text-2xl font-bold text-[#1A3C34] mt-2">{kpi.value}</p>
              </div>
            ))}
          </div>

          {/* CAPEX Table */}
          <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-800 font-headings">Ventilation du Budget d&apos;Investissement (CAPEX)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="p-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Poste de Dépense</th>
                    <th className="p-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Spécifications Clés</th>
                    <th className="p-4 font-semibold text-gray-500 uppercase tracking-wider text-xs text-right">Budget (MAD)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {capexTable.map((row: any, idx: number) => (
                    <tr key={idx} className="hover:bg-gray-50/50">
                      <td className="p-4 font-medium text-gray-800">{row.category}</td>
                      <td className="p-4 text-gray-500">{row.specs}</td>
                      <td className="p-4 text-right font-mono text-gray-800">
                        {row.budget.toLocaleString("fr-FR")}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 font-semibold">
                    <td className="p-4 text-gray-800">TOTAL</td>
                    <td className="p-4"></td>
                    <td className="p-4 text-right font-mono text-gray-800">
                      {totalBudget.toLocaleString("fr-FR")}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    // Study: BENCHMARK
    if (slug === "benchmark") {
      const benchmarkMaroc = content.benchmark_maroc || [];
      const wellnessPoles = content.wellness_poles || {};
      const buyout = content.privatisation_buyout || {};
      const benchmarkInt = content.benchmark_international || [];

      return (
        <div className="space-y-8 animate-fadeIn text-gray-800">
          {/* Section A: Benchmark Maroc */}
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-[#1A3C34] font-headings">A. Benchmark Maroc : L&apos;Échiquier de l&apos;Ultra-Luxe</h2>
              <p className="text-xs text-gray-400 mt-1">Analyse comparative face aux acteurs clés de l&apos;ultra-luxe et du Quiet Luxury au Maroc.</p>
            </div>

            {/* Table Concurrence */}
            <div className="bg-white rounded-lg border border-gray-200/60 shadow-sm overflow-hidden">
              <div className="p-4 bg-gray-50/50 border-b border-gray-200/60">
                <h3 className="text-sm font-semibold text-gray-700 font-headings">1. Cartographie de la Concurrence Haute Contribution</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200/60">
                      <th className="p-4 font-semibold text-gray-500 uppercase tracking-wider text-[10px]">Établissement</th>
                      <th className="p-4 font-semibold text-gray-500 uppercase tracking-wider text-[10px]">Localisation</th>
                      <th className="p-4 font-semibold text-gray-500 uppercase tracking-wider text-[10px]">Capacité</th>
                      <th className="p-4 font-semibold text-gray-500 uppercase tracking-wider text-[10px]">TJM Moyen</th>
                      <th className="p-4 font-semibold text-gray-500 uppercase tracking-wider text-[10px]">Positionnement de Marque & Services Clés</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {benchmarkMaroc.map((row: any, idx: number) => (
                      <tr 
                        key={idx} 
                        className={`hover:bg-gray-50/50 transition-colors ${
                          row.name.includes("MawaRif") ? "bg-[#1A3C34]/5 font-medium" : ""
                        }`}
                      >
                        <td className="p-4 text-gray-900 font-semibold">{row.name}</td>
                        <td className="p-4 text-gray-500">{row.location}</td>
                        <td className="p-4 text-gray-500">{row.capacity}</td>
                        <td className="p-4 text-gray-800 font-mono">{row.tjm}</td>
                        <td className="p-4 text-gray-600 leading-relaxed font-light">{row.positioning}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Wellness Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 font-headings">2. Positionnement Wellness : L&apos;Approche Bioculturelle</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm flex flex-col justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-800 text-sm">{wellnessPoles.clinique_longevite?.title}</h4>
                    <p className="text-[10px] text-gray-400 mt-0.5">Ex: {wellnessPoles.clinique_longevite?.example}</p>
                    <p className="text-gray-500 text-xs mt-3 leading-relaxed font-light">{wellnessPoles.clinique_longevite?.description}</p>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm flex flex-col justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-800 text-sm">{wellnessPoles.sacre_spirituel?.title}</h4>
                    <p className="text-[10px] text-gray-400 mt-0.5">Ex: {wellnessPoles.sacre_spirituel?.example}</p>
                    <p className="text-gray-500 text-xs mt-3 leading-relaxed font-light">{wellnessPoles.sacre_spirituel?.description}</p>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-lg border border-[#1A3C34]/20 bg-[#1A3C34]/5 shadow-sm flex flex-col justify-between">
                  <div>
                    <h4 className="font-semibold text-[#1A3C34] text-sm">{wellnessPoles.opportunity_mawarif?.title}</h4>
                    <p className="text-[10px] text-[#1A3C34]/65 mt-0.5">Synthèse MawaRif</p>
                    <p className="text-gray-700 text-xs mt-3 leading-relaxed font-medium">{wellnessPoles.opportunity_mawarif?.description}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Buyouts Section */}
            <div className="bg-white rounded-lg border border-gray-200/60 shadow-sm overflow-hidden">
              <div className="p-4 bg-gray-50/50 border-b border-gray-200/60">
                <h3 className="text-sm font-semibold text-gray-700 font-headings">3. Analyse des Modèles de Privatisation (Buyout)</h3>
              </div>
              <div className="divide-y divide-gray-100 text-xs">
                <div className="p-4 flex flex-col md:flex-row justify-between gap-2">
                  <div className="w-48 flex-shrink-0">
                    <h4 className="font-semibold text-gray-800 text-xs">{buyout.amanjena?.title}</h4>
                    <span className="text-[10px] text-gray-400 font-mono">{buyout.amanjena?.capacity}</span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed font-light">{buyout.amanjena?.details}</p>
                </div>
                <div className="p-4 flex flex-col md:flex-row justify-between gap-2">
                  <div className="w-48 flex-shrink-0">
                    <h4 className="font-semibold text-gray-800 text-xs">{buyout.sultana_oualidia?.title}</h4>
                    <span className="text-[10px] text-gray-400 font-mono">{buyout.sultana_oualidia?.capacity}</span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed font-light">{buyout.sultana_oualidia?.details}</p>
                </div>
                <div className="p-4 flex flex-col md:flex-row justify-between gap-2 bg-[#1A3C34]/5">
                  <div className="w-48 flex-shrink-0">
                    <h4 className="font-semibold text-[#1A3C34] text-xs">{buyout.advantage_mawarif?.title}</h4>
                    <span className="text-[10px] text-[#1A3C34]/70 font-mono font-medium">{buyout.advantage_mawarif?.capacity}</span>
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed font-medium">{buyout.advantage_mawarif?.details}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Section B: Benchmark International */}
          <div className="space-y-6 pt-6 border-t border-gray-200/60">
            <div>
              <h2 className="text-xl font-semibold text-[#1A3C34] font-headings">B. Benchmark International : Les Standards de Rupture Éco-Responsable</h2>
              <p className="text-xs text-gray-400 mt-1">Analyse comparative face aux leaders mondiaux de l&apos;éco-tourisme de luxe pour valider la crédibilité ESG.</p>
            </div>

            {/* Table International */}
            <div className="bg-white rounded-lg border border-gray-200/60 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200/60">
                      <th className="p-4 font-semibold text-gray-500 uppercase tracking-wider text-[10px]">Éco-Resort</th>
                      <th className="p-4 font-semibold text-gray-500 uppercase tracking-wider text-[10px]">Clés</th>
                      <th className="p-4 font-semibold text-gray-500 uppercase tracking-wider text-[10px]">Caractéristiques Écologiques de Rupture</th>
                      <th className="p-4 font-semibold text-gray-500 uppercase tracking-wider text-[10px]">Impact Économique Local</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {benchmarkInt.map((row: any, idx: number) => (
                      <tr 
                        key={idx} 
                        className={`hover:bg-gray-50/50 transition-colors ${
                          row.name.includes("MawaRif") ? "bg-[#1A3C34]/5 font-medium" : ""
                        }`}
                      >
                        <td className="p-4 text-gray-900 font-semibold">{row.name}</td>
                        <td className="p-4 text-gray-500 font-mono">{row.keys}</td>
                        <td className="p-4 text-gray-600 leading-relaxed font-light">{row.eco_features}</td>
                        <td className="p-4 text-gray-600 leading-relaxed font-light">{row.local_impact}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Note block */}
            <div className="bg-[#8B5E3C]/5 border-l-4 border-[#8B5E3C] p-4 rounded-r-lg">
              <h4 className="text-xs font-bold text-[#8B5E3C] uppercase tracking-wider font-headings">Note de structure</h4>
              <p className="text-xs text-gray-700 leading-relaxed font-light mt-1">{content.international_note}</p>
            </div>
          </div>
        </div>
      );
    }

    // Study: MARKETING
    if (slug === "marketing") {
      const marketMutation = content.market_mutation || {};
      const visualIdentity = content.visual_identity || {};
      const logoAdjustment = visualIdentity.logo_adjustment || {};
      const baselineOptimization = visualIdentity.baseline_optimization || {};
      const nicheSegments = content.niche_segments || {};
      const halalPrestige = nicheSegments.halal_prestige || {};
      const soloWomen = nicheSegments.solo_women || {};
      const distributionStrategy = content.distribution_strategy || {};
      const b2bElite = distributionStrategy.b2b_elite || {};
      const sxoIa = distributionStrategy.sxo_ia || {};
      const directChannels = distributionStrategy.direct_channels || {};
      const roadmap = content.roadmap || [];

      return (
        <div className="space-y-12 animate-fadeIn text-gray-800">
          {/* 1. Mutation du Marché */}
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-[#1A3C34] font-headings">
                {marketMutation.title || "1. Mutation du Marché de l'Hospitalité d'Élite (UHNWIs)"}
              </h2>
              <p className="text-xs text-gray-400 mt-1">Analyse comportementale de la clientèle ultra-fortuneuse internationale.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg border border-gray-200/60 shadow-sm">
                <div className="flex items-start gap-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#8B5E3C]/10 text-[#8B5E3C] flex items-center justify-center font-bold text-xs">
                    01
                  </span>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm font-headings">Le Passage au « Slow Luxe »</h4>
                    <p className="text-xs text-gray-500 mt-2 leading-relaxed font-light">
                      {marketMutation.slow_luxe ? marketMutation.slow_luxe.replace("Le Passage au « Slow Luxe » : ", "") : ""}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200/60 shadow-sm">
                <div className="flex items-start gap-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#8B5E3C]/10 text-[#8B5E3C] flex items-center justify-center font-bold text-xs">
                    02
                  </span>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm font-headings">Le Besoin de « Crowd Control »</h4>
                    <p className="text-xs text-gray-500 mt-2 leading-relaxed font-light">
                      {marketMutation.crowd_control ? marketMutation.crowd_control.replace("Le Besoin de « Crowd Control » : ", "") : ""}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {marketMutation.opportunity_mawarif && (
              <div className="bg-[#1A3C34] text-white p-6 rounded-lg shadow-sm border border-[#1A3C34]">
                <h4 className="font-semibold text-[#FBFBF8] text-sm font-headings">L&apos;Opportunité MawaRif</h4>
                <p className="text-xs text-gray-100/90 mt-2 leading-relaxed font-light">
                  {marketMutation.opportunity_mawarif.replace("L'Opportunité MawaRif : ", "")}
                </p>
              </div>
            )}
          </div>

          {/* 2. Alignement Sémiotique & Identité Visuelle */}
          <div className="space-y-6 pt-6 border-t border-gray-200/60">
            <div>
              <h2 className="text-xl font-semibold text-[#1A3C34] font-headings">
                {visualIdentity.title || "2. Alignement Sémiotique & Redressement de l'Identité Visuelle"}
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                {visualIdentity.description || "Audit et rectifications stratégiques pour justifier le positionnement ultra-luxe."}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Logo adjustment */}
              <div className="bg-white rounded-lg border border-gray-200/60 shadow-sm overflow-hidden flex flex-col justify-between">
                <div className="p-4 bg-gray-50/50 border-b border-gray-200/60">
                  <h3 className="text-sm font-semibold text-gray-700 font-headings">A. Ajustement Sémiotique du Logo</h3>
                </div>
                <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded tracking-wider uppercase">Problématique</span>
                    <p className="text-xs text-gray-500 leading-relaxed font-light">{logoAdjustment.problem}</p>
                  </div>
                  <div className="space-y-1 pt-4 border-t border-gray-100">
                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded tracking-wider uppercase">Solution</span>
                    <p className="text-xs text-gray-700 leading-relaxed font-normal">{logoAdjustment.solution}</p>
                  </div>
                </div>
              </div>

              {/* Baseline optimization */}
              <div className="bg-white rounded-lg border border-gray-200/60 shadow-sm overflow-hidden flex flex-col justify-between">
                <div className="p-4 bg-gray-50/50 border-b border-gray-200/60">
                  <h3 className="text-sm font-semibold text-gray-700 font-headings">B. Signature Typographique (Baseline)</h3>
                </div>
                <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded tracking-wider uppercase">Problématique</span>
                    <p className="text-xs text-gray-500 leading-relaxed font-light">{baselineOptimization.problem}</p>
                  </div>
                  <div className="space-y-1 pt-4 border-t border-gray-100">
                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded tracking-wider uppercase">Solution</span>
                    <p className="text-xs text-gray-700 leading-relaxed font-normal">{baselineOptimization.solution}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Plateforme de Marque & Segmentation de Niche */}
          <div className="space-y-6 pt-6 border-t border-gray-200/60">
            <div>
              <h2 className="text-xl font-semibold text-[#1A3C34] font-headings">
                {nicheSegments.title || "3. Plateforme de Marque & Segmentation de Niche"}
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                {nicheSegments.description || "Ingénierie de services exclusifs pour capter des niches mondiales sous-offertes."}
              </p>
            </div>

            <div className="space-y-6">
              {/* Halal Prestige */}
              <div className="bg-white p-6 rounded-lg border border-gray-200/60 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-100 pb-4 mb-4 gap-2">
                  <h3 className="text-sm font-semibold text-[#1A3C34] font-headings">{halalPrestige.title}</h3>
                  <span className="text-[9px] font-bold text-[#8B5E3C] bg-[#8B5E3C]/10 px-2 py-1 rounded-full uppercase tracking-wider self-start md:self-auto">
                    Certifications & Architecture
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                  <div>
                    <span className="text-[9px] text-gray-400 uppercase tracking-wider font-semibold block mb-1">Positionnement d&apos;Élite</span>
                    <p className="text-gray-600 leading-relaxed font-light">{halalPrestige.positioning}</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-gray-400 uppercase tracking-wider font-semibold block mb-1">Ingénierie Spatiale</span>
                    <p className="text-gray-600 leading-relaxed font-light">{halalPrestige.engineering}</p>
                  </div>
                </div>
              </div>

              {/* Solo Women */}
              <div className="bg-white p-6 rounded-lg border border-gray-200/60 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-100 pb-4 mb-4 gap-2">
                  <h3 className="text-sm font-semibold text-[#1A3C34] font-headings">{soloWomen.title}</h3>
                  <span className="text-[9px] font-bold text-[#1A3C34] bg-[#1A3C34]/10 px-2 py-1 rounded-full uppercase tracking-wider self-start md:self-auto">
                    Edge AI Virtual Security
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                  <div>
                    <span className="text-[9px] text-gray-400 uppercase tracking-wider font-semibold block mb-1">Positionnement d&apos;Élite</span>
                    <p className="text-gray-600 leading-relaxed font-light">{soloWomen.positioning}</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-gray-400 uppercase tracking-wider font-semibold block mb-1">Innovation Technologique</span>
                    <p className="text-gray-600 leading-relaxed font-light">{soloWomen.innovation}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Stratégie d'Acquisition & Distribution */}
          <div className="space-y-6 pt-6 border-t border-gray-200/60">
            <div>
              <h2 className="text-xl font-semibold text-[#1A3C34] font-headings">
                {distributionStrategy.title || "4. Stratégie d'Acquisition & Écosystème de Distribution"}
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                {distributionStrategy.description || "Rejet des OTA au profit d'une commercialisation fermée haut de gamme."}
              </p>
            </div>

            {/* Visual breakdown of distribution */}
            <div className="bg-white p-6 rounded-lg border border-gray-200/60 shadow-sm space-y-4">
              <span className="text-[9px] text-gray-400 uppercase tracking-wider font-semibold block">Mix de Distribution Cible</span>
              <div className="flex h-6 rounded-full overflow-hidden text-[10px] font-semibold text-white">
                <div className="bg-[#1A3C34] flex items-center justify-center transition-all" style={{ width: '53%' }} title="Canaux Directs">
                  53% Direct
                </div>
                <div className="bg-[#8B5E3C] flex items-center justify-center transition-all" style={{ width: '37%' }} title="Partenariats B2B">
                  37% B2B Elite
                </div>
                <div className="bg-[#7E8F8B] flex items-center justify-center transition-all" style={{ width: '10%' }} title="SXO IA">
                  10% SXO
                </div>
              </div>
              <div className="flex flex-wrap gap-4 text-[10px] text-gray-500 justify-between pt-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#1A3C34] block"></span>
                  <span>Canaux Directs & Cercle Privé (53%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#8B5E3C] block"></span>
                  <span>Partenariats B2B Privés d&apos;Élite (37%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#7E8F8B] block"></span>
                  <span>Acquisition Sémantique Directe par IA (10%)</span>
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
              {/* B2B */}
              <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-semibold text-gray-800 font-headings">{b2bElite.title}</h4>
                    <span className="text-[10px] font-mono text-[#8B5E3C] bg-[#8B5E3C]/5 px-1.5 py-0.5 rounded">{b2bElite.share}</span>
                  </div>
                  <p className="text-gray-500 leading-relaxed font-light">{b2bElite.details}</p>
                </div>
              </div>

              {/* SXO */}
              <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-semibold text-gray-800 font-headings">{sxoIa.title}</h4>
                    <span className="text-[10px] font-mono text-[#7E8F8B] bg-[#7E8F8B]/5 px-1.5 py-0.5 rounded">{sxoIa.share}</span>
                  </div>
                  <p className="text-gray-500 leading-relaxed font-light">{sxoIa.details}</p>
                </div>
              </div>

              {/* Direct */}
              <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-semibold text-gray-800 font-headings">{directChannels.title}</h4>
                    <span className="text-[10px] font-mono text-[#1A3C34] bg-[#1A3C34]/5 px-1.5 py-0.5 rounded">{directChannels.share}</span>
                  </div>
                  <div className="space-y-3 mt-3">
                    <div>
                      <span className="text-[9px] font-semibold text-gray-400 uppercase">Club Privé</span>
                      <p className="text-gray-500 leading-relaxed font-light mt-0.5">{directChannels.club ? directChannels.club.replace("Le Club MawaRif (10%) : ", "") : ""}</p>
                    </div>
                    <div className="pt-2 border-t border-gray-100">
                      <span className="text-[9px] font-semibold text-gray-400 uppercase">CRM Prédictif</span>
                      <p className="text-gray-500 leading-relaxed font-light mt-0.5">{directChannels.crm ? directChannels.crm.replace("CRM Prédictif Privé (43%) : ", "") : ""}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 5. Feuille de Route Marketing */}
          {roadmap.length > 0 && (
            <div className="space-y-6 pt-6 border-t border-gray-200/60">
              <div>
                <h2 className="text-xl font-semibold text-[#1A3C34] font-headings">5. Feuille de Route Marketing & Chronogramme</h2>
                <p className="text-xs text-gray-400 mt-1">Phases de déploiement, pré-acquisition et lancement opérationnel.</p>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200/60 shadow-sm space-y-6">
                <div className="relative pl-6 border-l-2 border-gray-150 space-y-8 mt-4">
                  {roadmap.map((item: any, idx: number) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-[31px] top-1.5 w-3 h-3 rounded-full bg-[#8B5E3C] border-2 border-white"></div>
                      <div>
                        <span className="text-xs font-bold text-[#8B5E3C] uppercase tracking-wider">{item.date}</span>
                        <h4 className="text-sm font-semibold text-gray-800 mt-0.5 font-headings">{item.title}</h4>
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed font-light">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    // Study: VISION STRATÉGIQUE
    if (slug === "vision-strategique") {
      const positioning = content.positioning || {};
      const marketDynamics = content.market_dynamics || {};
      const moroccanMomentum = content.moroccan_momentum || {};
      const identityAnchoring = content.identity_anchoring || {};
      const ecologicalSanctuary = content.ecological_sanctuary || {};

      return (
        <div className="space-y-12 animate-fadeIn text-gray-800">
          {/* 1. Le Positionnement */}
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-[#1A3C34] font-headings">
                {positioning.title || "1. Le Positionnement : L'Ère de la Post-Opulence"}
              </h2>
              <p className="text-xs text-gray-400 mt-1">Nouvelle définition de l&apos;hospitalité d&apos;exception.</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg border border-gray-200/60 shadow-sm space-y-4">
              <p className="text-xs text-gray-600 leading-relaxed font-light">
                {positioning.description}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100 text-xs">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-[#8B5E3C] uppercase tracking-wider block">Le Shift Culturel</span>
                  <p className="text-gray-500 leading-relaxed font-light">
                    {positioning.shift_cultural ? positioning.shift_cultural.replace("Le Shift Culturel : ", "") : ""}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-[#1A3C34] uppercase tracking-wider block">Infrastructure Régénérative</span>
                  <p className="text-gray-500 leading-relaxed font-light">
                    {positioning.infrastructure ? positioning.infrastructure.replace("Une Infrastructure Post-Opulence : ", "") : ""}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 2. La Dynamique de Marché */}
          <div className="space-y-6 pt-6 border-t border-gray-200/60">
            <div>
              <h2 className="text-xl font-semibold text-[#1A3C34] font-headings">
                {marketDynamics.title || "2. La Dynamique de Marché : Un Segment à Forte Valeur"}
              </h2>
              <p className="text-xs text-gray-400 mt-1">Opportunité financière sur le segment ultra-premium.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: Description */}
              <div className="md:col-span-1 bg-white p-6 rounded-lg border border-gray-200/60 shadow-sm flex flex-col justify-center">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Segment Target</span>
                <p className="text-xs text-gray-600 leading-relaxed font-light">
                  {marketDynamics.description}
                </p>
              </div>

              {/* Card 2: Projections */}
              <div className="bg-[#1A3C34]/5 p-6 rounded-lg border border-[#1A3C34]/10 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-[9px] font-bold text-[#1A3C34] uppercase tracking-wider block">Projections Horizon 2034</span>
                  <p className="text-2xl font-bold text-[#1A3C34] mt-2">10 M$ USD</p>
                  <p className="text-[10px] text-[#1A3C34]/70 font-medium">CAGR cible de 11%</p>
                </div>
                <p className="text-[10px] text-gray-500 mt-4 leading-relaxed font-light">
                  {marketDynamics.projections ? marketDynamics.projections.replace("Projections Financières : ", "") : ""}
                </p>
              </div>

              {/* Card 3: Premium */}
              <div className="bg-[#8B5E3C]/5 p-6 rounded-lg border border-[#8B5E3C]/10 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-[9px] font-bold text-[#8B5E3C] uppercase tracking-wider block">Premium Tarifaire</span>
                  <p className="text-2xl font-bold text-[#8B5E3C] mt-2">+42 %</p>
                  <p className="text-[10px] text-[#8B5E3C]/70 font-medium">Surcoût d&apos;exclusivité accepté</p>
                </div>
                <p className="text-[10px] text-gray-500 mt-4 leading-relaxed font-light">
                  {marketDynamics.pricing_premium ? marketDynamics.pricing_premium.replace("Le Premium Tarifaire : ", "") : ""}
                </p>
              </div>
            </div>
          </div>

          {/* 3. Le Momentum Marocain */}
          <div className="space-y-6 pt-6 border-t border-gray-200/60">
            <div>
              <h2 className="text-xl font-semibold text-[#1A3C34] font-headings">
                {moroccanMomentum.title || "3. Le Momentum Marocain : Une Conjoncture Exceptionnelle"}
              </h2>
              <p className="text-xs text-gray-400 mt-1">Conjoncture nationale favorable portée par les grands événements (FIFA 2030).</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="bg-white p-6 rounded-lg border border-gray-200/60 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <span className="font-semibold text-gray-800">Arrivées Touristiques 2025</span>
                  <span className="font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">19,8 M (+22%)</span>
                </div>
                <p className="text-gray-500 leading-relaxed font-light">
                  {moroccanMomentum.growth_record ? moroccanMomentum.growth_record.replace("Une Croissance Record : ", "") : ""}
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200/60 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <span className="font-semibold text-gray-800">Cible Nationale 2028 (Anticipée)</span>
                  <span className="font-mono font-bold text-[#1A3C34] bg-[#1A3C34]/10 px-2 py-0.5 rounded">26 M</span>
                </div>
                <p className="text-gray-500 leading-relaxed font-light">
                  {moroccanMomentum.anticipated_objectives ? moroccanMomentum.anticipated_objectives.replace("Objectifs Anticipés : ", "") : ""}
                </p>
              </div>
            </div>

            {moroccanMomentum.state_support && (
              <div className="bg-white p-6 rounded-lg border border-[#8B5E3C]/20 bg-[#8B5E3C]/5 shadow-sm text-xs">
                <span className="text-[9px] font-bold text-[#8B5E3C] uppercase tracking-wider block mb-1">Déconcentration & Soutien Étatique</span>
                <p className="text-gray-700 leading-relaxed font-light">
                  {moroccanMomentum.state_support.replace("Soutien Étatique Récompensé : ", "")}
                </p>
              </div>
            )}
          </div>

          {/* 4. L'Ancrage Identitaire */}
          <div className="space-y-6 pt-6 border-t border-gray-200/60">
            <div>
              <h2 className="text-xl font-semibold text-[#1A3C34] font-headings">
                {identityAnchoring.title || "4. L'Ancrage Identitaire : Le Triptyque Conceptuel"}
              </h2>
              <p className="text-xs text-gray-400 mt-1">{identityAnchoring.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Mawa */}
              <div className="bg-white p-6 rounded-lg border border-gray-200/60 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Triptyque I</span>
                    <span className="text-base font-bold text-[#8B5E3C] font-headings">{identityAnchoring.mawa?.arabic}</span>
                  </div>
                  <h4 className="font-semibold text-gray-900 text-sm font-headings">MAWA — {identityAnchoring.mawa?.meaning}</h4>
                  <p className="text-xs text-gray-500 mt-3 leading-relaxed font-light">{identityAnchoring.mawa?.details}</p>
                </div>
              </div>

              {/* Rif */}
              <div className="bg-white p-6 rounded-lg border border-gray-200/60 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Triptyque II</span>
                    <span className="text-base font-bold text-[#8B5E3C] font-headings">الريف</span>
                  </div>
                  <h4 className="font-semibold text-gray-900 text-sm font-headings">RIF — {identityAnchoring.rif?.meaning}</h4>
                  <p className="text-xs text-gray-500 mt-3 leading-relaxed font-light">{identityAnchoring.rif?.details}</p>
                </div>
              </div>

              {/* Maarif */}
              <div className="bg-white p-6 rounded-lg border border-gray-200/60 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Triptyque III</span>
                    <span className="text-base font-bold text-[#8B5E3C] font-headings">{identityAnchoring.maarif?.arabic}</span>
                  </div>
                  <h4 className="font-semibold text-gray-900 text-sm font-headings">MA&apos;ARIF — {identityAnchoring.maarif?.meaning}</h4>
                  <p className="text-xs text-gray-500 mt-3 leading-relaxed font-light">{identityAnchoring.maarif?.details}</p>
                </div>
              </div>
            </div>
          </div>

          {/* 5. Le Sanctuaire Écologique */}
          {ecologicalSanctuary && (
            <div className="space-y-6 pt-6 border-t border-gray-200/60">
              <div>
                <h2 className="text-xl font-semibold text-[#1A3C34] font-headings">
                  {ecologicalSanctuary.title || "5. Le Sanctuaire Écologique : Jebel Bouhachem"}
                </h2>
                <p className="text-xs text-gray-400 mt-1">{ecologicalSanctuary.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                <div className="bg-white p-6 rounded-lg border border-gray-200/60 shadow-sm">
                  <span className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Écosystème Protégé</span>
                  <p className="text-gray-500 leading-relaxed font-light">{ecologicalSanctuary.protected_ecosystem}</p>
                </div>
                <div className="bg-white p-6 rounded-lg border border-gray-200/60 shadow-sm">
                  <span className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Saisonnalité Lissée</span>
                  <p className="text-gray-500 leading-relaxed font-light">{ecologicalSanctuary.seasonality_smoothing}</p>
                </div>
                <div className="bg-white p-6 rounded-lg border border-gray-200/60 shadow-sm">
                  <span className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Héritage Circulaire</span>
                  <p className="text-gray-500 leading-relaxed font-light">{ecologicalSanctuary.circular_heritage}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    // Study: STRATÉGIE DE COMMERCIALISATION / DISTRIBUTION
    if (slug === "distribution") {
      const intro = content.intro || "";
      const segmentation = content.segmentation || {};
      const halalPrestige = segmentation.halal_prestige || {};
      const soloWomen = segmentation.solo_women || {};
      const distributionMix = content.distribution_mix || {};
      const b2bElite = distributionMix.b2b_elite || {};
      const sxoIa = distributionMix.sxo_ia || {};
      const directChannels = distributionMix.direct_channels || {};
      const certifications = content.certifications || {};
      const certItems = certifications.items || [];
      const kpis = content.kpis || {};
      const kpiTable = kpis.table || [];

      return (
        <div className="space-y-12 animate-fadeIn text-gray-800">
          {/* Introduction */}
          <div className="bg-white p-6 rounded-lg border border-gray-200/60 shadow-sm">
            <span className="text-[9px] font-bold text-[#8B5E3C] uppercase tracking-wider block mb-2">Philosophie de Vente</span>
            <p className="text-xs text-gray-600 leading-relaxed font-light">{intro}</p>
          </div>

          {/* 1. Segmentation Approfondie */}
          <div className="space-y-6 pt-6 border-t border-gray-200/60">
            <div>
              <h2 className="text-xl font-semibold text-[#1A3C34] font-headings">
                {segmentation.title || "1. Segmentation Approfondie des Cibles de Haute Contribution"}
              </h2>
              <p className="text-xs text-gray-400 mt-1">{segmentation.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              {/* Halal Prestige */}
              <div className="bg-white p-6 rounded-lg border border-gray-200/60 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-[#1A3C34] mb-3 font-headings">{halalPrestige.title}</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">Spécifications Clés</span>
                      <p className="text-gray-500 leading-relaxed font-light">{halalPrestige.specs}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <span className="text-[9px] font-bold text-[#8B5E3C] uppercase tracking-wider block mb-1">Levier Commercial</span>
                  <p className="text-gray-600 leading-relaxed font-light">{halalPrestige.lever}</p>
                </div>
              </div>

              {/* Solo Women */}
              <div className="bg-white p-6 rounded-lg border border-gray-200/60 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-[#1A3C34] mb-3 font-headings">{soloWomen.title}</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">Spécifications Clés</span>
                      <p className="text-gray-500 leading-relaxed font-light">{soloWomen.specs}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <span className="text-[9px] font-bold text-[#8B5E3C] uppercase tracking-wider block mb-1">Levier Commercial</span>
                  <p className="text-gray-600 leading-relaxed font-light">{soloWomen.lever}</p>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Mix de Distribution Élite */}
          <div className="space-y-6 pt-6 border-t border-gray-200/60">
            <div>
              <h2 className="text-xl font-semibold text-[#1A3C34] font-headings">
                {distributionMix.title || "2. Le Mix de Distribution Élite (Canaux de Capture de Valeur)"}
              </h2>
              <p className="text-xs text-gray-400 mt-1">{distributionMix.description}</p>
            </div>

            {/* Progress bar visual representation */}
            <div className="bg-white p-6 rounded-lg border border-gray-200/60 shadow-sm space-y-4">
              <span className="text-[9px] text-gray-400 uppercase tracking-wider font-semibold block">Architecture de Distribution</span>
              <div className="flex h-6 rounded-full overflow-hidden text-[10px] font-semibold text-white">
                <div className="bg-[#1A3C34] flex items-center justify-center transition-all" style={{ width: '53%' }} title="Canaux Directs">
                  53% Direct
                </div>
                <div className="bg-[#8B5E3C] flex items-center justify-center transition-all" style={{ width: '37%' }} title="B2B Réseaux">
                  37% B2B Elite
                </div>
                <div className="bg-[#7E8F8B] flex items-center justify-center transition-all" style={{ width: '10%' }} title="SXO IA">
                  10% SXO
                </div>
              </div>
              <div className="flex flex-wrap gap-4 text-[10px] text-gray-500 justify-between pt-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#1A3C34] block"></span>
                  <span>Direct & Cercle Privé (53%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#8B5E3C] block"></span>
                  <span>Partenariats B2B (37%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#7E8F8B] block"></span>
                  <span>Acquisition SXO par IA (10%)</span>
                </div>
              </div>
            </div>

            {/* Mix Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
              {/* B2B */}
              <div className="bg-white p-5 rounded-lg border border-gray-150 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-semibold text-gray-800 font-headings">{b2bElite.title}</h4>
                    <span className="text-[10px] font-mono text-[#8B5E3C] bg-[#8B5E3C]/5 px-1.5 py-0.5 rounded">{b2bElite.share}</span>
                  </div>
                  <p className="text-gray-500 leading-relaxed font-light mb-3">{b2bElite.details}</p>
                </div>
                <div className="pt-2 border-t border-gray-50 text-[10px] font-medium text-gray-600">
                  Impact : {b2bElite.impact}
                </div>
              </div>

              {/* SXO */}
              <div className="bg-white p-5 rounded-lg border border-gray-150 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-semibold text-gray-800 font-headings">{sxoIa.title}</h4>
                    <span className="text-[10px] font-mono text-[#7E8F8B] bg-[#7E8F8B]/5 px-1.5 py-0.5 rounded">{sxoIa.share}</span>
                  </div>
                  <p className="text-gray-500 leading-relaxed font-light mb-3">{sxoIa.details}</p>
                </div>
                <div className="pt-2 border-t border-gray-50 text-[10px] font-medium text-[#7E8F8B]">
                  {sxoIa.tech}
                </div>
              </div>

              {/* Direct */}
              <div className="bg-white p-5 rounded-lg border border-gray-150 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-semibold text-gray-800 font-headings">{directChannels.title}</h4>
                    <span className="text-[10px] font-mono text-[#1A3C34] bg-[#1A3C34]/5 px-1.5 py-0.5 rounded">{directChannels.share}</span>
                  </div>
                  <div className="space-y-3 mt-3">
                    <div>
                      <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider block">Ventes Directes</span>
                      <p className="text-gray-500 leading-relaxed font-light mt-0.5">{directChannels.direct_sales ? directChannels.direct_sales.replace("Ventes Directes (43%) : ", "") : ""}</p>
                    </div>
                    <div className="pt-2 border-t border-gray-100">
                      <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider block">Club Privé</span>
                      <p className="text-gray-500 leading-relaxed font-light mt-0.5">{directChannels.club ? directChannels.club.replace("Le Club MawaRif (10%) : ", "") : ""}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Certifications d'Excellence */}
          <div className="space-y-6 pt-6 border-t border-gray-200/60">
            <div>
              <h2 className="text-xl font-semibold text-[#1A3C34] font-headings">
                {certifications.title || "3. Certifications d'Excellence : Les Garanties de Crédibilité ESG"}
              </h2>
              <p className="text-xs text-gray-400 mt-1">{certifications.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {certItems.map((cert: any, idx: number) => (
                <div key={idx} className="bg-white p-6 rounded-lg border border-gray-200/60 shadow-sm border-l-4 border-l-[#8B5E3C] flex flex-col justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm font-headings">{cert.name}</h4>
                    <p className="text-xs text-gray-500 mt-2 leading-relaxed font-light">{cert.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. KPIs Cibles */}
          {kpiTable.length > 0 && (
            <div className="space-y-6 pt-6 border-t border-gray-200/60">
              <div>
                <h2 className="text-xl font-semibold text-[#1A3C34] font-headings">
                  {kpis.title || "4. Indicateurs Clés de Performance Commerciale (KPIs Cibles)"}
                </h2>
                <p className="text-xs text-gray-400 mt-1">Métriques financières stabilisées à horizon 2028.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {kpiTable.map((row: any, idx: number) => (
                  <div key={idx} className="bg-white p-5 rounded-lg border border-gray-200/60 shadow-sm flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">{row.metric}</span>
                      <p className="text-xl font-bold text-[#1A3C34] mt-2 font-mono">{row.value}</p>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-3 leading-relaxed font-light">{row.rationale}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    // Study: TECHNIQUE
    if (slug === "technique") {
      const ref = content.ref;
      const date = content.date;
      const techTitle = content.title;
      const status = content.status;
      const implantation = content.implantation || {};
      const fondations = content.fondations || {};
      const stabilite = content.stabilite || {};
      const poleEnergie = content.pole_energie || {};
      const bioHacking = content.bio_hacking || {};
      const dimensions = content.dimensions || {};

      return (
        <div className="space-y-8 animate-fadeIn text-gray-800">
          {/* Header specification card */}
          <div className="bg-[#FBFBF8] p-6 rounded-lg border border-gray-150 shadow-sm flex flex-col md:flex-row justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#8B5E3C] font-mono block">Document technique d&apos;Avant-Projet</span>
              <h3 className="text-base font-semibold text-[#1A3C34] mt-1 font-headings">{techTitle}</h3>
              <p className="text-xs text-gray-500 mt-1 font-light">Status : <strong className="font-semibold">{status}</strong></p>
            </div>
            <div className="text-left md:text-right text-xs">
              <p className="text-gray-400">Réf : <strong className="text-gray-600 font-mono">{ref}</strong></p>
              <p className="text-gray-400 mt-1">Date : <strong className="text-gray-600 font-mono">{date}</strong></p>
            </div>
          </div>

          {/* Sub Navigation */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setTechTab("implantation")}
              className={`py-3 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
                techTab === "implantation"
                  ? "border-[#1A3C34] text-[#1A3C34]"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              Implantation & Fondations
            </button>
            <button
              onClick={() => setTechTab("stabilite")}
              className={`py-3 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
                techTab === "stabilite"
                  ? "border-[#1A3C34] text-[#1A3C34]"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              Stabilité & Énergie
            </button>
            <button
              onClick={() => setTechTab("biohacking")}
              className={`py-3 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
                techTab === "biohacking"
                  ? "border-[#1A3C34] text-[#1A3C34]"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              Bio-Hacking & Sport
            </button>
            <button
              onClick={() => setTechTab("dimensions")}
              className={`py-3 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
                techTab === "dimensions"
                  ? "border-[#1A3C34] text-[#1A3C34]"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              Dimensionnel
            </button>
          </div>

          {/* Tab Content: Implantation */}
          {techTab === "implantation" && (
            <div className="space-y-6 animate-fadeIn text-xs leading-relaxed font-light text-gray-600">
              <div className="bg-white p-6 rounded-lg border border-gray-200/60 shadow-sm space-y-4">
                <h4 className="text-sm font-semibold text-[#1A3C34] font-headings">{implantation.title}</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Climat Extrême</span>
                    <p className="text-gray-500 font-light">{implantation.climat}</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Activité Sismique</span>
                    <p className="text-gray-500 font-light">{implantation.sismicite}</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Impératif Biologique</span>
                    <p className="text-gray-500 font-light">{implantation.zero_beton}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200/60 shadow-sm space-y-3">
                <h4 className="text-sm font-semibold text-[#1A3C34] font-headings">{fondations.title}</h4>
                <p>{fondations.description}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-gray-50">
                  <div>
                    <span className="text-[9px] font-bold text-[#8B5E3C] uppercase tracking-widest block">Type de pieux</span>
                    <p className="text-gray-500 mt-0.5">{fondations.pieux_type}</p>
                    <span className="text-[9px] font-bold text-[#8B5E3C] uppercase tracking-widest block mt-3">Profondeur d&apos;ancrage</span>
                    <p className="text-gray-500 mt-0.5">{fondations.ancrage}</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-[#8B5E3C] uppercase tracking-widest block">Traitement de protection</span>
                    <p className="text-gray-500 mt-0.5">{fondations.protection}</p>
                    <span className="text-[9px] font-bold text-[#8B5E3C] uppercase tracking-widest block mt-3">Liaison superstructure</span>
                    <p className="text-gray-500 mt-0.5">{fondations.solidarisation}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content: Stabilité & Énergie */}
          {techTab === "stabilite" && (
            <div className="space-y-6 animate-fadeIn text-xs leading-relaxed font-light text-gray-600">
              <div className="bg-white p-6 rounded-lg border border-gray-200/60 shadow-sm space-y-3">
                <h4 className="text-sm font-semibold text-[#1A3C34] font-headings">{stabilite.title}</h4>
                <p className="text-gray-500">{stabilite.description}</p>
                <p className="bg-[#8B5E3C]/5 border-l-2 border-[#8B5E3C] p-3 rounded-r text-[#8B5E3C] mt-2 font-medium">
                  {stabilite.directives}
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200/60 shadow-sm space-y-4">
                <h4 className="text-sm font-semibold text-[#1A3C34] font-headings">{poleEnergie.title}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <span className="text-[9px] font-bold text-[#1A3C34] uppercase tracking-widest block mb-1">Option Hammam Traditionnel</span>
                    <p>{poleEnergie.hammam}</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-[#1A3C34] uppercase tracking-widest block mb-1">Chaudière Biomasse Industrielle</span>
                    <p>{poleEnergie.chaudiere}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content: Bio-hacking */}
          {techTab === "biohacking" && (
            <div className="bg-white p-6 rounded-lg border border-gray-200/60 shadow-sm space-y-6 animate-fadeIn text-xs leading-relaxed font-light text-gray-600">
              <div>
                <h4 className="text-sm font-semibold text-[#1A3C34] font-headings">{bioHacking.title}</h4>
                <p className="mt-1">{bioHacking.sport}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-gray-100">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-[#8B5E3C] uppercase tracking-widest block">Cryothérapie</span>
                  <p>{bioHacking.cryotherapie}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-[#8B5E3C] uppercase tracking-widest block">Caisson Hyperbare (HBOT)</span>
                  <p>{bioHacking.hyperbare}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-[#8B5E3C] uppercase tracking-widest block">Régénération Cellulaire</span>
                  <p>{bioHacking.regeneration}</p>
                </div>
              </div>

              <div className="bg-amber-50/40 border-l-4 border-l-amber-500 p-4 rounded-r text-[#8B5E3C] font-normal">
                {bioHacking.acoustique}
              </div>
            </div>
          )}

          {/* Tab Content: Dimensions */}
          {techTab === "dimensions" && (
            <div className="bg-white rounded-lg border border-gray-200/60 shadow-sm overflow-hidden animate-fadeIn text-xs">
              <div className="p-6 border-b border-gray-200/60">
                <h4 className="text-sm font-semibold text-[#1A3C34] font-headings">{dimensions.title}</h4>
                <p className="text-xs text-gray-400 mt-1">Spécifications géométriques et puissance brute d&apos;ingénierie.</p>
              </div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200/60">
                    <th className="p-4 font-semibold text-gray-500 uppercase tracking-wider text-[10px] w-1/2">Paramètre Structurel / Équipement</th>
                    <th className="p-4 font-semibold text-gray-500 uppercase tracking-wider text-[10px]">Valeur Certifiée APD</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {dimensions.table?.map((row: any, idx: number) => (
                    <tr key={idx} className="hover:bg-gray-50/50">
                      <td className="p-4 font-medium text-gray-700">{row.name}</td>
                      <td className="p-4 font-mono text-gray-900">{row.val}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      );
    }

    // Study: STRESS-TESTING
    if (slug === "stress-testing") {
      const verbatim = content.verbatim || "";
      const breakEven = content.break_even || {};
      const costStructure = content.cost_structure || {};
      const sensitivityMatrix = content.sensitivity_matrix || {};
      const subventionsImpact = content.subventions_impact || {};

      return (
        <div className="space-y-8 animate-fadeIn text-gray-800">
          {/* Quote verbatim */}
          <div className="bg-[#FBFBF8] p-6 rounded-lg border border-gray-150 shadow-sm border-l-4 border-l-[#8B5E3C] italic text-xs leading-relaxed text-gray-600 font-light relative">
            <span className="text-4xl text-[#8B5E3C]/20 font-serif absolute left-2 top-2 leading-none">“</span>
            <p className="pl-4">{verbatim}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Break-even box */}
            <div className="bg-[#1A3C34] text-white p-6 rounded-lg shadow-sm border border-[#1A3C34] flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest block">{breakEven.title}</span>
                <p className="text-4xl font-bold text-[#FBFBF8] mt-3">{breakEven.to_value}</p>
                <p className="text-[10px] text-gray-200 mt-1 font-mono">Seuil de Rentabilité (Taux d&apos;Occupation)</p>
              </div>
              <p className="text-[10px] text-gray-100/90 mt-4 leading-relaxed font-light">{breakEven.rationale}</p>
            </div>

            {/* Cost structure (Fixed vs Variable) */}
            <div className="md:col-span-2 bg-white p-6 rounded-lg border border-gray-200/60 shadow-sm flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-semibold text-[#1A3C34] font-headings">{costStructure.title}</h4>
                <p className="text-xs text-gray-500 mt-1 font-light">{costStructure.description}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-xs font-light text-gray-600 leading-relaxed border-t border-gray-50 pt-4">
                <div>
                  <span className="text-[9px] font-bold text-[#8B5E3C] uppercase tracking-widest block">Charges Fixes (~70%)</span>
                  <p className="mt-1">{costStructure.fixed_costs}</p>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-[#8B5E3C] uppercase tracking-widest block">Charges Variables (~30%)</span>
                  <p className="mt-1">{costStructure.variable_costs}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sensitivity Matrix Table */}
          <div className="bg-white rounded-lg border border-gray-200/60 shadow-sm overflow-hidden text-xs">
            <div className="p-6 border-b border-gray-200/60">
              <h4 className="text-sm font-semibold text-[#1A3C34] font-headings">{sensitivityMatrix.title}</h4>
              <p className="text-xs text-gray-400 mt-1">Impact d&apos;une baisse du TJM et de l&apos;occupation sur l&apos;EBITDA et la valorisation à l&apos;année 1.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200/60">
                    <th className="p-4 font-semibold text-gray-500 uppercase tracking-wider text-[10px] w-48">Scénario de Test</th>
                    <th className="p-4 font-semibold text-gray-500 uppercase tracking-wider text-[10px] text-right">TJM Modélisé</th>
                    <th className="p-4 font-semibold text-gray-500 uppercase tracking-wider text-[10px] text-right">Taux Occ.</th>
                    <th className="p-4 font-semibold text-gray-500 uppercase tracking-wider text-[10px] text-right">Chiffre d&apos;Affaires</th>
                    <th className="p-4 font-semibold text-gray-500 uppercase tracking-wider text-[10px] text-right">EBITDA (MAD)</th>
                    <th className="p-4 font-semibold text-gray-500 uppercase tracking-wider text-[10px] text-right">Valorisation (12x)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sensitivityMatrix.scenarios?.map((row: any, idx: number) => (
                    <tr 
                      key={idx} 
                      className={`hover:bg-gray-50/50 transition-colors ${
                        row.name.includes("Nominal") ? "bg-[#1A3C34]/5 font-medium" : ""
                      }`}
                    >
                      <td className="p-4 font-semibold text-gray-900">
                        {row.name}
                        {row.analysis && (
                          <span className="block text-[10px] text-gray-400 font-light font-body mt-1 leading-relaxed">{row.analysis}</span>
                        )}
                      </td>
                      <td className="p-4 text-right text-gray-600 font-light leading-relaxed">{row.tjm}</td>
                      <td className="p-4 text-right font-mono text-gray-700">{row.occupancy}</td>
                      <td className="p-4 text-right font-mono text-gray-700">{row.revenue}</td>
                      <td className="p-4 text-right font-mono font-semibold text-[#1A3C34]">{row.ebitda}</td>
                      <td className="p-4 text-right font-mono text-gray-900 font-medium">{row.valuation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Subventions Card */}
          {subventionsImpact && (
            <div className="bg-emerald-50/30 border border-emerald-100 p-6 rounded-lg text-xs leading-relaxed text-gray-700">
              <h4 className="text-sm font-semibold text-emerald-800 font-headings">{subventionsImpact.title}</h4>
              <p className="mt-2 font-light">{subventionsImpact.description}</p>
            </div>
          )}
        </div>
      );
    }

    // Study: NOTE FISCALE
    if (slug === "fiscale") {
      const framework = content.framework || {};
      const isOptimization = content.is_optimization || {};
      const tvaOptimization = content.tva_optimization || {};
      const localTaxes = content.local_taxes || {};
      const valuationExit = content.valuation_exit || {};

      return (
        <div className="space-y-8 animate-fadeIn text-gray-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed font-light text-gray-600">
            {/* Framework and legal */}
            <div className="bg-white p-6 rounded-lg border border-gray-200/60 shadow-sm space-y-3">
              <h4 className="text-sm font-semibold text-[#1A3C34] font-headings">{framework.title}</h4>
              <p>{framework.legal_structure}</p>
              <div className="bg-[#1A3C34]/5 border-l-2 border-[#1A3C34] p-3 rounded-r text-[#1A3C34] font-medium">
                <span className="text-[9px] font-bold uppercase block tracking-widest">Éligibilité Charte de l&apos;Investissement</span>
                <p className="mt-0.5">{framework.charter_investment}</p>
              </div>
            </div>

            {/* IS optimization */}
            <div className="bg-white p-6 rounded-lg border border-gray-200/60 shadow-sm space-y-3">
              <h4 className="text-sm font-semibold text-[#1A3C34] font-headings">{isOptimization.title}</h4>
              <p>{isOptimization.exon_period}</p>
              <p className="pt-2 border-t border-gray-100 text-gray-500">{isOptimization.post_exon}</p>
            </div>
          </div>

          {/* TVA optimization table */}
          {tvaOptimization && (
            <div className="bg-white rounded-lg border border-gray-200/60 shadow-sm overflow-hidden text-xs">
              <div className="p-6 border-b border-gray-200/60">
                <h4 className="text-sm font-semibold text-[#1A3C34] font-headings">{tvaOptimization.title}</h4>
                <p className="text-xs text-gray-400 mt-1">{tvaOptimization.description}</p>
              </div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200/60">
                    <th className="p-4 font-semibold text-gray-500 uppercase tracking-wider text-[10px]">Poste d&apos;Investissement (CAPEX)</th>
                    <th className="p-4 font-semibold text-gray-500 uppercase tracking-wider text-[10px] text-right">Taux TVA Standard</th>
                    <th className="p-4 font-semibold text-gray-500 uppercase tracking-wider text-[10px] text-right">Budget Consommé (MAD)</th>
                    <th className="p-4 font-semibold text-gray-500 uppercase tracking-wider text-[10px] text-right">Économie TVA Sécurisée</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tvaOptimization.table?.map((row: any, idx: number) => (
                    <tr 
                      key={idx} 
                      className={`hover:bg-gray-50/50 transition-colors ${
                        row.category.includes("TOTAL") ? "bg-[#1A3C34]/5 font-semibold" : ""
                      }`}
                    >
                      <td className="p-4 text-gray-900">{row.category}</td>
                      <td className="p-4 text-right text-gray-500 font-mono">{row.tva}</td>
                      <td className="p-4 text-right font-mono text-gray-700">{row.budget.toLocaleString("fr-FR")}</td>
                      <td className={`p-4 text-right font-mono font-medium ${row.category.includes("TOTAL") ? "text-emerald-600" : "text-gray-800"}`}>
                        {row.savings.toLocaleString("fr-FR")} MAD
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed font-light text-gray-600">
            {/* Local Taxes */}
            <div className="bg-white p-6 rounded-lg border border-gray-200/60 shadow-sm space-y-3">
              <h4 className="text-sm font-semibold text-[#1A3C34] font-headings">{localTaxes.title}</h4>
              <p>{localTaxes.tp_exon}</p>
              <p className="pt-2 border-t border-gray-100 text-gray-500">{localTaxes.rural_location}</p>
            </div>

            {/* Valuation and exit */}
            <div className="bg-[#FBFBF8] p-6 rounded-lg border border-gray-150 shadow-sm border-l-4 border-l-[#8B5E3C] space-y-2">
              <h4 className="text-sm font-semibold text-[#8B5E3C] font-headings">{valuationExit.title}</h4>
              <p className="text-gray-700">{valuationExit.description}</p>
            </div>
          </div>
        </div>
      );
    }

    // Study: PLAN DE TRÉSORERIE
    if (slug === "tresorerie") {
      const cadrage = content.cadrage || {};
      const table = content.table || [];
      const missions = content.missions || [];
      const advantages = content.advantages || [];
      const allocation = content.allocation || [];

      return (
        <div className="space-y-8 animate-fadeIn text-gray-800">
          {/* Cadrage Panel */}
          <div className="bg-[#FBFBF8] p-6 rounded-lg border border-gray-150 shadow-sm space-y-3">
            <h4 className="text-sm font-semibold text-[#1A3C34] font-headings">Cadrage de Phase 1 : Amorçage Opérationnel</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs border-b border-gray-100 pb-3">
              <div>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Période d&apos;Étude</span>
                <p className="font-semibold text-gray-700">{cadrage.period}</p>
              </div>
              <div>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Enveloppe Financière</span>
                <p className="font-semibold text-gray-700">{cadrage.funding}</p>
              </div>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed font-light mt-2">{cadrage.philosophy}</p>
          </div>

          {/* Cash flow ledger table */}
          <div className="bg-white rounded-lg border border-gray-200/60 shadow-sm overflow-hidden text-xs">
            <div className="p-6 border-b border-gray-200/60">
              <h4 className="text-sm font-semibold text-[#1A3C34] font-headings">Livre des Flux Financiers d&apos;Amorçage</h4>
              <p className="text-xs text-gray-400 mt-1">Dépenses réelles encourues et solde de trésorerie consolidé au 31 Août 2026.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200/60">
                    <th className="p-4 font-semibold text-gray-500 uppercase tracking-wider text-[10px] w-1/4">Type de Flux</th>
                    <th className="p-4 font-semibold text-gray-500 uppercase tracking-wider text-[10px] w-1/2">Libellé de la Dépense</th>
                    <th className="p-4 font-semibold text-gray-500 uppercase tracking-wider text-[10px] w-1/4 text-right">Montant (MAD)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {table.map((row: any, idx: number) => {
                    const isIncome = row.type === "ENCAISSEMENTS";
                    const isTotal = row.type === "TOTAUX";
                    const isClosing = row.type === "SOLDE";
                    
                    return (
                      <tr 
                        key={idx} 
                        className={`hover:bg-gray-50/50 transition-colors ${
                          isClosing ? "bg-emerald-50/30 font-bold border-t border-gray-200" :
                          isTotal ? "bg-gray-50 font-semibold" : ""
                        }`}
                      >
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase ${
                            isIncome ? "bg-emerald-50 text-emerald-700" :
                            isClosing ? "bg-[#1A3C34] text-white" :
                            isTotal ? "bg-gray-150 text-gray-700" : "bg-red-50 text-red-700"
                          }`}>
                            {row.type}
                          </span>
                        </td>
                        <td className="p-4">
                          <p className="text-gray-900">{row.label}</p>
                          {row.source && <span className="block text-[9px] text-gray-400 font-mono mt-0.5">Sourcing : {row.source}</span>}
                        </td>
                        <td className={`p-4 text-right font-mono text-sm ${
                          isIncome ? "text-emerald-600 font-semibold" :
                          isClosing ? "text-[#1A3C34] text-base" :
                          isTotal ? "text-gray-800" : "text-red-600"
                        }`}>
                          {row.amount > 0 ? "+" : ""}{row.amount.toLocaleString("fr-FR")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed font-light text-gray-600">
            {/* Missions checklist */}
            <div className="bg-white p-6 rounded-lg border border-gray-200/60 shadow-sm space-y-4">
              <h4 className="text-sm font-semibold text-[#1A3C34] font-headings">Missions d&apos;Ingénierie Réalisées</h4>
              <ul className="space-y-2.5 pl-4 list-disc text-gray-500">
                {missions.map((mission: string, idx: number) => (
                  <li key={idx}>{mission}</li>
                ))}
              </ul>
            </div>

            {/* Strategic advantages */}
            <div className="bg-white p-6 rounded-lg border border-gray-200/60 shadow-sm space-y-4">
              <h4 className="text-sm font-semibold text-[#1A3C34] font-headings">Avantages Structurels de la Phase d&apos;Amorçage</h4>
              <ul className="space-y-2.5 pl-4 list-disc text-gray-500">
                {advantages.map((adv: string, idx: number) => (
                  <li key={idx}>{adv}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      );
    }

    // Study: INVESTMENT EXECUTIVE SUMMARY
    if (slug === "exec-summary") {
      const vision = content.vision || {};
      const valueProp = content.value_prop || {};
      const marketStrategy = content.market_strategy || {};
      const financialAnalysis = content.financial_analysis || {};

      return (
        <div className="space-y-8 animate-fadeIn text-gray-800">
          {/* Main Vision Callout */}
          <div className="bg-[#1A3C34] text-white p-8 rounded-lg shadow-sm border border-[#1A3C34] space-y-3">
            <span className="text-[10px] font-bold text-[#8B5E3C] uppercase tracking-[0.2em] font-mono block">
              {vision.title || "1. Vision & Hospitalité Régénérative"}
            </span>
            <p className="text-lg md:text-xl font-headings leading-relaxed font-light text-[#FBFBF8]">
              {vision.text}
            </p>
          </div>

          {/* Value Propositions */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-widest font-mono">
              {valueProp.title || "2. Proposition de Valeur Stratégique"}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs leading-relaxed font-light text-gray-600">
              <div className="bg-white p-6 rounded-lg border border-gray-200/60 shadow-sm">
                <span className="text-[9px] font-bold text-[#8B5E3C] uppercase tracking-widest block mb-1">Architecture Réversible</span>
                <p>{valueProp.sanctuary}</p>
              </div>
              <div className="bg-white p-6 rounded-lg border border-gray-200/60 shadow-sm">
                <span className="text-[9px] font-bold text-[#8B5E3C] uppercase tracking-widest block mb-1">Canaux Hyper-Ciblés</span>
                <p>{valueProp.exclusivity}</p>
              </div>
              <div className="bg-white p-6 rounded-lg border border-gray-200/60 shadow-sm">
                <span className="text-[9px] font-bold text-[#8B5E3C] uppercase tracking-widest block mb-1">Modèle Économique</span>
                <p>{valueProp.economic_model}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed font-light text-gray-600">
            {/* Market Strategy */}
            <div className="bg-white p-6 rounded-lg border border-gray-200/60 shadow-sm space-y-4">
              <h4 className="text-sm font-semibold text-[#1A3C34] font-headings">
                {marketStrategy.title || "3. Stratégie de Marché & Positionnement"}
              </h4>
              <div className="space-y-3">
                <div>
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Positionnement éco-luxe</span>
                  <p className="mt-0.5">{marketStrategy.positioning}</p>
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Canaux de commercialisation</span>
                  <p className="mt-0.5">{marketStrategy.distribution}</p>
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Autonomie OPEX</span>
                  <p className="mt-0.5">{marketStrategy.sustainability}</p>
                </div>
              </div>
            </div>

            {/* Financial Analysis */}
            <div className="bg-white p-6 rounded-lg border border-gray-200/60 shadow-sm space-y-4 flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-semibold text-[#1A3C34] font-headings">
                  {financialAnalysis.title || "4. Analyse Financière & Sourcing"}
                </h4>
                <div className="space-y-3 mt-1">
                  <div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Gestion et réallocation CAPEX</span>
                    <p className="mt-0.5">{financialAnalysis.capex}</p>
                  </div>
                  <div className="pt-2 border-t border-gray-100">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Thèse d&apos;Investissement</span>
                    <p className="mt-0.5">{financialAnalysis.thesis}</p>
                  </div>
                </div>
              </div>
              <div className="bg-[#8B5E3C]/5 border-l-2 border-[#8B5E3C] p-3 rounded-r text-[#8B5E3C] font-semibold mt-2">
                Launch : {financialAnalysis.opening}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Study: GOUVERNANCE & EXCELLENCE
    if (slug === "gouvernance") {
      const members = content.members || [];

      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
          {members.map((member: any, idx: number) => (
            <div key={idx} className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm flex flex-col justify-between">
              <div>
                <h4 className="font-semibold text-gray-800 text-base font-headings">{member.name}</h4>
                <p className="text-[10px] font-bold text-[#8B5E3C] uppercase tracking-wider mt-1">{member.role}</p>
                <p className="text-gray-500 text-xs mt-4 leading-relaxed font-light font-body">{member.desc}</p>
              </div>
            </div>
          ))}
        </div>
      );
    }

    // Fallback for custom / dynamically added studies
    return (
      <div className="bg-white p-8 rounded-lg border border-gray-100 shadow-sm animate-fadeIn">
        <div 
          className="prose prose-sm max-w-none text-gray-600 font-light font-body"
          dangerouslySetInnerHTML={{ __html: typeof content === 'string' ? content : JSON.stringify(content, null, 2) }}
        />
      </div>
    );
  };

  return (
    <div className="space-y-8 max-w-5xl animate-fadeIn">
      {/* Category Name */}
      <div>
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8B5E3C] font-mono block">
          {category || "Dossier d'Investissement"}
        </span>
      </div>

      {/* Restructured and styled Rubric Presentation */}
      {intro_text && (
        <div className="bg-[#FBFBF8] p-6 rounded-lg border-l-4 border-l-[#1A3C34] shadow-sm space-y-3">
          {introTitle && (
            <h3 className="text-[#1A3C34] font-headings text-sm md:text-base font-semibold italic leading-normal">
              {introTitle}
            </h3>
          )}
          {introParagraphs.map((p, i) => (
            <p key={i} className="text-gray-600 text-xs md:text-sm leading-relaxed font-light font-body">
              {p}
            </p>
          ))}
        </div>
      )}

      {/* Thin Divider */}
      <div className="border-t border-gray-200/60 my-4"></div>

      {/* Sub-rubric / Study Title */}
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-800 font-headings">
          {title}
        </h1>
      </div>

      {/* Access checks & Details Render */}
      {!hasAccess ? (
        <div className="bg-[#eae9e5]/40 p-10 rounded-xl border border-gray-200/60 shadow-sm flex flex-col items-center text-center space-y-6">
          <div className="w-14 h-14 bg-gray-200/50 text-[#1A3C34] rounded-full flex items-center justify-center shadow-inner">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div className="max-w-md space-y-2">
            <h3 className="text-lg font-semibold text-gray-800 font-headings">Contenu réservé</h3>
            <p className="text-sm text-gray-500 leading-relaxed font-light">
              L&apos;accès à l&apos;intégralité de cette étude (indicateurs financiers clés, projections stratégiques, cahier des charges technique et équipes de direction) requiert une habilitation spécifique.
            </p>
          </div>
          <div>
            <a
              href={`mailto:invest@mawarif.com?subject=Demande d'accès : ${encodeURIComponent(title)}&body=Bonjour,%0D%0A%0D%0AJe souhaite demander l'accès à l'étude "${encodeURIComponent(title)}" dans le cadre de mon espace investisseur.%0D%0A%0D%0ACordialement.`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#1A3C34] hover:bg-[#1A3C34]/90 text-white rounded-full text-xs font-semibold uppercase tracking-wider transition-all hover:shadow-md"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Demander l&apos;accès par e-mail
            </a>
          </div>
        </div>
      ) : pdf_path ? (
        <PDFViewer slug={slug} userEmail={userEmail} />
      ) : (
        renderDetails()
      )}
    </div>
  );
}
