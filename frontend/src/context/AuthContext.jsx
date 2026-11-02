import { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (userInfo) {
      setUser(userInfo);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    setUser(data);
    localStorage.setItem('userInfo', JSON.stringify(data));
    return data;
  };

  // Cambia la clave y deja de pedir el cambio obligatorio
  const cambiarClave = async (actual, nueva) => {
    await api.post('/auth/change-password', { actual, nueva });
    const actualizado = { ...user, debe_cambiar_clave: false };
    setUser(actualizado);
    localStorage.setItem('userInfo', JSON.stringify(actualizado));
  };

  // Trae del servidor los datos vigentes (por ejemplo, si el gestor le asignó la función de PAT)
  const guardarDatos = (datos) => {
    setUser((previo) => {
      const actualizado = { ...previo, ...datos, token: previo?.token };
      localStorage.setItem('userInfo', JSON.stringify(actualizado));
      return actualizado;
    });
  };
  const refrescar = async () => {
    const { data } = await api.get('/auth/me');
    guardarDatos(data);
  };
  const actualizarPerfil = async (cambios) => {
    const { data } = await api.put('/auth/me', cambios);
    guardarDatos(data);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('userInfo');
  };

  return (
    <AuthContext.Provider value={{ user, login, cambiarClave, refrescar, actualizarPerfil, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
