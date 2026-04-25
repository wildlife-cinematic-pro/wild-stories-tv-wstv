export function trackUsage(entry: Record<string, unknown>) {
  try {
    const raw = localStorage.getItem("wstv_history");
    const history = raw ? JSON.parse(raw) : [];

    history.push({
      ...entry,
      time: Date.now(),
    });

    localStorage.setItem("wstv_history", JSON.stringify(history));
  } catch (e) {
    console.error("tracking error", e);
  }
}
