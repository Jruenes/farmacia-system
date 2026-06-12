import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import { useAuth } from "../context/AuthContext"
import {
  Package,
  AlertTriangle,
  XCircle,
  DollarSign,
  Pencil,
  Trash2,
  Search,
  Sparkles,
  Box,
  Archive,
  Building2
} from "lucide-react"

export default function Inventario() {
  const { usuario } = useAuth()
  const esAdmin = usuario?.rol === "Administrador"

  const [productos, setProductos] = useState([])
  const [busqueda, setBusqueda] = useState("")
  const [editando, setEditando] = useState(null)
  
  // ✅ NUEVO: Lista de sedes para cargar nombres reales
  const [sedesDisponibles, setSedesDisponibles] = useState([])

  const [form, setForm] = useState({
    codigo: "",
    nombre: "",
    stock: "",
    stock_minimo: 5,
    precio_compra: "",
    precio_venta: "",
    sede_id: usuario?.sede_id || "" // <-- Cambiado para que sea dinámico
  })

  useEffect(() => {
    if (usuario) {
      cargarSedes() // <-- CARGAMOS LAS SEDES PRIMERO
      cargarProductos()
    }
  }, [usuario])

  // 📥 NUEVO: CARGAMOS SEDES DE LA BASE DE DATOS
  const cargarSedes = async () => {
    try {
      const { data, error } = await supabase
        .from("sedes")
        .select("id, nombre")
        .eq("estado", true) // Solo sedes activas
        .order("nombre", { ascending: true })

      if (error) throw error
      setSedesDisponibles(data || [])
      
      // Si no es admin, aseguramos que el formulario tenga su sede por defecto
      if (!esAdmin && usuario?.sede_id) {
        setForm(prev => ({...prev, sede_id: usuario.sede_id}))
      }

    } catch (err) {
      console.error("Error al cargar sedes:", err)
    }
  }

  const cargarProductos = async () => {
    let query = supabase
      .from("productos")
      .select("*")
      .order("id", { ascending: false })

    if (!esAdmin) {
      query = query.eq("sede_id", usuario?.sede_id)
    }

    const { data, error } = await query

    if (error) {
      console.log(error)
      return
    }

    setProductos(data || [])
  }

  const handleChange = e => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    })
  }

  const limpiarFormulario = () => {
    setEditando(null)
    setForm({
      codigo: "",
      nombre: "",
      stock: "",
      stock_minimo: 5,
      precio_compra: "",
      precio_venta: "",
      sede_id: esAdmin ? "" : (usuario?.sede_id || "") // <-- Limpieza corregida
    })
  }

  const guardarProducto = async e => {
    e.preventDefault()

    const payload = {
      codigo: form.codigo,
      nombre: form.nombre,
      stock: Number(form.stock),
      stock_minimo: Number(form.stock_minimo),
      precio_compra: Number(form.precio_compra),
      precio_venta: Number(form.precio_venta),
      sede_id: Number(form.sede_id) // <-- Aseguramos que sea número
    }

    let error

    if (editando) {
      const res = await supabase
        .from("productos")
        .update(payload)
        .eq("id", editando)

      error = res.error
    } else {
      const res = await supabase
        .from("productos")
        .insert([payload])

      error = res.error
    }

    if (error) {
      alert(error.message)
      return
    }

    limpiarFormulario()
    cargarProductos()
  }

  const editarProducto = producto => {
    setEditando(producto.id)

    setForm({
      codigo: producto.codigo || "",
      nombre: producto.nombre || "",
      stock: producto.stock || "",
      stock_minimo: producto.stock_minimo || 5,
      precio_compra: producto.precio_compra || "",
      precio_venta: producto.precio_venta || "",
      sede_id: producto.sede_id || ""
    })
  }

  const eliminarProducto = async id => {
    if (!window.confirm("¿Eliminar producto?"))
      return

    const { error } = await supabase
      .from("productos")
      .delete()
      .eq("id", id)

    if (error) {
      alert(error.message)
      return
    }

    cargarProductos()
  }

  // 🔎 NUEVO: Función para obtener el nombre de la sede desde el ID
  const obtenerNombreSede = (idSede) => {
    const sede = sedesDisponibles.find(s => s.id === idSede)
    return sede ? sede.nombre : "Desconocida"
  }

  const productosFiltrados = productos.filter(p =>
    p.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.codigo?.toLowerCase().includes(busqueda.toLowerCase())
  )

  const stockBajo = productos.filter(p =>
    Number(p.stock) > 0 && Number(p.stock) <= Number(p.stock_minimo)
  )

  const agotados = productos.filter(p =>
    Number(p.stock) <= 0
  )

  const valorInventario = productos.reduce((acc, p) =>
    acc + Number(p.stock) * Number(p.precio_compra || 0), 0
  )

  return (
    <div className="space-y-6 p-4 bg-gradient-to-br from-gray-50 to-blue-50/30 min-h-screen relative overflow-hidden">
      {/* ✨ DETALLES DECORATIVOS DE FONDO */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-200/20 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-sky-200/10 rounded-full blur-3xl -z-10"></div>

      {/* 📌 ENCABEZADO PRINCIPAL */}
      <div className="bg-white/80 backdrop-blur-md p-6 rounded-[2rem] shadow-[0_10px_40px_rgba(99,102,241,0.1)] border border-white/60">
        <div className="flex items-center gap-4 mb-2">
          <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg text-white">
            <Archive size={28} />
          </div>
          <div>
            <h1 className="text-[clamp(1.8rem,3vw,2.5rem)] font-bold text-gray-800 flex items-center gap-2">
              Gestión de Inventario
              <Sparkles size={18} className="text-yellow-500" />
            </h1>
            <p className="text-gray-600 font-medium mt-1 flex items-center gap-2">
              <Building2 size={16} />
              {!esAdmin 
                ? `Sede: ${obtenerNombreSede(usuario?.sede_id)}` 
                : "Administración General de Productos"}
            </p>
          </div>
        </div>
      </div>

      {/* 📊 TARJETAS RESUMEN */}
      <div className="grid md:grid-cols-4 gap-5">
        {/* TARJETA PRODUCTOS */}
        <div className="bg-white/80 backdrop-blur-md rounded-[2rem] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.06)] border border-white/60 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-500">Total Productos</p>
              <h3 className="text-3xl font-bold text-blue-700 mt-2">{productos.length}</h3>
            </div>
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
              <Package size={26} />
            </div>
          </div>
          <div className="w-full h-1.5 rounded-full mt-4 bg-blue-50">
            <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-700 w-3/4"></div>
          </div>
        </div>

        {/* TARJETA STOCK BAJO */}
        <div className="bg-white/80 backdrop-blur-md rounded-[2rem] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.06)] border border-white/60 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-500">Stock Bajo</p>
              <h3 className="text-3xl font-bold text-orange-700 mt-2">{stockBajo.length}</h3>
            </div>
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-400 to-amber-600 text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
              <AlertTriangle size={26} />
            </div>
          </div>
          <div className="w-full h-1.5 rounded-full mt-4 bg-orange-50">
            <div className="h-full rounded-full bg-gradient-to-r from-orange-400 to-amber-600 w-3/4"></div>
          </div>
        </div>

        {/* TARJETA AGOTADOS */}
        <div className="bg-white/80 backdrop-blur-md rounded-[2rem] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.06)] border border-white/60 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-500">Agotados</p>
              <h3 className="text-3xl font-bold text-red-700 mt-2">{agotados.length}</h3>
            </div>
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-500 to-rose-700 text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
              <XCircle size={26} />
            </div>
          </div>
          <div className="w-full h-1.5 rounded-full mt-4 bg-red-50">
            <div className="h-full rounded-full bg-gradient-to-r from-red-500 to-rose-700 w-3/4"></div>
          </div>
        </div>

        {/* TARJETA VALOR TOTAL */}
        <div className="bg-white/80 backdrop-blur-md rounded-[2rem] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.06)] border border-white/60 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-500">Valor Inventario</p>
              <h3 className="text-2xl font-bold text-emerald-700 mt-2">${valorInventario.toLocaleString("es-CO")}</h3>
            </div>
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-green-700 text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
              <DollarSign size={26} />
            </div>
          </div>
          <div className="w-full h-1.5 rounded-full mt-4 bg-emerald-50">
            <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-700 w-3/4"></div>
          </div>
        </div>
      </div>

      {/* 📝 FORMULARIO */}
      <form
        onSubmit={guardarProducto}
        className="bg-white/80 backdrop-blur-md p-6 rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.06)] border border-white/60"
      >
        <h2 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-2">
          <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
            {editando ? <Pencil size={18} /> : <Package size={18} />}
          </div>
          {editando ? "Editar Producto" : "Registrar Nuevo Producto"}
        </h2>

        <div className="grid md:grid-cols-4 gap-4">
          <input
            name="codigo"
            placeholder="Código del producto"
            value={form.codigo}
            onChange={handleChange}
            className="border border-indigo-100 bg-white/70 p-3.5 rounded-xl focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
          />

          <input
            name="nombre"
            placeholder="Nombre completo"
            value={form.nombre}
            onChange={handleChange}
            className="border border-indigo-100 bg-white/70 p-3.5 rounded-xl focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
          />

          <input
            name="stock"
            type="number"
            placeholder="Cantidad en Stock"
            value={form.stock}
            onChange={handleChange}
            className="border border-indigo-100 bg-white/70 p-3.5 rounded-xl focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
          />

          <input
            name="stock_minimo"
            type="number"
            placeholder="Límite Stock Mínimo"
            value={form.stock_minimo}
            onChange={handleChange}
            className="border border-indigo-100 bg-white/70 p-3.5 rounded-xl focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
          />

          <input
            name="precio_compra"
            type="number"
            placeholder="Precio de Compra ($)"
            value={form.precio_compra}
            onChange={handleChange}
            className="border border-indigo-100 bg-white/70 p-3.5 rounded-xl focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
          />

          <input
            name="precio_venta"
            type="number"
            placeholder="Precio de Venta ($)"
            value={form.precio_venta}
            onChange={handleChange}
            className="border border-indigo-100 bg-white/70 p-3.5 rounded-xl focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
          />

          {/* 👇 SELECTOR DE SEDES AHORA DINÁMICO Y BONITO */}
          {esAdmin && (
            <select
              name="sede_id"
              value={form.sede_id}
              onChange={handleChange}
              className="border border-indigo-100 bg-white/70 p-3.5 rounded-xl focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
              required
            >
              <option value="">-- Seleccionar Sede --</option>
              {sedesDisponibles.map(sede => (
                <option key={sede.id} value={sede.id}>
                  {sede.nombre}
                </option>
              ))}
            </select>
          )}

          <button
            type="submit"
            className={`md:col-span-1 rounded-xl py-3.5 font-semibold text-white transition-all transform hover:scale-[1.02] shadow-md ${
              editando 
                ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700" 
                : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            }`}
          >
            {editando ? "✏️ Actualizar" : "💾 Guardar Producto"}
          </button>
        </div>
      </form>

      {/* 🔎 BARRA DE BÚSQUEDA */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          placeholder="Buscar producto por código o nombre..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="w-full border border-indigo-100 bg-white/70 backdrop-blur-sm p-4 pl-11 rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
        />
      </div>

      {/* 📋 TABLA DE PRODUCTOS */}
      <div className="bg-white/80 backdrop-blur-md rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.06)] border border-white/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-indigo-50/80 to-purple-50/50">
              <tr>
                <th className="p-4 text-left font-semibold text-indigo-800">Código</th>
                <th className="p-4 text-left font-semibold text-indigo-800">Nombre del Producto</th>
                <th className="p-4 text-left font-semibold text-indigo-800">Stock Actual</th>
                <th className="p-4 text-left font-semibold text-indigo-800">Precio Venta</th>
                {/* 👇 NUEVA COLUMNA: SEDE */}
                {esAdmin && <th className="p-4 text-left font-semibold text-indigo-800">Sede</th>}
                <th className="p-4 text-left font-semibold text-indigo-800">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {productosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={esAdmin ? 6 : 5} className="p-10 text-center text-gray-500">
                    <Box size={40} className="mx-auto mb-3 text-gray-300" />
                    No se encontraron productos registrados
                  </td>
                </tr>
              ) : (
                productosFiltrados.map(producto => (
                  <tr 
                    key={producto.id} 
                    className="hover:bg-indigo-50/40 transition-colors group"
                  >
                    <td className="p-4 text-sm font-mono text-gray-700">{producto.codigo}</td>
                    <td className="p-4 font-medium text-gray-800">{producto.nombre}</td>
                    <td className="p-4">
                      <span className={`font-bold px-3 py-1 rounded-full text-sm shadow-sm ${
                        Number(producto.stock) <= 0 
                          ? "bg-red-100 text-red-700" 
                          : Number(producto.stock) <= Number(producto.stock_minimo) 
                            ? "bg-orange-100 text-orange-700" 
                            : "bg-green-100 text-green-700"
                      }`}>
                        {producto.stock} und.
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-gray-800">
                      ${Number(producto.precio_venta).toLocaleString("es-CO")}
                    </td>
                    {/* 👇 MOSTRAMOS NOMBRE DE LA SEDE */}
                    {esAdmin && (
                      <td className="p-4 text-sm text-gray-700">
                        <span className="bg-gray-100 px-2 py-1 rounded-lg">{obtenerNombreSede(producto.sede_id)}</span>
                      </td>
                    )}
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => editarProducto(producto)}
                          className="bg-amber-50 hover:bg-amber-100 text-amber-600 p-2 rounded-lg transition-colors group-hover:scale-105"
                          title="Editar producto"
                        >
                          <Pencil size={17} />
                        </button>
                        <button
                          onClick={() => eliminarProducto(producto.id)}
                          className="bg-red-50 hover:bg-red-100 text-red-600 p-2 rounded-lg transition-colors group-hover:scale-105"
                          title="Eliminar producto"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}