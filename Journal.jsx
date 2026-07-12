import React from "react";
import { C, fontSerif } from "./theme";

const fmtDate = (d) => new Date(d + "T00:00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });

export default function Journal({ days, onSelect }) {
  if (days.length === 0) {
    return (
      <div style={{ padding: "0 24px" }}>
        <p style={{ fontSize: 14, color: C.textFaint, textAlign: "center", padding: "40px 0" }}>Your logged days will appear here.</p>
      </div>
    );
  }
  return (
    <div style={{ padding: "0 24px", display: "flex", flexDirection: "column", gap: 14 }}>
      {days.map(({ date, weight, photos }) => (
        <button
          key={date}
          onClick={() => onSelect(date)}
          style={{
            textAlign: "left",
            background: C.card,
            borderRadius: 16,
            padding: 16,
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            border: `1px solid ${C.cardBorder}`,
            cursor: "pointer",
            width: "100%",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: C.textSoft }}>{fmtDate(date)}</span>
            {weight != null && <span style={{ fontFamily: fontSerif, fontSize: 18, color: C.rose }}>{weight}</span>}
          </div>
          {photos.length > 0 ? (
            <div style={{ display: "flex", gap: 8, overflowX: "auto" }}>
              {photos.slice(0, 6).map((p) => (
                <img key={p.id} src={p.photoUrl} style={{ width: 48, height: 48, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} alt="" />
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 12, color: C.textFainter, margin: 0 }}>No photos logged</p>
          )}
        </button>
      ))}
    </div>
  );
}
