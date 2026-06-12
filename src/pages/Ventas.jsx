import { useEffect, useState, useCallback } from "react"
import { supabase } from "../lib/supabase"
import { useAuth } from "../context/AuthContext"
import { Plus, Trash2, ShoppingCart, DollarSign, Search, Store, AlertCircle, CheckCircle, XCircle, Sparkles, ArrowRightCircle, Coins } from "lucide-react"

export default function Ventas() {
  const { usuario } = useAuth()
  const esAdmin = usuario?.rol === "Administrador"

  // ✅ Estado con validación inicial
  const [sedesDisponibles, setSedesDisponibles] = useState([])
  const [sedeSeleccionada, setSedeSeleccionada] = useState("")
  const [productos, setProductos] = useState([])
  const [busqueda, setBusqueda] = useState("")
  const [carrito, setCarrito] = useState([])
  const [metodoPago, setMetodoPago] = useState("Efectivo")
  const [referencia, setReferencia] = useState("")
  const [dineroRecibido, setDineroRecibido] = useState("")
  const [cargando, setCargando] = useState(false) // ✅ Nuevo: Estado de carga
  const [error, setError] = useState("") // ✅ Nuevo: Manejo de errores

  // ⏩ Cargar sedes al iniciar
  useEffect(() => {
    if (usuario) {
      cargarSedes()
    }
  }, [usuario])

  // ⏩ Cargar productos cuando cambia la sede o usuario
  const obtenerProductos = useCallback(async () => {
    if (!sedeSeleccionada && !usuario?.sede_id) return

    setCargando(true)
    setError("")
    try {
      let query = supabase.from("productos").select("*")

      if (esAdmin) {
        query = query.eq("sede_id", Number(sedeSeleccionada))
      } else {
        query = query.eq("sede_id", usuario?.sede_id)
      }

      const { data, error: prodError } = await query.order("nombre", { ascending: true })

      if (prodError) throw prodError
      setProductos(data || [])
    } catch (err) {
      setError("Error al cargar productos: " + err.message)
      console.error(err)
    } finally {
      setCargando(false)
    }
  }, [esAdmin, sedeSeleccionada, usuario?.sede_id])

  useEffect(() => {
    obtenerProductos()
  }, [obtenerProductos])

  // ⏩ Definir sede por defecto si no es admin
  useEffect(() => {
    if (usuario?.sede_id && !esAdmin) {
      setSedeSeleccionada(usuario.sede_id.toString())
    }
  }, [usuario, esAdmin])

  // 📥 Cargar lista de sedes
  const cargarSedes = async () => {
    setCargando(true)
    try {
      const { data, error } = await supabase
        .from("sedes")
        .select("id, nombre")
        .eq("estado", true)
        .order("nombre", { ascending: true })

      if (error) throw error
      setSedesDisponibles(data || [])

      // Sede por defecto para admin
      if (esAdmin && data?.length > 0 && !sedeSeleccionada) {
        setSedeSeleccionada(data[0].id.toString())
      }

    } catch (err) {
      setError("Error al cargar sedes: " + err.message)
      console.error(err)
    } finally {
      setCargando(false)
    }
  }

  // 🧹 Filtrar productos con memoización
  const productosFiltrados = productos.filter((producto) => {
    if (!busqueda) return true
    const busquedaLower = busqueda.toLowerCase()
    return (
      producto.nombre?.toLowerCase().includes(busquedaLower) ||
      producto.codigo?.toLowerCase().includes(busquedaLower)
    )
  })

  // ➕ Agregar producto al carrito
  const agregarProducto = (producto) => {
    if (Number(producto.stock) <= 0) {
      alert("❌ Producto sin existencias")
      return
    }

    setCarrito(prevCarrito => {
      const existe = prevCarrito.find(item => item.id === producto.id)

      if (existe) {
        if (existe.cantidad >= producto.stock) {
          alert(`⚠️ Solo hay ${producto.stock} unidades disponibles`)
          return prevCarrito
        }
        return prevCarrito.map(item =>
          item.id === producto.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        )
      }

      return [...prevCarrito, { ...producto, cantidad: 1 }]
    })
  }

  // 🔢 Cambiar cantidad
  const cambiarCantidad = (productoId, cantidad) => {
    const numero = parseInt(cantidad, 10)
    if (isNaN(numero) || numero < 1) return

    setCarrito(prevCarrito => {
      const producto = prevCarrito.find(item => item.id === productoId)
      if (!producto || numero > producto.stock) {
        alert(`⚠️ Solo hay ${producto?.stock || 0} unidades disponibles`)
        return prevCarrito
      }

      return prevCarrito.map(item =>
        item.id === productoId ? { ...item, cantidad: numero } : item
      )
    })
  }

  // ❌ Eliminar producto
  const eliminarProducto = (productoId) => {
    setCarrito(prevCarrito => prevCarrito.filter(item => item.id !== productoId))
  }

  // 🧮 Cálculos
  const total = carrito.reduce((acc, item) => acc + (Number(item.precio_venta) * item.cantidad), 0)
  const cambio = metodoPago === "Efectivo" ? Math.max(0, Number(dineroRecibido || 0) - total) : 0

  // ✅ Finalizar venta
  const finalizarVenta = async () => {
    if (carrito.length === 0) {
      alert("🛒 Agrega productos al carrito primero")
      return
    }

    // Validaciones previas
    const productosAgotados = carrito.filter(item => Number(item.stock) <= 0)
    if (productosAgotados.length > 0) {
      alert("❌ Hay productos agotados en el carrito. Actualiza la venta.")
      return
    }

    // Verificar stock actual en BD
    setCargando(true)
    setError("")
    try {
      for (const item of carrito) {
        const { data: stockData, error: stockError } = await supabase
          .from("productos")
          .select("stock")
          .eq("id", item.id)
          .single()

        if (stockError) throw new Error(`Producto ${item.nombre} no encontrado`)
        if (item.cantidad > stockData.stock) {
          throw new Error(`No hay suficiente stock para: ${item.nombre}. Disponible: ${stockData.stock}`)
        }
      }

      // Validar método de pago
      if (metodoPago === "Efectivo" && Number(dineroRecibido) < total) {
        throw new Error("💸 El dinero recibido es menor al total de la venta")
      }
      if (metodoPago !== "Efectivo" && referencia.trim() === "") {
        throw new Error("📝 Debes ingresar el número o código de referencia")
      }

      // 🔄 Transacción: Crear venta + detalles + actualizar stock
      const { data: ventaData, error: ventaError } = await supabase
        .from("ventas")
        .insert([
          {
            total,
            metodo_pago: metodoPago,
            referencia: referencia.trim(),
            usuario_id: usuario.id,
            sede_id: esAdmin ? Number(sedeSeleccionada) : usuario.sede_id
          }
        ])
        .select()

      if (ventaError) throw ventaError
      const ventaId = ventaData[0].id

      // Insertar detalles y actualizar stock
      for (const item of carrito) {
        const subtotal = Number(item.precio_venta) * item.cantidad
        // Insertar detalle
        await supabase.from("detalle_ventas").insert([{
          venta_id: ventaId,
          producto_id: item.id,
          producto_nombre: item.nombre,
          cantidad: item.cantidad,
          precio_unitario: Number(item.precio_venta),
          subtotal
        }])
        // Actualizar stock
        await supabase.from("productos")
          .update({ stock: item.stock - item.cantidad })
          .eq("id", item.id)
      }

      // ✅ Éxito: Limpiar todo
      alert("✅ Venta realizada correctamente 😎")
      setCarrito([])
      setReferencia("")
      setDineroRecibido("")
      obtenerProductos()

    } catch (err) {
      setError(err.message)
      alert("❌ Error: " + err.message)
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="p-4 md:p-6 bg-gradient-to-br from-gray-50 to-green-50/30 min-h-screen relative overflow-hidden">
      {/* Decoraciones de fondo */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-200/20 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-teal-200/10 rounded-full blur-3xl -z-10"></div>

      {/* Indicador de carga global */}
      {cargando && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-2xl shadow-xl flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <p className="font-medium">Procesando...</p>
          </div>
        </div>
      )}

      {/* Mensaje de error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button onClick={() => setError("")} className="ml-auto font-bold">×</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
        {/* 🛑 SECCIÓN DE PRODUCTOS */}
        <div className="lg:col-span-2 bg-white/80 backdrop-blur-md rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.06)] border border-white/60 p-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg text-white">
                <Store size={26} />
              </div>
              <div>
                <h1 className="text-[clamp(1.5rem,3vw,2.2rem)] font-bold text-gray-800 flex items-center gap-2">
                  Punto de Venta
                  <Sparkles size={18} className="text-yellow-500" />
                </h1>
                <p className="text-sm text-gray-500">Selecciona y agrega productos al carrito</p>
              </div>
            </div>
            
            {/* Nombre de la sede actual */}
            <span className="text-sm font-medium text-blue-700 bg-blue-100/70 px-4 py-2 rounded-full shadow-sm border border-blue-200/50">
              🏢 {sedesDisponibles.find(s => s.id === Number(sedeSeleccionada))?.nombre || "Cargando..."}
            </span>
          </div>

          {/* Selector de Sede (Solo Admin) */}
          {esAdmin && (
            <div className="mb-5">
              <label className="text-sm font-semibold text-gray-600 mb-2 block">Cambiar Sede:</label>
              <div className="relative">
                <select
                  value={sedeSeleccionada}
                  onChange={(e) => setSedeSeleccionada(e.target.value)}
                  className="w-full border border-blue-100 bg-white/70 backdrop-blur-sm p-4 pl-5 pr-10 rounded-2xl focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all appearance-none shadow-sm"
                >
                  {sedesDisponibles.map(sede => (
                    <option key={sede.id} value={sede.id}>🏢 {sede.nombre}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-blue-500">
                  <ArrowRightCircle size={18} className="rotate-90" />
                </div>
              </div>
            </div>
          )}

          {/* Buscador */}
          <div className="relative mb-6">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar producto por nombre o código..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full border border-blue-100 bg-white/70 backdrop-blur-sm p-4 pl-11 rounded-2xl focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all shadow-sm"
            />
          </div>

          {/* Lista de Productos */}
          <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
            {productosFiltrados.length === 0 ? (
              <div className="text-center py-16 text-gray-500 bg-white/50 rounded-3xl border border-dashed border-gray-200">
                <AlertCircle size={45} className="mx-auto mb-3 text-gray-300" />
                <p className="font-medium">No se encontraron productos</p>
                <p className="text-sm">Intenta con otra búsqueda</p>
              </div>
            ) : (
              productosFiltrados.map((producto) => (
                <div
                  key={producto.id}
                  className="border border-gray-100/80 bg-white/60 rounded-3xl p-5 flex flex-col md:flex-row md:items-center justify-between hover:shadow-lg hover:border-blue-200/60 hover:bg-white/80 transition-all group"
                >
                  <div className="mb-3 md:mb-0">
                    <h2 className="font-bold text-gray-800 text-lg group-hover:text-blue-700 transition-colors">{producto.nombre}</h2>
                    <p className="text-gray-500 text-sm mt-1">Código: <span className="font-mono bg-gray-100/80 px-2 py-0.5 rounded-lg">{producto.codigo}</span></p>
                    
                    {/* Estado de Stock */}
                    <p className={`mt-2 text-sm font-semibold flex items-center gap-1.5 ${
                      Number(producto.stock) <= 0
                        ? "text-red-600"
                        : Number(producto.stock) <= 5
                        ? "text-orange-500"
                        : "text-green-600"
                    }`}>
                      {Number(producto.stock) <= 0 ? (
                        <><XCircle size={16} /> Agotado</>
                      ) : Number(producto.stock) <= 5 ? (
                        <><AlertCircle size={16} /> Quedan {producto.stock} unidades</>
                      ) : (
                        <><CheckCircle size={16} /> Disponibles: {producto.stock}</>
                      )}
                    </p>

                    {Number(producto.stock) <= 0 && (
                      <span className="inline-block mt-2 bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                        SIN EXISTENCIAS
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between md:gap-5 w-full md:w-auto">
                    <p className="font-bold text-green-600 text-lg bg-green-50 px-3 py-1.5 rounded-xl shadow-sm border border-green-100/50">
                      $ {Number(producto.precio_venta).toLocaleString("es-CO")}
                    </p>

                    <button
                      onClick={() => agregarProducto(producto)}
                      disabled={Number(producto.stock) <= 0 || cargando}
                      className={`px-5 py-2.5 rounded-2xl text-white font-semibold transition-all flex items-center gap-2 shadow-md transform hover:scale-[1.03] active:scale-[0.97] ${
                        Number(producto.stock) <= 0 || cargando
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg"
                      }`}
                    >
                      <Plus size={18} />
                      {Number(producto.stock) <= 0 ? "Agotado" : "Agregar"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 🛒 SECCIÓN DEL CARRITO */}
        <div className="bg-white/80 backdrop-blur-md rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.06)] border border-white/60 p-6 h-fit sticky top-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl text-white shadow-md">
              <ShoppingCart size={22} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Carrito</h2>
            <span className="ml-auto bg-gray-100 text-gray-700 font-bold px-3 py-1 rounded-full text-sm">{carrito.length}</span>
          </div>

          {carrito.length === 0 ? (
            <div className="text-center py-12 text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
              <ShoppingCart size={55} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">El carrito está vacío</p>
              <p className="text-sm">Agrega productos para vender</p>
            </div>
          ) : (
            <div className="space-y-4 mb-6 max-h-[45vh] overflow-y-auto pr-2 custom-scrollbar">
              {carrito.map((item) => (
                <div key={item.id} className="bg-white/70 rounded-2xl p-4 border border-gray-100/80 shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-gray-800 mb-2">{item.nombre}</h3>
                  
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-sm text-gray-500 font-medium">Cant:</label>
                    <input
                      type="number"
                      min="1"
                      max={item.stock}
                      value={item.cantidad}
                      onChange={(e) => cambiarCantidad(item.id, e.target.value)}
                      disabled={cargando}
                      className="border border-gray-200 rounded-xl p-2 w-20 text-center focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all bg-white/80"
                    />
                    <p className="font-bold text-gray-800 bg-blue-50 px-2 py-1 rounded-lg text-sm">
                      $ {(item.precio_venta * item.cantidad).toLocaleString("es-CO")}
                    </p>
                  </div>

                  <button
                    onClick={() => eliminarProducto(item.id)}
                    disabled={cargando}
                    className="text-red-500 hover:text-red-700 text-sm mt-3 flex items-center gap-1.5 transition-colors font-medium disabled:opacity-50"
                  >
                    <Trash2 size={14} /> Quitar producto
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 💳 OPCIONES DE PAGO */}
          <div className="mt-6 pt-4 border-t border-gray-200/60">
            <label className="text-sm font-semibold text-gray-600 mb-2 block">Método de Pago</label>
            <div className="relative mb-4">
              <select
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value)}
                disabled={cargando}
                className="w-full border border-green-100 bg-white/70 backdrop-blur-sm p-4 pl-5 pr-10 rounded-2xl focus:ring-2 focus:ring-green-500/40 focus:border-green-500 transition-all appearance-none shadow-sm disabled:opacity-70"
              >
                <option value="Efectivo">💵 Efectivo</option>
                <option value="Nequi">📱 Nequi</option>
                <option value="Daviplata">📲 Daviplata</option>
                <option value="Transferencia">🏦 Transferencia</option>
                <option value="Tarjeta">💳 Tarjeta</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-green-500">
                <ArrowRightCircle size={18} className="rotate-90" />
              </div>
            </div>

            {metodoPago !== "Efectivo" && (
              <div className="mb-4">
                <label className="text-sm font-semibold text-gray-600 mb-2 block">Código o Referencia</label>
                <input
                  type="text"
                  placeholder="Ej: 123456789"
                  value={referencia}
                  onChange={(e) => setReferencia(e.target.value)}
                  disabled={cargando}
                  className="w-full border border-green-100 bg-white/70 backdrop-blur-sm p-4 rounded-2xl focus:ring-2 focus:ring-green-500/40 focus:border-green-500 transition-all shadow-sm disabled:opacity-70"
                />
              </div>
            )}

            {metodoPago === "Efectivo" && (
              <>
                <div className="mb-4">
                  <label className="text-sm font-semibold text-gray-600 mb-2 block">Dinero Recibido</label>
                  <input
                    type="number"
                    placeholder="Valor entregado por el cliente"
                    value={dineroRecibido}
                    onChange={(e) => setDineroRecibido(e.target.value)}
                    disabled={cargando}
                    className="w-full border border-green-100 bg-white/70 backdrop-blur-sm p-4 rounded-2xl focus:ring-2 focus:ring-green-500/40 focus:border-green-500 transition-all shadow-sm disabled:opacity-70"
                  />
                </div>

                <div className="bg-gradient-to-r from-emerald-50 to-teal-50/70 border border-emerald-200/60 rounded-2xl p-4 mb-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <Coins size={18} className="text-emerald-600" />
                    <p className="text-sm text-emerald-700 font-semibold">Cambio a devolver</p>
                  </div>
                  <p className="text-2xl font-bold text-emerald-800">
                    $ {cambio.toLocaleString("es-CO")}
                  </p>
                </div>
              </>
            )}

            {/* TOTAL FINAL */}
            <div className="flex items-center justify-between py-4 px-5 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl border border-green-400/20 mb-5 shadow-lg text-white">
              <h3 className="text-lg font-bold">TOTAL A PAGAR</h3>
              <p className="text-2xl font-bold">
                $ {total.toLocaleString("es-CO")}
              </p>
            </div>

            {/* BOTÓN FINALIZAR */}
            <button
              onClick={finalizarVenta}
              disabled={carrito.length === 0 || cargando}
              className={`w-full p-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 shadow-md transform hover:scale-[1.02] active:scale-[0.98] ${
                carrito.length === 0 || cargando
                  ? "bg-gray-300 cursor-not-allowed text-gray-500"
                  : "bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 hover:shadow-xl text-white"
              }`}
            >
              <DollarSign size={22} />
              {cargando ? "Procesando..." : "Finalizar Venta"}
            </button>
          </div>
        </div>

      </div>

      {/* Estilos para scroll */}
      <style >{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  )
}