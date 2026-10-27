import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import CambiarClavePage from './pages/CambiarClavePage';
import Dashboard from './pages/Dashboard';

// Con contraseña temporal sin estrenar solo se puede llegar a la pantalla de cambio de clave
const PrivateRoute = ({ children, permitirClaveTemporal = false }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (user.debe_cambiar_clave && !permitirClaveTemporal) return <Navigate to="/cambiar-clave" />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/cambiar-clave" element={<PrivateRoute permitirClaveTemporal><CambiarClavePage /></PrivateRoute>} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
