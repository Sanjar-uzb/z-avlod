const KEY_PROFILE = "zavlod_profile";
const KEY_REFLECTIONS = "zavlod_reflections";
const KEY_RESULTS = "zavlod_quiz_results";
const KEY_STUDENT_SURVEYS = "zavlod_student_surveys";
const KEY_KAHOOT_GAMES = "zavlod_kahoot_game_results";
const KEY_ELECTRIC_GAMES = "zavlod_electric_game_results";
const KEY_GENERIC_GAMES = "zavlod_generic_game_results";
const KEY_METHODS_TEACHER = "zavlod_methods_teacher_results";
const KEY_SUBJECT_RESULTS = "zavlod_subject_results";
const KEY_METHOD_QUIZ_RESULTS = "zavlod_method_quiz_results";

function normalizeProfile(profile = {}) {
  const firstName = (profile.firstName || "").trim();
  const lastName = (profile.lastName || "").trim();
  const fullName = [firstName, lastName].filter(Boolean).join(" ");

  return {
    firstName,
    lastName,
    fullName,
    org: (profile.org || "").trim(),
    region: (profile.region || "").trim(),
    district: (profile.district || "").trim(),
    institution: (profile.institution || "").trim(),
  };
}

function enrichResultWithProfile(result = {}, fallbackStudent = "Noma'lum") {
  const profile = normalizeProfile(getProfile());
  const student = profile.fullName || fallbackStudent;

  return {
    ...result,
    student,
    firstName: profile.firstName,
    lastName: profile.lastName,
    region: profile.region || result.region || "",
    district: profile.district || result.district || "",
    institution: profile.institution || result.institution || "",
  };
}

export function getProfile() {
  try {
    return JSON.parse(localStorage.getItem(KEY_PROFILE) || "null");
  } catch {
    return null;
  }
}

export function setProfile(profile) {
  localStorage.setItem(KEY_PROFILE, JSON.stringify(normalizeProfile(profile)));
}

export function clearAll() {
  localStorage.removeItem(KEY_PROFILE);
  localStorage.removeItem(KEY_REFLECTIONS);
  localStorage.removeItem(KEY_RESULTS);
  localStorage.removeItem(KEY_STUDENT_SURVEYS);
  localStorage.removeItem(KEY_KAHOOT_GAMES);
  localStorage.removeItem(KEY_ELECTRIC_GAMES);
  localStorage.removeItem(KEY_GENERIC_GAMES);
  localStorage.removeItem(KEY_METHODS_TEACHER);
  localStorage.removeItem(KEY_SUBJECT_RESULTS);
  localStorage.removeItem(KEY_METHOD_QUIZ_RESULTS);
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

export function getStudentSurveyResults() {
  try {
    return JSON.parse(localStorage.getItem(KEY_STUDENT_SURVEYS) || "[]");
  } catch {
    return [];
  }
}

export function saveStudentSurveyResult(result) {
  const arr = getStudentSurveyResults();
  const className = result.className || result.studentInfo?.grade || result.org || "Noma'lum";
  arr.unshift({
    ...result,
    className,
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    savedAt: Date.now(),
  });
  localStorage.setItem(KEY_STUDENT_SURVEYS, JSON.stringify(arr.slice(0, 100)));
}

// Kahoot Game Results
export function getKahootGameResults() {
  try {
    return JSON.parse(localStorage.getItem(KEY_KAHOOT_GAMES) || "[]");
  } catch {
    return [];
  }
}

export function saveKahootGameResult(gameResult) {
  const arr = getKahootGameResults();
  const profile = normalizeProfile(getProfile());
  const enrichedResult = enrichResultWithProfile({
    title: gameResult.title || "Kahoot o'yini",
    student: gameResult.student || profile.fullName || "Noma'lum",
    playerCount: gameResult.playerCount || 0,
    playerPosition: gameResult.playerPosition || 0,
    score: gameResult.score || 0,
    totalQuestions: gameResult.totalQuestions || 0,
    correctAnswers: gameResult.correctAnswers || 0,
    totalParticipants: gameResult.totalParticipants || 0,
    results: gameResult.results || [],
  }, profile.fullName || gameResult.student || "Noma'lum");

  arr.unshift({
    id: `kahoot_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    gameType: "kahoot",
    ...enrichedResult,
    savedAt: Date.now(),
  });
  localStorage.setItem(KEY_KAHOOT_GAMES, JSON.stringify(arr.slice(0, 50)));
}

// Electric Game Results
export function getElectricGameResults() {
  try {
    return JSON.parse(localStorage.getItem(KEY_ELECTRIC_GAMES) || "[]");
  } catch {
    return [];
  }
}

export function saveElectricGameResult(gameResult) {
  const arr = getElectricGameResults();
  const profile = normalizeProfile(getProfile());
  const enrichedResult = enrichResultWithProfile({
    title: "Elektr zanjirlash o'yini",
    student: gameResult.student || profile.fullName || "Noma'lum",
    levelsCompleted: gameResult.levelsCompleted || 10,
    totalLevels: 10,
    completionTime: gameResult.completionTime || 0,
  }, profile.fullName || gameResult.student || "Noma'lum");

  arr.unshift({
    id: `electric_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    gameType: "electric",
    ...enrichedResult,
    savedAt: Date.now(),
  });
  localStorage.setItem(KEY_ELECTRIC_GAMES, JSON.stringify(arr.slice(0, 50)));
}

// Generic Game Results (used by all other game pages)
export function getGenericGameResults() {
  try {
    return JSON.parse(localStorage.getItem(KEY_GENERIC_GAMES) || "[]");
  } catch {
    return [];
  }
}

export function saveGenericGameResult(gameResult) {
  const arr = getGenericGameResults();
  const profile = normalizeProfile(getProfile());
  const enrichedResult = enrichResultWithProfile({
    title: gameResult.title || "O'yin natijasi",
    gameType: gameResult.gameType || "generic",
    student: gameResult.student || profile.fullName || "Noma'lum",
    score: gameResult.score || 0,
    totalScore: gameResult.totalScore || 0,
    summary: gameResult.summary || {},
    details: gameResult.details || {},
    completed: Boolean(gameResult.completed),
  }, profile.fullName || gameResult.student || "Noma'lum");

  arr.unshift({
    id: `generic_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    gameType: enrichedResult.gameType,
    ...enrichedResult,
    savedAt: Date.now(),
  });
  localStorage.setItem(KEY_GENERIC_GAMES, JSON.stringify(arr.slice(0, 100)));
}

// Methods Teacher Results
export function getMethodsTeacherResults() {
  try {
    return JSON.parse(localStorage.getItem(KEY_METHODS_TEACHER) || "[]");
  } catch {
    return [];
  }
}

export function saveMethodsTeacherResult(methodResult) {
  const arr = getMethodsTeacherResults();
  const profile = getProfile() || {};
  arr.unshift({
    id: `teacher_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    resultType: "teacher",
    title: methodResult.title || "O'qituvchi natijasi",
    teacher: profile.firstName || methodResult.teacher || "Noma'lum",
    methodName: methodResult.methodName || "",
    studentsCount: methodResult.studentsCount || 0,
    results: methodResult.results || [],
    savedAt: Date.now(),
  });
  localStorage.setItem(KEY_METHODS_TEACHER, JSON.stringify(arr.slice(0, 50)));
}

// Get all game results for reflections page
export function getAllGameResults() {
  const kahootGames = getKahootGameResults() || [];
  const electricGames = getElectricGameResults() || [];
  const genericGames = getGenericGameResults() || [];

  return [
    ...kahootGames,
    ...electricGames,
    ...genericGames,
  ].sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
}

// Subject Quiz Results (from /play page)
export function getSubjectResults() {
  try {
    return JSON.parse(localStorage.getItem(KEY_SUBJECT_RESULTS) || "[]");
  } catch {
    return [];
  }
}

export function saveSubjectResult(result) {
  const arr = getSubjectResults();
  const profile = normalizeProfile(getProfile());
  const enrichedResult = enrichResultWithProfile({
    title: result.subjectTitle || "Fan testi",
    student: result.student || profile.fullName || "Noma'lum",
    subject: result.subject || "",
    subjectTitle: result.subjectTitle || "",
    level: result.level || "",
    totalQuestions: result.totalQuestions || 0,
    score: result.score || 0,
    total: result.total || 100,
    percent: result.percent || 0,
    grade: result.grade || "",
  }, profile.fullName || result.student || "Noma'lum");

  arr.unshift({
    id: `subject_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    resultType: "subject",
    ...enrichedResult,
    savedAt: Date.now(),
  });
  localStorage.setItem(KEY_SUBJECT_RESULTS, JSON.stringify(arr.slice(0, 100)));
}

// Method Quiz Results (from /quiz page)
export function getMethodQuizResults() {
  try {
    return JSON.parse(localStorage.getItem(KEY_METHOD_QUIZ_RESULTS) || "[]");
  } catch {
    return [];
  }
}

export function saveMethodQuizResult(result) {
  const arr = getMethodQuizResults();
  const profile = normalizeProfile(getProfile());
  const enrichedResult = enrichResultWithProfile({
    title: result.quizTitle || "Metod testi",
    student: result.student || profile.fullName || "Noma'lum",
    methodId: result.methodId || 0,
    methodTitle: result.methodTitle || "",
    quizId: result.quizId || 0,
    totalQuestions: result.totalQuestions || 0,
    correctAnswers: result.correctAnswers || 0,
    percent: result.percent || 0,
    level: result.level || "",
  }, profile.fullName || result.student || "Noma'lum");

  arr.unshift({
    id: `method_quiz_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    resultType: "method_quiz",
    ...enrichedResult,
    savedAt: Date.now(),
  });
  localStorage.setItem(KEY_METHOD_QUIZ_RESULTS, JSON.stringify(arr.slice(0, 100)));
}

