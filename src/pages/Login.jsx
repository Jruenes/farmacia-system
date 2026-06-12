import { useState } from "react"
import { Pill, LogIn, Shield, AlertCircle, Lock, Mail, HeartPulse } from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { supabase } from "../lib/supabase" 

export default function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const iniciarSesion = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const correoLimpio = email.trim().toLowerCase();
      console.log("👉 Correo a buscar:", correoLimpio);

      // ✅ PRUEBA 1: TRAER TODA LA TABLA (PARA VER SI PODEMOS LEER)
      const { data: todosLosUsuarios, error: errorTodo } = await supabase
        .from("usuarios")
        .select("*");

      console.log("📋 TODA LA TABLA:", todosLosUsuarios, "ERROR:", errorTodo);

      // ✅ PRUEBA 2: BUSQUEDA EXACTA
      const { data: usuarioEncontrado, error: errorBusqueda } = await supabase
        .from("usuarios")
        .select("*")
        .eq("email", correoLimpio);

      console.log("🔍 BUSQUEDA:", usuarioEncontrado, "ERROR:", errorBusqueda);

      // 🚨 ANÁLISIS DE ERRORES
      if (errorBusqueda) {
        throw new Error(`❌ ERROR DE BASE: ${errorBusqueda.message} (Código: ${errorBusqueda.code})`);
      }

      if (!usuarioEncontrado || usuarioEncontrado.length === 0) {
        throw new Error("❌ Usuario no registrado. Verifica tu correo.");
      }

      // ✅ SI LLEGAMOS AQUÍ, SÍ EXISTE
      const perfil = usuarioEncontrado[0];

      if (perfil.estado === false) throw new Error("🚫 ACCESO DENEGADO: Usuario desactivado");
      if (password !== perfil.password) throw new Error("❌ Contraseña incorrecta");

      // ✅ ENTRAMOS
      await login(perfil);
      console.log("✅ LOGIN EXITOSO");

    } catch (err) {
      console.error("🚨 ERROR FINAL:", err);
      setError(err.message);
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-100 p-4 relative overflow-hidden">
      {/* ✨ EFECTOS DE FONDO DECORATIVOS */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-blue-200/30 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-cyan-200/40 rounded-full blur-3xl"></div>
      <div className="absolute top-1/2 right-1/3 w-40 h-40 bg-teal-200/20 rounded-full blur-2xl"></div>

      {/* 📦 CONTENEDOR PRINCIPAL */}
      <div className="bg-white/80 backdrop-blur-md rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.15)] w-full max-w-md overflow-hidden border border-white/40 relative z-10">
        
        {/* 🔵 ENCABEZADO CON GRADIENTE */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-cyan-700 text-white text-center py-10 px-8 relative">
          {/* Efecto de brillo interno */}
          <div className="absolute inset-0 bg-white/5"></div>
          
          <div className="w-24 h-24 mx-auto bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-5 shadow-lg border border-white/20 transform hover:scale-105 transition-transform duration-300">
            <HeartPulse size={48} className="text-white drop-shadow-md" />
          </div>
          
          <h1 className="text-[clamp(1.6rem,3vw,2.2rem)] font-bold leading-tight drop-shadow-sm">
            Droguería Elizabeth GS
          </h1>
          
          <p className="text-blue-100/90 mt-2 text-base font-light">
            Salud y bienestar para ti ⚕️
          </p>

          {/* Línea decorativa */}
          <div className="w-20 h-1 bg-white/40 rounded-full mx-auto mt-4"></div>
        </div>

        {/* 📋 FORMULARIO */}
        <div className="p-8">
          <div className="text-center mb-7">
            <div className="flex items-center justify-center gap-2 text-gray-700 mb-2">
              <Shield size={20} className="text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-800">Acceso Seguro</h2>
            </div>
            <p className="text-gray-500 text-sm">
              Ingresa tus credenciales para gestionar el sistema
            </p>
          </div>

          {/* ⚠️ MENSAJE DE ERROR */}
          {error && (
            <div className="mb-5 p-4 border rounded-2xl flex items-center gap-3 text-sm bg-red-50/80 backdrop-blur-sm border-red-200/60 text-red-800 shadow-sm animate-pulse">
              <AlertCircle size={18} className="text-red-600 flex-shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={iniciarSesion} className="space-y-6">
            {/* 📧 CAMPO CORREO */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Mail size={15} className="text-blue-500" />
                Correo Electrónico
              </label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="tunombre@drogueria.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-200/70 bg-white/60 backdrop-blur-sm p-4 pl-5 rounded-2xl focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all duration-300 shadow-sm hover:shadow-md"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* 🔒 CAMPO CONTRASEÑA */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Lock size={15} className="text-blue-500" />
                Contraseña
              </label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-200/70 bg-white/60 backdrop-blur-sm p-4 pl-5 rounded-2xl focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all duration-300 shadow-sm hover:shadow-md"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* 🚀 BOTÓN DE INICIO */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-700 hover:from-blue-700 hover:to-cyan-800 text-white py-4 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-[0.985] active:scale-[0.995] disabled:opacity-65 disabled:cursor-not-allowed shadow-[0_8px_20px_rgba(37,99,235,0.25)] hover:shadow-[0_10px_25px_rgba(37,99,235,0.35)] mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-30" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verificando...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <LogIn size={20} />
                  Iniciar Sesión
                </span>
              )}
            </button>
          </form>

          {/* 📎 PIE DE PÁGINA */}
          <div className="mt-10 text-center text-xs text-gray-500/80 font-medium">
            <p>© 2026 Droguería Elizabeth GS • Todos los derechos reservados</p>
            <p className="mt-1 text-[10px] text-gray-400">Sistema de Gestión Farmacéutica</p>
          </div>
        </div>
      </div>
    </div>
  )
}