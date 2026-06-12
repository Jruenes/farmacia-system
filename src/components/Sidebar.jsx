import {
  LayoutDashboard,
  Boxes,
  ShoppingCart,
  Users,
  Wallet,
  Pill,
  Receipt,
  LogOut,
  Store,
  Settings,
  Building2,
  ChevronRight,
  UserCircle2,
  HeartPulse
} from "lucide-react"

export default function Sidebar({
  setPagina,
  usuario,
  paginaActual,
  logout
}) {
  // 📋 MENÚS SEGÚN ROL
  const menusAdmin = [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      value: "dashboard",
      descripcion: "Resumen general"
    },
    {
      name: "Inventario",
      icon: Boxes,
      value: "inventario",
      descripcion: "Productos y existencias"
    },
    {
      name: "Punto de Venta",
      icon: ShoppingCart,
      value: "ventas",
      descripcion: "Facturación rápida"
    },
    {
      name: "Historial de Ventas",
      icon: Receipt,
      value: "historial",
      descripcion: "Registro de transacciones"
    },
    {
      name: "Clientes",
      icon: Users,
      value: "clientes",
      descripcion: "Gestión de usuarios"
    },
    {
      name: "Caja Diaria",
      icon: Wallet,
      value: "caja",
      descripcion: "Cortes y reportes"
    },
    {
      name: "Configuración",
      icon: Settings,
      value: "configuracion",
      descripcion: "Ajustes del sistema"
    }
  ]

  const menusEmpleado = [
    {
      name: "Punto de Venta",
      icon: ShoppingCart,
      value: "ventas",
      descripcion: "Facturación rápida"
    },
    {
      name: "Historial de Ventas",
      icon: Receipt,
      value: "historial",
      descripcion: "Registro de transacciones"
    },
    {
      name: "Clientes",
      icon: Users,
      value: "clientes",
      descripcion: "Gestión de usuarios"
    }
  ]

  // 🧠 Definir menú a mostrar
  const menus = usuario?.rol === "Administrador" ? menusAdmin : menusEmpleado

  // 📌 Función para obtener nombre bonito del rol
  const nombreRol = (rol) => {
    if (rol === "Administrador") return "Administrador General"
    if (rol === "Empleado") return "Personal de Sede"
    return rol
  }

  return (
    <aside
      className="
        w-[290px]
        min-h-screen
        bg-gradient-to-b from-white to-blue-50/30
        border-r border-blue-100/60
        shadow-[0_0_30px_rgba(59,130,246,0.08)]
        flex
        flex-col
        sticky
        top-0
        z-20
      "
    >
      {/* 🏷️ ENCABEZADO - MARCA */}
      <div className="p-6 border-b border-blue-100/50 bg-white/60 backdrop-blur-sm">
        <div className="flex items-center gap-3 group">
          <div
            className="
              w-14
              h-14
              rounded-2xl
              bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-700
              flex
              items-center
              justify-center
              text-white
              shadow-lg
              transform
              group-hover:scale-105
              group-hover:rotate-2
              transition-all
              duration-300
              border-4 border-white/80
            "
          >
            <HeartPulse size={26} className="drop-shadow" />
          </div>

          <div>
            <h1 className="font-bold text-xl text-gray-800 leading-tight">
              Droguería GS
            </h1>
            <p className="text-sm text-blue-600/80 flex items-center gap-1 font-medium">
              <Store size={14} />
              Gestión Farmacéutica
            </p>
          </div>
        </div>
      </div>

      {/* 📂 NAVEGACIÓN PRINCIPAL */}
      <div className="flex-1 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-transparent">
        <p
          className="
            text-xs
            font-extrabold
            text-blue-600
            uppercase
            tracking-widest
            mb-4
            px-4
            flex
            items-center
            justify-between
          "
        >
          Menú Principal
          <span className="w-8 h-[2px] bg-gradient-to-r from-blue-400 to-cyan-300 rounded-full"></span>
        </p>

        <div className="space-y-2.5">
          {menus.map((menu, index) => {
            const Icon = menu.icon
            const esActivo = paginaActual === menu.value

            return (
              <button
                key={index}
                onClick={() => setPagina(menu.value)}
                className={`
                  w-full
                  relative
                  flex
                  items-center
                  gap-3
                  px-4
                  py-3.5
                  rounded-2xl
                  font-medium
                  transition-all
                  duration-300
                  group
                  overflow-hidden
                  ${esActivo
                    ? "bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 shadow-md border border-blue-200/60"
                    : "text-gray-700 hover:bg-white/80 hover:text-blue-600 hover:shadow-sm border border-transparent hover:border-blue-100/40"
                  }
                `}
              >
                {/* Efecto brillo al activo */}
                {esActivo && (
                  <span className="absolute inset-0 bg-gradient-to-r from-blue-100/20 to-cyan-100/20"></span>
                )}

                <div className={`
                  p-2 rounded-xl transition-all duration-300
                  ${esActivo ? "bg-blue-200/50 text-blue-700" : "bg-gray-100/70 text-gray-500 group-hover:bg-blue-100/50 group-hover:text-blue-600"}
                `}>
                  <Icon 
                    size={20} 
                    className={`transition-transform duration-300 ${esActivo ? "scale-110" : "group-hover:scale-110"}`} 
                  />
                </div>

                <div className="text-left flex-1">
                  <span className="block text-sm font-semibold">{menu.name}</span>
                  <span className="text-[10px] text-gray-500/80 font-normal">{menu.descripcion}</span>
                </div>

                {/* Indicador y flecha */}
                {esActivo ? (
                  <span className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 animate-pulse shadow-lg"></span>
                ) : (
                  <ChevronRight size={16} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* 👤 PERFIL Y BOTÓN SALIR */}
      <div className="p-4 border-t border-blue-100/50 bg-white/70 backdrop-blur-sm">
        <div className="bg-gradient-to-br from-white to-blue-50/40 rounded-2xl p-4 shadow-md border border-blue-100/40 mb-4 hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white shadow-sm">
              <UserCircle2 size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-800 text-sm truncate">
                {usuario?.nombre || "Usuario Sistema"}
              </p>
              <p className="text-xs font-medium text-blue-600/90">
                {nombreRol(usuario?.rol)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-xs bg-blue-50/70 rounded-lg p-2 border border-blue-100/50">
            <Building2 size={14} className="text-blue-500" />
            <span className="text-gray-700 font-medium">
              Sede: <span className="text-blue-700 font-semibold">{usuario?.sede_nombre || `Sede ${usuario?.sede_id || "-"}`}</span>
            </span>
          </div>
        </div>

        <button
          onClick={() => {
            if (window.confirm("¿Seguro que deseas cerrar sesión?")) {
              logout()
            }
          }}
          className="
            w-full
            flex
            items-center
            justify-center
            gap-2
            bg-gradient-to-r from-red-50 to-red-100/70
            hover:from-red-100 hover:to-red-200/60
            text-red-600
            py-3.5
            rounded-2xl
            font-semibold
            transition-all
            duration-300
            border border-red-200/60
            hover:shadow-md
            active:scale-[0.97]
            group
          "
        >
          <LogOut size={18} className="group-hover:translate-x-1 transition-transform duration-200" />
          Cerrar Sesión
        </button>

        <p className="text-[9px] text-center text-gray-400 mt-3 font-medium">
          © 2026 Droguería Elizabeth GS
        </p>
      </div>
    </aside>
  )
}