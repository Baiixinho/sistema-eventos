import { useState } from 'react';
import { Login } from './components/Login';
import { CheckOut } from './components/pages/CheckOut';
import { Dashboard } from './components/pages/Dashboard';

export function App() {
  const [perfilAtivo, setPerfilAtivo] = useState(null); // null, 'gestor' ou 'operador'

  if (!perfilAtivo) {
    return <Login onLogin={(perfil) => setPerfilAtivo(perfil)} />;
  }

  return (
    <div>
      {/* Barra de Topo com Indicador de Perfil e Botão Sair */}
      <header style={{ backgroundColor: '#1e293b', color: 'white', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 'bold', fontSize: '14px' }}>
          {perfilAtivo === 'gestor' ? '👑 Modo Gestor (Dono)' : '📷 Modo Operador (Galpão)'}
        </span>
        <button
          onClick={() => setPerfilAtivo(null)}
          style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
        >
          Sair / Trocar PIN
        </button>
      </header>

      {/* Renderização Condicional com base no Perfil */}
      <main>
        {perfilAtivo === 'gestor' ? <Dashboard /> : <CheckOut />}
      </main>
    </div>
  );
}

export default App;