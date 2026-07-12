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

function LoadingScreen({ text }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg }}>
      <pv
