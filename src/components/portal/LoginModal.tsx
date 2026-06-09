"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabase";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export default function LoginModal({ isOpen, onClose, onLoginSuccess }: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMsg(error.message || "Email ou mot de passe incorrect.");
      } else if (data.session) {
        // Fetch user profile to verify is_active status
        const { data: profile, error: pError } = await supabase
          .from("profiles")
          .select("role, is_active")
          .eq("id", data.session.user.id)
          .single();

        if (pError || !profile) {
          await supabase.auth.signOut();
          setErrorMsg("Erreur lors de la récupération de votre profil.");
        } else if (profile.is_active === false && profile.role !== "admin") {
          await supabase.auth.signOut();
          setErrorMsg("Votre compte a été désactivé. Veuillez contacter l'administrateur.");
        } else {
          onLoginSuccess();
          onClose();
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Une erreur est survenue lors de la connexion.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="login-modal-overlay open" onClick={onClose}>
      <div
        className="login-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        <h3>Espace Partenaire & Investisseur</h3>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-line"
            placeholder="Adresse email"
            required
            disabled={loading}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-line"
            placeholder="Mot de passe"
            required
            disabled={loading}
          />

          {errorMsg && <div className="error-msg">{errorMsg}</div>}

          <button
            type="submit"
            className="btn-confidence"
            style={{ color: "var(--color-cream)", borderColor: "var(--color-cream)", background: "transparent", border: "none", borderBottom: "1px solid var(--color-cream)", paddingBottom: "5px", width: "100%", marginTop: "10px" }}
            disabled={loading}
          >
            {loading ? "Connexion..." : "Valider"}
          </button>
        </form>

        <div style={{ marginTop: "40px" }}>
          <a
            style={{ fontSize: "0.8rem", color: "var(--color-mist)", cursor: "pointer" }}
            onClick={onClose}
          >
            Fermer
          </a>
        </div>
      </div>
    </div>
  );
}
