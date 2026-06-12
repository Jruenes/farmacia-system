import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import { useAuth } from "../context/AuthContext"

import {
  DollarSign,
  Package,
  AlertTriangle,
  Boxes,
  TrendingUp,
  ShoppingCart,
  XCircle,
  Store,
  Calendar,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  ArrowUpCircle
} from "lucide-react"

// ✅ IMPORTAMOS LAS FUNCIONES ESTANDARIZADAS
import { fechaColombia, soloFecha } from "../utils/fecha"

export default function Dashboard() {
  const { usuario } = useAuth()
  const esAdmin = usuario?.rol === "Administrador"

  // 📌 ESTADOS
  const [productos, setProductos] = useState([])
  const [stockBajo, setStockBajo] = useState([])
  const [agotados, setAgotados] = useState([])
  const [ventasHoy, setVentasHoy] = useState(0)
  const [ingresosHoy, setIngresosHoy] = useState(0)
  const [ventasRecientes, setVentasRecientes] = useState([])
  const [cargando, setCargando] = useState(true)

  // ✅ Selector de sede (solo Admin) - AHORA CARGA DE LA BD
  const [sedesDisponibles, setSedesDisponibles] = useState([])
  const [sedeSeleccionada, setSedeSeleccionada] = useState("todas")

  // ⏱️ Cargar datos al inicio o al cambiar filtros
  useEffect(() => {
    if (usuario) {
      cargarSedes()
      cargarDatos()
    }
  }, [usuario, sedeSeleccionada])

  // 📥 CARGAR LISTA DE SEDES PARA EL SELECTOR
  const cargarSedes = async () => {
    try {
      const { data, error } = await supabase
        .from("sedes")
        .select("id, nombre")
        .eq("estado", true)
        .order("nombre", { ascending: true })

      if (error) throw error
      setSedesDisponibles(data || [])

    } catch (err) {
      console.error("Error al cargar lista de sedes:", err)
    }
  }

  // 📥 CARGAR TODOS LOS DATOS
  const cargarDatos = async () => {
    setCargando(true)

    // ==========================================
    // 🔹 1. CARGAR PRODUCTOS (FILTRADOS POR SEDE)
    // ==========================================
    let consultaProductos = supabase
      .from("productos")
      .select("*")

    if (!esAdmin) {
      consultaProductos = consultaProductos.eq("sede_id", usuario?.sede_id)
    } else {
      if (sedeSeleccionada !== "todas") {
        consultaProductos = consultaProductos.eq("sede_id", Number(sedeSeleccionada))
      }
    }

    const { data: productosData, error: errorProductos } = await consultaProductos

    if (errorProductos) {
      console.error("Error al cargar productos:", errorProductos)
      setCargando(false)
      return
    }

    const listaProductos = productosData || []
    setProductos(listaProductos)

    // 🔍 Calcular alertas de inventario
    setStockBajo(
      listaProductos.filter(
        producto =>
          Number(producto.stock || 0) > 0 &&
          Number(producto.stock || 0) <= Number(producto.stock_minimo || 5)
      )
    )

    setAgotados(
      listaProductos.filter(
        producto => Number(producto.stock || 0) <= 0
      )
    )

    // ==========================================
    // 🔹 2. CARGAR VENTAS DE HOY ✅ CORREGIDO ZONA HORARIA
    // ==========================================
    const fechaHoy = soloFecha(new Date()) // ✅ USAMOS FUNCIÓN ESTANDAR
    const inicioDia = `${fechaHoy}T00:00:00-05:00` // ✅ FORZAMOS UTC-5
    const finDia = `${fechaHoy}T23:59:59-05:00`   // ✅ FORZAMOS UTC-5

    let consultaVentasHoy = supabase
      .from("ventas")
      .select("*")
      .gte("created_at", inicioDia)
      .lte("created_at", finDia)

    if (!esAdmin) {
      consultaVentasHoy = consultaVentasHoy.eq("sede_id", usuario?.sede_id)
    } else {
      if (sedeSeleccionada !== "todas") {
        consultaVentasHoy = consultaVentasHoy.eq("sede_id", Number(sedeSeleccionada))
      }
    }

    const { data: ventasHoyData, error: errorVentasHoy } = await consultaVentasHoy

    if (errorVentasHoy) {
      console.error("Error al cargar ventas de hoy:", errorVentasHoy)
    }

    const ventasHoyLista = ventasHoyData || []
    setVentasHoy(ventasHoyLista.length)
    setIngresosHoy(
      ventasHoyLista.reduce((acc, venta) => acc + Number(venta.total || 0), 0)
    )

    // ==========================================
    // 🔹 3. CARGAR ÚLTIMAS 5 VENTAS (Actividad Reciente)
    // ==========================================
    let consultaRecientes = supabase
      .from("ventas")
      .select("id, total, created_at, sede_id, metodo_pago")
      .order("id", { ascending: false })
      .limit(5)

    if (!esAdmin) {
      consultaRecientes = consultaRecientes.eq("sede_id", usuario?.sede_id)
    } else {
      if (sedeSeleccionada !== "todas") {
        consultaRecientes = consultaRecientes.eq("sede_id", Number(sedeSeleccionada))
      }
    }

    const { data: recientesData, error: errorRecientes } = await consultaRecientes

    if (errorRecientes) {
      console.error("Error al cargar ventas recientes:", errorRecientes)
    }

    setVentasRecientes(recientesData || [])
    setCargando(false)
  }

  // 🧮 CÁLCULOS MATEMÁTICOS
  const totalInventario = productos.reduce(
    (acc, producto) => acc + (Number(producto.stock || 0) * Number(producto.precio_compra || 0)),
    0
  )

  const totalStock = productos.reduce(
    (acc, producto) => acc + Number(producto.stock || 0),
    0
  )

  // ⏰ FORMATEAR HORA ✅ AHORA USA FUNCIÓN ESTANDAR
  const formatearHora = (fechaISO) => {
    if (!fechaISO) return ""
    return fechaColombia(fechaISO).split(" ")[1] || fechaColombia(fechaISO)
  }

  // 🔎 BUSCAR NOMBRE DE LA SEDE POR SU ID
  const obtenerNombreSede = (idSede) => {
    if (!sedesDisponibles || sedesDisponibles.length === 0) return "Cargando..."
    const sede = sedesDisponibles.find(s => s.id === idSede)
    return sede ? sede.nombre : "Sede desconocida"
  }

  // 📋 DATOS DE LAS TARJETAS RESUMEN
  const cards = [
    {
      title: "Productos",
      value: productos.length,
      icon: Package,
      color: "from-blue-500 to-blue-700",
      colorTexto: "text-blue-700",
      colorFondo: "bg-blue-50"
    },
    {
      title: "Stock Bajo",
      value: stockBajo.length,
      icon: AlertTriangle,
      color: "from-orange-500 to-amber-500",
      colorTexto: "text-orange-700",
      colorFondo: "bg-orange-50"
    },
    {
      title: "Agotados",
      value: agotados.length,
      icon: XCircle,
      color: "from-red-600 to-rose-700",
      colorTexto: "text-red-700",
      colorFondo: "bg-red-50"
    },
    {
      title: "Ventas Hoy",
      value: ventasHoy,
      icon: ShoppingCart,
      color: "from-cyan-500 to-sky-600",
      colorTexto: "text-cyan-700",
      colorFondo: "bg-cyan-50"
    },
    {
      title: "Ingresos Hoy",
      value: `$${ingresosHoy.toLocaleString("es-CO")}`,
      icon: TrendingUp,
      color: "from-green-500 to-emerald-700",
      colorTexto: "text-green-700",
      colorFondo: "bg-green-50"
    },
    {
      title: "Valor Inventario",
      value: `$${totalInventario.toLocaleString("es-CO")}`,
      icon: DollarSign,
      color: "from-teal-500 to-teal-700",
      colorTexto: "text-teal-700",
      colorFondo: "bg-teal-50"
    },
    {
      title: "Unidades Stock",
      value: totalStock,
      icon: Boxes,
      color: "from-purple-500 to-indigo-600",
      colorTexto: "text-purple-700",
      colorFondo: "bg-purple-50"
    }
  ]

  return (
    <div className="space-y-6 p-4 bg-gradient-to-br from-gray-50 to-blue-50/30 min-h-screen relative overflow-hidden">
      {/* ✨ DETALLES DE FONDO DECORATIVOS */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-200/20 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-200/10 rounded-full blur-3xl -z-10"></div>

      {/* 📌 ENCABEZADO */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white/80 backdrop-blur-md p-6 rounded-[2rem] shadow-[0_10px_40px_rgba(59,130,246,0.1)] border border-white/60">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl shadow-lg text-white">
              <Store size={26} />
            </div>
            <h1 className="text-[clamp(1.5rem,3vw,2.5rem)] font-bold text-gray-800 flex items-center gap-2">
              Panel Principal
              <Sparkles size={18} className="text-yellow-500" />
            </h1>
          </div>
          
          <p className="text-gray-600 ml-[70px] font-medium">
            {!esAdmin
              ? `👤 Resumen de la sede: ${obtenerNombreSede(usuario?.sede_id)}`
              : `👑 Administrador: Resumen ${sedeSeleccionada === "todas" ? "general" : `de ${obtenerNombreSede(Number(sedeSeleccionada))}`}`}
          </p>
        </div>

        {/* 🔽 SELECTOR DE SEDE - SOLO ADMIN */}
        {esAdmin && (
          <div className="relative w-full lg:w-auto">
            <select
              value={sedeSeleccionada}
              onChange={(e) => setSedeSeleccionada(e.target.value)}
              className="w-full lg:w-64 border border-blue-100 bg-white/70 backdrop-blur-sm p-3.5 pl-5 pr-10 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all appearance-none font-medium text-gray-700"
            >
              <option value="todas">🏢 Todas las sedes</option>
              {sedesDisponibles.map(sede => (
                <option key={sede.id} value={sede.id}>📍 {sede.nombre}</option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-blue-500">
              <ArrowUpCircle size={18} />
            </div>
          </div>
        )}
      </div>

      {/* ⏳ INDICADOR DE CARGA */}
      {cargando && (
        <div className="text-center py-16">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-500 font-medium text-lg">Cargando datos del sistema...</p>
        </div>
      )}

      {!cargando && (
        <>
          {/* 📊 TARJETAS RESUMEN */}
          <div className="grid xl:grid-cols-4 md:grid-cols-2 grid-cols-1 gap-6">
            {cards.map((card, index) => {
              const Icon = card.icon
              return (
                <div
                  key={index}
                  className="bg-white/80 backdrop-blur-md rounded-[2rem] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.06)] border border-white/60 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm font-semibold">{card.title}</p>
                      <h2 className={`text-[clamp(1.5rem,2vw,2rem)] font-bold mt-2 ${card.colorTexto} break-words`}>
                        {card.value}
                      </h2>
                    </div>
                    <div
                      className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white bg-gradient-to-br ${card.color} shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform`}
                    >
                      <Icon size={30} />
                    </div>
                  </div>
                  <div className={`w-full h-1.5 rounded-full mt-4 ${card.colorFondo}`}>
                    <div className={`h-full rounded-full bg-gradient-to-r ${card.color} w-3/4`}></div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* ⚠️ ALERTAS DE INVENTARIO */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* STOCK BAJO */}
            <div className="bg-white/80 backdrop-blur-md rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.06)] border border-white/60 overflow-hidden hover:shadow-xl transition-shadow">
              <div className="p-6 border-b border-orange-100/60 bg-gradient-to-r from-orange-50/80 to-amber-50/50 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-xl text-orange-600">
                    <AlertTriangle size={22} />
                  </div> 
                  Productos con Stock Bajo
                </h2>
                <span className="bg-orange-200 text-orange-800 font-bold px-3 py-1 rounded-full text-sm">
                  {stockBajo.length}
                </span>
              </div>
              <div className="p-6 space-y-3 min-h-[180px]">
                {stockBajo.length > 0 ? (
                  stockBajo.map(producto => (
                    <div
                      key={producto.id}
                      className="flex justify-between items-center bg-gradient-to-r from-orange-50/70 to-amber-50/40 p-4 rounded-2xl border border-orange-100/60 hover:shadow-sm transition-shadow"
                    >
                      <span className="font-semibold text-gray-800">{producto.nombre}</span>
                      <span className="font-bold text-orange-700 bg-white/80 px-4 py-1.5 rounded-full text-sm shadow-sm">
                        ⚠️ Quedan: {producto.stock}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-2 py-6">
                    <CheckCircle2 size={40} className="text-green-500" />
                    <span className="font-medium">Todo al día, sin productos bajos</span>
                  </div>
                )}
              </div>
            </div>

            {/* AGOTADOS */}
            <div className="bg-white/80 backdrop-blur-md rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.06)] border border-white/60 overflow-hidden hover:shadow-xl transition-shadow">
              <div className="p-6 border-b border-red-100/60 bg-gradient-to-r from-red-50/80 to-rose-50/50 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-xl text-red-600">
                    <XCircle size={22} />
                  </div>
                  Productos Agotados
                </h2>
                <span className="bg-red-200 text-red-800 font-bold px-3 py-1 rounded-full text-sm">
                  {agotados.length}
                </span>
              </div>
              <div className="p-6 space-y-3 min-h-[180px]">
                {agotados.length > 0 ? (
                  agotados.map(producto => (
                    <div
                      key={producto.id}
                      className="flex justify-between items-center bg-gradient-to-r from-red-50/70 to-rose-50/40 p-4 rounded-2xl border border-red-100/60 hover:shadow-sm transition-shadow"
                    >
                      <span className="font-semibold text-gray-800">{producto.nombre}</span>
                      <span className="font-bold text-red-700 bg-white/80 px-4 py-1.5 rounded-full text-sm shadow-sm">
                        ❌ Sin existencias
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-2 py-6">
                    <CheckCircle2 size={40} className="text-green-500" />
                    <span className="font-medium">¡Excelente! Ningún producto agotado</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ⚡ ACTIVIDAD RECIENTE */}
          <div className="bg-white/80 backdrop-blur-md rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.06)] border border-white/60 overflow-hidden hover:shadow-xl transition-shadow mt-6">
            <div className="p-6 border-b border-blue-100/50 bg-gradient-to-r from-blue-50/80 to-cyan-50/50">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-xl text-blue-600">
                  <TrendingUp size={22} />
                </div>
                Últimas Ventas Realizadas
              </h2>
            </div>
            <div className="p-6">
              {ventasRecientes.length > 0 ? (
                <div className="space-y-4">
                  {ventasRecientes.map(venta => (
                    <div
                      key={venta.id}
                      className="flex flex-col sm:flex-row sm:justify-between sm:items-center border border-blue-100/40 rounded-2xl p-5 bg-white/60 hover:bg-blue-50/40 transition-colors group"
                    >
                      <div className="flex items-center gap-3 mb-2 sm:mb-0">
                        <div className="p-1.5 bg-blue-100 rounded-lg text-blue-600 group-hover:scale-110 transition-transform">
                          <ArrowRight size={16} />
                        </div>
                        <span className="font-bold text-gray-800">Venta #{venta.id}</span>
                        {esAdmin && (
                          <span className="text-xs bg-blue-100/70 px-2 py-1 rounded-full text-blue-700 font-medium">
                            🏢 {obtenerNombreSede(venta.sede_id)}
                          </span>
                        )}
                      </div>
                      <div className="flex justify-between items-center w-full sm:w-auto gap-4">
                        <span className="text-sm text-gray-500 bg-gray-100/70 px-3 py-1 rounded-full">
                          {formatearHora(venta.created_at)}
                        </span>
                        <span className="font-bold text-green-600 text-lg bg-green-50 px-4 py-2 rounded-xl shadow-sm border border-green-100/50">
                          ${Number(venta.total || 0).toLocaleString("es-CO")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8 text-lg">
                  Aún no se han registrado ventas hoy.
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}