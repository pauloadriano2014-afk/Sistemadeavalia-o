"use client";

import { useEffect, useState } from "react";
import { Paintbrush } from "lucide-react";

export function ThemeSwitcher() {
  const [theme, setTheme] = useState("green");

  useEffect(() => {
    const savedTheme = localStorage.getItem("app-theme") || "green";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  const changeTheme = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem("app-theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1 bg-zinc-900 rounded-full p-1 border border-zinc-800">
        {/* Botão Verde */}
        <button
          onClick={() => changeTheme("green")}
          className={`w-4 h-4 rounded-full transition-all ${
            theme === "green" ? "scale-110 shadow-[0_0_8px_#84cc16] ring-1 ring-white" : "opacity-30 hover:opacity-100"
          }`}
          style={{ backgroundColor: "#84cc16" }} 
          title="Tema Verde"
        />

        {/* Botão Roxo */}
        <button
          onClick={() => changeTheme("purple")}
          className={`w-4 h-4 rounded-full transition-all ${
            theme === "purple" ? "scale-110 shadow-[0_0_8px_#8b5cf6] ring-1 ring-white" : "opacity-30 hover:opacity-100"
          }`}
          style={{ backgroundColor: "#8b5cf6" }} 
          title="Tema Roxo"
        />
      </div>
    </div>
  );
}