import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

// Componente de Logo Reutilizável
export function LogoPaulinho() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '6px' }}>
        <div style={{ width: '8px', height: '38px', borderRadius: '4px', background: 'linear-gradient(180deg, #001f54 0%, #00b4d8 100%)', position: 'relative' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', border: '2px solid #000', backgroundColor: '#fff', position: 'absolute', top: '14px', left: '-4px' }}></div>
        </div>
        <div style={{ width: '8px', height: '38px', borderRadius: '4px', background: 'linear-gradient(180deg, #001f54 0%, #00b4d8 100%)', position: 'relative' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', border: '2px solid #000', backgroundColor: '#fff', position: 'absolute', top: '6px', left: '-4px' }}></div>
        </div>
        <div style={{ width: '8px', height: '38px', borderRadius: '4px', background: 'linear-gradient(180deg, #001f54 0%, #00b4d8 100%)', position: 'relative' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', border: '2px solid #000', backgroundColor: '#fff', position: 'absolute', top: '18px', left: '-4px' }}></div>
        </div>
        <div style={{ width: '8px', height: '38px', borderRadius: '4px', background: 'linear-gradient(180deg, #001f54 0%, #00b4d8 100%)', position: 'relative' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', border: '2px solid #000', backgroundColor: '#fff', position: 'absolute', top: '8px', left: '-4px' }}></div>
        </div>
        <div style={{ width: '8px', height: '38px', borderRadius: '4px', background: 'linear-gradient(180deg, #001f54 0%, #00b4d8 100%)', position: 'relative' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', border: '2px solid #000', backgroundColor: '#fff', position: 'absolute', top: '22px', left: '-4px' }}></div>
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <div style={{ color: '#0f172a', fontWeight: '900', fontSize: '16px', letterSpacing: '2.5px', lineHeight: '1.1' }}>
          PAULINHO
        </div>
        <div style={{ color: '#0f172a', fontWeight: '900', fontSize: '14px', letterSpacing: '2px', lineHeight: '1.1', marginTop: '1px' }}>
          PRODUÇÕES
        </div>
        <div style={{ color: '#0284c7', fontSize: '7.5px', fontWeight: 'bold', letterSpacing: '1.5px', marginTop: '3px' }}>
          TECNOLOGIA E ESTRUTURA
        </div>
      </div>
    </div>
  );
}

export function Dashboard() {
  const [abaAtiva, setAbaAtiva] = useState('resumo'); // 'resumo', 'eventos', 'equipamentos'

  // Dados de resumo
  const [estatisticas, setEstatisticas] = useState({
    total: 0,
    disponiveis: 0,
    emUso: 0,
    eventosAtivos: 0,
  });

  // Listas de dados
  const [eventos, setEventos] = useState([]);
  const [equipamentos, setEquipamentos] = useState([]);

  // Form Eventos
  const [novoEvento, setNovoEvento] = useState({ nome: '', cliente: '' });

  // Form Equipamentos
  const [novoEquipamento, setNovoEquipamento] = useState({
    nome: '',
    codigo_barras: '',
    condicao: 'Novo',
  });

  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState('');

  // Carregar todos os dados iniciais
  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    setCarregando(true);

    // Busca equipamentos
    const { data: eqData } = await supabase.from('equipamentos').select('*');
    if (eqData) {
      setEquipamentos(eqData);
      const disp = eqData.filter((i) => i.status === 'Disponível').length;
      const uso = eqData.filter((i) => i.status === 'Em Uso').length;
      setEstatisticas((prev) => ({
        ...prev,
        total: eqData.length,
        disponiveis: disp,
        emUso: uso,
      }));
    }

    // Busca eventos
    const { data: evData } = await supabase
      .from('eventos')
      .select('*')
      .order('created_at', { ascending: false });
    if (evData) {
      setEventos(evData);
      const ativos = evData.filter((e) => e.status === 'ativo').length;
      setEstatisticas((prev) => ({ ...prev, eventosAtivos: ativos }));
    }

    setCarregando(false);
  }

  // Cadastrar Evento
  async function handleCriarEvento(e) {
    e.preventDefault();
    if (!novoEvento.nome.trim()) return;

    const { error } = await supabase.from('eventos').insert([
      {
        nome: novoEvento.nome,
        cliente: novoEvento.cliente,
        status: 'ativo',
      },
    ]);

    if (!error) {
      setMensagem('Evento cadastrado com sucesso!');
      setNovoEvento({ nome: '', cliente: '' });
      carregarDados();
    }
  }

  // Cadastrar Equipamento
  async function handleCriarEquipamento(e) {
    e.preventDefault();
    if (!novoEquipamento.nome.trim() || !novoEquipamento.codigo_barras.trim())
      return;

    const { error } = await supabase.from('equipamentos').insert([
      {
        nome: novoEquipamento.nome,
        codigo_barras: novoEquipamento.codigo_barras,
        condicao: novoEquipamento.condicao,
        status: 'Disponível',
      },
    ]);

    if (!error) {
      setMensagem('Equipamento cadastrado com sucesso!');
      setNovoEquipamento({ nome: '', codigo_barras: '', condicao: 'Novo' });
      carregarDados();
    } else {
      setMensagem('Erro: Código de barras pode já existir.');
    }
  }

  // Alternar Status do Evento
  async function toggleStatusEvento(id, statusAtual) {
    const novoStatus = statusAtual === 'ativo' ? 'finalizado' : 'ativo';
    await supabase.from('eventos').update({ status: novoStatus }).eq('id', id);
    carregarDados();
  }

  return (
    <div
      style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '24px 16px',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        color: '#1e293b',
      }}
    >
      {/* Cabeçalho com Logo em CSS e Títulos */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justify: 'space-between',
          borderBottom: '1px solid #e2e8f0',
          paddingBottom: '20px',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {/* Logo Paulinho Produções embutida */}
          <LogoPaulinho />
          
          <div style={{ borderLeft: '2px solid #e2e8f0', paddingLeft: '16px' }}>
            <h1
              style={{
                fontSize: '22px',
                fontWeight: '700',
                margin: 0,
                color: '#0f172a',
                lineHeight: '1.2'
              }}
            >
              Painel do Gestor
            </h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
              Gestão de estoque e eventos
            </p>
          </div>
        </div>

        {carregando && (
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
            Atualizando...
          </span>
        )}
      </header>

      {/* Navegação por Abas */}
      <nav
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px',
          backgroundColor: '#f1f5f9',
          padding: '4px',
          borderRadius: '8px',
        }}
      >
        {[
          { id: 'resumo', label: '📊 Visão Geral' },
          { id: 'eventos', label: '📅 Eventos' },
          { id: 'equipamentos', label: '📦 Equipamentos' },
        ].map((aba) => (
          <button
            key={aba.id}
            onClick={() => setAbaAtiva(aba.id)}
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: abaAtiva === aba.id ? '#ffffff' : 'transparent',
              color: abaAtiva === aba.id ? '#0284c7' : '#64748b',
              fontWeight: abaAtiva === aba.id ? '600' : '500',
              fontSize: '14px',
              boxShadow:
                abaAtiva === aba.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            {aba.label}
          </button>
        ))}
      </nav>

      {/* Alerta de Mensagem */}
      {mensagem && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            color: '#166534',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '14px',
            display: 'flex',
            justify: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{mensagem}</span>
          <button
            onClick={() => setMensagem('')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#166534',
              fontWeight: 'bold',
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ABA 1: RESUMO */}
      {abaAtiva === 'resumo' && (
        <div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
              gap: '16px',
            }}
          >
            <div
              style={{
                padding: '20px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
              }}
            >
              <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>
                Total Equipamentos
              </span>
              <p
                style={{
                  fontSize: '30px',
                  fontWeight: '700',
                  margin: '8px 0 0 0',
                  color: '#0f172a',
                }}
              >
                {estatisticas.total}
              </p>
            </div>

            <div
              style={{
                padding: '20px',
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '10px',
              }}
            >
              <span style={{ fontSize: '13px', color: '#166534', fontWeight: '500' }}>
                Disponíveis
              </span>
              <p
                style={{
                  fontSize: '30px',
                  fontWeight: '700',
                  margin: '8px 0 0 0',
                  color: '#15803d',
                }}
              >
                {estatisticas.disponiveis}
              </p>
            </div>

            <div
              style={{
                padding: '20px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '10px',
              }}
            >
              <span style={{ fontSize: '13px', color: '#991b1b', fontWeight: '500' }}>
                Em Uso (Fora)
              </span>
              <p
                style={{
                  fontSize: '30px',
                  fontWeight: '700',
                  margin: '8px 0 0 0',
                  color: '#b91c1c',
                }}
              >
                {estatisticas.emUso}
              </p>
            </div>

            <div
              style={{
                padding: '20px',
                backgroundColor: '#f0f9ff',
                border: '1px solid #bae6fd',
                borderRadius: '10px',
              }}
            >
              <span style={{ fontSize: '13px', color: '#0369a1', fontWeight: '500' }}>
                Eventos Ativos
              </span>
              <p
                style={{
                  fontSize: '30px',
                  fontWeight: '700',
                  margin: '8px 0 0 0',
                  color: '#0284c7',
                }}
              >
                {estatisticas.eventosAtivos}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ABA 2: EVENTOS */}
      {abaAtiva === 'eventos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div
            style={{
              padding: '20px',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
            }}
          >
            <h3
              style={{
                margin: '0 0 16px 0',
                fontSize: '16px',
                fontWeight: '600',
                color: '#0f172a',
              }}
            >
              Cadastrar Novo Evento
            </h3>
            <form
              onSubmit={handleCriarEvento}
              style={{
                display: 'flex',
                gap: '12px',
                flexWrap: 'wrap',
              }}
            >
              <input
                type="text"
                placeholder="Nome do Evento (ex: Show Sertanejo)"
                value={novoEvento.nome}
                onChange={(e) =>
                  setNovoEvento({ ...novoEvento, nome: e.target.value })
                }
                style={{
                  flex: '2 1 200px',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px',
                }}
                required
              />
              <input
                type="text"
                placeholder="Cliente / Contratante"
                value={novoEvento.cliente}
                onChange={(e) =>
                  setNovoEvento({ ...novoEvento, cliente: e.target.value })
                }
                style={{
                  flex: '1 1 150px',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px',
                }}
              />
              <button
                type="submit"
                style={{
                  backgroundColor: '#0284c7',
                  color: 'white',
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                Cadastrar
              </button>
            </form>
          </div>

          <div>
            <h3
              style={{
                margin: '0 0 12px 0',
                fontSize: '16px',
                fontWeight: '600',
                color: '#0f172a',
              }}
            >
              Eventos Cadastrados
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {eventos.map((ev) => (
                <li
                  key={ev.id}
                  style={{
                    padding: '14px 16px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    marginBottom: '8px',
                    display: 'flex',
                    justify: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '15px', color: '#0f172a' }}>
                      {ev.nome}
                    </strong>
                    {ev.cliente && (
                      <span
                        style={{
                          color: '#64748b',
                          marginLeft: '8px',
                          fontSize: '14px',
                        }}
                      >
                        • {ev.cliente}
                      </span>
                    )}
                    <div style={{ marginTop: '4px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: '700',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          backgroundColor:
                            ev.status === 'ativo' ? '#f0fdf4' : '#f1f5f9',
                          color: ev.status === 'ativo' ? '#166534' : '#64748b',
                          border:
                            ev.status === 'ativo'
                              ? '1px solid #bbf7d0'
                              : '1px solid #e2e8f0',
                        }}
                      >
                        {ev.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleStatusEvento(ev.id, ev.status)}
                    style={{
                      padding: '8px 14px',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '600',
                      backgroundColor:
                        ev.status === 'ativo' ? '#fef2f2' : '#f0f9ff',
                      color: ev.status === 'ativo' ? '#dc2626' : '#0284c7',
                      border:
                        ev.status === 'ativo'
                          ? '1px solid #fecaca'
                          : '1px solid #bae6fd',
                    }}
                  >
                    {ev.status === 'ativo' ? 'Encerrar Evento' : 'Reativar Evento'}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* ABA 3: EQUIPAMENTOS */}
      {abaAtiva === 'equipamentos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div
            style={{
              padding: '20px',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
            }}
          >
            <h3
              style={{
                margin: '0 0 16px 0',
                fontSize: '16px',
                fontWeight: '600',
                color: '#0f172a',
              }}
            >
              Cadastrar Novo Equipamento
            </h3>
            <form
              onSubmit={handleCriarEquipamento}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
              }}
            >
              <input
                type="text"
                placeholder="Nome do Equipamento (ex: Caixa RCF)"
                value={novoEquipamento.nome}
                onChange={(e) =>
                  setNovoEquipamento({
                    ...novoEquipamento,
                    nome: e.target.value,
                  })
                }
                style={{
                  padding: '10px 14px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px',
                }}
                required
              />
              <input
                type="text"
                placeholder="Código de Barras"
                value={novoEquipamento.codigo_barras}
                onChange={(e) =>
                  setNovoEquipamento({
                    ...novoEquipamento,
                    codigo_barras: e.target.value,
                  })
                }
                style={{
                  padding: '10px 14px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px',
                }}
                required
              />
              <button
                type="submit"
                style={{
                  gridColumn: 'span 2',
                  backgroundColor: '#0284c7',
                  color: 'white',
                  padding: '10px',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                Salvar Equipamento
              </button>
            </form>
          </div>

          <div>
            <h3
              style={{
                margin: '0 0 12px 0',
                fontSize: '16px',
                fontWeight: '600',
                color: '#0f172a',
              }}
            >
              Estoque Cadastrado ({equipamentos.length})
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {equipamentos.map((eq) => (
                <li
                  key={eq.id}
                  style={{
                    padding: '12px 16px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    marginBottom: '8px',
                    display: 'flex',
                    justify: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '14px', color: '#0f172a' }}>
                      {eq.nome}
                    </strong>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      Cód: {eq.codigo_barras}
                    </div>
                  </div>
                  <div>
                    <span
                      style={{
                        fontSize: '12px',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        backgroundColor:
                          eq.status === 'Disponível' ? '#f0fdf4' : '#fef2f2',
                        color:
                          eq.status === 'Disponível' ? '#166534' : '#991b1b',
                        border:
                          eq.status === 'Disponível'
                            ? '1px solid #bbf7d0'
                            : '1px solid #fecaca',
                        fontWeight: '600',
                      }}
                    >
                      {eq.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}