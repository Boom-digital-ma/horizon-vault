import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Admin client to bypass storage RLS and profiles check
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const slug = (await params).slug;
    
    // 1. Authenticate user from Bearer Token
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];

    const supabaseClient = createClient(supabaseUrl, anonKey);
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Session invalide ou expirée" }, { status: 401 });
    }

    // 2. Fetch Study info to get ID and pdf_path
    const { data: study, error: studyError } = await supabaseAdmin
      .from("studies")
      .select("id, pdf_path")
      .eq("slug", slug)
      .single();

    if (studyError || !study) {
      return NextResponse.json({ error: "Étude introuvable" }, { status: 404 });
    }

    if (!study.pdf_path) {
      return NextResponse.json({ error: "Cette étude n'a pas de version PDF associée" }, { status: 400 });
    }

    // 3. Verify user authorization (admin role OR record in user_study_access)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role, is_active")
      .eq("id", user.id)
      .single();

    if (profileError || !profile || profile.is_active === false) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const isAdmin = profile.role === "admin";
    
    if (!isAdmin) {
      // Check if user has explicit access
      const { data: access, error: accessError } = await supabaseAdmin
        .from("user_study_access")
        .select("id")
        .eq("user_id", user.id)
        .eq("study_id", study.id)
        .maybeSingle();

      if (accessError || !access) {
        return NextResponse.json({ error: "Vous n'avez pas l'autorisation d'accéder à cette étude" }, { status: 403 });
      }
    }

    // 4. Download PDF from Supabase Storage (either by full URL or relative path)
    let buffer: ArrayBuffer;
    
    if (study.pdf_path.startsWith("http://") || study.pdf_path.startsWith("https://")) {
      const res = await fetch(study.pdf_path);
      if (!res.ok) {
        console.error(`[PDF API] Failed to fetch PDF from URL: ${res.statusText}`);
        return NextResponse.json({ error: "Impossible de récupérer le fichier PDF via son URL" }, { status: 500 });
      }
      buffer = await res.arrayBuffer();
    } else {
      const { data: fileData, error: downloadError } = await supabaseAdmin.storage
        .from("studies")
        .download(study.pdf_path);

      if (downloadError || !fileData) {
        console.error("[PDF API] Error downloading file from storage:", downloadError?.message);
        return NextResponse.json({ error: "Impossible de récupérer le fichier PDF depuis le stockage" }, { status: 500 });
      }
      buffer = await fileData.arrayBuffer();
    }

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline; filename=study.pdf",
        "Cache-Control": "private, no-store, must-revalidate",
        "Pragma": "no-cache",
      },
    });

  } catch (err: any) {
    console.error("[PDF API] Exception:", err.message);
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
  }
}
