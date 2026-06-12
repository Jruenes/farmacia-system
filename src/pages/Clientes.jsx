import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import { useAuth } from "../context/AuthContext"

import {
  Users,
  UserPlus,
  Phone,
  Search,
  Edit,
  Trash2,
  Save,
  X,
  IdCard,
  Sparkles,
  ArrowRightCircle
} from "lucide-react"

export default function Clientes() {
  const { usuario } = useAuth()

  // 📌 Zona horaria CORRECTA para Cartagena / Colombia (UTC -5)
  const ZONA_HORARIA = "America/Bogota";

  // 📋 ESTADOS
  const [clientes, setClientes] = useState([])
  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState({ texto: "", tipo: "" })
  const [busqueda, setBusqueda] = useState("")
  
  // 📝 FORMULARIO (AGREGADO CAMPO CÉDULA)
  const [form, setForm] = useState({
    nombre: "",
    cedula: "",
    telefono: ""
  })

  // ✏️ EDITAR
  const [clienteEditar, setClienteEditar] = useState(null)
  const [modalEditar, setModalEditar] = useState(false)
  const [formEditar, setFormEditar] = useState({
    nombre: "",
    cedula: "",
    telefono: ""
  })

  // ⏱️ CARGAR DATOS AL INICIAR
  useEffect(() => {
    if (usuario) {
      cargarClientes()
    }

    // 🔄 Actualiza cada 60 segundos
    const intervalo = setInterval(() => {
      if (usuario) cargarClientes()
    }, 60000)

    return () => clearInterval(intervalo)
  }, [usuario])

  // ⏰ FUNCIÓN: Convierte la hora UTC de la base de datos a HORA DE CARTAGENA
  const obtenerHoraCartagena = (fechaISO) => {
    if (!fechaISO) return "";
    const fecha = new Date(fechaISO);
    return fecha.toLocaleString("es-CO", {
      timeZone: ZONA_HORARIA,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true
    });
  };

  // 📌 Obtener solo la fecha (para filtros o cálculos futuros)
  const obtenerFechaSolo = (fechaISO) => {
    if (!fechaISO) return "";
    const fecha = new Date(fechaISO);
    return fecha.toLocaleDateString("sv-SE", { timeZone: ZONA_HORARIA });
  };

  // 📥 CARGAR CLIENTES -> 🔒 REGLA PRINCIPAL 🔒
  const cargarClientes = async () => {
    setCargando(true)
    try {
      let query = supabase
        .from("clientes")
        .select("*")
        .order("id", { ascending: false })

      // 👇 AQUÍ ESTÁ EL CAMBIO IMPORTANTE 👇
      // Si es Administrador -> Ve TODOS
      // Si es Empleado -> Ve ÚNICAMENTE los que ÉL registró (usuario_id = su ID)
      if (usuario?.rol !== "Administrador") {
        query = query.eq("usuario_id", usuario?.id)
      }

      const { data, error } = await query

      if (error) throw error
      setClientes(data || [])

    } catch (err) {
      setMensaje({ texto: "Error al cargar: " + err.message, tipo: "error" })
    } finally {
      setCargando(false)
      setTimeout(() => setMensaje({ texto: "", tipo: "" }), 4000)
    }
  }

  // 💾 GUARDAR NUEVO CLIENTE
  const guardarCliente = async (e) => {
    e.preventDefault()

    if (!form.nombre.trim() || !form.cedula.trim()) {
      setMensaje({ texto: "⚠️ Nombre y Cédula son obligatorios", tipo: "error" })
      return
    }

    setCargando(true)
    try {
      const { error } = await supabase
        .from("clientes")
        .insert([
          {
            nombre: form.nombre.trim(),
            cedula: form.cedula.trim(), // ✅ Guardamos cédula
            telefono: form.telefono?.trim() || null,
            sede_id: usuario?.sede_id,
            usuario_id: usuario?.id // ✅ Guardamos QUIEN lo registró
          }
        ])

      if (error) throw error

      setMensaje({ texto: "✅ Cliente registrado correctamente", tipo: "exito" })
      setForm({ nombre: "", cedula: "", telefono: "" }) // Limpiar formulario
      await cargarClientes()

    } catch (err) {
      // Validación por si repite la cédula
      if (err.message.includes("duplicate key")) {
        setMensaje({ texto: "❌ Ya existe un cliente con esa cédula", tipo: "error" })
      } else {
        setMensaje({ texto: "❌ Error: " + err.message, tipo: "error" })
      }
    } finally {
      setCargando(false)
      setTimeout(() => setMensaje({ texto: "", tipo: "" }), 4000)
    }
  }

  // ✏️ ABRIR MODAL EDITAR
  const abrirEditar = (cliente) => {
    setClienteEditar(cliente)
    setFormEditar({
      nombre: cliente.nombre || "",
      cedula: cliente.cedula || "",
      telefono: cliente.telefono || ""
    })
    setModalEditar(true)
  }

  // ✅ ACTUALIZAR CLIENTE
  const actualizarCliente = async (e) => {
    e.preventDefault()

    if (!formEditar.nombre.trim() || !formEditar.cedula.trim()) {
      setMensaje({ texto: "⚠️ Nombre y Cédula son obligatorios", tipo: "error" })
      return
    }

    setCargando(true)
    try {
      const { error } = await supabase
        .from("clientes")
        .update({
          nombre: formEditar.nombre.trim(),
          cedula: formEditar.cedula.trim(),
          telefono: formEditar.telefono?.trim() || null
        })
        .eq("id", clienteEditar.id)

      if (error) throw error

      setMensaje({ texto: "✅ Cliente actualizado", tipo: "exito" })
      setModalEditar(false)
      await cargarClientes()

    } catch (err) {
      if (err.message.includes("duplicate key")) {
        setMensaje({ texto: "❌ Ya existe un cliente con esa cédula", tipo: "error" })
      } else {
        setMensaje({ texto: "❌ Error: " + err.message, tipo: "error" })
      }
    } finally {
      setCargando(false)
      setTimeout(() => setMensaje({ texto: "", tipo: "" }), 4000)
    }
  }

  // 🗑️ ELIMINAR CLIENTE
  const eliminarCliente = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este cliente?")) return

    setCargando(true)
    try {
      const { error } = await supabase
        .from("clientes")
        .delete()
        .eq("id", id)

      if (error) throw error

      setMensaje({ texto: "✅ Cliente eliminado", tipo: "exito" })
      await cargarClientes()

    } catch (err) {
      setMensaje({ texto: "❌ Error al borrar: " + err.message, tipo: "error" })
    } finally {
      setCargando(false)
      setTimeout(() => setMensaje({ texto: "", tipo: "" }), 4000)
    }
  }

  // 🔎 FILTRADO -> AHORA BUSCA POR NOMBRE, TELÉFONO Y CÉDULA
  const clientesFiltrados = clientes.filter(cliente =>
    cliente.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    cliente.cedula?.toLowerCase().includes(busqueda.toLowerCase()) || // ✅ Búsqueda por cédula
    cliente.telefono?.toLowerCase().includes(busqueda.toLowerCase())
  )

  // 🛡️ PROTECCIÓN
  if (!usuario) {
    return (
      <div className="flex items-center justify-center h-[70vh] bg-gradient-to-br from-gray-50 to-blue-50/20">
        <div className="text-center p-8 bg-white/70 backdrop-blur-md rounded-3xl shadow-2xl border border-white/60">
          <h2 className="text-xl font-bold text-gray-800">Acceso no permitido</h2>
          <p className="text-gray-600 mt-2">Debes iniciar sesión para ver esta sección.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 bg-gradient-to-br from-gray-50 to-blue-50/20 min-h-screen relative overflow-hidden">
      {/* ✨ DETALLES DECORATIVOS DE FONDO */}
      <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-indigo-200/20 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-200/20 rounded-full blur-3xl -z-10"></div>

      {/* 📌 ENCABEZADO */}
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg text-white">
            <Users size={26} />
          </div>
          <div>
            <h1 className="text-[clamp(1.8rem,3vw,2.5rem)] font-bold text-gray-800 flex items-center gap-2">
              Clientes
              <Sparkles size={18} className="text-yellow-500" />
            </h1>
            <p className="text-gray-600">
              {usuario.rol === "Administrador" 
                ? "Gestión total de clientes registrados en el sistema" 
                : "Gestión de tus clientes registrados"}
            </p>
          </div>
        </div>

        {/* 📢 MENSAJES DE ALERTA ESTILIZADOS */}
        {mensaje.texto && (
          <div className={`mt-4 p-4 rounded-2xl text-sm font-medium backdrop-blur-md border shadow-sm ${
            mensaje.tipo === "exito" 
              ? "bg-green-100/70 text-green-800 border-green-200/60" 
              : "bg-red-100/70 text-red-800 border-red-200/60"
          }`}>
            {mensaje.texto}
          </div>
        )}
      </div>

      {/* 📊 TARJETAS RESUMEN - CON GRADIENTES Y EFECTOS */}
      <div className="grid md:grid-cols-3 gap-5 relative z-10">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl p-6 shadow-lg text-white transform hover:scale-[1.03] transition-all hover:shadow-xl">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-white/80 text-sm font-medium">Total Clientes</p>
              <h2 className="text-3xl font-bold mt-1">{clientes.length}</h2>
            </div>
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Users size={28} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl p-6 shadow-lg text-white transform hover:scale-[1.03] transition-all hover:shadow-xl">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-white/80 text-sm font-medium">Con Teléfono</p>
              <h2 className="text-3xl font-bold mt-1">
                {clientes.filter(c => c.telefono && c.telefono.trim() !== "").length}
              </h2>
            </div>
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Phone size={28} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-fuchsia-600 rounded-3xl p-6 shadow-lg text-white transform hover:scale-[1.03] transition-all hover:shadow-xl">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-white/80 text-sm font-medium">Con Cédula</p>
              <h2 className="text-3xl font-bold mt-1">
                {clientes.filter(c => c.cedula && c.cedula.trim() !== "").length}
              </h2>
            </div>
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <IdCard size={28} />
            </div>
          </div>
        </div>
      </div>

      {/* ➕ FORMULARIO REGISTRAR - EFECTO CRISTAL */}
      <form
        onSubmit={guardarCliente}
        className="bg-white/70 backdrop-blur-md p-6 rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.05)] border border-white/60 relative z-10"
      >
        <div className="flex items-center gap-2 mb-4">
          <UserPlus size={20} className="text-indigo-600" />
          <h3 className="text-lg font-bold text-gray-800">Registrar Nuevo Cliente</h3>
        </div>
        
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <input
              type="text"
              placeholder="Nombre completo *"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className="w-full border border-indigo-100 bg-white/70 p-4 rounded-2xl focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all shadow-sm"
              required
            />
          </div>

          {/* ✅ NUEVO CAMPO CÉDULA */}
          <div>
            <input
              type="text"
              placeholder="Cédula / Documento *"
              value={form.cedula}
              onChange={(e) => setForm({ ...form, cedula: e.target.value })}
              className="w-full border border-indigo-100 bg-white/70 p-4 rounded-2xl focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all shadow-sm"
              required
            />
          </div>
          
          <div>
            <input
              type="text"
              placeholder="Teléfono / Celular"
              value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
              className="w-full border border-indigo-100 bg-white/70 p-4 rounded-2xl focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all shadow-sm"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={cargando}
          className="mt-5 w-full md:w-auto bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white px-6 py-4 rounded-2xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          {cargando ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              <Save size={18} />
              Guardar Cliente
            </>
          )}
        </button>
      </form>

      {/* 🔎 BUSCADOR - ESTILIZADO */}
      <div className="bg-white/70 backdrop-blur-md p-6 rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.05)] border border-white/60 relative z-10">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500"
          />
          <input
            type="text"
            placeholder="Buscar por nombre, cédula o teléfono..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full border border-indigo-100 bg-white/70 p-4 pl-10 rounded-2xl focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* 📋 TABLA CLIENTES - RENOVADA */}
      <div className="bg-white/70 backdrop-blur-md rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.05)] border border-white/60 overflow-hidden relative z-10">
        {cargando && clientes.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Cargando clientes...</p>
          </div>
        ) : clientesFiltrados.length === 0 ? (
          <div className="text-center py-20 text-gray-500 font-medium">
            <Users size={40} className="mx-auto mb-3 text-gray-300" />
            ⚠️ No se encontraron clientes registrados
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50/80 to-gray-100/80 backdrop-blur-sm border-b border-gray-200/60">
                <tr>
                  <th className="p-4 text-left font-semibold text-gray-700">Cliente</th>
                  <th className="p-4 text-left font-semibold text-gray-700">Cédula</th> {/* ✅ COLUMNA CÉDULA */}
                  <th className="p-4 text-left font-semibold text-gray-700">Teléfono</th>
                  <th className="p-4 text-left font-semibold text-gray-700">Fecha Registro</th>
                  <th className="p-4 text-right font-semibold text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/50">
                {clientesFiltrados.map((cliente) => (
                  <tr 
                    key={cliente.id} 
                    className="hover:bg-indigo-50/40 transition-colors group"
                  >
                    <td className="p-4 font-medium text-gray-800">{cliente.nombre}</td>
                    <td className="p-4">
                      <span className="font-mono font-semibold text-indigo-700 bg-indigo-50 px-2 py-1 rounded-lg text-sm">
                        {cliente.cedula}
                      </span>
                    </td> {/* ✅ MUESTRA CÉDULA */}
                    <td className="p-4 text-gray-600">{cliente.telefono || <span className="text-gray-400">—</span>}</td>
                    <td className="p-4 text-sm text-gray-600">
                      {/* ✅ FECHA CORREGIDA AQUÍ */}
                      {cliente.created_at ? obtenerHoraCartagena(cliente.created_at) : "—"}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => abrirEditar(cliente)}
                          className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all hover:scale-105 shadow-sm"
                          title="Editar cliente"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => eliminarCliente(cliente.id)}
                          className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all hover:scale-105 shadow-sm"
                          title="Eliminar cliente"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ✏️ MODAL EDITAR - MODAL DE LUJO */}
      {modalEditar && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl w-full max-w-md p-6 border border-white/80 transform scale-100 animate-scaleIn">
            <div className="flex justify-between items-center mb-5 border-b border-gray-200/70 pb-3">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Edit size={20} className="text-indigo-600" />
                Editar Cliente
              </h3>
              <button 
                onClick={() => setModalEditar(false)}
                className="text-gray-400 hover:text-red-500 transition-colors bg-gray-100 hover:bg-red-50 p-2 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={actualizarCliente} className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Nombre Completo *</label>
                <input
                  type="text"
                  value={formEditar.nombre}
                  onChange={(e) => setFormEditar({...formEditar, nombre: e.target.value})}
                  className="w-full border border-indigo-100 bg-white/70 p-3.5 rounded-xl focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all shadow-sm"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Cédula / Documento *</label>
                <input
                  type="text"
                  value={formEditar.cedula}
                  onChange={(e) => setFormEditar({...formEditar, cedula: e.target.value})}
                  className="w-full border border-indigo-100 bg-white/70 p-3.5 rounded-xl focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all shadow-sm"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Teléfono</label>
                <input
                  type="text"
                  value={formEditar.telefono}
                  onChange={(e) => setFormEditar({...formEditar, telefono: e.target.value})}
                  className="w-full border border-indigo-100 bg-white/70 p-3.5 rounded-xl focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all shadow-sm"
                />
              </div>

              <button
                type="submit"
                disabled={cargando}
                className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white py-3.5 rounded-xl font-medium transition-all disabled:opacity-50 shadow-lg hover:shadow-md mt-2"
              >
                {cargando ? "Procesando..." : "Actualizar Datos"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}