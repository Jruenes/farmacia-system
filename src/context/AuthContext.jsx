import { createContext, useContext, useEffect, useState } from "react"

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const sesionGuardada = localStorage.getItem("sesion_usuario");
    if (sesionGuardada) setUsuario(JSON.parse(sesionGuardada));
    setLoading(false);
  }, [])

  const login = async (datosUsuario) => {
    setUsuario(datosUsuario);
    localStorage.setItem("sesion_usuario", JSON.stringify(datosUsuario));
  }

  const logout = async () => {
    setUsuario(null);
    localStorage.removeItem("sesion_usuario");
  }

  return (
    <AuthContext.Provider value={{ usuario, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}