import { supabase } from "./supabaseClient";

const TOKEN_KEY = "yj_session_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

function friendlyError(error) {
  if (!error) return new Error("Unknown error.");
  // Supabase surfaces Postgres RAISE EXCEPTION messages in error.message
  return new Error(error.message || "Something went wrong talking to the database.");
}

export async function createAccount(username, passphrase) {
  const { data, error } = await supabase.rpc("create_account", {
    p_username: username,
    p_passphrase: passphrase || null,
  });
  if (error) throw friendlyError(error);
  const row = data?.[0];
  setToken(row.token);
  return { token: row.token, accountId: row.account_id, avatarUrl: row.avatar_url };
}

export async function login(username, passphrase) {
  const { data, error } = await supabase.rpc("login", {
    p_username: username,
    p_passphrase: passphrase || null,
  });
  if (error) throw friendlyError(error);
  const row = data?.[0];
  setToken(row.token);
  return { token: row.token, accountId: row.account_id, avatarUrl: row.avatar_url };
}

export async function logout() {
  const token = getToken();
  if (token) {
    try {
      await supabase.rpc("logout", { p_token: token });
    } catch {
      // ignore — we're clearing the local token regardless
    }
  }
  clearToken();
}

export async function getAccount() {
  const token = getToken();
  if (!token) return null;
  const { data, error } = await supabase.rpc("get_account", { p_token: token });
  if (error) {
    clearToken();
    return null;
  }
  const row = data?.[0];
  if (!row) return null;
  return { username: row.username, avatarUrl: row.avatar_url, hasPassphrase: row.has_passphrase };
}

export async function updateAvatar(avatarUrl) {
  const token = getToken();
  const { error } = await supabase.rpc("update_avatar", { p_token: token, p_avatar_url: avatarUrl });
  if (error) throw friendlyError(error);
}

export async function setPassphrase(passphrase) {
  const token = getToken();
  const { error } = await supabase.rpc("set_passphrase", { p_token: token, p_passphrase: passphrase || null });
  if (error) throw friendlyError(error);
}

export async function getProfile() {
  const token = getToken();
  const { data, error } = await supabase.rpc("get_profile", { p_token: token });
  if (error) throw friendlyError(error);
  const row = data?.[0];
  if (!row || row.start_weight == null) return null;
  return {
    unit: row.unit,
    startWeight: row.start_weight,
    goalWeight: row.goal_weight,
    startDate: row.start_date,
    endDate: row.end_date,
  };
}

export async function saveProfile(p) {
  const token = getToken();
  const { error } = await supabase.rpc("save_profile", {
    p_token: token,
    p_unit: p.unit,
    p_start_weight: p.startWeight,
    p_goal_weight: p.goalWeight,
    p_start_date: p.startDate,
    p_end_date: p.endDate || null,
  });
  if (error) throw friendlyError(error);
}

export async function upsertWeightLog(date, weight, hydration) {
  const token = getToken();
  const { error } = await supabase.rpc("upsert_weight_log", {
    p_token: token,
    p_date: date,
    p_weight: weight,
    p_hydration: hydration,
  });
  if (error) throw friendlyError(error);
}

export async function getWeightLogs() {
  const token = getToken();
  const { data, error } = await supabase.rpc("get_weight_logs", { p_token: token });
  if (error) throw friendlyError(error);
  return (data || []).map((r) => ({ date: r.log_date, weight: r.weight, hydration: r.hydration }));
}

export async function getMealPhotos() {
  const token = getToken();
  const { data, error } = await supabase.rpc("get_meal_photos", { p_token: token });
  if (error) throw friendlyError(error);
  return (data || []).map((r) => ({ id: r.id, date: r.log_date, mealType: r.meal_type, photoUrl: r.photo_url }));
}

export async function addMealPhoto(date, mealType, file) {
  const token = getToken();
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `meals/${token}/${date}-${mealType}-${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage.from("photos").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (uploadError) throw friendlyError(uploadError);

  const { data: urlData } = supabase.storage.from("photos").getPublicUrl(path);
  const photoUrl = urlData.publicUrl;

  const { data, error } = await supabase.rpc("add_meal_photo", {
    p_token: token,
    p_date: date,
    p_meal_type: mealType,
    p_photo_url: photoUrl,
  });
  if (error) throw friendlyError(error);
  return { id: data, date, mealType, photoUrl };
}

export async function deleteMealPhoto(photoId) {
  const token = getToken();
  const { error } = await supabase.rpc("delete_meal_photo", { p_token: token, p_photo_id: photoId });
  if (error) throw friendlyError(error);
}

export async function uploadAvatar(file) {
  const token = getToken();
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `avatars/${token}-${crypto.randomUUID()}.${ext}`;
  const { error: uploadError } = await supabase.storage.from("photos").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (uploadError) throw friendlyError(uploadError);
  const { data: urlData } = supabase.storage.from("photos").getPublicUrl(path);
  await updateAvatar(urlData.publicUrl);
  return urlData.publicUrl;
}
