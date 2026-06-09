"use client";

interface StudyContentProps {
  study: {
    slug: string;
    title: string;
    content: any;
  };
}

export default function StudyContent({ study }: StudyContentProps) {
  const { slug, title, content } = study;

  // Render Financial Study
  if (slug === "financiere") {
    const kpis = content.kpis || [];
    const capexTable = content.capex_table || [];
    const capexTotal = capexTable.reduce((sum: number, row: any) => sum + (Number(row.budget) || 0), 0);

    return (
      <div className="space-y-8 animate-fadeIn">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">{title}</h1>
          <p className="text-sm text-gray-400 mt-1">Données financières et projections d&apos;investissement</p>
        </div>

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
            <h3 className="text-base font-semibold text-gray-800">Ventilation du Budget d&apos;Investissement (CAPEX)</h3>
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
                    {capexTotal.toLocaleString("fr-FR")}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // Render Marketing Study
  if (slug === "marketing") {
    const prStrategy = content.pr_strategy || [];

    return (
      <div className="space-y-8 animate-fadeIn">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">{title}</h1>
          <p className="text-sm text-gray-400 mt-1">Positionnement de marque et stratégie commerciale</p>
        </div>

        {/* Positioning */}
        <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm space-y-3">
          <h3 className="text-base font-semibold text-gray-800">Positionnement Stratégique</h3>
          <p className="text-gray-600 leading-relaxed font-light">{content.positioning}</p>
        </div>

        {/* PR Strategy */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-gray-800">Actions & Axes de Communication</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {prStrategy.map((strat: any, idx: number) => (
              <div key={idx} className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm border-t-4 border-t-[#8B5E3C]">
                <h4 className="font-semibold text-gray-800 text-sm">{strat.title}</h4>
                <p className="text-gray-500 text-xs mt-2 leading-relaxed">{strat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Render Technical Study
  if (slug === "technique") {
    const roadmap = content.roadmap || [];

    return (
      <div className="space-y-8 animate-fadeIn">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">{title}</h1>
          <p className="text-sm text-gray-400 mt-1">Spécifications techniques, éco-conception et feuille de route</p>
        </div>

        {/* Technical Specifications */}
        <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm space-y-3">
          <h3 className="text-base font-semibold text-gray-800">Spécifications Techniques & Écologiques</h3>
          <p className="text-gray-600 leading-relaxed font-light">{content.specs}</p>
        </div>

        {/* Operational Roadmap (Timeline) */}
        <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm space-y-6">
          <h3 className="text-base font-semibold text-gray-800">Feuille de Route Opérationnelle</h3>
          <div className="relative pl-6 border-l-2 border-gray-150 space-y-8 mt-4">
            {roadmap.map((item: any, idx: number) => (
              <div key={idx} className="relative">
                {/* Timeline Dot */}
                <div className="absolute -left-[31px] top-1.5 w-3 h-3 rounded-full bg-[#8B5E3C] border-2 border-white"></div>
                <div>
                  <span className="text-xs font-bold text-[#8B5E3C] uppercase tracking-wider">{item.date}</span>
                  <h4 className="text-sm font-semibold text-gray-800 mt-0.5">{item.title}</h4>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Render Governance Study
  if (slug === "gouvernance") {
    const members = content.members || [];

    return (
      <div className="space-y-8 animate-fadeIn">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">{title}</h1>
          <p className="text-sm text-gray-400 mt-1">Organigramme de direction et partenaires clés</p>
        </div>

        {/* Governance Members Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {members.map((member: any, idx: number) => (
            <div key={idx} className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm flex flex-col justify-between">
              <div>
                <h4 className="font-semibold text-gray-800 text-base">{member.name}</h4>
                <p className="text-[10px] font-bold text-[#8B5E3C] uppercase tracking-wider mt-1">{member.role}</p>
                <p className="text-gray-500 text-xs mt-4 leading-relaxed font-light">{member.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Fallback for custom / dynamically added studies
  return (
    <div className="bg-white p-8 rounded-lg border border-gray-100 shadow-sm animate-fadeIn">
      <h1 className="text-2xl font-semibold text-gray-800 mb-4">{title}</h1>
      <div 
        className="prose prose-sm max-w-none text-gray-600 font-light"
        dangerouslySetInnerHTML={{ __html: typeof content === 'string' ? content : JSON.stringify(content, null, 2) }}
      />
    </div>
  );
}
