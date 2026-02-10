"use client";

import { useState } from "react";
import { ArrowRight, CameraOff } from "lucide-react";

interface Photo {
  id: string;
  storage_path: string;
  pose_label: string;
  url?: string;
}

interface Checkin {
  id: string;
  created_at: string;
  weight: number;
  photos: Photo[];
}

export default function PhotoComparator({ checkins }: { checkins: Checkin[] }) {
  if (!checkins || checkins.length < 2) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
        <p className="text-gray-500 text-sm">
          O aluno precisa de pelo menos 2 registros para gerar o comparativo rápido.
        </p>
      </div>
    );
  }

  const [leftIndex, setLeftIndex] = useState(checkins.length - 1);
  const [rightIndex, setRightIndex] = useState(0);

  const leftCheckin = checkins[leftIndex];
  const rightCheckin = checkins[rightIndex];

  const allPoses = Array.from(new Set([
    ...(leftCheckin.photos?.map(p => p.pose_label) || []),
    ...(rightCheckin.photos?.map(p => p.pose_label) || [])
  ])).filter(Boolean);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* BARRA DE CONTROLE */}
      <div className="bg-gray-50 border-b border-gray-200 p-4 flex flex-col md:flex-row items-center justify-between gap-4 rounded-t-xl">
        
        {/* Esquerda */}
        <div className="w-full md:w-1/3">
          <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">Data Anterior</label>
          <select 
            value={leftIndex}
            onChange={(e) => setLeftIndex(Number(e.target.value))}
            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
          >
            {checkins.map((c, idx) => (
              <option key={c.id} value={idx}>
                {new Date(c.created_at).toLocaleDateString('pt-BR')} — {c.weight}kg
              </option>
            ))}
          </select>
        </div>

        <ArrowRight size={20} className="text-gray-300 hidden md:block" />

        {/* Direita */}
        <div className="w-full md:w-1/3">
          <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">Data Atual</label>
          <select 
            value={rightIndex}
            onChange={(e) => setRightIndex(Number(e.target.value))}
            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
          >
            {checkins.map((c, idx) => (
              <option key={c.id} value={idx}>
                {new Date(c.created_at).toLocaleDateString('pt-BR')} — {c.weight}kg
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* GRID DE FOTOS */}
      <div className="p-4 md:p-6 space-y-8 bg-white rounded-b-xl">
        {allPoses.length === 0 && <div className="text-center text-gray-400 text-sm">Nenhuma foto encontrada nestas datas.</div>}
        
        {allPoses.map((pose) => {
          const photoLeft = leftCheckin.photos?.find(p => p.pose_label === pose);
          const photoRight = rightCheckin.photos?.find(p => p.pose_label === pose);

          if (!photoLeft && !photoRight) return null;

          return (
            <div key={pose} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 text-center flex justify-between items-center">
                <span className="text-gray-400 text-[10px] font-bold uppercase w-1/3 text-left">Antes</span>
                <h3 className="text-purple-600 font-bold uppercase tracking-widest text-xs w-1/3">{pose}</h3>
                <span className="text-gray-400 text-[10px] font-bold uppercase w-1/3 text-right">Depois</span>
              </div>
              
              <div className="grid grid-cols-2 divide-x divide-gray-100 bg-gray-100">
                
                {/* LADO ESQUERDO */}
                <div className="relative aspect-[3/4] group w-full bg-white">
                  {photoLeft?.url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img 
                      src={photoLeft.url} 
                      alt={`Antes - ${pose}`} 
                      // AQUI ESTÁ A CORREÇÃO DE ALINHAMENTO: object-cover
                      className="w-full h-full object-cover object-top" 
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300">
                      <CameraOff size={24} className="mb-2 opacity-50"/>
                      <span className="text-[10px]">Sem foto</span>
                    </div>
                  )}
                  {photoLeft && (
                      <div className="absolute bottom-2 left-2 bg-white/90 px-2 py-0.5 rounded text-[10px] text-gray-900 font-mono shadow-sm">
                        {new Date(leftCheckin.created_at).toLocaleDateString('pt-BR')}
                      </div>
                  )}
                </div>

                {/* LADO DIREITO */}
                <div className="relative aspect-[3/4] group w-full bg-white">
                  {photoRight?.url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img 
                      src={photoRight.url} 
                      alt={`Depois - ${pose}`} 
                      // AQUI ESTÁ A CORREÇÃO DE ALINHAMENTO: object-cover
                      className="w-full h-full object-cover object-top"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300">
                      <CameraOff size={24} className="mb-2 opacity-50"/>
                      <span className="text-[10px]">Sem foto</span>
                    </div>
                  )}
                  {photoRight && (
                      <div className="absolute bottom-2 right-2 bg-purple-600/90 px-2 py-0.5 rounded text-[10px] text-white font-mono font-bold shadow-sm">
                        {new Date(rightCheckin.created_at).toLocaleDateString('pt-BR')}
                      </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}