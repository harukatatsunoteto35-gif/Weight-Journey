import React, { useEffect, useRef, useState } from "react";
import { Camera } from "lucide-react";
import { C, fontSerif, fontBody } from "./theme";
import { Field } from "./Auth";
import * as api from "./api";
import defaultAvatarUrl from "./default-avatar.jpg";

export default function Settings({ profile, account, onProfileSaved, onAvatarChanged, onLogout }) {
  const [unit, setUnit] = useState(profile.unit);
  const [startWeight, setStartWeight] = useState(profile.startWeight);
  const [goalWeight, setGoalWeight] = useState(profile.goalWeight);
  const [startDate, setStartDate] = useState(profile.startDate);
  const [endDate, setEndDate] = useState(profile.endDate || "");
  const [saveState, setSaveState] = useState("idle");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [passphrase, setPassphrase] = useState("");
  const [passphraseMsg, setPassphraseMsg] = useState("");
  const avatarInput = useRef(null);
  const firstRun = useRef(true);

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const sw = parseFloat(startWeight);
    const gw = parseFloat(goalWeight);
    if (!startDate || isNaN(sw) || isNaN(gw)) return;
    setSaveState("pending");
    const t = setTimeout(async () => {
      const next = { unit, startWeight: sw, goalWeight: gw, startDate, endDate: endDate || null };
      try {
        await api.saveProfile(next);
        onProfileSaved(next);
        setSaveState("saved");
        setTimeout(() => setSaveState((s) => (s === "saved" ? "idle" : s)), 1500);
      } catch {
        setSaveState("idle");
      }
    }, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unit, startWeight, goalWeight, startDate, endDate]);

  const handleAvatarFile = async (file) => {
    setAvatarUploading(true);
    try {
      const url = await api.uploadAvatar(file);
      onAvatarChanged(url);
    } catch (e) {
      alert(e.message);
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleResetAvatar = async () => {
    setAvatarUploading(true);
    try {
      await api.updateAvatar(null);
      onAvatarChanged(null);
    } catch (e) {
      alert(e.message);
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleSetPassphrase = async () => {
    try {
      await api.setPassphrase(passphrase.trim());
      setPassphraseMsg(passphrase.trim() ? "Passphrase updated ✓" : "Passphrase removed ✓");
      setPassphrase("");
      setTimeout(() => setPassphraseMsg(""), 2000);
    } catch (e) {
      setPassphraseMsg(e.message);
    }
  };

  return (
    <div style={{ padding: "0 24px", display: "flex", flexDirection: "column", gap: 18, fontFamily: fontBody }}>
      <div style={{ background: C.card, borderRadius: 16, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.04)", border: `1px solid ${C.cardBorder}`, display: "flex", alignItems: "center", gap: 14 }}>
        <button
          type="button"
          onClick={() => avatarInput.current?.click()}
          disabled={avatarUploading}
          style={{ position: "relative", border: "none", background: "none", padding: 0, cursor: "pointer" }}
          aria-label="Change profile picture"
        >
          <img
            src={account.avatarUrl || defaultAvatarUrl}
            alt={account.username}
            style={{ width: 60, height: 60, borderRadius: "50%", objectFit: "cover", border: `2px solid ${C.roseSoft}`, opacity: avatarUploading ? 0.5 : 1 }}
          />
          <span style={{ position: "absolute", bottom: -2, right: -2, background: C.rose, borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Camera size={12} color={C.roseText} />
          </span>
        </button>
        <input
          ref={avatarInput}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleAvatarFile(f);
            e.target.value = "";
          }}
        />
        <div style={{ flex: 1 }}>
          <p style={{ fontFamily: fontSerif, fontSize: 18, margin: 0 }}>@{account.username}</p>
          {account.avatarUrl && (
            <button
              type="button"
              onClick={handleResetAvatar}
              disabled={avatarUploading}
              style={{ background: "none", border: "none", padding: 0, marginTop: 4, fontSize: 12, color: C.textFaint, textDecoration: "underline", cursor: "pointer" }}
            >
              Reset to default
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        {["lb", "kg"].map((u) => (
          <button
            key={u}
            type="button"
            onClick={() => setUnit(u)}
            style={{
              flex: 1, padding: "10px 0", borderRadius: 12, fontSize: 14, fontWeight: 500, cursor: "pointer",
              border: `1px solid ${unit === u ? C.rose : C.inputBorder}`,
              background: unit === u ? C.rose : "transparent",
              color: unit === u ? C.roseText : C.textSoft,
            }}
          >
            {u}
          </button>
        ))}
      </div>
      <Field label={`Start weight (${unit})`} value={startWeight} onChange={setStartWeight} type="number" />
      <Field label={`Goal weight (${unit})`} value={goalWeight} onChange={setGoalWeight} type="number" />
      <Field label="Start date" value={startDate} onChange={setStartDate} type="date" />
      <Field label="Target date (optional)" value={endDate} onChange={setEndDate} type="date" />
      <div style={{ textAlign: "center", fontSize: 12, color: saveState === "saved" ? C.good : C.textFaint, minHeight: 16 }}>
        {saveState === "pending" ? "Saving…" : saveState === "saved" ? "Saved ✓" : ""}
      </div>

      <div style={{ background: C.card, borderRadius: 16, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.04)", border: `1px solid ${C.cardBorder}` }}>
        <p style={{ fontSize: 12, fontWeight: 500, color: C.textMuted, marginTop: 0, marginBottom: 10 }}>
          {account.hasPassphrase ? "Change or remove passphrase" : "Add a passphrase"}
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}>
            <Field label="" value={passphrase} onChange={setPassphrase} type="password" />
          </div>
          <button
            type="button"
            onClick={handleSetPassphrase}
            style={{ padding: "0 16px", borderRadius: 12, background: C.rose, color: C.roseText, fontWeight: 600, fontSize: 13, border: "none", cursor: "pointer" }}
          >
            Save
          </button>
        </div>
        <p style={{ fontSize: 11, color: C.textFaint, marginTop: 8, marginBottom: 0 }}>
          Leave blank and tap Save to remove your passphrase. {passphraseMsg}
        </p>
      </div>

      <p style={{ fontSize: 12, color: C.textFaint, textAlign: "center", lineHeight: 1.5, paddingTop: 4 }}>
        Your account works from any device — just log in with your username{account.hasPassphrase ? " and passphrase" : ""}.
      </p>
      <button
        type="button"
        onClick={onLogout}
        style={{ width: "100%", padding: "12px 0", borderRadius: 12, background: "transparent", color: C.warn, fontWeight: 500, fontSize: 14, border: `1px solid ${C.warnBg}`, cursor: "pointer" }}
      >
        Log out
      </button>
    </div>
  );
}
