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
-- CONFIGURATION DES RÈGLES DE SÉCURITÉ (RLS)
-- ==========================================

-- RLS Profiles
CREATE POLICY "Profiles are readable by authenticated users" ON public.profiles
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Profiles are updateable by admin only" ON public.profiles
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Studies
CREATE POLICY "Studies are readable by admin" ON public.studies
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
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
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Access table is readable by authenticated users" ON public.user_study_access
    FOR SELECT TO authenticated USING (true);

-- RLS User Study Analytics
CREATE POLICY "Analytics readable and writeable by own user" ON public.user_study_analytics
    FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Analytics readable by admin" ON public.user_study_analytics
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
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

INSERT INTO public.studies (slug, title, content) VALUES
(
    'financiere',
    'Étude Financière & Budgétaire',
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
    'Étude Marketing & Stratégie',
    '{
        "positioning": "MawaRif s''impose comme l''unique refuge d''ultra-luxe éco-conçu en Afrique du Nord, combinant déconnexion radicale, immersion sauvage et conscience écologique stricte. La cible est constituée d''une clientèle internationale de niche recherchant la confidentialité absolue et le ressourcement.",
        "pr_strategy": [
            {"title": "Relations Presse Internationales", "desc": "Campagnes ciblées auprès des magazines spécialisés luxe & design (Condé Nast, Wallpaper, AD) dès fin 2027."},
            {"title": "Filière Ultra-Courte", "desc": "Mise en avant de la gastronomie des origines et des serres hydroponiques comme argument d''exclusivité sensorielle."}
        ]
    }'::jsonb
),
(
    'technique',
    'Étude Technique & Feuille de Route',
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
    '{
        "members": [
            {"name": "Reda Ouaradane", "role": "Visionnaire et Développeur Territorial", "desc": "Orchestre les relations institutionnelles, la sécurisation foncière et la vision stratégique globale pour transformer le potentiel du territoire en actif pérenne."},
            {"name": "Bruno Tolu", "role": "Expert en Aménagements Écologiques", "desc": "Garant de l''éco-conception, de l''intégration paysagère et du respect de l''équilibre organique de la canopée du Jebel Bouhachem."},
            {"name": "Boom Digital", "role": "Agence de communication", "desc": "Accompagnement stratégique exclusif pour sculpter l''identité de marque ultra-luxe, orchestrer le récit et assurer une communication de haute précision."}
        ]
    }'::jsonb
);
