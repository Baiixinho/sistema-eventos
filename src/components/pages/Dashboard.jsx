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
  const [abaAtiva, setAbaAtiva] = useState('resumo');

  // Dados de resumo
  const [estatisticas, setEstatisticas] = useState({
    total: 0,
    disponiveis: 0,
    emUso: 0,
    eventosAtivos: 0,
    eventosProgramados: 0,
  });

  // Listas de dados
  const [eventos, setEventos] = useState([]);
  const [equipamentos, setEquipamentos] = useState([]);

  // Form Eventos com data_inicio
  const [novoEvento, setNovoEvento] = useState({
    nome: '',
    cliente: '',
    data_inicio: '',
  });

  // Form Equipamentos (Atualizado com Fluxo "Scan First")
  const [passoScan, setPassoScan] = useState(1); // 1: Ler código, 2: Escolher Tipo, 3: Preencher Dados
  const [caseEmModoAcondicionamento, setCaseEmModoAcondicionamento] = useState(null); // Armazena o Case ativo
  const [novoEquipamento, setNovoEquipamento] = useState({
    nome: '',
    codigo_barras: '',
    patrimonio: '',
    tipo: 'Equipamento', // 'Equipamento' ou 'Case'
    case_id: '',
    condicao: 'Novo',
  });

  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState('');

  useEffect(() => {
    carregarDados();
  }, []);

  // Helper para determinar o status dinâmico do evento (Ativo vs Programado)
  function obterStatusCalculado(evento) {
    if (evento.status === 'finalizado') return 'finalizado';

    if (!evento.data_inicio) return 'ativo';

    const hoje = new Date().toISOString().split('T')[0];
    return evento.data_inicio > hoje ? 'programado' : 'ativo';
  }

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
      .order('data_inicio', { ascending: true });

    if (evData) {
      setEventos(evData);

      const hoje = new Date().toISOString().split('T')[0];

      const ativos = evData.filter(
        (e) => e.status !== 'finalizado' && e.data_inicio <= hoje
      ).length;

      const programados = evData.filter(
        (e) => e.status !== 'finalizado' && e.data_inicio > hoje
      ).length;

      setEstatisticas((prev) => ({
        ...prev,
        eventosAtivos: ativos,
        eventosProgramados: programados,
      }));
    }

    setCarregando(false);
  }

  // Cadastrar Evento
  async function handleCriarEvento(e) {
    e.preventDefault();
    if (!novoEvento.nome.trim() || !novoEvento.data_inicio) return;

    const { error } = await supabase.from('eventos').insert([
      {
        nome: novoEvento.nome,
        cliente: novoEvento.cliente,
        data_inicio: novoEvento.data_inicio,
        status: 'ativo',
      },
    ]);

    if (!error) {
      setMensagem('Evento cadastrado com sucesso!');
      setNovoEvento({ nome: '', cliente: '', data_inicio: '' });
      carregarDados();
    } else {
      setMensagem('Erro ao salvar o evento. Verifique a tabela no Supabase.');
    }
  }

  // Passo 1: Processar Leitura do Código de Barras / QR Code
  function handleLerCodigo(e) {
    e.preventDefault();
    if (!novoEquipamento.codigo_barras.trim()) return;

    // Verifica se o código já está cadastrado no sistema
    const itemExistente = equipamentos.find(
      (eq) => eq.codigo_barras === novoEquipamento.codigo_barras
    );

    if (itemExistente) {
      // Se for um Case existente, abre o modo de acondicionamento para adicionar itens nele
      if (itemExistente.tipo === 'Case') {
        setCaseEmModoAcondicionamento(itemExistente);
        setNovoEquipamento({
          nome: '',
          codigo_barras: '',
          patrimonio: '',
          tipo: 'Equipamento',
          case_id: itemExistente.id,
          condicao: 'Novo',
        });
        setPassoScan(1);
        setMensagem(`Case "${itemExistente.nome}" selecionado! Agora escaneie os equipamentos para colocá-lo dentro.`);
      } else {
        setMensagem(`Aviso: O código "${novoEquipamento.codigo_barras}" já pertence ao item: ${itemExistente.nome}`);
      }
    } else {
      // Código novo -> Avança para seleção do Tipo
      setPassoScan(2);
    }
  }

  // Passo 2: Definir se é Case ou Equipamento
  function handleSelecionarTipo(tipo) {
    setNovoEquipamento((prev) => ({
      ...prev,
      tipo,
      case_id: tipo === 'Equipamento' && caseEmModoAcondicionamento ? caseEmModoAcondicionamento.id : prev.case_id,
    }));
    setPassoScan(3);
  }

  // Passo 3: Cadastrar Equipamento/Case no Banco
  async function handleCriarEquipamento(e) {
    e.preventDefault();
    if (!novoEquipamento.nome.trim() || !novoEquipamento.codigo_barras.trim()) return;

    // Validação do Patrimônio de 5 dígitos
    if (novoEquipamento.patrimonio && !/^\d{5}$/.test(novoEquipamento.patrimonio)) {
      setMensagem('Erro: O patrimônio deve conter exatamente 5 dígitos numéricos.');
      return;
    }

    const payload = {
      nome: novoEquipamento.nome,
      codigo_barras: novoEquipamento.codigo_barras,
      patrimonio: novoEquipamento.patrimonio || null,
      tipo: novoEquipamento.tipo,
      case_id: novoEquipamento.tipo === 'Equipamento' && novoEquipamento.case_id ? novoEquipamento.case_id : null,
      condicao: novoEquipamento.condicao,
      status: 'Disponível',
    };

    const { data, error } = await supabase.from('equipamentos').insert([payload]).select();

    if (!error) {
      const itemSalvo = data ? data[0] : null;

      // Se acabamos de cadastrar um NOVO CASE, entra direto no modo de acondicionamento dele!
      if (novoEquipamento.tipo === 'Case' && itemSalvo) {
        setCaseEmModoAcondicionamento(itemSalvo);
        setMensagem(`Case "${itemSalvo.nome}" cadastrado! Agora escaneie os equipamentos para este Case.`);
      } else {
        setMensagem('Item cadastrado com sucesso!');
      }

      // Reinicia os dados para o próximo scan
      setNovoEquipamento({
        nome: '',
        codigo_barras: '',
        patrimonio: '',
        tipo: 'Equipamento',
        case_id: caseEmModoAcondicionamento ? caseEmModoAcondicionamento.id : '',
        condicao: 'Novo',
      });
      setPassoScan(1);
      carregarDados();
    } else {
      setMensagem('Erro: Código de barras ou patrimônio pode já existir.');
    }
  }

  // Alternar Status de Finalização
  async function toggleStatusEvento(id, statusAtual) {
    const novoStatus = statusAtual === 'finalizado' ? 'ativo' : 'finalizado';
    await supabase.from('eventos').update({ status: novoStatus }).eq('id', id);
    carregarDados();
  }

  // Filtra lista de Cases para seleção de vínculo
  const casesDisponiveis = equipamentos.filter((eq) => eq.tipo === 'Case');

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
      {/* Cabeçalho com Logo */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #e2e8f0',
          paddingBottom: '20px',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <LogoPaulinho />
          <div style={{ borderLeft: '2px solid #e2e8f0', paddingLeft: '16px' }}>
            <h1
              style={{
                fontSize: '22px',
                fontWeight: '700',
                margin: 0,
                color: '#0f172a',
                lineHeight: '1.2',
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
            justifyContent: 'space-between',
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
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: '16px',
          }}
        >
          <div style={{ padding: '20px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Total Equipamentos</span>
            <p style={{ fontSize: '30px', fontWeight: '700', margin: '8px 0 0 0', color: '#0f172a' }}>{estatisticas.total}</p>
          </div>

          <div style={{ padding: '20px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px' }}>
            <span style={{ fontSize: '13px', color: '#166534', fontWeight: '500' }}>Disponíveis</span>
            <p style={{ fontSize: '30px', fontWeight: '700', margin: '8px 0 0 0', color: '#15803d' }}>{estatisticas.disponiveis}</p>
          </div>

          <div style={{ padding: '20px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px' }}>
            <span style={{ fontSize: '13px', color: '#991b1b', fontWeight: '500' }}>Em Uso (Fora)</span>
            <p style={{ fontSize: '30px', fontWeight: '700', margin: '8px 0 0 0', color: '#b91c1c' }}>{estatisticas.emUso}</p>
          </div>

          <div style={{ padding: '20px', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '10px' }}>
            <span style={{ fontSize: '13px', color: '#0369a1', fontWeight: '500' }}>Eventos Ativos</span>
            <p style={{ fontSize: '30px', fontWeight: '700', margin: '8px 0 0 0', color: '#0284c7' }}>{estatisticas.eventosAtivos}</p>
          </div>

          <div style={{ padding: '20px', backgroundColor: '#fffbebf', border: '1px solid #fef08a', borderRadius: '10px' }}>
            <span style={{ fontSize: '13px', color: '#854d0e', fontWeight: '500' }}>Programados</span>
            <p style={{ fontSize: '30px', fontWeight: '700', margin: '8px 0 0 0', color: '#ca8a04' }}>{estatisticas.eventosProgramados}</p>
          </div>
        </div>
      )}

      {/* ABA 2: EVENTOS */}
      {abaAtiva === 'eventos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Form de Cadastro */}
          <div
            style={{
              padding: '20px',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
            }}
          >
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#0f172a' }}>
              Cadastrar Novo Evento
            </h3>
            <form onSubmit={handleCriarEvento} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Nome do Evento (ex: Show Sertanejo)"
                value={novoEvento.nome}
                onChange={(e) => setNovoEvento({ ...novoEvento, nome: e.target.value })}
                style={{ flex: '2 1 200px', padding: '10px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                required
              />
              <input
                type="text"
                placeholder="Cliente / Contratante"
                value={novoEvento.cliente}
                onChange={(e) => setNovoEvento({ ...novoEvento, cliente: e.target.value })}
                style={{ flex: '1 1 150px', padding: '10px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
              />
              <input
                type="date"
                value={novoEvento.data_inicio}
                onChange={(e) => setNovoEvento({ ...novoEvento, data_inicio: e.target.value })}
                style={{ flex: '1 1 140px', padding: '10px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                required
              />
              <button
                type="submit"
                style={{ backgroundColor: '#0284c7', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}
              >
                Cadastrar
              </button>
            </form>
          </div>

          {/* Lista de Eventos */}
          <div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: '#0f172a' }}>
              Eventos Cadastrados
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {eventos.map((ev) => {
                const statusCalculado = obterStatusCalculado(ev);

                // Configuração das tags visuais por status
                let tagBg = '#f0fdf4';
                let tagColor = '#166534';
                let tagBorder = '#bbf7d0';
                let label = 'ATIVO';

                if (statusCalculado === 'programado') {
                  tagBg = '#fefce8';
                  tagColor = '#854d0e';
                  tagBorder = '#fef08a';
                  label = 'PROGRAMADO';
                } else if (statusCalculado === 'finalizado') {
                  tagBg = '#f1f5f9';
                  tagColor = '#64748b';
                  tagBorder = '#e2e8f0';
                  label = 'FINALIZADO';
                }

                return (
                  <li
                    key={ev.id}
                    style={{
                      padding: '14px 16px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      marginBottom: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '15px', color: '#0f172a' }}>{ev.nome}</strong>
                      {ev.cliente && (
                        <span style={{ color: '#64748b', marginLeft: '8px', fontSize: '14px' }}>
                          • {ev.cliente}
                        </span>
                      )}
                      <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: '700',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            backgroundColor: tagBg,
                            color: tagColor,
                            border: `1px solid ${tagBorder}`,
                          }}
                        >
                          {label}
                        </span>
                        {ev.data_inicio && (
                          <span style={{ fontSize: '12px', color: '#64748b' }}>
                            Data: {new Date(ev.data_inicio + 'T00:00:00').toLocaleDateString('pt-BR')}
                          </span>
                        )}
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
                        backgroundColor: ev.status === 'finalizado' ? '#f0f9ff' : '#fef2f2',
                        color: ev.status === 'finalizado' ? '#0284c7' : '#dc2626',
                        border: ev.status === 'finalizado' ? '1px solid #bae6fd' : '1px solid #fecaca',
                      }}
                    >
                      {ev.status === 'finalizado' ? 'Reativar Evento' : 'Encerrar Evento'}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      {/* ABA 3: EQUIPAMENTOS (FLUXO "SCAN FIRST" INTERATIVO) */}
      {abaAtiva === 'equipamentos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Banner de Modo de Acondicionamento (Case Ativo) */}
          {caseEmModoAcondicionamento && (
            <div style={{ padding: '14px 18px', backgroundColor: '#e0f2fe', border: '1px solid #7dd3fc', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '12px', color: '#0369a1', fontWeight: 'bold', textTransform: 'uppercase' }}>🧳 Modo de Acondicionamento Ativo</span>
                <h4 style={{ margin: '2px 0 0 0', color: '#0c4a6e', fontSize: '15px' }}>
                  Acondicionando no Case: <strong>{caseEmModoAcondicionamento.nome}</strong> {caseEmModoAcondicionamento.patrimonio ? `[PAT: #${caseEmModoAcondicionamento.patrimonio}]` : ''}
                </h4>
              </div>
              <button
                onClick={() => {
                  setCaseEmModoAcondicionamento(null);
                  setNovoEquipamento((prev) => ({ ...prev, case_id: '' }));
                }}
                style={{ backgroundColor: '#0284c7', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
              >
                Concluir Case
              </button>
            </div>
          )}

          {/* Painel do Fluxo de Cadastro */}
          <div style={{ padding: '20px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
            
            {/* PASSO 1: LEITURA DO CÓDIGO */}
            {passoScan === 1 && (
              <div>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: '#0f172a' }}>
                  📷 Passo 1: Escanear / Digitar Código
                </h3>
                <form onSubmit={handleLerCodigo} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    placeholder="Escaneie o código de barras ou QR Code..."
                    value={novoEquipamento.codigo_barras}
                    onChange={(e) => setNovoEquipamento({ ...novoEquipamento, codigo_barras: e.target.value })}
                    style={{ flex: 1, padding: '12px 14px', borderRadius: '6px', border: '2px solid #0284c7', fontSize: '15px', fontWeight: '500' }}
                    autoFocus
                    required
                  />
                  <button
                    type="submit"
                    style={{ backgroundColor: '#0284c7', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}
                  >
                    Avançar ➔
                  </button>
                </form>
              </div>
            )}

            {/* PASSO 2: SELEÇÃO DE TIPO (CASE OU EQUIPAMENTO) */}
            {passoScan === 2 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#0f172a' }}>
                    🟢 Código Lido: <span style={{ color: '#0284c7' }}>#{novoEquipamento.codigo_barras}</span>
                  </h3>
                  <button onClick={() => setPassoScan(1)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '13px' }}>
                    ← Voltar
                  </button>
                </div>
                <p style={{ fontSize: '14px', color: '#475569', marginBottom: '16px' }}>
                  O que é este item que você acabou de escanear?
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <button
                    type="button"
                    onClick={() => handleSelecionarTipo('Case')}
                    style={{ padding: '20px', borderRadius: '8px', border: '2px solid #cbd5e1', backgroundColor: '#f8fafc', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}
                  >
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>🧳</div>
                    <strong style={{ display: 'block', fontSize: '16px', color: '#0f172a' }}>É um Case</strong>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>Maleta, Rack ou Caixa que guarda outros itens.</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelecionarTipo('Equipamento')}
                    style={{ padding: '20px', borderRadius: '8px', border: '2px solid #cbd5e1', backgroundColor: '#f8fafc', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}
                  >
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔌</div>
                    <strong style={{ display: 'block', fontSize: '16px', color: '#0f172a' }}>É um Equipamento</strong>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>Microfone, Caixa de som, Cabo, iluminação, etc.</span>
                  </button>
                </div>
              </div>
            )}

            {/* PASSO 3: FORMULÁRIO DE PREENCHIMENTO */}
            {passoScan === 3 && (
              <form onSubmit={handleCriarEquipamento} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#0f172a' }}>
                    📝 Cadastrar {novoEquipamento.tipo}: <span style={{ color: '#0284c7' }}>#{novoEquipamento.codigo_barras}</span>
                  </h3>
                  <button type="button" onClick={() => setPassoScan(2)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '13px' }}>
                    ← Alterar Tipo
                  </button>
                </div>

                <input
                  type="text"
                  placeholder={novoEquipamento.tipo === 'Case' ? "Nome do Case (ex: Case Mics Shure #01)" : "Nome do Equipamento (ex: Microfone Shure SM58)"}
                  value={novoEquipamento.nome}
                  onChange={(e) => setNovoEquipamento({ ...novoEquipamento, nome: e.target.value })}
                  style={{ padding: '10px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', gridColumn: 'span 2' }}
                  autoFocus
                  required
                />

                <input
                  type="text"
                  placeholder="Patrimônio (5 dígitos, ex: 12345)"
                  value={novoEquipamento.patrimonio}
                  maxLength={5}
                  onChange={(e) => setNovoEquipamento({ ...novoEquipamento, patrimonio: e.target.value.replace(/\D/g, '') })}
                  style={{ padding: '10px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                />

                {novoEquipamento.tipo === 'Equipamento' && (
                  <select
                    value={novoEquipamento.case_id}
                    onChange={(e) => setNovoEquipamento({ ...novoEquipamento, case_id: e.target.value })}
                    style={{ padding: '10px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  >
                    <option value="">Sem Case (Avulso)</option>
                    {casesDisponiveis.map((c) => (
                      <option key={c.id} value={c.id}>
                        Vincular ao Case: {c.nome} {c.patrimonio ? `[${c.patrimonio}]` : ''}
                      </option>
                    ))}
                  </select>
                )}

                <button
                  type="submit"
                  style={{ gridColumn: 'span 2', backgroundColor: '#0284c7', color: 'white', padding: '12px', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '14px', cursor: 'pointer', marginTop: '8px' }}
                >
                  Salvar {novoEquipamento.tipo} e Continuar
                </button>
              </form>
            )}
          </div>

          {/* LISTA DE ESTOQUE CADASTRADO */}
          <div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: '#0f172a' }}>
              Estoque Cadastrado ({equipamentos.length})
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {equipamentos.map((eq) => {
                const casePai = eq.case_id ? equipamentos.find((c) => c.id === eq.case_id) : null;

                return (
                  <li
                    key={eq.id}
                    style={{
                      padding: '12px 16px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      marginBottom: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ fontSize: '14px', color: '#0f172a' }}>{eq.nome}</strong>
                        {eq.tipo === 'Case' && (
                          <span style={{ fontSize: '10px', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                            CASE
                          </span>
                        )}
                        {eq.patrimonio && (
                          <span style={{ fontSize: '11px', backgroundColor: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                            PAT: #{eq.patrimonio}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                        Cód: {eq.codigo_barras}
                        {casePai && (
                          <span style={{ marginLeft: '8px', color: '#0284c7', fontWeight: '500' }}>
                            🧳 Acondicionado em: {casePai.nome}
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <span
                        style={{
                          fontSize: '12px',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          backgroundColor: eq.status === 'Disponível' ? '#f0fdf4' : '#fef2f2',
                          color: eq.status === 'Disponível' ? '#166534' : '#991b1b',
                          border: eq.status === 'Disponível' ? '1px solid #bbf7d0' : '1px solid #fecaca',
                          fontWeight: '600',
                        }}
                      >
                        {eq.status}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}