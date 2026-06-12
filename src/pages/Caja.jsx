import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import { useAuth } from "../context/AuthContext"
import {
  DollarSign,
  ShoppingCart,
  CreditCard,
  Wallet,
  Store,
  Calendar,
  ArrowUpCircle,
  ArrowDownCircle,
  BarChart3
} from "lucide-react"

// ✅ IMPORTAMOS LAS FUNCIONES QUE CREASTE
import { fechaColombia, soloFecha } from "../utils/fecha"

export default function Caja() {
  const { usuario } = useAuth()
  const esAdmin = usuario?.rol === "Administrador"

  // 📌 ESTADOS
  const [ventas, setVentas] = useState([])
  const [sedesDisponibles, setSedesDisponibles] = useState([])
  const [fecha, setFecha] = useState(soloFecha(new Date())) // ✅ USAMOS TU FUNCIÓN
  const [sedeSeleccionada, setSedeSeleccionada] = useState("todas")
  const [busqueda, setBusqueda] = useState("")
  const [fechaBusqueda, setFechaBusqueda] = useState("")

  // ⏱️ Cargar sedes al inicio
  useEffect(() => {
    if (usuario) {
      cargarSedes()
    }
  }, [usuario])

  // ⏱️ Cargar datos al cambiar fecha, usuario o sede
  useEffect(() => {
    if (usuario && sedesDisponibles.length > 0) {
      cargarCaja()
    }
  }, [fecha, usuario, sedeSeleccionada, sedesDisponibles])

  // 📥 CARGAR LISTA DE SEDES DESDE LA BASE
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
      console.error("Error al cargar sedes:", err)
    }
  }

  // 🔎 Obtener nombre de la sede por ID
  const obtenerNombreSede = (idSede) => {
    const sede = sedesDisponibles.find(s => s.id === idSede)
    return sede ? sede.nombre : "Desconocida"
  }

  // 📥 CARGAR CAJA DESDE SUPABASE CON FILTROS Y ZONA HORARIA CORRECTA
  const cargarCaja = async () => {
    // ✅ CORREGIDO: Rango de fecha FORZANDO HORA COLOMBIA (UTC-5)
    const inicio = `${fecha}T00:00:00-05:00`
    const fin = `${fecha}T23:59:59-05:00`

    let consulta = supabase
      .from("ventas")
      .select("*")
      .gte("created_at", inicio)
      .lte("created_at", fin)
      .order("created_at", { ascending: false })

    // 🔒 FILTRO DE SEDE SEGÚN ROL
    if (!esAdmin) {
      consulta = consulta.eq("sede_id", usuario?.sede_id)
    } else {
      if (sedeSeleccionada !== "todas") {
        consulta = consulta.eq("sede_id", Number(sedeSeleccionada))
      }
    }

    const { data, error } = await consulta

    if (error) {
      console.error("Error al cargar caja:", error)
      return
    }

    setVentas(data || [])
  }

  // 🔎 FILTRADO DE VENTAS (AHORA CON LA FUNCIÓN soloFecha)
  const ventasFiltradas = ventas.filter(v => {
    const coincideBusqueda =
      String(v.id).includes(busqueda) ||
      (v.metodo_pago || "").toLowerCase().includes(busqueda.toLowerCase()) ||
      (v.referencia || "").toLowerCase().includes(busqueda.toLowerCase())

    const coincideFecha =
      !fechaBusqueda ||
      soloFecha(v.created_at) === fechaBusqueda // ✅ USAMOS TU FUNCIÓN

    return coincideBusqueda && coincideFecha
  })

  // 🧮 CÁLCULOS TOTALES POR MÉTODO DE PAGO
  const totalMetodo = metodo =>
    ventas.reduce(
      (acc, v) => (v.metodo_pago === metodo ? acc + Number(v.total || 0) : acc),
      0
    )

  const efectivo = totalMetodo("Efectivo")
  const nequi = totalMetodo("Nequi")
  const daviplata = totalMetodo("Daviplata")
  const transferencia = totalMetodo("Transferencia")
  const tarjeta = totalMetodo("Tarjeta")

  const totalGeneral = efectivo + nequi + daviplata + transferencia + tarjeta
  const cantidadVentas = ventas.length
  const promedioVenta = cantidadVentas > 0 ? totalGeneral / cantidadVentas : 0
  const mayorVenta = cantidadVentas > 0 ? Math.max(...ventas.map(v => Number(v.total))) : 0
  const menorVenta = cantidadVentas > 0 ? Math.min(...ventas.map(v => Number(v.total))) : 0

  // 🎨 COLOR POR MÉTODO DE PAGO
  const colorMetodo = (metodo) => {
    switch (metodo) {
      case "Efectivo": return "bg-green-100 text-green-700"
      case "Nequi": return "bg-blue-100 text-blue-700"
      case "Daviplata": return "bg-purple-100 text-purple-700"
      case "Tarjeta": return "bg-orange-100 text-orange-700"
      case "Transferencia": return "bg-cyan-100 text-cyan-700"
      default: return "bg-gray-100 text-gray-700"
    }
  }

  return (
    <div className="space-y-6 p-4 bg-gray-50 min-h-screen">
      {/* 📌 ENCABEZADO Y CONTROLES */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-5 rounded-3xl shadow-lg border border-gray-100">
        <div>
          <h1 className="text-[clamp(1.5rem,3vw,2.5rem)] font-bold text-gray-800 flex items-center gap-3">
            <Store size={28} className="text-blue-600" />
            Caja Diaria
          </h1>
          <p className="text-gray-500 mt-1">
            {!esAdmin
              ? `👤 Viendo caja de la sede: <b>${obtenerNombreSede(usuario?.sede_id)}</b>`
              : `👑 Administrador: Control total de caja`}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          {/* Selector de Fecha */}
          <div className="relative">
            <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full border border-gray-200 bg-gray-50 p-3 pl-10 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>

          {/* Selector de Sede (SOLO ADMIN) */}
          {esAdmin && (
            <select
              value={sedeSeleccionada}
              onChange={(e) => setSedeSeleccionada(e.target.value)}
              className="w-full border border-gray-200 bg-gray-50 p-3 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            >
              <option value="todas">🏢 Todas las sedes</option>
              {sedesDisponibles.map(sede => (
                <option key={sede.id} value={sede.id}>📍 {sede.nombre}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* 📊 RESUMEN GENERAL */}
      <div className="grid xl:grid-cols-4 md:grid-cols-2 gap-5">
        <ResumenCard
          titulo="Ventas Realizadas"
          valor={cantidadVentas}
          icono={<ShoppingCart size={22} className="text-blue-600" />}
          color="bg-blue-50 border-blue-100"
        />
        <ResumenCard
          titulo="Total del Día"
          valor={`$${totalGeneral.toLocaleString("es-CO")}`}
          icono={<DollarSign size={22} className="text-green-600" />}
          color="bg-green-50 border-green-100"
        />
        <ResumenCard
          titulo="Promedio por Venta"
          valor={`$${promedioVenta.toLocaleString("es-CO")}`}
          icono={<BarChart3 size={22} className="text-purple-600" />}
          color="bg-purple-50 border-purple-100"
        />
        <ResumenCard
          titulo="Dinero en Efectivo"
          valor={`$${efectivo.toLocaleString("es-CO")}`}
          icono={<Wallet size={22} className="text-orange-600" />}
          color="bg-orange-50 border-orange-100"
        />
      </div>

      {/* 💳 TOTALES POR MÉTODO DE PAGO */}
      <div className="grid xl:grid-cols-5 md:grid-cols-2 gap-4">
        <MetodoCard
          titulo="Efectivo"
          valor={efectivo}
          colorFondo="bg-green-50"
          colorTexto="text-green-700"
          icono="💵"
        />
        <MetodoCard
          titulo="Nequi"
          valor={nequi}
          colorFondo="bg-blue-50"
          colorTexto="text-blue-700"
          icono="📱"
        />
        <MetodoCard
          titulo="Daviplata"
          valor={daviplata}
          colorFondo="bg-purple-50"
          colorTexto="text-purple-700"
          icono="📲"
        />
        <MetodoCard
          titulo="Tarjeta"
          valor={tarjeta}
          colorFondo="bg-orange-50"
          colorTexto="text-orange-700"
          icono="💳"
        />
        <MetodoCard
          titulo="Transferencia"
          valor={transferencia}
          colorFondo="bg-cyan-50"
          colorTexto="text-cyan-700"
          icono="🏦"
        />
      </div>

      {/* 📈 ESTADÍSTICAS ADICIONALES */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
          <BarChart3 size={20} /> Estadísticas del día
        </h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="flex items-center gap-4">
            <ArrowUpCircle size={32} className="text-green-500" />
            <div>
              <p className="text-gray-500 text-sm">Venta más alta</p>
              <h2 className="text-xl font-bold text-gray-800">
                ${mayorVenta.toLocaleString("es-CO")}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <ArrowDownCircle size={32} className="text-red-500" />
            <div>
              <p className="text-gray-500 text-sm">Venta más baja</p>
              <h2 className="text-xl font-bold text-gray-800">
                ${menorVenta.toLocaleString("es-CO")}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <CreditCard size={32} className="text-blue-500" />
            <div>
              <p className="text-gray-500 text-sm">Ticket promedio</p>
              <h2 className="text-xl font-bold text-gray-800">
                ${promedioVenta.toLocaleString("es-CO")}
              </h2>
            </div>
          </div>
        </div>
      </div>

      {/* 🔎 FILTROS SECCIÓN */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-lg p-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-600 mb-2 block">Buscar venta</label>
            <input
              type="text"
              placeholder="ID, método o referencia..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full border border-gray-200 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 mb-2 block">Filtrar por fecha</label>
            <input
              type="date"
              value={fechaBusqueda}
              onChange={(e) => setFechaBusqueda(e.target.value)}
              className="w-full border border-gray-200 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
        </div>
      </div>

      {/* 📑 TABLA DE VENTAS */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-4 text-left font-semibold text-gray-700">Venta #</th>
                <th className="p-4 text-left font-semibold text-gray-700">Hora</th>
                {esAdmin && <th className="p-4 text-left font-semibold text-gray-700">Sede</th>}
                <th className="p-4 text-left font-semibold text-gray-700">Método Pago</th>
                <th className="p-4 text-left font-semibold text-gray-700">Referencia</th>
                <th className="p-4 text-left font-semibold text-gray-700 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {ventasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={esAdmin ? "6" : "5"} className="p-6 text-center text-gray-500">
                    😕 No hay ventas registradas para esta fecha o filtro
                  </td>
                </tr>
              ) : (
                ventasFiltradas.map((venta) => (
                  <tr
                    key={venta.id}
                    className="border-t border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="p-4 font-bold text-gray-800">#{venta.id}</td>
                    <td className="p-4 text-sm text-gray-600">
                      {fechaColombia(venta.created_at)} {/* ✅ USAMOS TU FUNCIÓN */}
                    </td>
                    
                    {esAdmin && (
                      <td className="p-4 text-sm font-medium text-gray-700">
                        {obtenerNombreSede(venta.sede_id)}
                      </td>
                    )}
                    
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${colorMetodo(venta.metodo_pago)}`}>
                        {venta.metodo_pago}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-600">{venta.referencia || "-"}</td>
                    <td className="p-4 font-bold text-green-600 text-right">
                      ${Number(venta.total || 0).toLocaleString("es-CO")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 💰 CIERRE DE CAJA - DINERO FÍSICO */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-3xl p-6 shadow-lg">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="font-bold text-xl text-blue-800 flex items-center gap-2">
              <Wallet size={22} /> Dinero físico esperado en caja
            </h2>
            <p className="text-blue-600 text-sm mt-1">Corresponde solo a pagos en efectivo</p>
          </div>
          <p className="text-[clamp(1.8rem,4vw,2.8rem)] font-bold text-blue-700">
            ${efectivo.toLocaleString("es-CO")}
          </p>
        </div>
      </div>
    </div>
  )
}

// 🧩 COMPONENTES AUXILIARES
function ResumenCard({ titulo, valor, icono, color }) {
  return (
    <div className={`${color} rounded-3xl p-6 shadow-lg border`}>
      <div className="flex justify-between items-center">
        <div>
          <p className="text-gray-600 text-sm">{titulo}</p>
          <h2 className="text-2xl font-bold mt-2 text-gray-800">{valor}</h2>
        </div>
        <div className="opacity-80">{icono}</div>
      </div>
    </div>
  )
}

function MetodoCard({ titulo, valor, colorFondo, colorTexto, icono }) {
  return (
    <div className={`${colorFondo} rounded-2xl p-5 shadow-lg border border-gray-100`}>
      <p className={`text-sm font-medium ${colorTexto} flex items-center gap-2`}>
        <span className="text-lg">{icono}</span> {titulo}
      </p>
      <h2 className="text-2xl font-bold mt-2 text-gray-800">
        ${valor.toLocaleString("es-CO")}
      </h2>
    </div>
  )
}