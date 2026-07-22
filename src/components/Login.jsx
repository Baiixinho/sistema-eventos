import { useState } from 'react';

export function Login({ onLogin }) {
  const [pin, setPin] = useState('');
  const [erro, setErro] = useState('');

  // 🔑 DEFINA AQUI OS SEUS PINS DE ACESSO
  const PIN_GESTOR = '9999';   // Acesso ao Painel do Dono
  const PIN_OPERADOR = '1111'; // Acesso Apenas ao Bipador do Galpão

  const handleSubmit = (e) => {
    e.preventDefault();
    setErro('');

    if (pin === PIN_GESTOR) {
      onLogin('gestor');
    } else if (pin === PIN_OPERADOR) {
      onLogin('operador');
    } else {
      setErro('PIN incorreto. Tente novamente.');
      setPin('');
    }
  };

  return (
    <div style={{ padding: '40px 20px', maxWidth: '400px', margin: '60px auto', fontFamily: 'sans-serif', textAlign: 'center', border: '1px solid #e5e7eb', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
      <h2>Sistema de Eventos</h2>
      <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>Digite o PIN para acessar o perfil</p>

      <form onSubmit={handleSubmit}>
        <input
          type="password"
          maxLength={6}
          placeholder="Digite o PIN"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          style={{
            width: '100%',
            padding: '14px',
            fontSize: '24px',
            textAlign: 'center',
            letterSpacing: '8px',
            borderRadius: '8px',
            border: '2px solid #3b82f6',
            marginBottom: '16px',
            boxSizing: 'border-box'
          }}
          autoFocus
        />

        <button
          type="submit"
          style={{
            width: '100%',
            padding: '14px',
            fontSize: '16px',
            fontWeight: 'bold',
            color: 'white',
            backgroundColor: '#2563eb',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Entrar no Sistema
        </button>
      </form>

      {erro && (
        <div style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '10px', marginTop: '16px', borderRadius: '6px', fontSize: '14px' }}>
          {erro}
        </div>
      )}
    </div>
  );
}