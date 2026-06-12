import MainLayout from "./layouts/MainLayout"
import Login from "./pages/Login"

import {
  AuthProvider,
  useAuth
} from "./context/AuthContext"

// 📌 Componente que maneja la lógica de navegación y permisos
function AppContent() {
  const {
    usuario,
    loading
  } = useAuth()

  // ⏳ Pantalla de carga mientras verifica sesión
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600 font-medium">Verificando sesión...</p>
      </div>
    )
  }

  // 🔒 Si NO hay usuario logueado, mostrar Login
  if (!usuario) {
    return <Login />
  }

  // ✅ Si YA hay usuario, cargar la estructura principal
  // MainLayout ya se encargará de mostrar menús y rutas según el rol
  return <MainLayout />
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App