-- ==========================================
-- SCRIPT DE CONFIGURATION DE LA BASE DE DONNÉES MAWARIF
-- À exécuter dans l'éditeur SQL de votre console Supabase
-- ==========================================

-- 1. Nettoyage éventuel des anciennes tables
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS public.user_study_analytics CASCADE;
DROP TABLE IF EXISTS public.user_study_access CASCADE;
DROP TABLE IF EXISTS public.studies CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TYPE IF EXISTS public.user_role CASCADE;

-- 2. Création de l'Enum pour les rôles
CREATE TYPE public.user_role AS ENUM ('user', 'admin');

-- 3. Table des profils utilisateurs
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    role public.user_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Activation de RLS sur Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Table des études d'investissement
CREATE TABLE public.studies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Dossier d''Investissement',
    intro_text TEXT NOT NULL DEFAULT '',
    content JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Activation de RLS sur Studies
ALTER TABLE public.studies ENABLE ROW LEVEL SECURITY;

-- 5. Table de liaison pour les droits d'accès
CREATE TABLE public.user_study_access (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    study_id UUID REFERENCES public.studies(id) ON DELETE CASCADE,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (user_id, study_id)
);

-- Activation de RLS sur User Study Access
ALTER TABLE public.user_study_access ENABLE ROW LEVEL SECURITY;

-- 6. Table de suivi analytique (clics et temps passé)
CREATE TABLE public.user_study_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    study_id UUID REFERENCES public.studies(id) ON DELETE CASCADE,
    clicks INTEGER DEFAULT 0 NOT NULL,
    time_spent INTEGER DEFAULT 0 NOT NULL, -- en secondes
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (user_id, study_id)
);

-- Activation de RLS sur User Study Analytics
ALTER TABLE public.user_study_analytics ENABLE ROW LEVEL SECURITY;


-- ==========================================
-- FONCTIONS UTILITAIRES DE SÉCURITÉ
-- ==========================================

-- Fonction pour vérifier si l'utilisateur est admin sans récursion RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN SECURITY DEFINER AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql;


-- ==========================================
-- CONFIGURATION DES RÈGLES DE SÉCURITÉ (RLS)
-- ==========================================

-- RLS Profiles
CREATE POLICY "Profiles are readable by authenticated users" ON public.profiles
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Profiles are updateable by admin only" ON public.profiles
    FOR ALL TO authenticated USING (
        public.is_admin()
    );

-- RLS Studies
CREATE POLICY "Studies are readable by admin" ON public.studies
    FOR ALL TO authenticated USING (
        public.is_admin()
    );

CREATE POLICY "Studies are readable by authorized users" ON public.studies
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.user_study_access
            WHERE user_id = auth.uid() AND study_id = studies.id
        )
    );

-- RLS User Study Access
CREATE POLICY "Access table is manageable by admin only" ON public.user_study_access
    FOR ALL TO authenticated USING (
        public.is_admin()
    ) WITH CHECK (
        public.is_admin()
    );

CREATE POLICY "Access table is readable by authenticated users" ON public.user_study_access
    FOR SELECT TO authenticated USING (true);

-- RLS User Study Analytics
CREATE POLICY "Analytics readable and writeable by own user" ON public.user_study_analytics
    FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Analytics readable by admin" ON public.user_study_analytics
    FOR SELECT TO authenticated USING (
        public.is_admin()
    );


-- ==========================================
-- DÉFINITION DES TRIGGERS & FONCTIONS
-- ==========================================

-- Trigger pour créer automatiquement un profil à l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, role, full_name)
    VALUES (
        new.id,
        new.email,
        CASE 
            -- Remplacer par l'e-mail de l'administrateur principal désiré
            WHEN new.email = 'admin@mawarif.com' THEN 'admin'::public.user_role
            ELSE 'user'::public.user_role
        END,
        COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ==========================================
-- INSERTION DES DONNÉES (SEEDER)
-- ==========================================

INSERT INTO public.studies (slug, title, category, intro_text, content) VALUES
(
    'financiere',
    'Étude Financière & Budgétaire',
    'Dossier d''Investissement',
    'Cette étude présente l''analyse financière prospective du projet MawaRif, incluant le détail du budget d''investissement (CAPEX), la structure de rentabilité, l''évolution de la marge EBITDA et les indicateurs clés de performance financière pour les investisseurs.',
    '{
        "kpis": [
            {"label": "CAPEX Total", "value": "80,5 MDH"},
            {"label": "Marge EBITDA", "value": "43,3 %"},
            {"label": "ROI Cible", "value": "18%+"},
            {"label": "Point Mort", "value": "An 2.5"}
        ],
        "capex_table": [
            {"category": "Génie Civil & Passerelles", "specs": "900 m de passerelles sur pilotis, vis acier galvanisé, gros œuvre du Hub", "budget": 22900000},
            {"category": "Hébergements Prestige", "specs": "40 structures complètes (25 Bungalows + 15 Suites Horizon)", "budget": 13750000},
            {"category": "Logistique & Flotte", "specs": "Quads électriques, équipements cuisine pro, flotte personnel, sécurité", "budget": 13800000},
            {"category": "Marketing & BFR", "specs": "Honoraires direction projet, RP internationales, fonds de roulement", "budget": 11200000},
            {"category": "Hub, Spa & Lac", "specs": "Équipements éco-thermiques et création du plan d''eau artificiel", "budget": 9300000},
            {"category": "Conception & Juridique", "specs": "Études d''impact (EIE), architectes, frais d''autorisations et dossiers", "budget": 2300000},
            {"category": "Réserve & Divers", "specs": "Provision pour aléas et imprévus techniques", "budget": 7250000}
        ]
    }'::jsonb
),
(
    'marketing',
    'Marketing, positionnement et stratégie de marque',
    'Bienvenue au cœur de la Vision MawaRif',
    'Analyse détaillée de l''identité de marque ultra-luxe, du positionnement concurrentiel et des axes de communication médiatique.',
    '{
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
    }'::jsonb
),
(
    'technique',
    'Étude Technique & Feuille de Route',
    'Dossier d''Investissement',
    'Cette étude expose les choix d''aménagement écologiques (structures sur vis de fondation, autonomie énergétique complète) et détaille la planification des phases de développement, des autorisations administratives jusqu''à l''ouverture.',
    '{
        "specs": "L''aménagement repose sur une architecture en apesanteur (zéro impact au sol) grâce à des fondations sur vis en acier galvanisé, préservant la canopée du Jebel Bouhachem. L''approvisionnement énergétique sera 100% autonome et éco-thermique.",
        "roadmap": [
            {"date": "Fin 2026", "title": "Fondations Administratives", "desc": "Finalisation du cadre juridique, études d''impact (EIE) et audit architectural."},
            {"date": "S1 2027", "title": "Infrastructure Lourde", "desc": "Relevé LiDAR, installation des fondations sur vis et déploiement des réseaux."},
            {"date": "S2 2027", "title": "Élévation des Superstructures", "desc": "Montage des 40 unités d''hébergement, construction du Hub central et création du lac."},
            {"date": "Fin 2027", "title": "Préparation Commerciale", "desc": "Lancement de la stratégie de RP internationales, recrutement et séjours blancs."},
            {"date": "2028", "title": "Grand Opening", "desc": "Ouverture commerciale officielle et accueil des premiers hôtes."}
        ]
    }'::jsonb
),
(
    'gouvernance',
    'Gouvernance & Excellence',
    'Organisation & Partenaires',
    'Présentation des membres fondateurs du projet MawaRif, de la gouvernance interne, et des partenaires clés impliqués dans la mise en œuvre opérationnelle et la réussite commerciale du projet.',
    '{
        "members": [
            {"name": "Reda Ouaradane", "role": "Visionnaire et Développeur Territorial", "desc": "Orchestre les relations institutionnelles, la sécurisation foncière et la vision stratégique globale pour transformer le potentiel du territoire en actif pérenne."},
            {"name": "Bruno Tolu", "role": "Expert en Aménagements Écologiques", "desc": "Garant de l''éco-conception, de l''intégration paysagère et du respect de l''équilibre organique de la canopée du Jebel Bouhachem."},
            {"name": "Boom Digital", "role": "Agence de communication", "desc": "Accompagnement stratégique exclusif pour sculpter l''identité de marque ultra-luxe, orchestrer le récit et assurer une communication de haute précision."}
        ]
    }'::jsonb
);

-- ==========================================
-- FONCTIONS COMPLÉMENTAIRES
-- ==========================================

-- Création de la fonction SECURITY DEFINER pour lire les métadonnées sans RLS
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
    SELECT s.id, s.slug, s.title, s.category, s.intro_text 
    FROM public.studies s
    ORDER BY s.category DESC, s.title ASC;
END;
$$ LANGUAGE plpgsql;

-- Droits d'exécution de la fonction
GRANT EXECUTE ON FUNCTION public.get_all_studies_metadata() TO authenticated;
