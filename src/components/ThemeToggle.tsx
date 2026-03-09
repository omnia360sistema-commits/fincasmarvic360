import { useEffect, useState } from "react";


export default function ThemeToggle() {
  const [dark, setDark] = useState(false);


  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const isDark = saved === "dark";
    setDark(isDark);
    if (isDark) {
      document.documentElement.classList.add("dark");
    }
  }, []);


  function toggleTheme() {
    const next = !dark;
    setDark(next);


    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }


  return (
    <button
      onClick={toggleTheme}
      className="px-3 py-2 rounded-lg bg-gray-200 dark:bg-slate-700 text-sm"
    >
      {dark ? "☀ Claro" : "🌙 Oscuro"}
    </button>
  );
}
