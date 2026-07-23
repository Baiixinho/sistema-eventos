import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setCarregando(true);
    setErro('');

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    if (error) {
      setErro('E-mail ou senha incorretos.');
      setCarregando(false);
    } else {
      navigate('/checkout');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#0a0a0a', // Fundo preto puro
      padding: '20px',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    }}>
      
      {/* CARD DE LOGIN */}
      <div style={{
        backgroundColor: '#161616',
        width: '100%',
        maxWidth: '380px',
        padding: '30px 25px',
        borderRadius: '16px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.8)',
        border: '1px solid #262626'
      }}>
        
        <h2 style={{ textAlign: 'center', color: '#ffffff', margin: '0 0 6px 0', fontSize: '22px' }}>
          Acesso ao Sistema
        </h2>
        <p style={{ textAlign: 'center', color: '#888', fontSize: '13px', marginTop: 0, marginBottom: '25px' }}>
          Gestão de Equipamentos e Eventos
        </p>

        {erro && (
          <div style={{
            backgroundColor: '#3f1212',
            color: '#f87171',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '13px',
            marginBottom: '20px',
            fontWeight: 'bold',
            textAlign: 'center',
            border: '1px solid #7f1d1d'
          }}>
            ⚠️ {erro}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#ccc', marginBottom: '6px' }}>
              E-mail
            </label>
            <input
              type="email"
              required
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                fontSize: '15px',
                borderRadius: '8px',
                border: '1px solid #333',
                backgroundColor: '#0d0d0d',
                color: '#fff',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '22px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#ccc', marginBottom: '6px' }}>
              Senha
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                fontSize: '15px',
                borderRadius: '8px',
                border: '1px solid #333',
                backgroundColor: '#0d0d0d',
                color: '#fff',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={carregando}
            style={{
              width: '100%',
              padding: '14px',
              fontSize: '16px',
              fontWeight: 'bold',
              color: 'white',
              background: 'linear-gradient(90deg, #0284c7 0%, #2563eb 100%)',
              border: 'none',
              borderRadius: '8px',
              cursor: carregando ? 'wait' : 'pointer',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}
          >
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>

      {/* LOGO EM CÓDIGO (ABAIXO DAS INFORMAÇÕES DE LOGIN) */}
      <div style={{ marginTop: '35px', textAlign: 'center' }}>
        
        {/* Equalizador Vértical (5 faders da logo) */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
          
          {/* Barra 1 */}
          <div style={{ width: '12px', height: '55px', borderRadius: '6px', background: 'linear-gradient(180deg, #001f54 0%, #00b4d8 100%)', position: 'relative' }}>
            <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid #000', backgroundColor: '#fff', position: 'absolute', top: '22px', left: '-4px' }}></div>
          </div>

          {/* Barra 2 */}
          <div style={{ width: '12px', height: '55px', borderRadius: '6px', background: 'linear-gradient(180deg, #001f54 0%, #00b4d8 100%)', position: 'relative' }}>
            <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid #000', backgroundColor: '#fff', position: 'absolute', top: '10px', left: '-4px' }}></div>
          </div>

          {/* Barra 3 */}
          <div style={{ width: '12px', height: '55px', borderRadius: '6px', background: 'linear-gradient(180deg, #001f54 0%, #00b4d8 100%)', position: 'relative' }}>
            <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid #000', backgroundColor: '#fff', position: 'absolute', top: '28px', left: '-4px' }}></div>
          </div>

          {/* Barra 4 */}
          <div style={{ width: '12px', height: '55px', borderRadius: '6px', background: 'linear-gradient(180deg, #001f54 0%, #00b4d8 100%)', position: 'relative' }}>
            <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid #000', backgroundColor: '#fff', position: 'absolute', top: '12px', left: '-4px' }}></div>
          </div>

          {/* Barra 5 */}
          <div style={{ width: '12px', height: '55px', borderRadius: '6px', background: 'linear-gradient(180deg, #001f54 0%, #00b4d8 100%)', position: 'relative' }}>
            <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid #000', backgroundColor: '#fff', position: 'absolute', top: '34px', left: '-4px' }}></div>
          </div>

        </div>

        {/* Textos com a fonte estilizada da Paulinho Produções */}
        <div style={{ color: '#ffffff', fontWeight: '900', fontSize: '20px', letterSpacing: '3px', lineHeight: '1.1' }}>
          PAULINHO
        </div>
        <div style={{ color: '#ffffff', fontWeight: '900', fontSize: '18px', letterSpacing: '2px', lineHeight: '1.1', marginTop: '2px' }}>
          PRODUÇÕES
        </div>
        <div style={{ color: '#38bdf8', fontSize: '10px', fontWeight: 'bold', letterSpacing: '2px', marginTop: '6px' }}>
          TECNOLOGIA E ESTRUTURA
        </div>
      </div>

    </div>
  );
}