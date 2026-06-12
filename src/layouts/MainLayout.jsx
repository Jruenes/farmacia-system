import { useEffect, useState } from "react"
import Sidebar from "../components/Sidebar"

// 📦 Importación de Páginas
import Dashboard from "../pages/Dashboard"
import Inventario from "../pages/Inventario"
import Ventas from "../pages/Ventas"
import HistorialVentas from "../pages/HistorialVentas"
import Clientes from "../pages/Clientes"
import Caja from "../pages/Caja"
import Configuracion from "../pages/Configuracion" // ⚙️ NUEVA PÁGINA

import { useAuth } from "../context/AuthContext"

export default function MainLayout() {
  // 🧠 Estado: Página actual
  const [pagina, setPagina] = useState("ventas") // Por defecto: Punto de Venta

  // 🔐 Datos de usuario y permisos
  const { usuario, logout } = useAuth()
  const esAdmin = usuario?.rol === "Administrador"

  // 🛡️ RUTAS PERMITIDAS POR ROL
  const rutasPermitidas = {
    Administrador: [
      "dashboard", 
      "inventario", 
      "ventas", 
      "historial", 
      "clientes", 
      "caja", 
      "configuracion" // ⚙️ SOLO ADMIN
    ],
    Empleado: [
      "ventas", 
      "historial", 
      "clientes" // ❌ ACCESO RESTRINGIDO
    ] 
  }

  // ⏱️ CONTROL DE ACCESO Y REDIRECCIONES
  useEffect(() => {
    if (!usuario) return

    // 🔒 PROTECCIÓN: Si es Empleado e intenta entrar a ruta prohibida -> Redirigir a Ventas
    if (!esAdmin && !rutasPermitidas.Empleado.includes(pagina)) {
      setPagina("ventas")
      return
    }

  }, [usuario, esAdmin, pagina, rutasPermitidas.Empleado])

  // ⏳ PANTALLA DE CARGA MIENTRAS VALIDA SESIÓN
  if (!usuario) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600 font-medium">Cargando datos del usuario...</p>
      </div>
    )
  }

  return (
    <div className="flex bg-gray-100 min-h-screen">
      {/* 📑 BARRA LATERAL - COMPLETAMENTE SINCRONIZADA */}
      <Sidebar 
        setPagina={setPagina} 
        usuario={usuario} 
        paginaActual={pagina}
        logout={logout}
      />

      {/* 📄 CONTENIDO PRINCIPAL CON ENCABEZADO DE PÁGINA */}
      <main className="flex-1 p-4 md:p-6 overflow-auto">
        {/* ✨ Encabezado dinámico según la página actual */}
        <div className="mb-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">
            {pagina === "dashboard" && "Panel Principal"}
            {pagina === "inventario" && "Gestión de Inventario"}
            {pagina === "ventas" && "Punto de Venta"}
            {pagina === "historial" && "Historial de Ventas"}
            {pagina === "clientes" && "Gestión de Clientes"}
            {pagina === "caja" && "Arqueo de Caja Diaria"}
            {pagina === "configuracion" && "Configuración del Sistema"}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {esAdmin 
              ? "Acceso total: Administrador del sistema" 
              : `Trabajando en: Sede ${usuario?.sede_id || "Principal"}`
            }
          </p>
        </div>

        {/* 📦 RUTAS Y COMPONENTES */}
        <div className="animate-fadeIn">
          {/* 👑 SECCIONES EXCLUSIVAS DEL ADMINISTRADOR */}
          {esAdmin && pagina === "dashboard" && <Dashboard />}
          {esAdmin && pagina === "inventario" && <Inventario />}
          {esAdmin && pagina === "caja" && <Caja />}
          {esAdmin && pagina === "configuracion" && <Configuracion />}

          {/* 🧑‍💼 SECCIONES COMPARTIDAS (AMBOS ROLES) */}
          {pagina === "ventas" && <Ventas />}
          {pagina === "historial" && <HistorialVentas />}
          {pagina === "clientes" && <Clientes />}
        </div>
      </main>
    </div>
  )
}