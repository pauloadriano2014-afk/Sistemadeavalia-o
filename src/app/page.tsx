import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-white p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-blue-500">
            Fitness SaaS <span className="text-white">Pro</span>
          </h1>
          <p className="mt-2 text-slate-400">
            Sistema de Avaliação e Evolução Física High-End.
          </p>
        </div>
        
        <div className="flex flex-col gap-4 mt-8">
          <Link 
            href="/login" 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded transition"
          >
            Entrar como Coach
          </Link>
          <Link 
            href="/login" 
            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-4 rounded transition"
          >
            Área do Aluno
          </Link>
        </div>
      </div>
    </main>
  );
}