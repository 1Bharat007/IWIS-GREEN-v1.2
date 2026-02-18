export const getTheme = () => {
  if (typeof window === "undefined") return "light";
  return localStorage.getItem("iwis_theme") || "light";
};

export const setTheme = (theme: "light" | "dark") => {
  if (typeof window === "undefined") return;
  localStorage.setItem("iwis_theme", theme);
  document.documentElement.classList.remove("light", "dark");
  document.documentElement.classList.add(theme);
};
