import { login, signup } from "./actions";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-md space-y-8 bg-slate-900 p-8 rounded-xl border border-slate-800 shadow-2xl">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-white">
            Acesse sua conta
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Área restrita para Coaches e Alunos
          </p>
        </div>
        
        <form className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="email-address" className="block text-sm font-medium text-slate-300 mb-1">
                E-mail
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="block w-full rounded-md border border-slate-700 bg-slate-800 py-3 px-3 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="seu@email.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="block w-full rounded-md border border-slate-700 bg-slate-800 py-3 px-3 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {/* Botão de Entrar (Azul) */}
            <button
              formAction={login}
              className="w-full justify-center rounded-md bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all uppercase tracking-wide"
            >
              Entrar
            </button>

            {/* Divisor Visual */}
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-slate-700"></div>
              <span className="flex-shrink-0 mx-4 text-slate-500 text-xs uppercase">Ou</span>
              <div className="flex-grow border-t border-slate-700"></div>
            </div>

            {/* Botão de Criar Conta (Verde - Para destacar bem) */}
            <button
              formAction={signup}
              className="w-full justify-center rounded-md bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all uppercase tracking-wide"
            >
              Criar Nova Conta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}