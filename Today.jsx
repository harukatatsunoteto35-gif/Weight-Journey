import React, { useRef, useState } from "react";
import { Camera, X, TrendingDown, TrendingUp, Minus, Calendar, Droplet } from "lucide-react";
import { C, fontSerif, cardStyle } from "./theme";

const MEALS = [
  { key: "breakfast", label: "Breakfast" },
  { key: "lunch", label: "Lunch" },
  { key: "dinner", label: "Dinner" },
  { key: "snacks", label: "Snacks" },
];

const todayStr = () => new Date().toISOString().slice(0, 10);

const Chip = ({ tone = "neutral", children }) => {
  const tones = {
    good: { background: C.goodBg, color: C.good },
    warn: { background: C.warnBg, color: C.warn },
    neutral: { background: "#F1EBE6", color: C.textSoft },
  };
  return <span style={{ ...tones[tone], padding: "4px 12px", borderRadius: 999, fontSize: 14, fontWeight: 500 }}>{children}</span>;
};

function DeltaChip({ label, delta, unit }) {
  const rounded = Math.round(delta * 10) / 10;
  let tone = "neutral", Icon = Minus;
  if (rounded < 0) { tone = "good"; Icon = TrendingDown; }
  else if (rounded > 0) { tone = "warn"; Icon = TrendingUp; }
  return (
    <Chip tone={tone}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
        <Icon size={13} />
        {rounded > 0 ? "+" : ""}{rounded} {unit} <span style={{ opacity: 0.7, fontWeight: 400 }}>{label}</span>
      </span>
    </Chip>
  );
}

export default function Today({
  profile, selectedDate, setSelectedDate, weight, hydration, photosForDay,
  onSetWeight, onSetHydration, onAddPhoto, onDeletePhoto,
  deltaFromStart, deltaFromPrev, progressPct,
}) {
  const fileRefs = useRef({});
  const [uploading, setUploading] = useState({});

  const handleFile = async (mealKey, file) => {
    setUploading((u) => ({ ...u, [mealKey]: true }));
    try {
      await onAddPhoto(mealKey, file);
    } finally {
      setUploading((u) => ({ ...u, [mealKey]: false }));
    }
  };

  return (
    <div style={{ padding: "0 24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <Calendar size={16} color={C.eyebrow} />
        <input
          type="date"
          value={selectedDate}
          max={todayStr()}
          onChange={(e) => setSelectedDate(e.target.value)}
          style={{ background: "transparent", fontSize: 14, fontWeight: 500, color: C.textSoft, border: "none" }}
        />
      </div>

      <div style={cardStyle}>
        <span style={{ fontSize: 12, fontWeight: 500, color: C.textMuted }}>Weight ({profile.unit})</span>
        <input
          type="number"
          inputMode="decimal"
          placeholder="—"
          value={weight ?? ""}
          onChange={(e) => onSetWeight(e.target.value === "" ? null : parseFloat(e.target.value))}
          style={{ width: "100%", fontFamily: fontSerif, fontSize: 36, marginTop: 4, background: "transparent", border: "none", color: C.text, boxSizing: "border-box", padding: 0 }}
        />
        {(deltaFromPrev != null || deltaFromStart != null) && (
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            {deltaFromPrev != null && <DeltaChip label="vs yesterday" delta={deltaFromPrev} unit={profile.unit} />}
            {deltaFromStart != null && <DeltaChip label="vs start" delta={deltaFromStart} unit={profile.unit} />}
          </div>
        )}
        <p style={{ fontSize: 12, color: C.textFaint, marginTop: 12, marginBottom: 0, lineHeight: 1.5 }}>
          Weight shifts naturally day to day with water, food, and hormones — the trend over weeks matters far more than any single number.
        </p>
      </div>

      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: C.textMuted }}>Hydration</span>
          <span style={{ fontSize: 12, color: C.textFaint }}>{hydration || 0} / 10</span>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {Array.from({ length: 10 }).map((_, i) => {
            const filled = i < (hydration || 0);
            return (
              <button
                key={i}
                type="button"
                onClick={() => onSetHydration(filled ? i : i + 1)}
                aria-label={`Set hydration to ${i + 1}`}
                style={{ background: "none", border: "none", padding: 2, cursor: "pointer", display: "flex" }}
              >
                <Droplet size={22} fill={filled ? C.aqua : "none"} color={filled ? C.aqua : C.inputBorder} strokeWidth={1.8} />
              </button>
            );
          })}
        </div>
        <p style={{ fontSize: 12, color: C.textFaint, marginTop: 10, marginBottom: 0, lineHeight: 1.5 }}>
          Tap a droplet for roughly how hydrated you felt today.
        </p>
      </div>

      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: C.textMuted }}>Progress to goal</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: C.rose }}>{Math.round(progressPct)}%</span>
        </div>
        <div style={{ width: "100%", height: 8, borderRadius: 999, background: C.cardBorder, overflow: "hidden" }}>
          <div style={{ height: "100%", borderRadius: 999, width: `${progressPct}%`, background: `linear-gradient(to right, ${C.roseSoft}, ${C.rose})` }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.textFaint, marginTop: 8 }}>
          <span>{profile.startWeight} {profile.unit}</span>
          <span>{profile.goalWeight} {profile.unit}</span>
        </div>
      </div>

      <h2 style={{ fontFamily: fontSerif, fontSize: 22, marginBottom: 12 }}>What you ate</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {MEALS.map(({ key, label }) => (
          <div key={key} style={{ background: C.card, borderRadius: 16, padding: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.04)", border: `1px solid ${C.cardBorder}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: C.textSoft }}>{label}</span>
              <button
                type="button"
                onClick={() => fileRefs.current[key]?.click()}
                disabled={uploading[key]}
                style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 500, color: C.roseText, background: C.roseBg, padding: "6px 12px", borderRadius: 999, border: "none", cursor: "pointer", opacity: uploading[key] ? 0.6 : 1 }}
              >
                <Camera size={13} /> {uploading[key] ? "Uploading…" : "Add"}
              </button>
              <input
                ref={(el) => (fileRefs.current[key] = el)}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(key, f);
                  e.target.value = "";
                }}
              />
            </div>
            {(photosForDay[key] || []).length > 0 ? (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {photosForDay[key].map((p) => (
                  <div key={p.id} style={{ position: "relative", width: 64, height: 64, borderRadius: 12, overflow: "hidden" }}>
                    <img src={p.photoUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt={label} />
                    <button
                      type="button"
                      onClick={() => onDeletePhoto(p.id)}
                      style={{ position: "absolute", top: 2, right: 2, background: "rgba(0,0,0,0.5)", borderRadius: 999, border: "none", padding: 2, cursor: "pointer", display: "flex" }}
                    >
                      <X size={10} color="white" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 12, color: C.textFainter, margin: 0 }}>Nothing logged yet</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
