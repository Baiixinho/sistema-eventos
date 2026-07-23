import { useNavigate } from 'react-router-dom';

export function Dashboard() {
  const navigate = useNavigate();

  const handleSair = () => {
    localStorage.removeItem('autenticado');
    localStorage.removeItem('perfil');
    navigate('/');
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#000000',
      color: '#ffffff',
      padding: '20px',
      fontFamily: 'sans-serif'
    }}>
      {/* Cabeçalho */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #333',
        paddingBottom: '15px',
        marginBottom: '20px'
      }}>
        <h2>👑 Painel do Gestor</h2>
        <button
          onClick={handleSair}
          style={{
            backgroundColor: '#dc2626',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Sair
        </button>
      </div>

      {/* Cartões de Métricas Básicas */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '15px',
        marginBottom: '30px'
      }}>
        <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px' }}>
          <span style={{ fontSize: '14px', color: '#94a3b8' }}>Total de Eventos</span>
          <h1 style={{ margin: '5px 0 0 0', color: '#0284c7' }}>0</h1>
        </div>
        <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px' }}>
          <span style={{ fontSize: '14px', color: '#94a3b8' }}>Ingressos Validados</span>
          <h1 style={{ margin: '5px 0 0 0', color: '#16a34a' }}>0</h1>
        </div>
        <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px' }}>
          <span style={{ fontSize: '14px', color: '#94a3b8' }}>Operadores Ativos</span>
          <h1 style={{ margin: '5px 0 0 0', color: '#eab308' }}>1</h1>
        </div>
      </div>

      {/* Área de conteúdo/relatórios */}
      <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px' }}>
        <h3 style={{ marginTop: 0 }}>Relatório de Atividades</h3>
        <p style={{ color: '#94a3b8' }}>Nenhum registro de evento encontrado até o momento.</p>
      </div>
    </div>
  );
}