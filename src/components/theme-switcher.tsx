"use client";

import { useEffect, useState } from "react";
import { Paintbrush } from "lucide-react";

export function ThemeSwitcher() {
  const [theme, setTheme] = useState("green");

  useEffect(() => {
    // 1. Ao carregar, vê se já tem tema salvo
    const savedTheme = localStorage.getItem("app-theme") || "green";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  const changeTheme = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem("app-theme", newTheme); // Salva para sempre
    document.documentElement.setAttribute("data-theme", newTheme); // Aplica agora
  };

  return (
    <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 p-2 rounded-full">
      <Paintbrush size={14} className="text-zinc-500 ml-2" />
      
      {/* Botão Verde */}
      <button
        onClick={() => changeTheme("green")}
        className={`w-6 h-6 rounded-full border-2 transition-all ${
          theme === "green" ? "border-white scale-110 shadow-[0_0_10px_#84cc16]" : "border-transparent opacity-50 hover:opacity-100"
        }`}
        style={{ backgroundColor: "#84cc16" }} // Cor Lime fixa visual
      />

      {/* Botão Roxo */}
      <button
        onClick={() => changeTheme("purple")}
        className={`w-6 h-6 rounded-full border-2 transition-all ${
          theme === "purple" ? "border-white scale-110 shadow-[0_0_10px_#8b5cf6]" : "border-transparent opacity-50 hover:opacity-100"
        }`}
        style={{ backgroundColor: "#8b5cf6" }} // Cor Violet fixa visual
      />
    </div>
  );
}