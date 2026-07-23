import { Routes, Route } from 'react-router-dom';
import { Login } from './components/Login';
import { CheckOut } from './components/pages/CheckOut';
import { Dashboard } from './components/pages/Dashboard'; // 👈 Import do Dashboard

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/checkout" element={<CheckOut />} />
      <Route path="/dashboard" element={<Dashboard />} /> {/* 👈 Rota do Gestor */}
    </Routes>
  );
}

export default App;