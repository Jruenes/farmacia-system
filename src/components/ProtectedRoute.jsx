import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, soloAdmin = false }) {
  const { usuario, loading } = useAuth();

  // Mientras carga, mostramos nada o un cargador
  if (loading) return <div className="flex items-center justify-center h-screen">Cargando...</div>;

  // Si NO hay usuario logueado, lo mandamos al login
  if (!usuario) return <Navigate to="/login" replace />;

  // Si es una ruta SOLO para ADMIN y el usuario NO es admin... ¡FUERA!
  if (soloAdmin && usuario.rol !== "Administrador") {
    return <Navigate to="/dashboard" replace />;
  }

  // Si todo está bien, mostramos la página
  return children;
}