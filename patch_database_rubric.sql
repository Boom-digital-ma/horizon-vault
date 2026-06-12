-- ==========================================================
-- SQL PATCH FOR PROFILES (is_active, recursion fix), CATEGORIES & STUDIES (arborescence)
-- Run this in your Supabase SQL Editor (https://supabase.com)
-- ==========================================================

-- 1. Ensure 'is_active' column exists on public.profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- 2. Define is_admin SECURITY DEFINER function to prevent RLS recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN SECURITY DEFINER AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql;

-- 3. Recreate RLS policies with recursion fix
DROP POLICY IF EXISTS "Profiles are updateable by admin only" ON public.profiles;
CREATE POLICY "Profiles are updateable by admin only" ON public.profiles
    FOR ALL TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Studies are readable by admin" ON public.studies;
CREATE POLICY "Studies are readable by admin" ON public.studies
    FOR ALL TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Access table is manageable by admin only" ON public.user_study_access;
CREATE POLICY "Access table is manageable by admin only" ON public.user_study_access
    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Analytics readable by admin" ON public.user_study_analytics;
CREATE POLICY "Analytics readable by admin" ON public.user_study_analytics
    FOR SELECT TO authenticated USING (public.is_admin());


-- 4. Backfill existing authenticated users into public.profiles
INSERT INTO public.profiles (id, email, role, full_name, is_active)
SELECT 
    id, 
    email, 
    CASE 
        WHEN email = 'admin@mawarif.com' THEN 'admin'::public.user_role 
        ELSE 'user'::public.user_role 
    END as role,
    COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)) as full_name,
    true as is_active
FROM auth.users
ON CONFLICT (id) DO NOTHING;


-- 5. Configure Realtime & Replica Identity for tables
DO $$
BEGIN
  -- Add profiles table to publication if not already present
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_rel pr
    JOIN pg_class c ON pr.prrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    JOIN pg_publication p ON pr.prpubid = p.oid
    WHERE p.pubname = 'supabase_realtime'
      AND n.nspname = 'public'
      AND c.relname = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;

  -- Add user_study_access table to publication if not already present
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_rel pr
    JOIN pg_class c ON pr.prrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    JOIN pg_publication p ON pr.prpubid = p.oid
    WHERE p.pubname = 'supabase_realtime'
      AND n.nspname = 'public'
      AND c.relname = 'user_study_access'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_study_access;
  END IF;
END $$;

ALTER TABLE public.user_study_access REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;


-- 6. Create public.categories table
CREATE TABLE IF NOT EXISTS public.categories (
    name TEXT PRIMARY KEY,
    intro_text TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0
);

-- Enable RLS on Categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Categories are readable by all authenticated users" ON public.categories;
CREATE POLICY "Categories are readable by all authenticated users" ON public.categories
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Categories are manageable by admin only" ON public.categories;
CREATE POLICY "Categories are manageable by admin only" ON public.categories
    FOR ALL TO authenticated USING (public.is_admin());


-- 7. Seed categories details
INSERT INTO public.categories (name, intro_text, order_index) VALUES
(
    'Bienvenue au cœur de la Vision MawaRif',
    'MawaRif Forest Sanctuary : L’Architecture d’une Nouvelle Ère

Plus qu’une destination, MawaRif Forest Sanctuary incarne une mutation profonde de l’hospitalité d’exception, là où le luxe matériel s’efface au profit d’une quête de sens, de régénération et d’alignement éthique.
Les documents qui suivent détaillent l’architecture stratégique d’un projet qui ne se contente pas de s’intégrer dans le paysage actuel, mais qui aspire à en définir le futur. À travers ces pages, vous explorerez comment nous avons conçu ce sanctuaire pour répondre aux aspirations les plus intimes d’une clientèle ultra-fortunée, en quête de déconnexion radicale et d’expériences transformatrices.
Nous vous invitons à découvrir la rigueur de notre positionnement, la précision de notre écosystème de distribution et l’audace de notre approche marketing. Cette étude dévoile la feuille de route d’un modèle économique unique, où l’exclusivité, l’innovation technologique et la préservation de l’identité bioculturelle marocaine convergent pour créer une valeur durable et inédite sur le marché.
Plongez dans les fondements de ce qui promet d''être le nouveau benchmark de l''ultra-luxe régénératif au Maroc.',
    1
),
(
    'L''architecture de la performance',
    'L’équilibre parfait entre respect écologique et excellence technique.

Cette section regroupe l’ensemble des études techniques et architecturales qui sous-tendent la réalisation physique de MawaRif. Elle détaille nos principes constructifs innovants à zéro impact au sol (structures sur pilotis vissés, autonomie énergétique de pointe) ainsi que la ventilation de notre budget d''investissement initial (CAPEX) et nos représentations 3D.',
    2
),
(
    'Trajectoire D''investissement, L''art de l''allocation stratégique',
    'La modélisation financière rigoureuse au service d’un rendement d’exception.

Cette section rassemble les documents de prospective financière du projet MawaRif. Destinés aux partenaires institutionnels et investisseurs, ils décrivent le plan directeur financier, la note d’ingénierie fiscale, les prévisions de trésorerie consolidées et notre modélisation de rentabilité soumise à des scénarios de stress-testing.',
    3
),
(
    'Gouvernance',
    'Une équipe d’excellence pour piloter un développement territorial d’envergure.

Présentation des fondateurs du projet MawaRif, de la gouvernance interne, et des partenaires clés unissant leurs expertises pour garantir le succès de la mise en œuvre opérationnelle et de la commercialisation.',
    4
),
-- Temporary default category to avoid foreign key violations on migration
(
    'Dossier d''Investissement',
    'Description en attente de rédaction.',
    99
)
ON CONFLICT (name) DO UPDATE
SET intro_text = EXCLUDED.intro_text,
    order_index = EXCLUDED.order_index;


-- 8. Ensure studies table has category column
ALTER TABLE public.studies ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'Bienvenue au cœur de la Vision MawaRif';
ALTER TABLE public.studies ADD COLUMN IF NOT EXISTS intro_text TEXT NOT NULL DEFAULT '';


-- 9. Update existing studies to valid categories before adding constraint
UPDATE public.studies
SET title = 'Etudes, Budgétisation CAPEX',
    category = 'L''architecture de la performance',
    intro_text = 'Ventilation détaillée des dépenses d''investissement initiales (CAPEX) par postes clés et calendrier de déploiement des fonds.'
WHERE slug = 'financiere';

UPDATE public.studies
SET title = 'Marketing, positionnement et stratégie de marque',
    category = 'Bienvenue au cœur de la Vision MawaRif',
    intro_text = 'Analyse détaillée de l''identité de marque ultra-luxe, du positionnement concurrentiel et des axes de communication médiatique.',
    content = '{
        "market_mutation": {
            "title": "1. Mutation du Marché de l''Hospitalité d''Élite (UHNWIs)",
            "slow_luxe": "Le Passage au « Slow Luxe » : L''opulence matérielle ostentatoire cède la place à une quête d''intention, de déconnexion radicale et de régénération psycho-émotionnelle.",
            "crowd_control": "Le Besoin de « Crowd Control » : La maîtrise absolue de la densité et l’isolement physique total sont devenus les critères suprêmes de l''hospitalité de prestige.",
            "opportunity_mawarif": "L''Opportunité MawaRif : En s’abandonnant au cœur de la canopée séculaire de Jebel Bouhachem, MawaRif ne propose pas un produit hôtelier, mais un Sanctuaire de préservation bioculturelle et spirituelle."
        },
        "visual_identity": {
            "title": "2. Alignement Sémiotique & Redressement de l''Identité Visuelle",
            "description": "L''audit de l''agence marketing impose deux rectifications stratégiques immédiates pour aligner l''image de la marque sur son niveau d''investissement réel (FF&E de 25 000 € à 50 000 € par clé) :",
            "logo_adjustment": {
                "problem": "L''emblème initial présentait une courbe évoquant de manière trop littérale une vague de surf. Cette analogie marine est en totale contradiction avec l''identité de moyenne montagne, l''altitude et la brume forestière de Jebel Bouhachem.",
                "solution": "Modification subtile du tracé pour supprimer toute évocation balnéaire. Le nouvel emblème symbolise désormais la brume mystique se levant sur la canopée ou l''onde paisible du lac artificiel du domaine."
            },
            "baseline_optimization": {
                "problem": "L''utilisation du terme \"eco-resort\" est jugée trop générique et dépréciative. Dans l''esprit des clients de l''ultra-luxe, \"resort\" évoque une hôtellerie de masse déconnectée de l''exclusivité fermée.",
                "solution": "Remplacement de \"eco-resort\" par une formulation statutaire de haute lignée : MawaRif Forest Sanctuary. Ce glissement sémantique justifie immédiatement les Tarifs Journaliers Moyens (TJM) cibles auprès des agences d''élite."
            }
        },
        "niche_segments": {
            "title": "3. Plateforme de Marque & Segmentation de Niche",
            "description": "MawaRif résout une inefficacité du marché mondial en captant deux segments sous-offerts dans le segment des retraites exclusives :",
            "halal_prestige": {
                "title": "Segment 1 : La Clientèle « Halal Prestige » (Moyen-Orient & GCC)",
                "positioning": "Offrir un alignement éthique rigoureux (domaine certifié 100% sans alcool, approvisionnement gastronomique de la ferme à la table certifié Halal, intégration de la sylvothérapie soufie) sans jamais faire de compromis sur les codes esthétiques d''un palace international.",
                "engineering": "L''architecture invisible garantit un zéro vis-à-vis total sur les terrasses, les espaces de vie et les jacuzzis privatifs, répondant à l''exigence non négociable d''intimité des familles du Conseil de coopération du Golfe (CCG)."
            },
            "solo_women": {
                "title": "Segment 2 : Les Voyageuses Solos en Quête d''Introspection",
                "positioning": "Un environnement axé sur la sérénité émotionnelle, la déconnexion mentale et la sécurité.",
                "innovation": "Pour bannir le sentiment d''oppression lié à la présence de gardes physiques (qui brise l''illusion d''isolement en nature), la sécurité est assurée par une barrière virtuelle gérée par intelligence artificielle (Edge AI) en périphérie du domaine. Les caméras thermiques intelligentes protègent le site de manière invisible, offrant une liberté totale aux résidentes."
            }
        },
        "distribution_strategy": {
            "title": "4. Stratégie d''Acquisition & Écosystème de Distribution",
            "description": "L’agence marketing préconise le rejet systématique des canaux de distribution grand public (OTA) pour déployer une architecture de distribution fermée à haute valeur ajoutée.",
            "b2b_elite": {
                "share": "37% du Mix",
                "title": "Partenariats B2B Privés d''Élite",
                "details": "L''effort commercial se concentre exclusivement sur l''intégration et l''animation des réseaux fermés de créateurs de voyages de luxe. Virtuoso & Serandipians : Pénétration directe des portefeuilles des Private Travel Designers internationaux. MawaRif s''impose comme la seule destination éco-régénérative de rupture en Afrique du Nord dans leurs catalogues."
            },
            "sxo_ia": {
                "share": "10% du Mix",
                "title": "Acquisition Sémantique Directe par IA (SXO)",
                "details": "MawaRif externalise sa visibilité sur les moteurs de réponse de nouvelle génération. Contenus Profonds : Le maillage éditorial de la marque est optimisé pour répondre aux requêtes ultra-ciblées générées par les algorithmes d''IA (ex: \"Meilleure retraite spirituelle et éco-lodges de luxe isolés en montagne sans alcool\")."
            },
            "direct_channels": {
                "share": "53% du Mix",
                "title": "Canaux Directs & Cercle Privé MawaRif",
                "club": "Le Club MawaRif (10%) : Accès prioritaire réservé aux membres pour les privatisations complètes (Buyouts) du domaine lors d''événements familiaux ou corporate de prestige.",
                "crm": "CRM Prédictif Privé (43%) : Collecte des préférences holistiques en amont du séjour (profil métabolique pour la cuisine, fragrances pour les rituels de soin) pour une ultra-personnalisation dès l''arrivée au Hub central."
            }
        },
        "roadmap": [
            {
                "date": "Fin 2026",
                "title": "Ajustement Institutionnel",
                "desc": "Finalisation du nouveau guide de marque (Charte graphique : Vert Émeraude Profond, Brun Cèdre Brûlé, Or Sablé). Production des assets de pitch confidentiels pour les courtiers de voyage d''ultra-luxe."
            },
            {
                "date": "S1 2027",
                "title": "Infrastructure Digitale & Pré-Acquisition",
                "desc": "Lancement du site vitrine immersif (style magazine d''art, minimaliste). Structuration des données sémantiques pour le référencement IA (SXO). Interconnexion du CRM de luxe avec le moteur de réservation propriétaire."
            },
            {
                "date": "S2 2027",
                "title": "Récit Sensoriel & Relations Publiques Élite",
                "desc": "Campagnes de Relations Publiques (RP) hyper-sélectives dans les médias cibles (Robb Report, Condé Nast Traveler, Financial Times - How To Spend It). Présence de la direction commerciale aux salons ultra-exclusifs (LE Miami, ILTM Cannes) pour contractualiser avec les agences Virtuoso."
            },
            {
                "date": "Fin 2027 - Début 2028",
                "title": "Activation Opérationnelle",
                "desc": "Organisation des « Séjours Blancs » : Accueil test des leaders d''opinion clés du bien-être mondial et des planificateurs de voyages de familles royales du CCG. Grand Opening et basculement vers le rythme de croisière commercial."
            }
        ]
    }''::jsonb
WHERE slug = ''marketing'';

UPDATE public.studies
SET title = 'Ingénierie Territoriale et Architecturale résiliente',
    category = 'L''architecture de la performance',
    intro_text = 'Spécifications d''éco-conception (construction sur vis de fondation, autonomie énergétique complète) et respect de la biodiversité du Jebel Bouhachem.'
WHERE slug = 'technique';

UPDATE public.studies
SET title = 'Gouvernance & Excellence',
    category = 'Gouvernance',
    intro_text = 'Présentation des membres fondateurs du projet MawaRif, de la gouvernance interne, et des partenaires clés impliqués dans la réussite du projet.'
WHERE slug = 'gouvernance';


-- 10. Link studies table to categories table by adding foreign key constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'studies_category_fkey'
  ) THEN
    ALTER TABLE public.studies 
    ADD CONSTRAINT studies_category_fkey 
    FOREIGN KEY (category) REFERENCES public.categories(name) ON UPDATE CASCADE;
  END IF;
END $$;


-- 11. Insert new studies or update them if they exist
INSERT INTO public.studies (slug, title, category, intro_text, content)
VALUES
(
    'vision-strategique',
    'Vision Stratégique',
    'Bienvenue au cœur de la Vision MawaRif',
    'Présentation de la vision fondatrice du projet MawaRif, de ses valeurs phares et de son ambition en tant que destination éco-touristique d''exception.',
    '{
        "positioning": {
            "title": "1. Le Positionnement : L''Ère de la Post-Opulence",
            "description": "MawaRif se positionne comme le futur benchmark de l''ultra-luxe régénératif et du wellness spirituel au Maroc. Le projet répond à une mutation profonde et structurelle des très hauts patrimoines mondiaux (UHNWIs).",
            "shift_cultural": "Le Shift Culturel : L''opulence matérielle et ostentatoire recule au profit d''expériences de transformation personnelle, de santé durable et d''alignement éthique.",
            "infrastructure": "Une Infrastructure Post-Opulence : MawaRif est conçu comme une infrastructure spirituelle et environnementale, et non comme un simple produit hôtelier."
        },
        "market_dynamics": {
            "title": "2. La Dynamique de Marché : Un Segment à Forte Valeur",
            "description": "Le tourisme régénératif est l''un des segments qui progresse le plus rapidement au monde :",
            "projections": "Projections Financières : Le marché mondial cible est projeté à 10 milliards de dollars USD d''ici 2034, porté par une croissance annuelle composée (CAGR) de 11% sur le segment ultra-premium.",
            "pricing_premium": "Le Premium Tarifaire : Preuve de la valeur de ce positionnement, les clients acceptent un surcoût moyen de +42% pour des séjours régénératifs par rapport à des séjours de loisirs haut de gamme classiques."
        },
        "moroccan_momentum": {
            "title": "3. Le Momentum Marocain : Une Conjoncture Exceptionnelle (2026)",
            "description": "L''implantation du projet s''inscrit dans un alignement de planètes historique pour le Royaume, catalysé par la Coupe du Monde de la FIFA 2030 :",
            "growth_record": "Une Croissance Record : Le Maroc a enregistré 19,8 millions d''arrivées touristiques en 2025 (+22% sur un an).",
            "anticipated_objectives": "Objectifs Anticipés : La cible nationale de 26 millions de visiteurs, initialement fixée pour 2030, est désormais projetée dès 2028.",
            "state_support": "Soutien Étatique Récompensé : MawaRif s''intègre parfaitement dans la stratégie gouvernementale de déconcentration régionale, qui pousse au développement d''une hôtellerie d''élite alternative dans la région septentrionale (Tanger-Tétouan-Al Hoceima) pour éviter la saturation du Sud."
        },
        "identity_anchoring": {
            "title": "4. L''Ancrage Identitaire : Le Triptyque Conceptuel",
            "description": "L''expérience client est dictée par une triple étymologie qui structure le parcours initiatique du domaine :",
            "mawa": {
                "arabic": "المأوى",
                "meaning": "Le Refuge",
                "details": "Le havre de paix, le paradis le plus haut (Jannat)."
            },
            "rif": {
                "meaning": "La Canopée",
                "details": "L''enracinement physique dans la lisière forestière des montagnes du Nord."
            },
            "maarif": {
                "arabic": "المعارف",
                "meaning": "La Gnose",
                "details": "La contemplation intuitive et la spiritualité d''inspiration soufie (Suhrawardi)."
            }
        },
        "ecological_sanctuary": {
            "title": "5. Le Sanctuaire Écologique : Jebel Bouhachem",
            "description": "Le Domaine I s''établit sur un terrain forestier de 4 hectares doté d''atouts environnementaux uniques :",
            "protected_ecosystem": "Un Écosystème Protégé : Le site est situé au cœur de la réserve naturelle de Jebel Bouhachem, zone centrale de la Réserve de Biosphère Intercontinentale de la Méditerranée de l''UNESCO.",
            "seasonality_smoothing": "Un Atout d''Exploitation (Lissage de la Saisonnalité) : Grâce à un microclimat montagnard frais et tempéré en été, le resort s''affranchit de la forte saisonnalité du littoral ou des zones désertiques intérieures, garantissant une activité lissée sur toute l''année.",
            "circular_heritage": "Un Héritage Circulaire : En s''appuyant sur l''historique écotouristique local, MawaRif collabore avec des coopératives de l''artisanat et du terroir (Ithri Taounil pour le miel, Nissae Bades pour le textile et les arts de la table)."
        }
    }'::jsonb
),
(
    'benchmark',
    'Analyse Comparative et benchmark',
    'Bienvenue au cœur de la Vision MawaRif',
    'Étude comparative des resorts éco-luxe de référence mondiaux et analyse des facteurs clés de succès applicables au positionnement de MawaRif.',
    '{"message": "Étude de benchmark en cours de validation."}'::jsonb
),
(
    'distribution',
    'Stratégie de Commercialisation et canaux de distribution',
    'Bienvenue au cœur de la Vision MawaRif',
    'Plan de commercialisation, segmentation de la clientèle cible internationale et partenariats avec les agences de voyage haut de gamme.',
    '{
        "intro": "L''ingénierie commerciale de MawaRif refuse les canaux de masse (Booking.com, Expedia) qui diluent l''image de marque et érodent les marges. Notre modèle repose sur un écosystème de distribution fermé, hyper-ciblé, articulé autour de deux segments de niche mondiaux à très forte rentabilité.",
        "segmentation": {
            "title": "1. Segmentation Approfondie des Cibles de Haute Contribution",
            "description": "Le Domaine I cible une clientèle internationale caractérisée par un panier moyen élevé et une exigence d''exclusivité absolue.",
            "halal_prestige": {
                "title": "A. La Clientèle « Halal Prestige » (Moyen-Orient, GCC & Diaspora d''Élite)",
                "specs": "Intimité totale, absence absolue de vis-à-vis (notamment pour les terrasses et jacuzzis privatifs), domaine certifié 100% sans alcool, et offre culinaire de niveau gastronomique exclusivement certifiée Halal (concept de la ferme à la table).",
                "lever": "Ce segment est structurellement sous-offert dans l''hôtellerie d''ultra-luxe occidentale. MawaRif devient le premier sanctuaire mondial à combiner les codes physiques des grands palaces (Aman, Singita) avec une éthique de séjour rigouusement alignée sur leurs valeurs."
            },
            "solo_women": {
                "title": "B. Les Voyageuses Solos en Quête d''Introspection",
                "specs": "Sécurité parfaite, sérénité psycho-émotionnelle et discrétion absolue du personnel.",
                "lever": "Pour rassurer cette clientèle premium, MawaRif déploie une barrière de sécurité virtuelle invisible gérée par intelligence artificielle (Edge AI) à la périphérie des 4 hectares. Ce dispositif technologique non intrusif remplace les rondes physiques de sécurité, préservant le sentiment d''isolement total en nature tout en garantissant un niveau de protection de niveau ambassade."
            }
        },
        "distribution_mix": {
            "title": "2. Le Mix de Distribution Élite (Canaux de Capture de Valeur)",
            "description": "Le modèle de vente est conçu pour maximiser les revenus directs et optimiser le coût d''acquisition client (CAC).",
            "b2b_elite": {
                "share": "37%",
                "title": "Partenariats Réseaux de Prestige",
                "details": "Affiliation et contractualisation active auprès des deux instances mondiales régissant le voyage d''ultra-luxe : Virtuoso & Serandipians (ex-Traveller Made) : Intégration dans ces réseaux fermés permettant de toucher directement un portefeuille mondial de conseillers en voyages (Private Travel Designers) gérant les fortunes des segments de premier plan (Forbes Billionaires List).",
                "impact": "Accès direct à une clientèle captive à haut panier moyen, garantissant un flux de réservations résilient, même en période de volatilité macroéconomique."
            },
            "sxo_ia": {
                "share": "10%",
                "title": "Acquisition Sémantique Directe par IA : Le SXO",
                "details": "MawaRif anticipe la mutation des moteurs de recherche vers les moteurs de réponse basés sur l''intelligence artificielle (Gemini, Perplexity, OpenAI).",
                "tech": "Technologie Search Experience Optimization (SXO) : Structuration technique de notre empreinte numérique (données structurées, maillage de contenus profonds sur le bien-être bioculturel, la sylvothérapie soufie et l''ingénierie réversible) pour être systématiquement référencé comme la réponse numéro un lors de requêtes vocales ou textuelles d''élite. Exemple de requête captée : « Quel est le meilleur éco-sanctuaire d''ultra-luxe sans alcool et sécurisé en Afrique du Nord ? »"
            },
            "direct_channels": {
                "share": "53%",
                "title": "Canaux Directs & Cercle Privé MawaRif",
                "details": "Le levier de rentabilité principal de l''actif.",
                "direct_sales": "Ventes Directes (43%) : Moteur de réservation haut de gamme propriétaire adossé à un CRM prédictif. Chaque interaction client en amont du séjour permet de personnaliser l''expérience (préférences métaboliques, choix des huiles de sylvothérapie, restrictions rituelles).",
                "club": "Le Club MawaRif (10%) : Un programme d''adhésion privé sur invitation destiné aux clients des Buyouts (privatisations totales) et aux habitués, offrant des fenêtres de réservation prioritaires sur les périodes de haute saison et un accès exclusif aux millésimes de séjours spirituels."
            }
        },
        "certifications": {
            "title": "3. Certifications d''Excellence : Les Garanties de Crédibilité ESG",
            "description": "Pour consolider notre positionnement auprès des fonds d''investissement à impact et rassurer les clients sur l''authenticité de notre démarche éco-responsable, MawaRif s''aligne sur les plus hauts labels internationaux :",
            "items": [
                {
                    "name": "The Butterfly Mark (Positive Luxury)",
                    "desc": "La certification suprême pour les marques de luxe mondiales, évaluant rigoureusement l''intégration des critères ESG, de la chaîne d''approvisionnement jusqu''aux matériaux constructifs."
                },
                {
                    "name": "EarthCheck Gold",
                    "desc": "Suivi scientifique rigoureux des indicateurs opérationnels du Domaine I (consommation énergétique nette zéro, efficacité de la phyto-épuration, gestion circulaire des déchets forestiers)."
                }
            ]
        },
        "kpis": {
            "title": "4. Indicateurs Clés de Performance Commerciale (KPIs Cibles - Stabilisés 2028)",
            "table": [
                {
                    "metric": "Taux d''Occupation Moyen",
                    "value": "35 %",
                    "rationale": "Calibré sur les standards des Luxury Eco-Lodges de montagne mondiaux (Singita, Amangiri)."
                },
                {
                    "metric": "Coût d''Acquisition Client (CAC)",
                    "value": "< 8,5 % du CA",
                    "rationale": "Optimisé grâce à la prédominance des canaux directs (53%) et du SXO organique par rapport aux commissions d''agences."
                },
                {
                    "metric": "Durée Moyenne de Séjour (LOS)",
                    "value": "3,8 Nuits",
                    "rationale": "Portée par la profondeur des programmes de régénération, de bio-hacking et de retraites spirituelles."
                },
                {
                    "metric": "Revenu par Chambre Disponible (RevPAR)",
                    "value": "651 € (Moyen global)",
                    "rationale": "Performance financière de premier ordre pour le Royaume, surclassant les resorts balnéaires classiques."
                }
            ]
        }
    }'::jsonb
),
(
    'maquettes',
    'Maquettes illustrations 3D',
    'L''architecture de la performance',
    'Rendus réalistes 3D du Hub central, des suites Horizon suspendues et des aménagements paysagers prévus.',
    '{"message": "Galerie de rendus 3D en cours de chargement."}'::jsonb
),
(
    'plan-directeur',
    'Plan Directeur financier',
    'Trajectoire D''investissement, L''art de l''allocation stratégique',
    'Synthèse de la structure financière globale, répartition des apports en capital, besoins de financement et schéma de gouvernance financière.',
    '{"message": "Plan directeur financier en cours d''approbation."}'::jsonb
),
(
    'exec-summary',
    'Investment Executive Summary',
    'Trajectoire D''investissement, L''art de l''allocation stratégique',
    'Résumé exécutif destiné aux partenaires financiers, mettant en évidence les indicateurs clés de rendement (TIR, VAN) et les opportunités d''investissement.',
    '{"message": "Executive summary en cours de révision."}'::jsonb
),
(
    'stress-testing',
    'Modélisation financière Stress-testing',
    'Trajectoire D''investissement, L''art de l''allocation stratégique',
    'Simulations de rentabilité selon différents scénarios d''occupation et d''évolution des tarifs pour valider la robustesse du modèle.',
    '{"message": "Modélisation de stress-testing en cours de calcul."}'::jsonb
),
(
    'fiscale',
    'Note d''ingénierie fiscale',
    'Trajectoire D''investissement, L''art de l''allocation stratégique',
    'Analyse du cadre fiscal applicable au projet (incitations à l''investissement touristique, régime de TVA et impôts sur les sociétés au Maroc).',
    '{"message": "Note fiscale en cours de rédaction juridique."}'::jsonb
),
(
    'tresorerie',
    'Plan de trésorerie consolidé',
    'Trajectoire D''investissement, L''art de l''allocation stratégique',
    'Prévisions mensuelles des flux de trésorerie durant la phase de construction (2026-2027) et les premières années d''exploitation.',
    '{"message": "Plan de trésorerie en cours d''ajustement."}'::jsonb
),
(
    'business-plan',
    'Business plan 2028 prévisionnel',
    'Trajectoire D''investissement, L''art de l''allocation stratégique',
    'Plan d''affaires prévisionnel à horizon 2028 détaillant les comptes de résultat prévisionnels, le seuil de rentabilité et la politique de dividendes.',
    '{"message": "Business plan 2028 en cours de finalisation."}'::jsonb
)
ON CONFLICT (slug) DO UPDATE
SET title = EXCLUDED.title,
    category = EXCLUDED.category,
    intro_text = EXCLUDED.intro_text,
    content = EXCLUDED.content;


-- 12. Create security definer function to read study metadata (safe to run for all authenticated users)
-- Joins the categories table dynamically to get the global category introduction text
CREATE OR REPLACE FUNCTION public.get_all_studies_metadata()
RETURNS TABLE (
    id UUID,
    slug TEXT,
    title TEXT,
    category TEXT,
    intro_text TEXT
) SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY 
    SELECT 
        s.id, 
        s.slug, 
        s.title, 
        s.category, 
        c.intro_text
    FROM public.studies s
    LEFT JOIN public.categories c ON s.category = c.name
    ORDER BY c.order_index ASC, s.title ASC;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION public.get_all_studies_metadata() TO authenticated;
