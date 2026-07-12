import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine, Tooltip } from "recharts";
import { C, fontSerif, cardStyle } from "./theme";

const fmtDate = (d) => new Date(d + "T00:00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });

function Stat({ label, value, color }) {
  return (
    <div style={{ background: C.card, borderRadius: 16, padding: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.04)", border: `1px solid ${C.cardBorder}`, textAlign: "center" }}>
      <p style={{ fontSize: 12, color: C.textFaint, marginBottom: 4 }}>{label}</p>
      <p style={{ fontFamily: fontSerif, fontSize: 20, color: color || C.textSoft, margin: 0 }}>{value}</p>
    </div>
  );
}

export default function Trend({ profile, weightLogs, progressPct, latestWeight }) {
  const chartData = weightLogs
    .filter((l) => l.weight != null)
    .map((l) => ({ label: fmtDate(l.date).split(",")[0], weight: l.weight }));

  return (
    <div style={{ padding: "0 24px" }}>
      <div style={cardStyle}>
        {chartData.length >= 2 ? (
          <div style={{ width: "100%", height: 220 }}>
            <ResponsiveContainer>
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke={C.cardBorder} vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: C.textFaint }} axisLine={false} tickLine={false} />
                <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10, fill: C.textFaint }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: `1px solid ${C.cardBorder}`, fontSize: 12 }} />
                <ReferenceLine y={profile.goalWeight} stroke={C.sage} strokeDasharray="4 4" label={{ value: "goal", position: "insideTopRight", fontSize: 10, fill: C.sage }} />
                <Line type="monotone" dataKey="weight" stroke={C.rose} strokeWidth={2.5} dot={{ r: 3, fill: C.rose }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p style={{ fontSize: 14, color: C.textFaint, textAlign: "center", padding: "40px 0" }}>
            Log weight on two or more days to see your trend line.
          </p>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Stat label="Current" value={latestWeight != null ? `${latestWeight} ${profile.unit}` : "—"} />
        <Stat label="Goal" value={`${profile.goalWeight} ${profile.unit}`} />
        <Stat label="Started" value={`${profile.startWeight} ${profile.unit}`} />
        <Stat label="Progress" value={`${Math.round(progressPct)}%`} color={progressPct < 0 ? C.warn : undefined} />
      </div>

      {profile.endDate && (
        <p style={{ fontSize: 12, color: C.textFaint, textAlign: "center", marginTop: 24 }}>Target date: {fmtDate(profile.endDate)}</p>
      )}
    </div>
  );
}
