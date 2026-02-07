import { createStudent } from "../actions"; // Vamos criar esse arquivo no passo 3
import { Save, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NovoAlunoPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      
      {/* Botão Voltar */}
      <Link 
        href="/dashboard/alunos"
        className="inline-flex items-center text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft size={20} className="mr-2" />
        Voltar para lista
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-white">Cadastrar Novo Atleta</h1>
        <p className="text-slate-400 mt-2">
          Crie o acesso para seu aluno.
        </p>
      </div>

      {/* O FORMULÁRIO COMEÇA AQUI */}
      <form action={createStudent} className="bg-slate-900 border border-slate-800 rounded-xl p-8 space-y-6">
        
        {/* Nome */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Nome Completo</label>
          <input 
            name="fullName"
            type="text" 
            required
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
            placeholder="Ex: Paulo Adriano"
          />
        </div>

        {/* Email e Senha */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">E-mail</label>
            <input 
              name="email"
              type="email" 
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
              placeholder="aluno@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Senha Inicial</label>
            <input 
              name="password"
              type="text" 
              required
              defaultValue="mudar123"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>
        </div>

        {/* Objetivo */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Objetivo</label>
          <select 
            name="goal"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
          >
            <option value="emagrecimento">🔥 Emagrecimento</option>
            <option value="hipertrofia">💪 Hipertrofia</option>
            <option value="performance">⚡ Performance</option>
            <option value="competicao_men">🏆 Competição (H)</option>
            <option value="competicao_women">👑 Competição (M)</option>
          </select>
        </div>

        {/* Botão Salvar */}
        <div className="pt-4 border-t border-slate-800">
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-lg flex items-center justify-center gap-2 transition-all">
            <Save size={20} />
            Criar Acesso
          </button>
        </div>

      </form>
    </div>
  );
}