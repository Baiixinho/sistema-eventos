import { Navigate } from 'react-router-dom';

export function ProtectedRoute({ perfilRequerido, children }) {
  const autenticado = localStorage.getItem('autenticado') === 'true';
  const perfil = localStorage.getItem('perfil');

  if (!autenticado || perfil !== perfilRequerido) {
    return <Navigate to="/" replace />;
  }

  return children;
}
