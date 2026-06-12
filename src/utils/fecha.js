// 🇨🇴 FUNCIÓN PARA CONVERTIR FECHA A HORA DE COLOMBIA (UTC-5)
export const fechaColombia = (fecha) => {
  if (!fecha) return "";

  // Si viene de Supabase, le quitamos la Z para que no la interprete como UTC
  const fechaLimpia = fecha.toString().replace("Z", "");
  
  // Creamos la fecha y ajustamos a zona horaria
  const fechaObj = new Date(fechaLimpia);

  // Opciones para mostrarla bonita
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota", // 🔑 CLAVE: Zona horaria EXACTA
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true // ⏱️ Formato 12 horas (AM/PM) como te gusta
  }).format(fechaObj);
};

// 📅 SOLO FECHA (sin hora)
export const soloFecha = (fecha) => {
  if (!fecha) return "";
  const fechaLimpia = fecha.toString().replace("Z", "");
  const fechaObj = new Date(fechaLimpia);
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(fechaObj);
};