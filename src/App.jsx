import { Routes, Route } from 'react-router-dom';
import { Login } from './components/Login';
import { CheckOut } from './components/pages/CheckOut';
import { Dashboard } from './components/pages/Dashboard';
import { ProtectedRoute } from './components/ProtectedRoute';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route
        path="/checkout"
        element={
          <ProtectedRoute perfilRequerido="operador">
            <CheckOut />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute perfilRequerido="gestor">
            <Dashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;