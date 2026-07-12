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
      setUploading((u) => ({
