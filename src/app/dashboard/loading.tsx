export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse bg-black min-h-screen">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-zinc-900">
        <div className="space-y-3">
          <div className="h-8 w-48 md:w-64 bg-zinc-900 rounded-lg"></div>
          <div className="h-4 w-32 md:w-48 bg-zinc-900 rounded-lg"></div>
        </div>
        <div className="h-10 w-full md:w-32 bg-zinc-900 rounded-lg"></div>
      </div>

      {/* Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 h-32">
            <div className="flex justify-between mb-4">
              <div className="h-4 w-24 bg-zinc-800 rounded"></div>
              <div className="h-8 w-8 bg-zinc-800 rounded"></div>
            </div>
            <div className="h-8 w-16 bg-zinc-800 rounded mt-2"></div>
          </div>
        ))}
      </div>

      {/* Lista */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
          <div className="h-5 w-32 bg-zinc-800 rounded"></div>
          <div className="h-4 w-20 bg-zinc-800 rounded"></div>
        </div>
        <div className="p-0">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between p-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-zinc-800"></div>
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-zinc-800 rounded"></div>
                  <div className="h-3 w-20 bg-zinc-800 rounded"></div>
                </div>
              </div>
              <div className="hidden md:block h-4 w-24 bg-zinc-800 rounded"></div>
              <div className="h-8 w-8 bg-zinc-800 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}