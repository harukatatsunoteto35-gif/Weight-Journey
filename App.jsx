import React, { useEffect, useMemo, useState } from "react";
import { Home, LineChart as LineChartIcon, BookOpen, Settings as SettingsIcon } from "lucide-react";
import { C, fontSerif, fontBody } from "./theme";
import * as api from "./api";
import Auth from "./Auth";
import Onboarding from "./Onboarding";
import Today from "./Today";
import Trend from "./Trend";
import Journal from "./Journal";
import Settings from "./Settings";
import defaultAvatarUrl from "./default-avatar.jpg";

const todayStr = () => new Date().toISOString().slice(0, 10);
const fmtShortDate = (d) => new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });

function LoadingScreen({ text }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg }}>
      <p style={{ color: C.textSoft, fontFamily: fontSerif, fontStyle: "italic" }}>{text}</p>
    </div>
  );
}

export default function App() {
  const [checking, setChecking] = useState(true);
  const [account, setAccount] = useState(null); // { username, avatarUrl, hasPassphrase }
  const [profile, setProfile] = useState(null); // null until onboarding done
  const [weightLogs, setWeightLogs] = useState([]); // [{date, weight, hydration}]
  const [mealPhotos, setMealPhotos] = useState([]); // [{id, date, mealType, photoUrl}]
  const [tab, setTab] = useState("today");
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [dataLoading, setDataLoading] = useState(false);

  // restore session on load
  useEffect(() => {
    (async () => {
      const acct = await api.getAccount();
      if (acct) {
        setAccount(acct);
        await loadAllData();
      }
      setChecking(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAllData = async () => {
    setDataLoading(true);
    try {
      const [p, logs, photos] = await Promise.all([api.getProfile(), api.getWeightLogs(), api.getMealPhotos()]);
      setProfile(p);
      setWeightLogs(logs);
      setMealPhotos(photos);
    } finally {
      setDataLoading(false);
    }
  };

  const handleAuthed = async (result) => {
    const acct = await api.getAccount();
    setAccount(acct);
    await loadAllData();
  };

  const handleLogout = async () => {
    await api.logout();
    setAccount(null);
    setProfile(null);
    setWeightLogs([]);
    setMealPhotos([]);
  };

  // ---- derived data ----
  const weighedDates = useMemo(() => weightLogs.filter((l) => l.weight != null).map((l) => l.date).sort(), [weightLogs]);
  const latestDate = weighedDates[weighedDates.length - 1];
  const latestWeight = latestDate ? weightLogs.find((l) => l.date === latestDate)?.weight : null;
  const prevDate = weighedDates.length > 1 ? weighedDates[weighedDates.length - 2] : null;
  const prevWeight = prevDate ? weightLogs.find((l) => l.date === prevDate)?.weight : null;

  const deltaFromStart = profile && latestWeight != null ? latestWeight - profile.startWeight : null;
  const deltaFromPrev = latestWeight != null && prevWeight != null ? latestWeight - prevWeight : null;

  const progressPct = useMemo(() => {
    if (!profile || latestWeight == null) return 0;
    const total = profile.goalWeight - profile.startWeight;
    if (total === 0) return 100;
    return Math.min(100, ((latestWeight - profile.startWeight) / total) * 100);
  }, [profile, latestWeight]);

  const currentLog = weightLogs.find((l) => l.date === selectedDate) || { weight: null, hydration: 0 };
  const photosForSelectedDay = useMemo(() => {
    const grouped = { breakfast: [], lunch: [], dinner: [], snacks: [] };
    mealPhotos.filter((p) => p.date === selectedDate).forEach((p) => grouped[p.mealType]?.push(p));
    return grouped;
  }, [mealPhotos, selectedDate]);

  const journalDays = useMemo(() => {
    const dates = new Set([...weightLogs.map((l) => l.date), ...mealPhotos.map((p) => p.date)]);
    return [...dates]
      .sort()
      .reverse()
      .map((date) => ({
        date,
        weight: weightLogs.find((l) => l.date === date)?.weight ?? null,
        photos: mealPhotos.filter((p) => p.date === date),
      }));
  }, [weightLogs, mealPhotos]);

  // ---- handlers that touch Supabase ----
  const handleSetWeight = async (value) => {
    setWeightLogs((prev) => {
      const others = prev.filter((l) => l.date !== selectedDate);
      return [...others, { date: selectedDate, weight: value, hydration: currentLog.hydration }];
    });
    await api.upsertWeightLog(selectedDate, value, currentLog.hydration);
  };

  const handleSetHydration = async (count) => {
    setWeightLogs((prev) => {
      const others = prev.filter((l) => l.date !== selectedDate);
      return [...others, { date: selectedDate, weight: currentLog.weight, hydration: count }];
    });
    await api.upsertWeightLog(selectedDate, currentLog.weight, count);
  };

  const handleAddPhoto = async (mealType, file) => {
    const photo = await api.addMealPhoto(selectedDate, mealType, file);
    setMealPhotos((prev) => [...prev, photo]);
  };

  const handleDeletePhoto = async (photoId) => {
    setMealPhotos((prev) => prev.filter((p) => p.id !== photoId));
    await api.deleteMealPhoto(photoId);
  };

  if (checking) return <LoadingScreen text="loading…" />;
  if (!account) return <Auth onAuthed={handleAuthed} />;
  if (dataLoading) return <LoadingScreen text="loading your journal…" />;
  if (!profile) return <Onboarding onSaved={(p) => setProfile(p)} />;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: fontBody, paddingBottom: 96 }}>
      <header style={{ padding: "32px 24px 16px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: C.eyebrow, margin: 0 }}>@{account.username}'s journey</p>
          <h1 style={{ fontFamily: fontSerif, fontSize: 30, marginTop: 4 }}>
            {tab === "today"
              ? (selectedDate === todayStr() ? "Today" : fmtShortDate(selectedDate))
              : tab === "trend" ? "The Trend" : tab === "journal" ? "Journal" : "Settings"}
          </h1>
        </div>
        <img
          src={account.avatarUrl || defaultAvatarUrl}
          alt={account.username}
          style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", border: `2px solid ${C.roseSoft}`, marginTop: 4 }}
        />
      </header>

      {tab === "today" && (
        <Today
          profile={profile}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          weight={currentLog.weight}
          hydration={currentLog.hydration}
          photosForDay={photosForSelectedDay}
          onSetWeight={handleSetWeight}
          onSetHydration={handleSetHydration}
          onAddPhoto={handleAddPhoto}
          onDeletePhoto={handleDeletePhoto}
          deltaFromStart={selectedDate === latestDate ? deltaFromStart : null}
          deltaFromPrev={selectedDate === latestDate ? deltaFromPrev : null}
          progressPct={progressPct}
        />
      )}

      {tab === "trend" && (
        <Trend profile={profile} weightLogs={weightLogs} progressPct={progressPct} latestWeight={latestWeight} />
      )}

      {tab === "journal" && (
        <Journal days={journalDays} onSelect={(d) => { setSelectedDate(d); setTab("today"); }} />
      )}

      {tab === "settings" && (
        <Settings
          profile={profile}
          account={account}
          onProfileSaved={setProfile}
          onAvatarChanged={(url) => setAccount((a) => ({ ...a, avatarUrl: url }))}
          onLogout={handleLogout}
        />
      )}

      <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: C.navBg, borderTop: `1px solid ${C.navBorder}`, display: "flex", justifyContent: "space-around", padding: "12px 8px" }}>
        {[
          { key: "today", icon: Home, label: "Today" },
          { key: "trend", icon: LineChartIcon, label: "Trend" },
          { key: "journal", icon: BookOpen, label: "Journal" },
          { key: "settings", icon: SettingsIcon, label: "Settings" },
        ].map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => {
              if (key === "today") setSelectedDate(todayStr());
              setTab(key);
            }}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "4px 12px", background: "none", border: "none", color: tab === key ? C.rose : C.textFaint, cursor: "pointer" }}
          >
            <Icon size={20} strokeWidth={tab === key ? 2.4 : 1.8} />
            <span style={{ fontSize: 11, fontWeight: 500 }}>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
