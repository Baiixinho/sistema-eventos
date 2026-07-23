import { Routes, Route } from 'react-router-dom';
import { Login } from './components/Login'; // 👈 Apontando para src/components/Login.jsx
import { CheckOut } from './components/pages/CheckOut';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/checkout" element={<CheckOut />} />
    </Routes>
  );
}

export default App;