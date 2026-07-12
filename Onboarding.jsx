import React, { useState } from "react";
import { C, fontSerif, fontBody } from "./theme";
import { Field } from "./Auth";
import * as api from "./api";

const todayStr = () => new Date().toISOString().slice(0, 10);

export default function Onboarding({ onSaved }) {
  const [unit, setUnit] = useState("lb");
  const [startWeight, setStartWeight] = useState("");
  const [goalWeight, setGoalWeight] = useState("");
  const [startDate, setStartDate] = useState(todayStr());
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleBegin = async () => {
    const sw = parseFloat(startWeight);
    const gw = parseFloat(goalWeight);
    if (!startWeight || isNaN(sw)) return setError("Enter your current weight.");
    if (!goalWeight || isNaN(gw)) return setError("Enter a goal weight.");
    if (!startDate) return setError("Pick a start date.");
    setError("");
    setBusy(true);
    const profile = { unit, startWeight: sw, goalWeight: gw, startDate, endDate: endDate || null };
    try {
      await api.saveProfile(profile);
      onSaved(profile);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 24px", fontFamily: fontBody }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <p style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: C.eyebrow, margin: 0 }}>let's set up</p>
        <h1 style={{ fontFamily: fontSerif, fontSize: 30, marginTop: 4, marginBottom: 4 }}>Your Journey</h1>
        <p style={{ color: C.textSoft, fontSize: 14, marginBottom: 28 }}>
          A few numbers to get started. You can change these anytime in Settings.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", gap: 8 }}>
            {["lb", "kg"].map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setUnit(u)}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: "pointer",
                  border: `1px solid ${unit === u ? C.rose : C.inputBorder}`,
                  background: unit === u ? C.rose : "transparent",
                  color: unit === u ? C.roseText : C.textSoft,
                }}
              >
                {u}
              </button>
            ))}
          </div>
          <Field label={`Current weight (${unit})`} value={startWeight} onChange={setStartWeight} type="number" />
          <Field label={`Goal weight (${unit})`} value={goalWeight} onChange={setGoalWeight} type="number" />
          <Field label="Start date" value={startDate} onChange={setStartDate} type="date" />
          <Field label="Target date (optional)" value={endDate} onChange={setEndDate} type="date" />
          {error && <p style={{ color: C.warn, fontSize: 13, margin: 0 }}>{error}</p>}
          <button
            type="button"
            disabled={busy}
            onClick={handleBegin}
            style={{
              width: "100%",
              padding: "13px 0",
              borderRadius: 12,
              background: C.rose,
              color: C.roseText,
              fontWeight: 600,
              fontSize: 15,
              border: "none",
              cursor: "pointer",
              opacity: busy ? 0.6 : 1,
            }}
          >
            {busy ? "Saving…" : "Begin"}
          </button>
        </div>
      </div>
    </div>
  );
}
