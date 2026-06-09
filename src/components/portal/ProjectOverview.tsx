"use client";

import React from "react";

export default function ProjectOverview() {
  return (
    <div className="space-y-10 animate-fade-in w-full">
      {/* Hero Header */}
      <div className="bg-[#1A3C34] text-[#FBFBF8] p-10 rounded-2xl relative overflow-hidden shadow-md">
        <div className="absolute inset-0 bg-gradient-to-tr from-[#132d27] via-[#1A3C34] to-[#255247] opacity-90" />
        <div className="relative z-10 space-y-4">
          <span className="text-[10px] tracking-widest uppercase font-semibold text-[#E5DCC5]">
            Sanctuaire Sauvage & Territorial
          </span>
          <h1 className="font-serif text-3xl md:text-4xl tracking-wide font-normal">
            MawaRif — Jebel Bouhachem
          </h1>
          <p className="font-serif italic text-lg text-[#E5DCC5]/90 max-w-2xl font-light">
            « Une ascension immobile vers le silence. »
          </p>
          <div className="pt-4 border-t border-white/10 text-sm text-[#FBFBF8]/80 max-w-3xl leading-relaxed font-light">
            Là où la canopée séculaire du Rif frôle le sacré, notre sanctuaire se déploie, suspendu entre terre et ciel. Plus qu’un refuge d&apos;ultra-luxe, une retraite souveraine off-grid à zéro impact environnemental.
          </div>
        </div>
      </div>

      {/* Galerie Sobres Miniatures */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {["img1", "img2", "img3", "img4"].map((img, idx) => (
          <div key={img} className="overflow-hidden rounded-xl border border-gray-200/60 bg-white p-1.5 shadow-sm">
            <img
              src={`/images/${img}.jpeg`}
              alt={`MawaRif Sanctuaire ${idx + 1}`}
              className="object-cover w-full aspect-[3/2] rounded-lg grayscale hover:grayscale-0 transition-all duration-500 ease-in-out cursor-pointer"
            />
          </div>
        ))}
      </div>

      {/* Vision & Concept */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm space-y-4">
          <div className="w-10 h-10 rounded-lg bg-[#1A3C34]/5 flex items-center justify-center text-[#1A3C34]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </div>
          <h3 className="font-serif text-xl font-semibold text-[#1A3C34]">L&apos;Esprit du Projet</h3>
          <p className="text-sm text-gray-600 leading-relaxed font-light">
            MawaRif redéfinit le luxe par la déconnexion radicale, l&apos;isolement physique et le respect rigoureux de la nature. Il ne s&apos;agit pas d&apos;un simple hôtel, mais d&apos;un sanctuaire régénératif au cœur de la montagne marocaine.
          </p>
        </div>

        <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm space-y-4">
          <div className="w-10 h-10 rounded-lg bg-[#1A3C34]/5 flex items-center justify-center text-[#1A3C34]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.07 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" />
            </svg>
          </div>
          <h3 className="font-serif text-xl font-semibold text-[#1A3C34]">Autonomie Off-Grid</h3>
          <p className="text-sm text-gray-600 leading-relaxed font-light">
            Une autonomie énergétique et hydraulique totale. Énergie solaire, systèmes éco-thermiques avancés, gestion circulaire de l&apos;eau et cultures hydroponiques locales garantissent un cycle de vie souverain et résilient.
          </p>
        </div>
      </div>

      {/* Key Pillars */}
      <div className="space-y-6">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Les Piliers du Sanctuaire
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-lg bg-gray-50 border border-gray-100 space-y-2">
            <h4 className="font-medium text-[#1A3C34] text-sm">Déconnexion Radicale</h4>
            <p className="text-xs text-gray-500 leading-relaxed font-light">
              Isolement physique dans le Jebel Bouhachem, architecture propice à la méditation et detox technologique complète.
            </p>
          </div>

          <div className="p-6 rounded-lg bg-gray-50 border border-gray-100 space-y-2">
            <h4 className="font-medium text-[#1A3C34] text-sm">Architecture Suspendue</h4>
            <p className="text-xs text-gray-500 leading-relaxed font-light">
              40 hébergements de prestige construits sur vis en acier galvanisé, survolant le sol forestier sans l&apos;altérer.
            </p>
          </div>

          <div className="p-6 rounded-lg bg-gray-50 border border-gray-100 space-y-2">
            <h4 className="font-medium text-[#1A3C34] text-sm">Impact Régénératif</h4>
            <p className="text-xs text-gray-500 leading-relaxed font-light">
              Restauration de la biodiversité locale, reforestation et co-développement économique avec les communautés locales.
            </p>
          </div>
        </div>
      </div>

      {/* Investment Note */}
      <div className="p-6 rounded-xl border border-amber-100 bg-amber-50/50 flex gap-4 items-start">
        <svg className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div className="space-y-1">
          <h5 className="font-medium text-amber-900 text-sm">Dossiers d&apos;Investissement Confidentiels</h5>
          <p className="text-xs text-amber-800 leading-relaxed font-light">
            Ce portail regroupe les études confidentielles du projet. Utilisez le menu de gauche pour naviguer dans l&apos;analyse financière, la stratégie de positionnement marketing et la feuille de route technique.
          </p>
        </div>
      </div>
    </div>
  );
}
