import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function verifyAdmin(request: Request): Promise<boolean> {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("[verifyAdmin] En-tête Authorization manquant ou invalide");
      return false;
    }
    const token = authHeader.split(" ")[1];

    // Create client to verify token
    const supabaseClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "");
    const { data: { user }, error } = await supabaseClient.auth.getUser(token);
    
    if (error || !user) {
      console.log("[verifyAdmin] Échec de la vérification du token auth:", error?.message);
      return false;
    }

    // Check role in profiles table
    const { data: profile, error: pError } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (pError || !profile) {
      console.log("[verifyAdmin] Profil introuvable pour l'UID:", user.id, pError?.message);
      return false;
    }

    console.log(`[verifyAdmin] Rôle détecté: ${profile.role} pour l'e-mail ${user.email}`);
    return profile.role === "admin";
  } catch (err: any) {
    console.error("[verifyAdmin] Exception attrapée:", err.message);
    return false;
  }
}

export async function POST(request: Request) {
  const isAdmin = await verifyAdmin(request);
  if (!isAdmin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  try {
    const { email, password, fullName } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email et mot de passe requis" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (error) {
      console.error("[POST User] Erreur Supabase admin.createUser:", error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.log("[POST User] Compte créé avec succès pour:", email);
    return NextResponse.json({ user: data.user }, { status: 201 });
  } catch (err: any) {
    console.error("[POST User] Exception:", err.message);
    return NextResponse.json({ error: err.message || "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const isAdmin = await verifyAdmin(request);
  if (!isAdmin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("id");

    if (!userId) {
      return NextResponse.json({ error: "ID utilisateur requis" }, { status: 400 });
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
      console.error("[DELETE User] Erreur Supabase admin.deleteUser:", error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.log("[DELETE User] Compte supprimé avec succès:", userId);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[DELETE User] Exception:", err.message);
    return NextResponse.json({ error: err.message || "Erreur serveur" }, { status: 500 });
  }
}
