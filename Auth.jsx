import React, { useState } from "react";
import { C, fontSerif, fontBody } from "./theme";
import * as api from "./api";
import defaultAvatarUrl from "./default-avatar.jpg";

export function Field({ label, value, onChange, type = "text" }) {
  return (
    <label style={{ display: "block" }}>
      <span style={{ fontSize: 12, fontWeight: 500, color: C.textMuted, marginBottom: 4, display: "block" }}>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          border: `1px solid ${C.inputBorder}`,
          borderRadius: 12,
          padding: "10px 14px",
          background: "#FFFFFF",
          color: C.text,
          fontSize: 15,
          fontFamily: fontBody,
          boxSizing: "border-box",
        }}
      />
    </label>
  );
}

export default function Auth({ onAuthed }) {
  const [mode, setMode] = useState("welcome"); // welcome | login | create

  const wrap = (children) => (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 24px", fontFamily: fontBody }}>
      <div style={{ width: "100%", maxWidth: 380 }}>{children}</div>
    </div>
  );

  if (mode === "login") return wrap(<LoginForm onBack={() => setMode("welcome")} onAuthed={onAuthed} />);
  if (mode === "create") return wrap(<CreateAccountForm onBack={() => setMode("welcome")} onAuthed={onAuthed} />);

  return wrap(
    <div>
      <img
        src={defaultAvatarUrl}
        alt=""
        style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", marginBottom: 20, border: `2px solid ${C.roseSoft}` }}
      />
      <p style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: C.eyebrow, margin: 0 }}>welcome</p>
      <h1 style={{ fontFamily: fontSerif, fontSize: 30, marginTop: 4, marginBottom: 8 }}>Your Journey</h1>
      <p style={{ color: C.textSoft, fontSize: 14, marginBottom: 28, lineHeight: 1.5 }}>
        A weight and food journal, log in with just a username, from any device.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <button type="button" onClick={() => setMode("login")} style={primaryBtn}>
          Log in
        </button>
        <button type="button" onClick={() => setMode("create")} style={secondaryBtn}>
          Create account
        </button>
      </div>
    </div>
  );
}

const primaryBtn = {
  width: "100%",
  padding: "13px 0",
  borderRadius: 12,
  background: C.rose,
  color: C.roseText,
  fontWeight: 600,
  fontSize: 15,
  border: "none",
  cursor: "pointer",
};
const secondaryBtn = {
  width: "100%",
  padding: "13px 0",
  borderRadius: 12,
  background: "transparent",
  color: C.textSoft,
  fontWeight: 500,
  fontSize: 15,
  border: `1px solid ${C.inputBorder}`,
  cursor: "pointer",
};
const backBtn = { background: "none", border: "none", color: C.textFaint, fontSize: 13, padding: 0, marginBottom: 20, cursor: "pointer" };

function LoginForm({ onBack, onAuthed }) {
  const [username, setUsername] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!username.trim()) return setError("Enter your username.");
    setBusy(true);
    setError("");
    try {
      const result = await api.login(username.trim(), passphrase.trim());
      onAuthed(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <button type="button" onClick={onBack} style={backBtn}>← Back</button>
      <h1 style={{ fontFamily: fontSerif, fontSize: 26, marginTop: 0, marginBottom: 20 }}>Log in</h1>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Field label="Username" value={username} onChange={setUsername} />
        <Field label="Passphrase (only if you set one)" value={passphrase} onChange={setPassphrase} type="password" />
        {error && <p style={{ color: C.warn, fontSize: 13, margin: 0 }}>{error}</p>}
        <button type="button" disabled={busy} onClick={submit} style={{ ...primaryBtn, opacity: busy ? 0.6 : 1 }}>
          {busy ? "Checking…" : "Log in"}
        </button>
      </div>
    </div>
  );
}

function CreateAccountForm({ onBack, onAuthed }) {
  const [username, setUsername] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const u = username.trim();
    if (!u) return setError("Choose a username.");
    setBusy(true);
    setError("");
    try {
      const result = await api.createAccount(u, passphrase.trim());
      onAuthed(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <button type="button" onClick={onBack} style={backBtn}>← Back</button>
      <h1 style={{ fontFamily: fontSerif, fontSize: 26, marginTop: 0, marginBottom: 20 }}>Create account</h1>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Field label="Username" value={username} onChange={setUsername} />
        <Field label="Passphrase (optional)" value={passphrase} onChange={setPassphrase} type="password" />
        <p style={{ fontSize: 12, color: C.textFaint, margin: 0, lineHeight: 1.5 }}>
          Usernames must be unique — this is how you'll log back in, from any device. Add a passphrase if you
          want more than "knowing the username" to protect your account; leave it blank to skip that.
        </p>
        {error && <p style={{ color: C.warn, fontSize: 13, margin: 0 }}>{error}</p>}
        <button type="button" disabled={busy} onClick={submit} style={{ ...primaryBtn, opacity: busy ? 0.6 : 1 }}>
          {busy ? "Creating…" : "Create account"}
        </button>
      </div>
    </div>
  );
}
