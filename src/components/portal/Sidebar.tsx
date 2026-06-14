"use client";

interface StudyHeader {
  id: string;
  slug: string;
  title: string;
  category?: string;
  hasAccess?: boolean;
  order_index?: number;
}

interface SidebarProps {
  studies: StudyHeader[];
  activeStudySlug: string;
  onSelectStudy: (slug: string) => void;
  userEmail: string;
  onLogout: () => void;
}

export default function Sidebar({
  studies,
  activeStudySlug,
  onSelectStudy,
  userEmail,
  onLogout,
}: SidebarProps) {
  // Group studies by category
  const categories = studies.reduce((acc, study) => {
    const cat = study.category || "Dossier d'Investissement";
    if (!acc[cat]) {
      acc[cat] = [];
    }
    acc[cat].push(study);
    return acc;
  }, {} as Record<string, StudyHeader[]>);

  const CATEGORY_ORDER = [
    "Bienvenue au cœur de la Vision MawaRif",
    "L'architecture de la performance",
    "Trajectoire D'investissement, L'art de l'allocation stratégique",
    "Gouvernance"
  ];

  return (
    <aside className="w-64 bg-[#eae9e5] border-r border-gray-200 flex flex-col justify-between h-screen sticky top-0 text-gray-800">
      <div>
        {/* Header */}
        <div className="p-6 border-b border-gray-200/70 flex flex-col items-center text-center">
          <img
            src="/images/logo.png"
            alt="MawaRif"
            className="object-contain mb-3"
            style={{ color: "#eae9e5" }}
          />
          <p className="text-[10px] tracking-widest text-[#1A3C34]/80 uppercase font-semibold">
            Espace Investisseurs
          </p>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-4">
          <div>
            <button
              onClick={() => onSelectStudy("")}
              className={`w-full text-left px-3 py-2.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                activeStudySlug === ""
                  ? "bg-[#1A3C34]/10 text-[#1A3C34] font-semibold"
                  : "text-gray-600 hover:bg-gray-200/50 hover:text-gray-900"
              }`}
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Présentation
            </button>
          </div>

          <div className="space-y-4">
            {studies.length === 0 ? (
              <div className="space-y-1">
                <p className="px-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Études disponibles
                </p>
                <p className="px-3 py-2 text-xs text-gray-500 italic">
                  Aucune étude enregistrée.
                </p>
              </div>
            ) : (
              Object.entries(categories)
                .sort(([catA], [catB]) => {
                  const idxA = CATEGORY_ORDER.indexOf(catA);
                  const idxB = CATEGORY_ORDER.indexOf(catB);
                  return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
                })
                .map(([category, items]) => (
                <div key={category} className="space-y-1 pt-2">
                  <p className="px-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    {category}
                  </p>
                  {items
                    .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
                    .map((study) => (
                    <button
                      key={study.id}
                      onClick={() => onSelectStudy(study.slug)}
                      className={`w-full text-left px-3 py-2.5 rounded-md text-sm font-medium transition-colors flex items-center justify-between ${
                        study.slug === activeStudySlug
                          ? "bg-[#1A3C34]/10 text-[#1A3C34] font-semibold"
                          : "text-gray-600 hover:bg-gray-200/50 hover:text-gray-900"
                      }`}
                    >
                      <span className="truncate">{study.title}</span>
                      {!study.hasAccess && (
                        <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <title>Accès restreint</title>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </nav>
      </div>

      {/* Footer Profile & Logout */}
      <div className="p-4 border-t border-gray-200/70 bg-gray-800/5">
        <div className="mb-3">
          <p className="text-[9px] text-gray-400 uppercase font-semibold">Connecté en tant que</p>
          <p className="text-xs font-medium text-gray-700 truncate" title={userEmail}>
            {userEmail}
          </p>
        </div>
        <button
          onClick={onLogout}
          className="w-full text-center py-2 px-3 border border-red-200 rounded text-xs font-medium text-red-600 bg-white hover:bg-red-50 transition-colors"
        >
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
