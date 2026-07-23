import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Logo em CSS da Paulinho Produções
function LogoPaulinho() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '8px' }}>
        <div style={{ width: '10px', height: '45px', borderRadius: '5px', background: 'linear-gradient(180deg, #001f54 0%, #00b4d8 100%)', position: 'relative' }}>
          <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid #000', backgroundColor: '#fff', position: 'absolute', top: '18px', left: '-4px' }}></div>
        </div>
        <div style={{ width: '10px', height: '45px', borderRadius: '5px', background: 'linear-gradient(180deg, #001f54 0%, #00b4d8 100%)', position: 'relative' }}>
          <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid #000', backgroundColor: '#fff', position: 'absolute', top: '8px', left: '-4px' }}></div>
        </div>
        <div style={{ width: '10px', height: '45px', borderRadius: '5px', background: 'linear-gradient(180deg, #001f54 0%, #00b4d8 100%)', position: 'relative' }}>
          <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid #000', backgroundColor: '#fff', position: 'absolute', top: '22px', left: '-4px' }}></div>
        </div>
        <div style={{ width: '10px', height: '45px', borderRadius: '5px', background: 'linear-gradient(180deg, #001f54 0%, #00b4d8 100%)', position: 'relative' }}>
          <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid #000', backgroundColor: '#fff', position: 'absolute', top: '10px', left: '-4px' }}></div>
        </div>
        <div style={{ width: '10px', height: '45px', borderRadius: '5px', background: 'linear-gradient(180deg, #001f54 0%, #00b4d8 100%)', position: 'relative' }}>
          <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid #000', backgroundColor: '#fff', position: 'absolute', top: '26px', left: '-4px' }}></div>
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <div style={{ color: '#0f172a', fontWeight: '900', fontSize: '20px', letterSpacing: '3px', lineHeight: '1.1' }}>
          PAULINHO
        </div>
        <div style={{ color: '#0f172a', fontWeight: '900', fontSize: '18px', letterSpacing: '2px', lineHeight: '1.1', marginTop: '2px' }}>
          PRODUÇÕES
        </div>
        <div style={{ color: '#0284c7', fontSize: '9px', fontWeight: 'bold', letterSpacing: '2px', marginTop: '4px' }}>
          TECNOLOGIA E ESTRUTURA
        </div>
      </div>
    </div>
  );
}

export function Login() {
  const [pin, setPin] = useState('');
  const [erro, setErro] = useState('');
  const navigate = useNavigate();

  // Altere o PIN padrão abaixo se desejar
  const PIN_CORRETO = '1234'; 

  const handleLogin = (e) => {
    e.preventDefault();
    if (pin === PIN_CORRETO) {
      localStorage.setItem('autenticado', 'true');
      navigate('/checkout');
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
      backgroundColor: '#f8fafc',
      padding: '20px',
      fontFamily: 'sans-serif'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '12px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        width: '100%',
        maxWidth: '360px'
      }}>
        <LogoPaulinho />

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