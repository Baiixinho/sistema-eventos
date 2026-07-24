import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from './Logo';

export function Login() {
  const [pin, setPin] = useState('');
  const [erro, setErro] = useState('');
  const navigate = useNavigate();

  // Configuração dos PINs de Acesso
  const PIN_OPERADOR = '1234';
  const PIN_GESTOR = '9999';

  const handleLogin = (e) => {
    e.preventDefault();

    if (pin === PIN_OPERADOR) {
      localStorage.setItem('autenticado', 'true');
      localStorage.setItem('perfil', 'operador');
      navigate('/checkout');
    } else if (pin === PIN_GESTOR) {
      localStorage.setItem('autenticado', 'true');
      localStorage.setItem('perfil', 'gestor');
      navigate('/dashboard');
    } else {
      setErro('PIN incorreto. Tente novamente.');
      setPin('');
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#000000', // 👈 Fundo preto
      padding: '20px',
      fontFamily: 'sans-serif'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        padding: '30px',
        borderRadius: '12px',
        boxShadow: '0 10px 25px -5px rgba(255, 255, 255, 0.1)',
        width: '100%',
        maxWidth: '360px'
      }}>
        <Logo style={{ marginBottom: '20px' }} />

        <h2 style={{ textAlign: 'center', color: '#0f172a', fontSize: '18px', marginBottom: '15px' }}>
          Acesso ao Sistema
        </h2>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#475569', marginBottom: '6px' }}>
              Digite o PIN de Acesso:
            </label>
            <input
              type="password"
              maxLength="6"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="****"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '20px',
                textAlign: 'center',
                letterSpacing: '8px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                boxSizing: 'border-box',
                outline: 'none'
              }}
              autoFocus
            />
          </div>

          {erro && (
            <div style={{ color: '#dc2626', fontSize: '14px', textAlign: 'center', marginBottom: '15px', fontWeight: 'bold' }}>
              {erro}
            </div>
          )}

          <button
            type="submit"
            style={{
              width: '100%',
              backgroundColor: '#0284c7',
              color: 'white',
              padding: '12px',
              fontSize: '16px',
              fontWeight: 'bold',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}