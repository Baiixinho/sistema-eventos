import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Login } from './pages/Login'; // ou './components/pages/Login'
import { CheckOut } from './components/pages/CheckOut';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/checkout" element={<CheckOut />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;