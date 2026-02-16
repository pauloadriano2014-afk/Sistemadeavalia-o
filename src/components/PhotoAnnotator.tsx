"use client";

import { useRef, useState } from "react";
import CanvasDraw from "react-canvas-draw";
import { Undo, Trash2, Check, X, MousePointer2 } from "lucide-react";

interface PhotoAnnotatorProps {
  imageUrl: string;
  onSave: (annotatedBase64: string) => void;
  onCancel: () => void;
}

export function PhotoAnnotator({ imageUrl, onSave, onCancel }: PhotoAnnotatorProps) {
  const canvasRef = useRef<CanvasDraw | null>(null);
  const [brushSize, setBrushSize] = useState(3);

  const handleExport = () => {
    if (canvasRef.current) {
      // @ts-ignore - Obtém a imagem combinada (foto + desenho)
      const dataUrl = canvasRef.current.getDataURL("png", false, "#ffffff");
      onSave(dataUrl);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4">
      {/* TOOLBAR */}
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 p-4 rounded-t-2xl flex items-center justify-between">
        <div className="flex gap-4 items-center">
            <button onClick={onCancel} className="p-2 text-zinc-500 hover:text-white transition-colors">
                <X size={24} />
            </button>
            <div className="h-6 w-px bg-zinc-800" />
            <span className="text-xs font-black uppercase tracking-widest text-brand">Modo Anotação</span>
        </div>

        <div className="flex gap-2">
            <button 
                onClick={() => canvasRef.current?.undo()} 
                className="p-2 bg-zinc-800 rounded-lg text-white hover:bg-zinc-700"
                title="Desfazer"
            >
                <Undo size={18} />
            </button>
            <button 
                onClick={() => canvasRef.current?.clear()} 
                className="p-2 bg-zinc-800 rounded-lg text-red-500 hover:bg-red-500/10"
                title="Limpar tudo"
            >
                <Trash2 size={18} />
            </button>
            <button 
                onClick={handleExport}
                className="flex items-center gap-2 bg-brand text-black px-4 py-2 rounded-lg font-black text-xs uppercase"
            >
                <Check size={18} /> Aplicar
            </button>
        </div>
      </div>

      {/* ÁREA DO DESENHO */}
      <div className="relative bg-zinc-900 border-x border-b border-zinc-800 rounded-b-2xl overflow-hidden shadow-2xl">
        <CanvasDraw
          ref={canvasRef}
          imgSrc={imageUrl}
          brushColor="#ff0000" // Vermelho para dar destaque
          brushRadius={brushSize}
          lazyRadius={0}
          canvasWidth={400} // Ajuste conforme necessário
          canvasHeight={550}
          enablePanAndZoom={false}
          hideGrid={true}
          style={{ background: "transparent" }}
        />
      </div>

      <p className="mt-4 text-zinc-500 text-[10px] uppercase font-bold tracking-tighter">
        Use o mouse ou o dedo para desenhar círculos e setas na imagem
      </p>
    </div>
  );
}