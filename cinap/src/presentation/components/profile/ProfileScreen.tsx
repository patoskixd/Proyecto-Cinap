"use client";
import { useProfile } from "./hooks/useProfile";
import { useTelegram } from "./hooks/useTelegram";

export default function ProfileScreen() {
  const { data, error, loading } = useProfile();
  const { state: tg, busy, link, unlink } = useTelegram();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '0.1s'}}></div>
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 shadow-lg">
          <div className="text-red-600 font-medium">{error ?? "Sin datos"}</div>
        </div>
      </div>
    );
  }

  const { user, stats } = data;

  const totalAsesorias = stats.total ?? stats.completed + stats.canceled;
  const resolvedAsesorias = stats.completed + stats.canceled;
  const successRate =
    resolvedAsesorias > 0 ? Math.round((stats.completed / resolvedAsesorias) * 100) : 0;

  const btnLabel = tg.linked
    ? `Vinculado${tg.username ? ` como ${tg.username.startsWith("@") ? tg.username : "@" + tg.username}` : ""}`
    : busy
    ? "Conectando..."
    : "Vincular Telegram";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header con avatar */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          {/* Banner superior */}
          <div className="h-32 bg-gradient-to-r from-blue-600 via-blue-700 to-yellow-500 relative">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="absolute -bottom-16 left-8">
              <div className="w-32 h-32 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full shadow-xl border-4 border-white flex items-center justify-center">
                <div className="text-4xl font-bold text-blue-600">
                  {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </div>
              </div>
            </div>
          </div>

          {/* Información del perfil */}
          <div className="pt-20 pb-8 px-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-4">
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">{user.name}</h1>
                  <p className="text-lg text-gray-600 mb-4">{user.email}</p>
                </div>
                
                {/* Badges mejorados */}
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    {user.role}
                  </span>
                  
                  <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium shadow-lg transition-all duration-300 ${
                    tg.linked 
                      ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-blue-700' 
                      : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700'
                  }`}>
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.09 0 2.16-.18 3.16-.5L19 23l1.5-4.84C21.46 16.75 22 14.46 22 12c0-5.52-4.48-10-10-10z"/>
                    </svg>
                    {tg.linked ? `Telegram vinculado` : "Sin vincular"}
                  </span>
                </div>
              </div>

              {/* Botones de Telegram mejorados */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={link}
                  disabled={busy || tg.linked}
                  className="group relative overflow-hidden px-8 py-4 rounded-2xl font-semibold text-white shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
                  style={{
                    background: tg.linked 
                      ? 'linear-gradient(135deg, #EAB308, #CA8A04)' 
                      : 'linear-gradient(135deg, #2563EB, #1D4ED8)'
                  }}
                >
                  <span className="relative z-10 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.09 0 2.16-.18 3.16-.5L19 23l1.5-4.84C21.46 16.75 22 14.46 22 12c0-5.52-4.48-10-10-10z"/>
                    </svg>
                    {btnLabel}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/0 transform translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
                </button>

                {tg.linked && (
                  <button
                    type="button"
                    onClick={unlink}
                    disabled={busy}
                    className="group relative overflow-hidden px-8 py-4 rounded-2xl font-semibold text-white bg-gradient-to-r from-red-500 to-red-600 shadow-xl transition-all duration-300 disabled:opacity-50 transform hover:scale-105 active:scale-95"
                    title="Desvincular Telegram de tu cuenta"
                  >
                    <span className="relative z-10 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      {busy ? "Desvinculando…" : "Desvincular"}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/0 transform translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas mejoradas */}
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Asesorías Completadas */}
          <div className="group bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-8 transition-all duration-300 hover:shadow-2xl hover:scale-105">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl shadow-lg">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="text-4xl font-bold text-gray-900 mb-2">{stats.completed}</div>
            <div className="text-sm font-medium text-gray-600">Asesorías Completadas</div>
          </div>

          {/* Asesorías Canceladas */}
          <div className="group bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-8 transition-all duration-300 hover:shadow-2xl hover:scale-105">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl shadow-lg">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="text-4xl font-bold text-gray-900 mb-2">{stats.canceled}</div>
            <div className="text-sm font-medium text-gray-600">Canceladas</div>
          </div>

          {/* Total de asesorias */}
          <div className="group bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-8 transition-all duration-300 hover:shadow-2xl hover:scale-105">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl shadow-lg">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7 4V3a1 1 0 10-2 0v1H4a2 2 0 00-2 2v13a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7zm13 6H4v9h16v-9z" />
                </svg>
              </div>
            </div>
            <div className="text-4xl font-bold text-gray-900 mb-2">{totalAsesorias}</div>
            <div className="text-sm font-medium text-gray-600">Total de asesorias</div>
          </div>

          {/* Tasa de Éxito */}
          <div className="group bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-8 transition-all duration-300 hover:shadow-2xl hover:scale-105">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl shadow-lg">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                </svg>
              </div>
            </div>
            <div className="text-4xl font-bold text-gray-900 mb-2">
              {successRate}%
            </div>
            <div className="text-sm font-medium text-gray-600">Tasa de Éxito</div>
          </div>
        </div>
      </div>
    </div>
  );
}
