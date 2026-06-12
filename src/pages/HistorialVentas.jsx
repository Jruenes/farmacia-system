import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { 
  ShoppingCart, DollarSign, CreditCard, Eye, X, Calendar, Store, 
  Sparkles, ArrowRightCircle, BarChart3, AlertCircle, Loader 
} from "lucide-react";

export default function HistorialVentas() {
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === "Administrador"

  // Estados
  const [ventas, setVentas] = useState([]);
  const [ventasFiltradas, setVentasFiltradas] = useState([]);
  const [limite, setLimite] = useState(10);
  const [busqueda, setBusqueda] = useState("");
  const [metodoFiltro, setMetodoFiltro] = useState("Todos");
  const [fechaFiltro, setFechaFiltro] = useState("");
  const [detalleVenta, setDetalleVenta] = useState([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);

  // ✅ NUEVO: Estado para lista de sedes y la seleccionada
  const [sedesDisponibles, setSedesDisponibles] = useState([]);
  const [sedeSeleccionada, setSedeSeleccionada] = useState("todas"); 

  // ✅ NUEVO: Estados de carga y error
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  // 🔢 Estados para los totales desglosados
  const [totales, setTotales] = useState({
    hoy: { efectivo: 0, nequi: 0, daviplata: 0, transferencia: 0, tarjeta: 0, total: 0 },
    ayer: { efectivo: 0, nequi: 0, daviplata: 0, transferencia: 0, tarjeta: 0, total: 0 },
    mes: { efectivo: 0, nequi: 0, daviplata: 0, transferencia: 0, tarjeta: 0, total: 0 },
    historico: { efectivo: 0, nequi: 0, daviplata: 0, transferencia: 0, tarjeta: 0, total: 0 }
  });

  // 📌 Zona horaria CORRECTA para Cartagena / Colombia (UTC -5)
  const ZONA_HORARIA = "America/Bogota";

  // ⏩ AL INICIAR: Cargar sedes disponibles
  useEffect(() => {
    if (usuario) {
      cargarSedes();
    }
  }, [usuario]);

  // ⏩ Cargar ventas - Se ejecuta si cambia limite, usuario o la SEDE SELECCIONADA
  const cargarVentas = useCallback(async () => {
    if (!usuario || (esAdmin && sedesDisponibles.length === 0)) return;

    setCargando(true);
    setError("");
    try {
      let consulta = supabase
        .from("ventas")
        .select("*")
        .order("id", { ascending: false })
        .limit(limite);

      // ✅ LÓGICA NUEVA: 
      if (!esAdmin) {
        // Empleado: SIEMPRE ve solo su sede
        consulta = consulta.eq("sede_id", usuario?.sede_id);
      } else {
        // Administrador: Depende de lo que haya elegido
        if (sedeSeleccionada !== "todas") {
          consulta = consulta.eq("sede_id", Number(sedeSeleccionada));
        }
        // Si es "todas", no pone filtro y trae todo
      }

      const { data, error } = await consulta;

      if (error) throw error;
      setVentas(data || []);

    } catch (err) {
      setError("Error al cargar ventas: " + err.message);
      console.error(err);
    } finally {
      setCargando(false);
    }
  }, [limite, usuario, sedeSeleccionada, sedesDisponibles, esAdmin]);

  useEffect(() => {
    cargarVentas();
  }, [cargarVentas]);

  // Aplicar filtros
  useEffect(() => {
    filtrarVentas();
  }, [ventas, busqueda, metodoFiltro, fechaFiltro]);

  // Calcular totales
  useEffect(() => {
    calcularTotalesDetallados();
  }, [ventas]);

  // 📥 NUEVO: CARGAR LISTA DE SEDES DE LA BASE DE DATOS
  const cargarSedes = async () => {
    setCargando(true);
    try {
      const { data, error } = await supabase
        .from("sedes")
        .select("id, nombre")
        .eq("estado", true)
        .order("nombre", { ascending: true })

      if (error) throw error
      setSedesDisponibles(data || [])

    } catch (err) {
      setError("Error al cargar sedes: " + err.message);
      console.error(err);
    } finally {
      setCargando(false);
    }
  }

  // 🔎 NUEVO: Obtener nombre de la sede por ID
  const obtenerNombreSede = useCallback((idSede) => {
    if (!idSede) return "Desconocida";
    const sede = sedesDisponibles.find(s => s.id === idSede)
    return sede ? sede.nombre : "Desconocida"
  }, [sedesDisponibles]);

  // ⏰ FUNCIÓN CLAVE: Convierte la hora UTC de la base de datos a HORA DE CARTAGENA
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

  // 📌 Obtener solo la fecha (para filtros y cálculos)
  const obtenerFechaSolo = useCallback((fechaISO) => {
    if (!fechaISO) return "";
    const fecha = new Date(fechaISO);
    return fecha.toLocaleDateString("sv-SE", { timeZone: ZONA_HORARIA });
  }, []);

  // Filtrar ventas
  const filtrarVentas = () => {
    let resultado = [...ventas];

    if (busqueda.trim()) {
      resultado = resultado.filter((v) => 
        String(v.id).includes(busqueda.trim()) ||
        String(v.id).toLowerCase().includes(busqueda.toLowerCase())
      );
    }

    if (metodoFiltro !== "Todos") {
      resultado = resultado.filter((v) => v.metodo_pago === metodoFiltro);
    }

    if (fechaFiltro) {
      resultado = resultado.filter((v) => obtenerFechaSolo(v.created_at) === fechaFiltro);
    }

    setVentasFiltradas(resultado);
  };

  // ⚙️ Calcular totales por fecha y método
  const calcularTotalesDetallados = () => {
    const hoyStr = obtenerFechaSolo(new Date());
    
    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 1);
    const ayerStr = obtenerFechaSolo(ayer);

    const mesActual = new Date().getMonth() + 1;
    const anioActual = new Date().getFullYear();

    let nuevosTotales = {
      hoy: { efectivo: 0, nequi: 0, daviplata: 0, transferencia: 0, tarjeta: 0, total: 0 },
      ayer: { efectivo: 0, nequi: 0, daviplata: 0, transferencia: 0, tarjeta: 0, total: 0 },
      mes: { efectivo: 0, nequi: 0, daviplata: 0, transferencia: 0, tarjeta: 0, total: 0 },
      historico: { efectivo: 0, nequi: 0, daviplata: 0, transferencia: 0, tarjeta: 0, total: 0 }
    };

    ventas.forEach((venta) => {
      if (!venta.created_at) return;

      const fechaVenta = obtenerFechaSolo(venta.created_at);
      const fechaObj = new Date(venta.created_at);
      const mesVenta = fechaObj.getMonth() + 1;
      const anioVenta = fechaObj.getFullYear();

      const valor = Number(venta.total || 0);
      const metodo = venta.metodo_pago;

      // Total Histórico
      nuevosTotales.historico.total += valor;
      if (metodo === "Efectivo") nuevosTotales.historico.efectivo += valor;
      if (metodo === "Nequi") nuevosTotales.historico.nequi += valor;
      if (metodo === "Daviplata") nuevosTotales.historico.daviplata += valor;
      if (metodo === "Transferencia") nuevosTotales.historico.transferencia += valor;
      if (metodo === "Tarjeta") nuevosTotales.historico.tarjeta += valor;

      // Hoy
      if (fechaVenta === hoyStr) {
        nuevosTotales.hoy.total += valor;
        if (metodo === "Efectivo") nuevosTotales.hoy.efectivo += valor;
        if (metodo === "Nequi") nuevosTotales.hoy.nequi += valor;
        if (metodo === "Daviplata") nuevosTotales.hoy.daviplata += valor;
        if (metodo === "Transferencia") nuevosTotales.hoy.transferencia += valor;
        if (metodo === "Tarjeta") nuevosTotales.hoy.tarjeta += valor;
      }

      // Ayer
      if (fechaVenta === ayerStr) {
        nuevosTotales.ayer.total += valor;
        if (metodo === "Efectivo") nuevosTotales.ayer.efectivo += valor;
        if (metodo === "Nequi") nuevosTotales.ayer.nequi += valor;
        if (metodo === "Daviplata") nuevosTotales.ayer.daviplata += valor;
        if (metodo === "Transferencia") nuevosTotales.ayer.transferencia += valor;
        if (metodo === "Tarjeta") nuevosTotales.ayer.tarjeta += valor;
      }

      // Este Mes
      if (mesVenta === mesActual && anioVenta === anioActual) {
        nuevosTotales.mes.total += valor;
        if (metodo === "Efectivo") nuevosTotales.mes.efectivo += valor;
        if (metodo === "Nequi") nuevosTotales.mes.nequi += valor;
        if (metodo === "Daviplata") nuevosTotales.mes.daviplata += valor;
        if (metodo === "Transferencia") nuevosTotales.mes.transferencia += valor;
        if (metodo === "Tarjeta") nuevosTotales.mes.tarjeta += valor;
      }
    });

    setTotales(nuevosTotales);
  };

  // Cargar más
  const cargarMas = () => {
    setLimite((prev) => prev + 10);
  };

  // Ver detalle
  const verDetalle = async (ventaId) => {
    setVentaSeleccionada(ventaId);
    setCargando(true);
    try {
      const { data, error } = await supabase
        .from("detalle_ventas")
        .select("*")
        .eq("venta_id", ventaId)
        .order("id", { ascending: true });

      if (error) throw error;
      setDetalleVenta(data || []);
      setModalAbierto(true);
    } catch (err) {
      setError("No se pudo cargar el detalle: " + err.message);
    } finally {
      setCargando(false);
    }
  };

  // Colores método de pago
  const badgeMetodo = (metodo) => {
    switch (metodo) {
      case "Efectivo": return "bg-green-100 text-green-700";
      case "Nequi": return "bg-blue-100 text-blue-700";
      case "Daviplata": return "bg-purple-100 text-purple-700";
      case "Tarjeta": return "bg-orange-100 text-orange-700";
      case "Transferencia": return "bg-cyan-100 text-cyan-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="space-y-6 p-4 bg-gradient-to-br from-gray-50 to-blue-50/20 min-h-screen relative overflow-hidden">
      {/* ✨ DETALLES DECORATIVOS DE FONDO */}
      <div className="absolute top-0 left-0 w-[350px] h-[350px] bg-blue-200/20 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-0 right-0 w-[350px] h-[350px] bg-indigo-200/20 rounded-full blur-3xl -z-10"></div>

      {/* 🔄 Indicador de carga global */}
      {cargando && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-2xl shadow-xl flex items-center gap-3">
            <Loader size={24} className="animate-spin text-indigo-600" />
            <p className="font-medium">Procesando...</p>
          </div>
        </div>
      )}

      {/* ❌ Mensaje de error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2 relative z-20">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button onClick={() => setError("")} className="ml-auto font-bold hover:text-red-900">×</button>
        </div>
      )}

      {/* Encabezado */}
      <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl shadow-lg text-white">
              <Store size={26} />
            </div>
            <div>
              <h1 className="text-[clamp(1.5rem,3vw,2.3rem)] font-bold text-gray-800 flex items-center gap-2">
                Historial de Ventas
                <Sparkles size={18} className="text-yellow-500" />
              </h1>
              <p className="text-sm text-gray-500">Consulta y analiza todas las transacciones realizadas</p>
            </div>
          </div>
          
          {/* ✅ SELECTOR DE SEDE - DINÁMICO Y ESTILIZADO */}
          {esAdmin && (
            <div className="w-full md:w-64">
              <label className="text-xs font-medium text-gray-500 mb-1 block">Seleccionar Sede:</label>
              <div className="relative">
                <select
                  value={sedeSeleccionada}
                  onChange={(e) => setSedeSeleccionada(e.target.value)}
                  disabled={cargando}
                  className="w-full border border-indigo-100 bg-white/70 backdrop-blur-sm p-3 pl-4 pr-10 rounded-xl focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all appearance-none shadow-sm disabled:opacity-70"
                >
                  <option value="todas">🏢 Ver todas las sedes</option>
                  {sedesDisponibles.map(sede => (
                    <option key={sede.id} value={sede.id}>📍 {sede.nombre}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-500">
                  <ArrowRightCircle size={16} className="rotate-90" />
                </div>
              </div>
            </div>
          )}
        </div>

        <p className="text-gray-600 bg-white/60 backdrop-blur-sm p-3 rounded-xl shadow-sm border border-white/60 inline-block">
          {!esAdmin
            ? `👤 Estás viendo solo las ventas de: <b>${obtenerNombreSede(usuario?.sede_id)}</b>`
            : `👑 Modo administrador: viendo ${sedeSeleccionada === "todas" ? "todas las sedes" : `sede ${obtenerNombreSede(Number(sedeSeleccionada))}`}`}
        </p>
      </div>

      {/* 📊 TOTALES DETALLADOS - Hora corregida */}
      <div className="grid md:grid-cols-4 gap-5 relative z-10">
        {/* HOY */}
        <div className="bg-white/70 backdrop-blur-md rounded-[2rem] p-5 shadow-[0_8px_32px_rgba(0,0,0,0.05)] border border-white/60 hover:shadow-lg transition-all hover:scale-[1.02]">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-green-100 text-green-600 rounded-lg">
              <Calendar size={18} />
            </div>
            <h3 className="font-bold text-lg text-green-700">Hoy</h3>
          </div>
          <div className="space-y-2 text-sm">
            <p className="flex justify-between items-center"><span className="text-gray-600">Efectivo:</span> <span className="font-semibold text-gray-800">${totales.hoy.efectivo.toLocaleString("es-CO")}</span></p>
            <p className="flex justify-between items-center"><span className="text-gray-600">Nequi:</span> <span className="font-semibold text-gray-800">${totales.hoy.nequi.toLocaleString("es-CO")}</span></p>
            <p className="flex justify-between items-center"><span className="text-gray-600">Daviplata:</span> <span className="font-semibold text-gray-800">${totales.hoy.daviplata.toLocaleString("es-CO")}</span></p>
            <p className="flex justify-between items-center"><span className="text-gray-600">Transf.:</span> <span className="font-semibold text-gray-800">${totales.hoy.transferencia.toLocaleString("es-CO")}</span></p>
            <p className="flex justify-between items-center"><span className="text-gray-600">Tarjeta:</span> <span className="font-semibold text-gray-800">${totales.hoy.tarjeta.toLocaleString("es-CO")}</span></p>
            <div className="border-t border-green-100/70 mt-3 pt-3 flex justify-between font-bold text-base text-green-700">
              <span>TOTAL:</span>
              <span>${totales.hoy.total.toLocaleString("es-CO")}</span>
            </div>
          </div>
        </div>

        {/* AYER */}
        <div className="bg-white/70 backdrop-blur-md rounded-[2rem] p-5 shadow-[0_8px_32px_rgba(0,0,0,0.05)] border border-white/60 hover:shadow-lg transition-all hover:scale-[1.02]">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <Calendar size={18} />
            </div>
            <h3 className="font-bold text-lg text-blue-700">Ayer</h3>
          </div>
          <div className="space-y-2 text-sm">
            <p className="flex justify-between items-center"><span className="text-gray-600">Efectivo:</span> <span className="font-semibold text-gray-800">${totales.ayer.efectivo.toLocaleString("es-CO")}</span></p>
            <p className="flex justify-between items-center"><span className="text-gray-600">Nequi:</span> <span className="font-semibold text-gray-800">${totales.ayer.nequi.toLocaleString("es-CO")}</span></p>
            <p className="flex justify-between items-center"><span className="text-gray-600">Daviplata:</span> <span className="font-semibold text-gray-800">${totales.ayer.daviplata.toLocaleString("es-CO")}</span></p>
            <p className="flex justify-between items-center"><span className="text-gray-600">Transf.:</span> <span className="font-semibold text-gray-800">${totales.ayer.transferencia.toLocaleString("es-CO")}</span></p>
            <p className="flex justify-between items-center"><span className="text-gray-600">Tarjeta:</span> <span className="font-semibold text-gray-800">${totales.ayer.tarjeta.toLocaleString("es-CO")}</span></p>
            <div className="border-t border-blue-100/70 mt-3 pt-3 flex justify-between font-bold text-base text-blue-700">
              <span>TOTAL:</span>
              <span>${totales.ayer.total.toLocaleString("es-CO")}</span>
            </div>
          </div>
        </div>

        {/* ESTE MES */}
        <div className="bg-white/70 backdrop-blur-md rounded-[2rem] p-5 shadow-[0_8px_32px_rgba(0,0,0,0.05)] border border-white/60 hover:shadow-lg transition-all hover:scale-[1.02]">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
              <Calendar size={18} />
            </div>
            <h3 className="font-bold text-lg text-purple-700">Este Mes</h3>
          </div>
          <div className="space-y-2 text-sm">
            <p className="flex justify-between items-center"><span className="text-gray-600">Efectivo:</span> <span className="font-semibold text-gray-800">${totales.mes.efectivo.toLocaleString("es-CO")}</span></p>
            <p className="flex justify-between items-center"><span className="text-gray-600">Nequi:</span> <span className="font-semibold text-gray-800">${totales.mes.nequi.toLocaleString("es-CO")}</span></p>
            <p className="flex justify-between items-center"><span className="text-gray-600">Daviplata:</span> <span className="font-semibold text-gray-800">${totales.mes.daviplata.toLocaleString("es-CO")}</span></p>
            <p className="flex justify-between items-center"><span className="text-gray-600">Transf.:</span> <span className="font-semibold text-gray-800">${totales.mes.transferencia.toLocaleString("es-CO")}</span></p>
            <p className="flex justify-between items-center"><span className="text-gray-600">Tarjeta:</span> <span className="font-semibold text-gray-800">${totales.mes.tarjeta.toLocaleString("es-CO")}</span></p>
            <div className="border-t border-purple-100/70 mt-3 pt-3 flex justify-between font-bold text-base text-purple-700">
              <span>TOTAL:</span>
              <span>${totales.mes.total.toLocaleString("es-CO")}</span>
            </div>
          </div>
        </div>

        {/* TOTAL HISTÓRICO */}
        <div className="bg-white/70 backdrop-blur-md rounded-[2rem] p-5 shadow-[0_8px_32px_rgba(0,0,0,0.05)] border border-white/60 hover:shadow-lg transition-all hover:scale-[1.02]">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
              <DollarSign size={18} />
            </div>
            <h3 className="font-bold text-lg text-orange-700">Histórico</h3>
          </div>
          <div className="space-y-2 text-sm">
            <p className="flex justify-between items-center"><span className="text-gray-600">Efectivo:</span> <span className="font-semibold text-gray-800">${totales.historico.efectivo.toLocaleString("es-CO")}</span></p>
            <p className="flex justify-between items-center"><span className="text-gray-600">Nequi:</span> <span className="font-semibold text-gray-800">${totales.historico.nequi.toLocaleString("es-CO")}</span></p>
            <p className="flex justify-between items-center"><span className="text-gray-600">Daviplata:</span> <span className="font-semibold text-gray-800">${totales.historico.daviplata.toLocaleString("es-CO")}</span></p>
            <p className="flex justify-between items-center"><span className="text-gray-600">Transf.:</span> <span className="font-semibold text-gray-800">${totales.historico.transferencia.toLocaleString("es-CO")}</span></p>
            <p className="flex justify-between items-center"><span className="text-gray-600">Tarjeta:</span> <span className="font-semibold text-gray-800">${totales.historico.tarjeta.toLocaleString("es-CO")}</span></p>
            <div className="border-t border-orange-100/70 mt-3 pt-3 flex justify-between font-bold text-base text-orange-700">
              <span>TOTAL:</span>
              <span>${totales.historico.total.toLocaleString("es-CO")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tarjetas resumen general */}
      <div className="grid xl:grid-cols-4 md:grid-cols-2 grid-cols-1 gap-5 relative z-10">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl p-6 shadow-lg text-white transform hover:scale-[1.03] transition-all hover:shadow-xl">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-white/80 text-sm">Ventas Realizadas</p>
              <h2 className="text-3xl font-bold mt-1">{ventas.length}</h2>
            </div>
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <ShoppingCart size={26} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl p-6 shadow-lg text-white transform hover:scale-[1.03] transition-all hover:shadow-xl">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-white/80 text-sm">Ventas Hoy</p>
              <h2 className="text-3xl font-bold mt-1">{ventas.filter(v => obtenerFechaSolo(v.created_at) === obtenerFechaSolo(new Date())).length}</h2>
            </div>
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <BarChart3 size={26} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-teal-500 to-cyan-600 rounded-3xl p-6 shadow-lg text-white transform hover:scale-[1.03] transition-all hover:shadow-xl">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-white/80 text-sm">Ingresos Hoy</p>
              <h2 className="text-2xl font-bold mt-1">${totales.hoy.total.toLocaleString("es-CO")}</h2>
            </div>
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <DollarSign size={26} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-fuchsia-600 rounded-3xl p-6 shadow-lg text-white transform hover:scale-[1.03] transition-all hover:shadow-xl">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-white/80 text-sm">Total Histórico</p>
              <h2 className="text-2xl font-bold mt-1">${totales.historico.total.toLocaleString("es-CO")}</h2>
            </div>
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <CreditCard size={26} />
            </div>
          </div>
        </div>
      </div>

      {/* Totales por método histórico */}
      <div className="grid md:grid-cols-5 grid-cols-2 gap-4 relative z-10">
        <div className="bg-white/60 backdrop-blur-md p-5 rounded-2xl border border-green-100/70 shadow-sm hover:shadow-md transition-shadow hover:bg-green-50/50">
          <p className="text-gray-600 text-sm font-medium">Efectivo</p>
          <h2 className="text-xl font-bold text-green-700 mt-1">
            ${totales.historico.efectivo.toLocaleString("es-CO")}
          </h2>
        </div>
        <div className="bg-white/60 backdrop-blur-md p-5 rounded-2xl border border-blue-100/70 shadow-sm hover:shadow-md transition-shadow hover:bg-blue-50/50">
          <p className="text-gray-600 text-sm font-medium">Nequi</p>
          <h2 className="text-xl font-bold text-blue-700 mt-1">
            ${totales.historico.nequi.toLocaleString("es-CO")}
          </h2>
        </div>
        <div className="bg-white/60 backdrop-blur-md p-5 rounded-2xl border border-purple-100/70 shadow-sm hover:shadow-md transition-shadow hover:bg-purple-50/50">
          <p className="text-gray-600 text-sm font-medium">Daviplata</p>
          <h2 className="text-xl font-bold text-purple-700 mt-1">
            ${totales.historico.daviplata.toLocaleString("es-CO")}
          </h2>
        </div>
        <div className="bg-white/60 backdrop-blur-md p-5 rounded-2xl border border-cyan-100/70 shadow-sm hover:shadow-md transition-shadow hover:bg-cyan-50/50">
          <p className="text-gray-600 text-sm font-medium">Transferencia</p>
          <h2 className="text-xl font-bold text-cyan-700 mt-1">
            ${totales.historico.transferencia.toLocaleString("es-CO")}
          </h2>
        </div>
        <div className="bg-white/60 backdrop-blur-md p-5 rounded-2xl border border-orange-100/70 shadow-sm hover:shadow-md transition-shadow hover:bg-orange-50/50">
          <p className="text-gray-600 text-sm font-medium">Tarjeta</p>
          <h2 className="text-xl font-bold text-orange-700 mt-1">
            ${totales.historico.tarjeta.toLocaleString("es-CO")}
          </h2>
        </div>
      </div>

      {/* FILTROS */}
      <div className="bg-white/70 backdrop-blur-md p-6 rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.05)] border border-white/60 grid md:grid-cols-3 gap-6 relative z-10">
        <div>
          <label className="text-sm font-semibold text-gray-600 mb-2 block">Buscar por ID de venta</label>
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            disabled={cargando}
            className="w-full border border-indigo-100 bg-white/70 rounded-xl p-3.5 focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all shadow-sm disabled:opacity-70"
            placeholder="Ej: 125"
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-gray-600 mb-2 block">Método de Pago</label>
          <div className="relative">
            <select
              value={metodoFiltro}
              onChange={(e) => setMetodoFiltro(e.target.value)}
              disabled={cargando}
              className="w-full border border-indigo-100 bg-white/70 rounded-xl p-3.5 pl-4 pr-10 focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all shadow-sm appearance-none disabled:opacity-70"
            >
              <option value="Todos">Todos los métodos</option>
              <option value="Efectivo">Efectivo</option>
              <option value="Nequi">Nequi</option>
              <option value="Daviplata">Daviplata</option>
              <option value="Transferencia">Transferencia</option>
              <option value="Tarjeta">Tarjeta</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-500">
              <ArrowRightCircle size={16} className="rotate-90" />
            </div>
          </div>
        </div>
        <div>
          <label className="text-sm font-semibold text-gray-600 mb-2 block">Filtrar por Fecha</label>
          <input
            type="date"
            value={fechaFiltro}
            onChange={(e) => setFechaFiltro(e.target.value)}
            disabled={cargando}
            className="w-full border border-indigo-100 bg-white/70 rounded-xl p-3.5 focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all shadow-sm disabled:opacity-70"
          />
        </div>
      </div>

      {/* TABLA DE VENTAS - ⏰ HORA CORREGIDA AQUÍ */}
      <div className="bg-white/70 backdrop-blur-md rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.05)] border border-white/60 overflow-hidden relative z-10">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50/80 to-gray-100/80 backdrop-blur-sm border-b border-gray-200/60">
              <tr>
                <th className="p-4 text-left font-semibold text-gray-700"># Venta</th>
                <th className="p-4 text-left font-semibold text-gray-700">Fecha y Hora</th>
                {/* ✅ NUEVA COLUMNA: MOSTRAR SEDE */}
                {esAdmin && <th className="p-4 text-left font-semibold text-gray-700">Sede</th>}
                <th className="p-4 text-left font-semibold text-gray-700">Método</th>
                <th className="p-4 text-left font-semibold text-gray-700">Referencia</th>
                <th className="p-4 text-left font-semibold text-gray-700">Total</th>
                <th className="p-4 text-left font-semibold text-gray-700">Acción</th>
              </tr>
            </thead>
            <tbody>
              {ventasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={esAdmin ? "7" : "6"} className="p-8 text-center text-gray-500">
                    <div className="py-6">
                      <ShoppingCart size={40} className="mx-auto mb-3 text-gray-300" />
                      <p className="font-medium">😕 No hay ventas registradas con estos filtros</p>
                    </div>
                  </td>
                </tr>
              ) : (
                ventasFiltradas.map((venta) => (
                  <tr key={venta.id} className="border-t border-gray-100/70 hover:bg-indigo-50/40 transition-colors group">
                    <td className="p-4 font-bold text-gray-800">#{venta.id}</td>
                    <td className="p-4 text-sm text-gray-600 font-medium">
                      {obtenerHoraCartagena(venta.created_at)}
                    </td>
                    {/* ✅ NUEVA CELDA: NOMBRE DE LA SEDE DINÁMICO */}
                    {esAdmin && (
                      <td className="p-4 text-sm font-medium text-gray-700">
                        <span className="bg-gray-100 px-2 py-1 rounded-lg text-xs">{obtenerNombreSede(venta.sede_id)}</span>
                      </td>
                    )}
                    <td className="p-4">
                      <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${badgeMetodo(venta.metodo_pago)} shadow-sm`}>
                        {venta.metodo_pago}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-600">{venta.referencia || <span className="text-gray-400">-</span>}</td>
                    <td className="p-4 font-bold text-green-600 text-base">
                      ${Number(venta.total).toLocaleString("es-CO")}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => verDetalle(venta.id)}
                        disabled={cargando}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-xl transition-all hover:scale-105 shadow-sm disabled:opacity-50"
                        title="Ver detalle completo"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Cargar más */}
        <div className="p-5 flex justify-center border-t border-gray-100/70 bg-gray-50/40">
          <button
            onClick={cargarMas}
            disabled={cargando}
            className="px-6 py-3 bg-white hover:bg-indigo-50 text-indigo-700 rounded-xl transition font-semibold shadow-sm border border-indigo-100 hover:border-indigo-300 hover:shadow-md disabled:opacity-70"
          >
            Cargar más registros
          </button>
        </div>
      </div>

      {/* MODAL DETALLE - ESTILIZADO */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl border border-white/80 transform scale-100 animate-scaleIn">
            <div className="flex justify-between items-center mb-5 border-b border-gray-200/70 pb-3">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <ShoppingCart size={20} className="text-indigo-600" />
                Detalle de Venta #{ventaSeleccionada}
              </h3>
              <button
                onClick={() => setModalAbierto(false)}
                className="text-gray-400 hover:text-red-500 transition-colors bg-gray-100 hover:bg-red-50 p-2 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            {detalleVenta.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Sin productos registrados en esta venta</p>
            ) : (
              <div className="space-y-4">
                {detalleVenta.map((item, idx) => (
                  <div key={idx} className="bg-gray-50/70 rounded-2xl p-4 border border-gray-100/70">
                    <p className="font-semibold text-gray-800 mb-2">{item.producto_nombre || "Producto"}</p>
                    <div className="flex flex-wrap justify-between items-center gap-2 text-sm text-gray-600">
                      <p className="bg-white px-2 py-1 rounded-lg shadow-sm">Cant: <span className="font-bold text-gray-800">{item.cantidad}</span></p>
                      <p className="bg-white px-2 py-1 rounded-lg shadow-sm">Valor U: <span className="font-bold text-gray-800">${Number(item.precio_unitario || 0).toLocaleString("es-CO")}</span></p>
                      <p className="font-bold text-green-700 bg-green-50 px-3 py-1 rounded-lg shadow-sm">Subtotal: ${Number(item.subtotal || 0).toLocaleString("es-CO")}</p>
                    </div>
                  </div>
                ))}
                <div className="mt-6 pt-4 border-t border-gray-300/70 font-bold text-xl text-right text-green-700 bg-green-50/50 p-4 rounded-2xl shadow-sm">
                  Total Venta: ${detalleVenta.reduce((sum, item) => sum + Number(item.subtotal || 0), 0).toLocaleString("es-CO")}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}