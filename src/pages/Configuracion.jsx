import { useState, useEffect } from "react"
import { supabase } from "../lib/supabase"
import { useAuth } from "../context/AuthContext"
import {
  Settings,
  Building2,
  UserPlus,
  Users,
  Edit,
  Lock,
  Unlock,
  Save,
  X,
  PlusCircle,
  UserCog,
  Trash2,
  Sparkles,
  AlertCircle
} from "lucide-react"

export default function Configuracion() {
  const { usuario: usuarioActual } = useAuth()
  const [activoTab, setActivoTab] = useState("sedes")

  // 📋 ESTADOS GENERALES
  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState({ texto: "", tipo: "" })

  // 🏢 ESTADOS SEDES
  const [sedes, setSedes] = useState([])
  const [modalSede, setModalSede] = useState(false)
  const [sedeEditar, setSedeEditar] = useState(null)
  const [formSede, setFormSede] = useState({
    nombre: "",
    direccion: "",
    telefono: "",
    ciudad: "",
    estado: true
  })

  // 👤 ESTADOS USUARIOS
  const [usuarios, setUsuarios] = useState([])
  const [sedesLista, setSedesLista] = useState([])
  const [modalUsuario, setModalUsuario] = useState(false)
  const [usuarioEditar, setUsuarioEditar] = useState(null)
  const [formUsuario, setFormUsuario] = useState({
    nombre: "",
    email: "",
    password: "",
    rol: "Empleado",
    sede_id: "",
    estado: true
  })

  // ⏱️ CARGAR DATOS AL INICIAR
  useEffect(() => {
    if (usuarioActual?.rol === "Administrador") {
      cargarSedes()
      cargarUsuarios()
    }
  }, [usuarioActual])

  // 📥 CARGAR SEDES -> ✅ ARREGLADO PARA QUE ACTUALICE BIEN
  const cargarSedes = async () => {
    setCargando(true)
    try {
      const { data, error } = await supabase
        .from("sedes")
        .select("*")
        .order("id", { ascending: true })

      if (error) throw error
      
      // Aseguramos que sea un array limpio
      const datosSedes = data || []
      setSedes(datosSedes)
      // Solo las activas para el select de usuarios
      setSedesLista(datosSedes.filter(s => s.estado === true))

    } catch (err) {
      setMensaje({ texto: "Error al cargar sedes: " + err.message, tipo: "error" })
    } finally {
      setCargando(false)
      setTimeout(() => setMensaje({ texto: "", tipo: "" }), 4000)
    }
  }

  // 📥 CARGAR USUARIOS -> ✅ ARREGLADO
  const cargarUsuarios = async () => {
    setCargando(true)
    try {
      const { data, error } = await supabase
        .from("usuarios")
        .select("*") 
        .order("nombre", { ascending: true })

      if (error) throw error

      // 🧩 Unimos con nombre de sede para mostrar
      const datosConSede = (data || []).map(usuario => {
        // Aseguramos que sede_id sea número para comparar bien
        const idSedeUsuario = parseInt(usuario.sede_id) || null
        const sedeEncontrada = sedesLista.find(s => s.id === idSedeUsuario)
        
        return {
          ...usuario,
          sede_id: idSedeUsuario,
          sedes: { nombre: sedeEncontrada ? sedeEncontrada.nombre : "Sin asignar" }
        }
      })

      setUsuarios([...datosConSede])

    } catch (err) {
      setMensaje({ texto: "Error al cargar usuarios: " + err.message, tipo: "error" })
    } finally {
      setCargando(false)
      setTimeout(() => setMensaje({ texto: "", tipo: "" }), 4000)
    }
  }

  // 💾 GUARDAR SEDE -> ✅ SOLUCIONADO: AHORA SÍ ACTUALIZA
  const guardarSede = async (e) => {
    e.preventDefault()
    setCargando(true)

    try {
      if (sedeEditar) {
        // ✏️ EDITAR
        const datosActualizar = {
          nombre: formSede.nombre.trim(),
          direccion: formSede.direccion.trim(),
          telefono: formSede.telefono.trim(),
          ciudad: formSede.ciudad.trim(),
          estado: formSede.estado
        }

        const { error } = await supabase
          .from("sedes")
          .update(datosActualizar)
          .eq("id", sedeEditar.id)

        if (error) throw error
        setMensaje({ texto: "✅ Sede actualizada correctamente", tipo: "exito" })

      } else {
        // ➕ CREAR
        const nuevaSede = {
          nombre: formSede.nombre.trim(),
          direccion: formSede.direccion.trim(),
          telefono: formSede.telefono.trim(),
          ciudad: formSede.ciudad.trim(),
          estado: formSede.estado
        }

        const { error } = await supabase
          .from("sedes")
          .insert([nuevaSede])

        if (error) throw error
        setMensaje({ texto: "✅ Sede creada correctamente", tipo: "exito" })
      }

      // 🔄 RECARGAMOS DATOS Y LIMPIAMOS
      await cargarSedes() 
      cerrarModalSede()

    } catch (err) {
      console.error("ERROR SEDE:", err)
      setMensaje({ texto: "❌ " + err.message, tipo: "error" })
    } finally {
      setCargando(false)
      setTimeout(() => setMensaje({ texto: "", tipo: "" }), 4000)
    }
  }

  // 🗑️ ELIMINAR SEDE -> ✅ AGREGADO POR TI, POR SI LO NECESITABAS
  const eliminarSede = async (id) => {
    if (!window.confirm("¿Seguro?\nSe eliminará esta sede y ya no podrás recuperarla.")) return
    setCargando(true)
    try {
      const { error } = await supabase
        .from("sedes")
        .delete()
        .eq("id", id)

      if (error) throw error
      setMensaje({ texto: "✅ Sede eliminada", tipo: "exito" })
      await cargarSedes()

    } catch (err) {
      setMensaje({ texto: "❌ No se pudo eliminar: " + err.message, tipo: "error" })
    } finally {
      setCargando(false)
      setTimeout(() => setMensaje({ texto: "", tipo: "" }), 4000)
    }
  }

  // 💾 GUARDAR USUARIO -> ✅ ARREGLADO, CONVERTIMOS SEDE_ID A NÚMERO
  const guardarUsuario = async (e) => {
    e.preventDefault()
    setCargando(true)

    try {
      if (usuarioEditar) {
        // ✏️ EDITAR
        const datosActualizar = {
          nombre: formUsuario.nombre.trim(),
          email: formUsuario.email.toLowerCase().trim(),
          rol: formUsuario.rol,
          sede_id: formUsuario.sede_id ? parseInt(formUsuario.sede_id) : null, // ✅ CLAVE: CONVERTIMOS A ENTERO
          estado: formUsuario.estado,
          ...(formUsuario.password && { password: formUsuario.password.trim() })
        }

        const { error } = await supabase
          .from("usuarios")
          .update(datosActualizar)
          .eq("id", usuarioEditar.id)

        if (error) throw error
        setMensaje({ texto: "✅ Usuario actualizado correctamente", tipo: "exito" })

      } else {
        // ➕ CREAR
        if (!formUsuario.email || !formUsuario.password) {
          throw new Error("Correo y contraseña son obligatorios")
        }

        const nuevoUsuario = {
          nombre: formUsuario.nombre.trim(),
          email: formUsuario.email.toLowerCase().trim(),
          password: formUsuario.password.trim(),
          rol: formUsuario.rol,
          sede_id: formUsuario.sede_id ? parseInt(formUsuario.sede_id) : null,
          estado: formUsuario.estado
        }

        const { error } = await supabase
          .from("usuarios")
          .insert([nuevoUsuario])

        if (error) throw error

        setMensaje({ 
          texto: `✅ Empleado creado | Correo: ${nuevoUsuario.email} | Clave: ${nuevoUsuario.password}`, 
          tipo: "exito" 
        })
      }

      await cargarUsuarios() // Refrescar lista
      cerrarModalUsuario()  // Cerrar ventana

    } catch (err) {
      console.error("ERROR USUARIO:", err)
      setMensaje({ texto: "❌ " + err.message, tipo: "error" })
    } finally {
      setCargando(false)
      setTimeout(() => setMensaje({ texto: "", tipo: "" }), 5000)
    }
  }

  // 🗑️ ELIMINAR USUARIO
  const eliminarUsuario = async (usuario) => {
    if (!window.confirm("¿Eliminar este usuario?\n¡Se borrará totalmente del sistema!")) return;
    
    setCargando(true)
    try {
      const { error } = await supabase
        .from("usuarios")
        .delete()
        .eq("id", usuario.id)
      
      if (error) throw error
      
      setMensaje({ texto: "✅ Usuario eliminado totalmente", tipo: "exito" })
      await cargarUsuarios()
      
    } catch (err) {
      console.error("ERROR:", err)
      setMensaje({ texto: "❌ Error al borrar: " + err.message, tipo: "error" })
    } finally {
      setCargando(false)
      setTimeout(() => setMensaje({ texto: "", tipo: "" }), 4000)
    }
  }

  // 🔄 CAMBIAR ESTADO USUARIO
  const cambiarEstadoUsuario = async (usuario) => {
    setCargando(true)
    const nuevoEstado = !usuario.estado
    try {
      const { error } = await supabase
        .from("usuarios")
        .update({ estado: nuevoEstado })
        .eq("id", usuario.id)
      if (error) throw error
      setMensaje({ texto: `Usuario ${nuevoEstado ? "desbloqueado ✅" : "bloqueado ❌"}`, tipo: "exito" })
      await cargarUsuarios()
    } catch (err) {
      setMensaje({ texto: "Error: " + err.message, tipo: "error" })
    } finally {
      setCargando(false)
      setTimeout(() => setMensaje({ texto: "", tipo: "" }), 4000)
    }
  }

  // 📝 ABRIR MODALES
  const editarSede = (sede) => {
    setSedeEditar(sede)
    setFormSede({
      nombre: sede.nombre || "",
      direccion: sede.direccion || "",
      telefono: sede.telefono || "",
      ciudad: sede.ciudad || "",
      estado: sede.estado
    })
    setModalSede(true)
  }

  const editarUsuario = (usuario) => {
    setUsuarioEditar(usuario)
    setFormUsuario({
      nombre: usuario.nombre || "",
      email: usuario.email || "",
      password: "",
      rol: usuario.rol || "Empleado",
      sede_id: usuario.sede_id || "", // ✅ Ya viene como número
      estado: usuario.estado
    })
    setModalUsuario(true)
  }

  // ❌ CERRAR MODALES
  const cerrarModalSede = () => {
    setModalSede(false)
    setSedeEditar(null)
    setFormSede({ nombre: "", direccion: "", telefono: "", ciudad: "", estado: true })
  }

  const cerrarModalUsuario = () => {
    setModalUsuario(false)
    setUsuarioEditar(null)
    setFormUsuario({ nombre: "", email: "", password: "", rol: "Empleado", sede_id: "", estado: true })
  }

  // 🛡️ PROTECCIÓN
  if (usuarioActual?.rol !== "Administrador") {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="text-center p-8 bg-white/70 backdrop-blur-md rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.05)] border border-white/60">
          <div className="p-4 bg-red-100 text-red-600 rounded-2xl w-fit mx-auto mb-4">
            <Lock size={50} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Acceso Restringido</h2>
          <p className="text-gray-600 mt-2">Solo el Administrador puede acceder a la configuración.</p>
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
      <div className="bg-white/70 backdrop-blur-md p-6 rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.05)] border border-white/60 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg text-white">
            <Settings size={26} />
          </div>
          <div>
            <h1 className="text-[clamp(1.5rem,3vw,2.2rem)] font-bold text-gray-800 flex items-center gap-2">
              Configuración del Sistema
              <Sparkles size={18} className="text-yellow-500" />
            </h1>
            <p className="text-gray-600 mt-1">Gestiona sedes, empleados y permisos del sistema</p>
          </div>
        </div>

        {mensaje.texto && (
          <div className={`mt-5 p-4 rounded-2xl text-sm font-medium flex items-center gap-3 backdrop-blur-sm border ${
            mensaje.tipo === "exito" 
              ? "bg-green-100/70 text-green-800 border-green-200/60" 
              : "bg-red-100/70 text-red-800 border-red-200/60"
          }`}>
            {mensaje.tipo === "exito" ? <Sparkles size={18} /> : <AlertCircle size={18} />}
            {mensaje.texto}
          </div>
        )}
      </div>

      {/* 📑 PESTAÑAS */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200/60 px-4 relative z-10">
        <button
          onClick={() => setActivoTab("sedes")}
          className={`px-6 py-3 rounded-t-2xl font-medium transition-all duration-300 flex items-center gap-2 ${
            activoTab === "sedes" 
              ? "bg-white/70 backdrop-blur-md shadow-[0_-4px_12px_rgba(0,0,0,0.05)] border-b-2 border-blue-600 text-blue-700" 
              : "text-gray-500 hover:bg-white/40 hover:text-gray-700"
          }`}
        >
          <Building2 size={18} />
          Gestión de Sedes
        </button>
        <button
          onClick={() => setActivoTab("empleados")}
          className={`px-6 py-3 rounded-t-2xl font-medium transition-all duration-300 flex items-center gap-2 ${
            activoTab === "empleados" 
              ? "bg-white/70 backdrop-blur-md shadow-[0_-4px_12px_rgba(0,0,0,0.05)] border-b-2 border-blue-600 text-blue-700" 
              : "text-gray-500 hover:bg-white/40 hover:text-gray-700"
          }`}
        >
          <Users size={18} />
          Gestión de Empleados
        </button>
      </div>

      {cargando && (
        <div className="text-center py-16 relative z-10">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Procesando información...</p>
        </div>
      )}

      {/* 🏢 SECCIÓN SEDES */}
      {!cargando && activoTab === "sedes" && (
        <div className="bg-white/70 backdrop-blur-md rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.05)] border border-white/60 overflow-hidden relative z-10">
          <div className="p-6 border-b border-gray-200/60 flex justify-between items-center flex-wrap gap-3">
            <h2 className="text-xl font-bold text-gray-800">Lista de Sedes</h2>
            <button
              onClick={() => setModalSede(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
            >
              <PlusCircle size={18} /> Nueva Sede
            </button>
          </div>

          <div className="overflow-x-auto p-4">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50/80 to-gray-100/80 backdrop-blur-sm border-b border-gray-200/60">
                  <th className="p-4 text-left font-semibold text-gray-700 rounded-tl-xl">Nombre</th>
                  <th className="p-4 text-left font-semibold text-gray-700">Dirección</th>
                  <th className="p-4 text-left font-semibold text-gray-700">Teléfono</th>
                  <th className="p-4 text-left font-semibold text-gray-700">Estado</th>
                  <th className="p-4 text-right font-semibold text-gray-700 rounded-tr-xl">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/50">
                {sedes.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-10 text-center text-gray-500 font-medium">
                      <AlertCircle size={40} className="mx-auto mb-3 text-gray-300" />
                      ⚠️ No hay sedes registradas
                    </td>
                  </tr>
                ) : (
                  sedes.map(sede => (
                    <tr key={sede.id} className="hover:bg-indigo-50/40 transition-colors group">
                      <td className="p-4 font-medium text-gray-800">{sede.nombre}</td>
                      <td className="p-4 text-sm text-gray-600">{sede.direccion || <span className="text-gray-400">—</span>}</td>
                      <td className="p-4 text-sm text-gray-600">{sede.telefono || <span className="text-gray-400">—</span>}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-medium border backdrop-blur-sm ${
                          sede.estado 
                            ? "bg-green-100/70 text-green-700 border-green-200/60" 
                            : "bg-red-100/70 text-red-700 border-red-200/60"
                        }`}>
                          {sede.estado ? "✅ Activa" : "❌ Inactiva"}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => editarSede(sede)} 
                            className="p-2.5 bg-blue-50/70 backdrop-blur-sm text-blue-600 rounded-xl hover:bg-blue-100/70 transition-colors border border-blue-100/60" 
                            title="Editar Sede"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            onClick={() => eliminarSede(sede.id)} 
                            className="p-2.5 bg-red-50/70 backdrop-blur-sm text-red-600 rounded-xl hover:bg-red-100/70 transition-colors border border-red-100/60" 
                            title="Eliminar Sede"
                          >
                            <Trash2 size={16} />
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
      )}

      {/* 👤 SECCIÓN EMPLEADOS */}
      {!cargando && activoTab === "empleados" && (
        <div className="bg-white/70 backdrop-blur-md rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.05)] border border-white/60 overflow-hidden relative z-10">
          <div className="p-6 border-b border-gray-200/60 flex justify-between items-center flex-wrap gap-3">
            <h2 className="text-xl font-bold text-gray-800">Gestión de Empleados y Usuarios</h2>
            <button
              onClick={() => setModalUsuario(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
            >
              <UserPlus size={18} /> Nuevo Empleado
            </button>
          </div>

          <div className="overflow-x-auto p-4">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50/80 to-gray-100/80 backdrop-blur-sm border-b border-gray-200/60">
                  <th className="p-4 text-left font-semibold text-gray-700 rounded-tl-xl">Nombre</th>
                  <th className="p-4 text-left font-semibold text-gray-700">Correo</th>
                  <th className="p-4 text-left font-semibold text-gray-700">Rol</th>
                  <th className="p-4 text-left font-semibold text-gray-700">Sede Asignada</th>
                  <th className="p-4 text-left font-semibold text-gray-700">Estado</th>
                  <th className="p-4 text-right font-semibold text-gray-700 rounded-tr-xl">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/50">
                {usuarios.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-gray-500 font-medium">
                      <AlertCircle size={40} className="mx-auto mb-3 text-gray-300" />
                      ⚠️ No hay empleados registrados
                    </td>
                  </tr>
                ) : (
                  usuarios.map(emp => (
                    <tr key={emp.id} className="hover:bg-indigo-50/40 transition-colors group">
                      <td className="p-4 font-medium text-gray-800">{emp.nombre}</td>
                      <td className="p-4 text-sm text-gray-600">{emp.email}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border backdrop-blur-sm ${
                          emp.rol === "Administrador" 
                            ? "bg-purple-100/70 text-purple-700 border-purple-200/60" 
                            : "bg-cyan-100/70 text-cyan-700 border-cyan-200/60"
                        }`}>
                          {emp.rol}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-gray-600">{emp.sedes?.nombre || <span className="text-gray-400">Sin asignar</span>}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-medium border backdrop-blur-sm ${
                          emp.estado 
                            ? "bg-green-100/70 text-green-700 border-green-200/60" 
                            : "bg-red-100/70 text-red-700 border-red-200/60"
                        }`}>
                          {emp.estado ? "✅ Activo" : "❌ Bloqueado"}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => editarUsuario(emp)} 
                            className="p-2.5 bg-blue-50/70 backdrop-blur-sm text-blue-600 rounded-xl hover:bg-blue-100/70 transition-colors border border-blue-100/60" 
                            title="Editar Usuario"
                          >
                            <UserCog size={16} />
                          </button>
                          <button
                            onClick={() => cambiarEstadoUsuario(emp)}
                            className={`p-2.5 rounded-xl backdrop-blur-sm transition-colors border ${
                              emp.estado 
                                ? "bg-red-50/70 text-red-600 hover:bg-red-100/70 border-red-100/60" 
                                : "bg-green-50/70 text-green-600 hover:bg-green-100/70 border-green-100/60"
                            }`}
                            title={emp.estado ? "Bloquear Usuario" : "Desbloquear Usuario"}
                          >
                            {emp.estado ? <Lock size={16} /> : <Unlock size={16} />}
                          </button>
                          <button
                            onClick={() => eliminarUsuario(emp)}
                            className="p-2.5 bg-red-50/70 backdrop-blur-sm text-red-600 rounded-xl hover:bg-red-100/70 transition-colors border border-red-100/60"
                            title="Eliminar Usuario"
                          >
                            <Trash2 size={16} />
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
      )}

      {/* 📝 MODAL SEDE */}
      {modalSede && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/80 backdrop-blur-md rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.2)] w-full max-w-md p-6 border border-white/60">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  {sedeEditar ? <Edit size={18} /> : <PlusCircle size={18} />}
                </div>
                {sedeEditar ? "Editar Sede" : "Nueva Sede"}
              </h3>
              <button onClick={cerrarModalSede} className="text-gray-500 hover:text-gray-800 p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={guardarSede} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Nombre de la Sede *</label>
                <input
                  type="text"
                  value={formSede.nombre}
                  onChange={(e) => setFormSede({...formSede, nombre: e.target.value})}
                  className="w-full border border-indigo-100 bg-white/70 p-3.5 rounded-xl focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Dirección</label>
                <input
                  type="text"
                  value={formSede.direccion}
                  onChange={(e) => setFormSede({...formSede, direccion: e.target.value})}
                  className="w-full border border-indigo-100 bg-white/70 p-3.5 rounded-xl focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Teléfono</label>
                  <input
                    type="text"
                    value={formSede.telefono}
                    onChange={(e) => setFormSede({...formSede, telefono: e.target.value})}
                    className="w-full border border-indigo-100 bg-white/70 p-3.5 rounded-xl focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Ciudad</label>
                  <input
                    type="text"
                    value={formSede.ciudad}
                    onChange={(e) => setFormSede({...formSede, ciudad: e.target.value})}
                    className="w-full border border-indigo-100 bg-white/70 p-3.5 rounded-xl focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              {sedeEditar && (
                <div className="p-3 bg-gray-50/70 rounded-xl border border-gray-100">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formSede.estado}
                      onChange={(e) => setFormSede({...formSede, estado: e.target.checked})}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700 font-medium">Sede Activa</span>
                  </label>
                </div>
              )}

              <button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl mt-2"
              >
                <Save size={18} /> Guardar Cambios
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 📝 MODAL USUARIO */}
      {modalUsuario && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white/80 backdrop-blur-md rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.2)] w-full max-w-md p-6 my-10 border border-white/60">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  {usuarioEditar ? <UserCog size={18} /> : <UserPlus size={18} />}
                </div>
                {usuarioEditar ? "Editar Empleado" : "Crear Nuevo Empleado"}
              </h3>
              <button onClick={cerrarModalUsuario} className="text-gray-500 hover:text-gray-800 p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={guardarUsuario} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Nombre Completo *</label>
                <input
                  type="text"
                  value={formUsuario.nombre}
                  onChange={(e) => setFormUsuario({...formUsuario, nombre: e.target.value})}
                  className="w-full border border-indigo-100 bg-white/70 p-3.5 rounded-xl focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Correo Electrónico *</label>
                <input
                  type="email"
                  value={formUsuario.email}
                  onChange={(e) => setFormUsuario({...formUsuario, email: e.target.value})}
                  className="w-full border border-indigo-100 bg-white/70 p-3.5 rounded-xl focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                  placeholder="ejemplo@correo.com"
                  required
                />
              </div>

              {!usuarioEditar && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Contraseña *</label>
                  <input
                    type="text"
                    value={formUsuario.password}
                    onChange={(e) => setFormUsuario({...formUsuario, password: e.target.value})}
                    className="w-full border border-indigo-100 bg-white/70 p-3.5 rounded-xl focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                    placeholder="Ej: farmacia123"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1.5 px-1">* Clave de ingreso para este usuario</p>
                </div>
              )}

              {usuarioEditar && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Contraseña (Dejar vacío para NO cambiar)</label>
                  <input
                    type="text"
                    value={formUsuario.password}
                    onChange={(e) => setFormUsuario({...formUsuario, password: e.target.value})}
                    className="w-full border border-indigo-100 bg-white/70 p-3.5 rounded-xl focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                    placeholder="Solo escribe si deseas cambiarla"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Rol *</label>
                  <select
                    value={formUsuario.rol}
                    onChange={(e) => setFormUsuario({...formUsuario, rol: e.target.value})}
                    className="w-full border border-indigo-100 bg-white/70 p-3.5 rounded-xl focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                  >
                    <option value="Empleado">Empleado</option>
                    <option value="Administrador">Administrador</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Sede *</label>
                  <select
                    value={formUsuario.sede_id}
                    onChange={(e) => setFormUsuario({...formUsuario, sede_id: e.target.value})}
                    className="w-full border border-indigo-100 bg-white/70 p-3.5 rounded-xl focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                    required
                  >
                    <option value="">-- Seleccionar --</option>
                    {sedesLista.map(sede => (
                      <option key={sede.id} value={sede.id}>{sede.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              {usuarioEditar && (
                <div className="p-3 bg-gray-50/70 rounded-xl border border-gray-100">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Estado de la Cuenta</label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formUsuario.estado}
                      onChange={(e) => setFormUsuario({...formUsuario, estado: e.target.checked})}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700 font-medium">Cuenta Activa</span>
                  </label>
                </div>
              )}

              <button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl mt-2"
              >
                <Save size={18} />
                {usuarioEditar ? "Actualizar Datos" : "Crear Empleado"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}