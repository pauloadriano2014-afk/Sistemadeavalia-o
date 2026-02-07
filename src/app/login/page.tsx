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
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Endereço de Email
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="relative block w-full rounded-md border-0 bg-slate-800 py-3 px-3 text-white ring-1 ring-inset ring-slate-700 placeholder:text-slate-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                placeholder="Endereço de Email"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="relative block w-full rounded-md border-0 bg-slate-800 py-3 px-3 text-white ring-1 ring-inset ring-slate-700 placeholder:text-slate-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                placeholder="Senha"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              formAction={login}
              className="group relative flex w-full justify-center rounded-md bg-blue-600 px-3 py-3 text-sm font-semibold text-white hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-all"
            >
              Entrar
            </button>
            <button
              formAction={signup}
              className="group relative flex w-full justify-center rounded-md bg-transparent border border-slate-600 px-3 py-3 text-sm font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
            >
              Criar nova conta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}