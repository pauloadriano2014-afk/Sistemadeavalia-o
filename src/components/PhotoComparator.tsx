"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowRight, Calendar, CameraOff } from "lucide-react";

// Tipagem dos dados que vamos receber
interface Photo {
  id: string;
  storage_path: string;
  pose_label: string;
  url?: string; // URL pública injetada
}

interface Checkin {
  id: string;
  created_at: string;
  weight: number;
  photos: Photo[];
}

export default function PhotoComparator({ checkins }: { checkins: Checkin[] }) {
  // Se não tiver pelo menos 2 checkins, não dá pra comparar
  if (!checkins || checkins.length < 2) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
        <p className="text-slate-400">
          O aluno precisa de pelo menos 2 check-ins para gerar um comparativo.
        </p>
      </div>
    );
  }

  // Estado: Selecionar o checkin da Esquerda (Antes) e Direita (Depois)
  // Por padrão: O mais antigo vs O mais recente
  const [leftIndex, setLeftIndex] = useState(checkins.length - 1); // Último do array (Antigo)
  const [rightIndex, setRightIndex] = useState(0); // Primeiro do array (Novo)

  const leftCheckin = checkins[leftIndex];
  const rightCheckin = checkins[rightIndex];

  // Identificar quais poses existem para comparar (ex: Frente, Costas, Perfil)
  // Isso garante que se for competição, ele pegue as poses certas.
  const allPoses = Array.from(new Set([
    ...leftCheckin.photos.map(p => p.pose_label),
    ...rightCheckin.photos.map(p => p.pose_label)
  ]));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* CONTROLES DE DATA */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 sticky top-4 z-10 shadow-xl shadow-black/50">
        
        {/* Seletor ESQUERDA (Antes) */}
        <div className="w-full md:w-1/3">
          <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Foto Anterior</label>
          <select 
            value={leftIndex}
            onChange={(e) => setLeftIndex(Number(e.target.value))}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
          >
            {checkins.map((c, idx) => (
              <option key={c.id} value={idx}>
                {new Date(c.created_at).toLocaleDateString('pt-BR')} — {c.weight}kg
              </option>
            ))}
          </select>
        </div>

        {/* Ícone Indicador */}
        <div className="text-blue-500">
          <ArrowRight size={24} />
        </div>

        {/* Seletor DIREITA (Depois) */}
        <div className="w-full md:w-1/3">
          <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Foto Atual</label>
          <select 
            value={rightIndex}
            onChange={(e) => setRightIndex(Number(e.target.value))}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
          >
            {checkins.map((c, idx) => (
              <option key={c.id} value={idx}>
                {new Date(c.created_at).toLocaleDateString('pt-BR')} — {c.weight}kg
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* GRID DE COMPARAÇÃO */}
      <div className="space-y-8">
        {allPoses.map((pose) => {
          const photoLeft = leftCheckin.photos.find(p => p.pose_label === pose);
          const photoRight = rightCheckin.photos.find(p => p.pose_label === pose);

          return (
            <div key={pose} className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="bg-slate-950/50 px-4 py-2 border-b border-slate-800 text-center">
                <h3 className="text-white font-bold uppercase tracking-widest text-sm">{pose}</h3>
              </div>
              
              <div className="grid grid-cols-2 divide-x divide-slate-800">
                {/* LADO ESQUERDO */}
                <div className="relative aspect-[3/4] group">
                  {photoLeft?.url ? (
                    <Image 
                      src={photoLeft.url} 
                      alt={`Antes - ${pose}`} 
                      fill 
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600">
                      <CameraOff size={32} className="mb-2"/>
                      <span className="text-xs">Sem foto</span>
                    </div>
                  )}
                  <div className="absolute top-2 left-2 bg-black/60 px-2 py-1 rounded text-xs text-white font-mono">
                    {new Date(leftCheckin.created_at).toLocaleDateString('pt-BR')}
                  </div>
                </div>

                {/* LADO DIREITO */}
                <div className="relative aspect-[3/4] group">
                  {photoRight?.url ? (
                    <Image 
                      src={photoRight.url} 
                      alt={`Depois - ${pose}`} 
                      fill 
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600">
                      <CameraOff size={32} className="mb-2"/>
                      <span className="text-xs">Sem foto</span>
                    </div>
                  )}
                  <div className="absolute top-2 right-2 bg-blue-600 px-2 py-1 rounded text-xs text-white font-mono font-bold shadow-lg">
                    {new Date(rightCheckin.created_at).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </div>
              
              {/* Diferença de Peso (Se houver) */}
              <div className="bg-slate-950/30 p-2 text-center text-xs text-slate-500">
                 Diferença: <span className={(rightCheckin.weight - leftCheckin.weight) <= 0 ? "text-emerald-400" : "text-red-400"}>
                   {(rightCheckin.weight - leftCheckin.weight).toFixed(1)}kg
                 </span> entre as datas.
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}