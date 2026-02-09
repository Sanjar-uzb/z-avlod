const KEY_PROFILE = "zavlod_profile";
const KEY_REFLECTIONS = "zavlod_reflections";
const KEY_RESULTS = "zavlod_quiz_results";

export function getProfile() {
  try {
    return JSON.parse(localStorage.getItem(KEY_PROFILE) || "null");
  } catch {
    return null;
  }
}

export function setProfile(profile) {
  localStorage.setItem(KEY_PROFILE, JSON.stringify(profile));
}

export function clearAll() {
  localStorage.removeItem(KEY_PROFILE);
  localStorage.removeItem(KEY_REFLECTIONS);
  localStorage.removeItem(KEY_RESULTS);
}

export function requireProfile() {
  const p = getProfile();
  return p && p.firstName && p.lastName;
}

export function getQuizResults() {
  try {
    return JSON.parse(localStorage.getItem(KEY_RESULTS) || "{}");
  } catch {
    return {};
  }
}

export function saveQuizResult(quizId, result) {
  const all = getQuizResults();
  all[String(quizId)] = { ...result, savedAt: Date.now() };
  localStorage.setItem(KEY_RESULTS, JSON.stringify(all));
}

export function getReflections() {
  try {
    return JSON.parse(localStorage.getItem(KEY_REFLECTIONS) || "[]");
  } catch {
    return [];
  }
}

export function addReflection(ref) {
  const arr = getReflections();
  arr.unshift({ ...ref, createdAt: Date.now() });
  localStorage.setItem(KEY_REFLECTIONS, JSON.stringify(arr));
}
