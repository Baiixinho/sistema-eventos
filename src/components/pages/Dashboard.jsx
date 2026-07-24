import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Logo } from '../Logo';
import { BarcodeReader } from '../BarcodeReader';

export function Dashboard() {
  const [abaAtiva, setAbaAtiva] = useState('resumo');

  // Resumo
  const [estatisticas, setEstatisticas] = useState({
    total: 0,
    disponiveis: 0,
    emUso: 0,
    eventosAtivos: 0,
    eventosProgramados: 0,
  });

  // Listas
  const [eventos, setEventos] = useState([]);
  const [equipamentos, setEquipamentos] = useState([]);

  // Form Eventos
  const [novoEvento, setNovoEvento] = useState({
    nome: '',
    cliente: '',
    data_inicio: '',
  });

  // Fluxo Scan First
  const [passoScan, setPassoScan] = useState(1); // 1: Ler Câmera, 2: Escolher Tipo/Preencher
  const [usarCamera, setUsarCamera] = useState(false);
  const [caseEmAcondicionamento, setCaseEmAcondicionamento] = useState(null);

  const [novoEquipamento, setNovoEquipamento] = useState({
    nome: '',
    codigo_barras: '',
    patrimonio: '',
    tipo: 'Equipamento',
    case_id: '',
    condicao: 'Novo',
  });

  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState('');

  // Edição de item já cadastrado
  const [itemEditando, setItemEditando] = useState(null);

  // Trava para evitar leituras duplas simultâneas (debounce/lock)
  const isProcessingRef = useRef(false);

  // Referências para evitar estado desatualizado
  const equipamentosRef = useRef(equipamentos);
  const caseRef = useRef(caseEmAcondicionamento);

  useEffect(() => {
    equipamentosRef.current = equipamentos;
  }, [equipamentos]);

  useEffect(() => {
    caseRef.current = caseEmAcondicionamento;
  }, [caseEmAcondicionamento]);

  useEffect(() => {
    carregarDados();
  }, []);

  function handleCodigoLidoCamera(codigo) {
    if (isProcessingRef.current) return;
    processarCodigoScaneado(codigo);
  }

  function obterStatusCalculado(evento) {
    if (evento.status === 'finalizado') return 'finalizado';
    if (!evento.data_inicio) return 'ativo';
    const hoje = new Date().toISOString().split('T')[0];
    return evento.data_inicio > hoje ? 'programado' : 'ativo';
  }

  async function carregarDados() {
    setCarregando(true);

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

    const { data: evData } = await supabase
      .from('eventos')
      .select('*')
      .order('data_inicio', { ascending: true });

    if (evData) {
      setEventos(evData);
      const hoje = new Date().toISOString().split('T')[0];
      const ativos = evData.filter((e) => e.status !== 'finalizado' && e.data_inicio <= hoje).length;
      const programados = evData.filter((e) => e.status !== 'finalizado' && e.data_inicio > hoje).length;

      setEstatisticas((prev) => ({
        ...prev,
        eventosAtivos: ativos,
        eventosProgramados: programados,
      }));
    }

    setCarregando(false);
  }

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
      setMensagem('Erro ao salvar o evento.');
    }
  }

  function iniciarCadastroEquipamento() {
    setMensagem('');
    setAbaAtiva('equipamentos');
    setCaseEmAcondicionamento(null);
    setPassoScan(1);
    setUsarCamera(true);
  }

  // Lógica de Processamento do Código de Barras
  function processarCodigoScaneado(codigo) {
    if (isProcessingRef.current) return;

    // Limpa espaços, caracteres de nova linha (Enter do leitor) e símbolos invisíveis
    const codLimpo = codigo ? codigo.trim().replace(/[\r\n]+/g, '') : '';
    if (!codLimpo) return;

    // Ativa a trava de leitura
    isProcessingRef.current = true;

    // Código de barras deve ter exatamente 5 dígitos numéricos
    if (!/^\d{5}$/.test(codLimpo)) {
      setMensagem(`⚠️ Código inválido: "${codLimpo}". O código de barras deve ter exatamente 5 dígitos.`);
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 1500);
      return;
    }

    const listaEquipamentos = equipamentosRef.current;
    const currentCase = caseRef.current;

    // Procura se já existe no banco (compara string exata)
    const itemExistente = listaEquipamentos.find(
      (eq) =>
        String(eq.codigo_barras).trim() === codLimpo ||
        String(eq.patrimonio).trim() === codLimpo
    );

    if (itemExistente) {
      if (itemExistente.tipo === 'Case') {
        setCaseEmAcondicionamento(itemExistente);
        setNovoEquipamento({
          nome: '',
          codigo_barras: '',
          patrimonio: '',
          tipo: 'Equipamento',
          case_id: itemExistente.id,
          condicao: 'Novo',
        });
        setPassoScan(1);
        setMensagem(`Case "${itemExistente.nome}" selecionado! Agora escaneie os itens para ele.`);
      } else {
        setMensagem(`⚠️ Código/Patrimônio #${codLimpo} já está cadastrado no item: ${itemExistente.nome}`);
      }

      // Libera a trava após 1.5s
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 1500);
    } else {
      // Novo código detectado
      setNovoEquipamento({
        nome: '',
        codigo_barras: codLimpo,
        patrimonio: codLimpo,
        tipo: 'Equipamento',
        case_id: currentCase ? currentCase.id : '',
        condicao: 'Novo',
      });
      setUsarCamera(false);
      setPassoScan(2);

      // Libera a trava
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 1000);
    }
  }

  function handleFormCodigoManual(e) {
    e.preventDefault();
    processarCodigoScaneado(novoEquipamento.codigo_barras);
  }

  async function handleSalvarCadastro(e) {
    e.preventDefault();
    const codFormatado = novoEquipamento.codigo_barras.trim().replace(/[\r\n]+/g, '');

    if (!novoEquipamento.nome.trim() || !codFormatado) {
      setMensagem('Por favor, informe o nome e o código do equipamento.');
      return;
    }

    setCarregando(true);

    const payload = {
      nome: novoEquipamento.nome.trim(),
      codigo_barras: codFormatado,
      patrimonio: novoEquipamento.patrimonio ? novoEquipamento.patrimonio.trim() : codFormatado,
      tipo: novoEquipamento.tipo,
      case_id: novoEquipamento.tipo === 'Equipamento' && novoEquipamento.case_id ? novoEquipamento.case_id : null,
      condicao: novoEquipamento.condicao,
      status: 'Disponível',
    };

    const { data, error } = await supabase.from('equipamentos').insert([payload]).select();

    setCarregando(false);

    if (!error) {
      const itemSalvo = data ? data[0] : null;

      if (novoEquipamento.tipo === 'Case' && itemSalvo) {
        setCaseEmAcondicionamento(itemSalvo);
        setMensagem(`Case "${itemSalvo.nome}" cadastrado com sucesso! Agora escaneie os itens para este Case.`);
      } else {
        setMensagem(`${novoEquipamento.tipo} "${novoEquipamento.nome}" cadastrado com sucesso!`);
      }

      // Prepara para a próxima leitura
      setNovoEquipamento({
        nome: '',
        codigo_barras: '',
        patrimonio: '',
        tipo: 'Equipamento',
        case_id: caseEmAcondicionamento ? caseEmAcondicionamento.id : '',
        condicao: 'Novo',
      });
      setPassoScan(1);
      carregarDados();
    } else {
      console.error('Erro ao salvar no Supabase:', error);
      setMensagem(`Erro ao cadastrar: ${error.message || 'Código ou patrimônio já cadastrado no banco.'}`);
    }
  }

  function abrirEdicao(eq) {
    setMensagem('');
    setItemEditando({
      id: eq.id,
      nome: eq.nome,
      status: eq.status,
      case_id: eq.case_id || '',
      tipo: eq.tipo,
    });
  }

  async function handleSalvarEdicao(e) {
    e.preventDefault();
    if (!itemEditando.nome.trim()) return;

    setCarregando(true);

    const { error } = await supabase
      .from('equipamentos')
      .update({
        nome: itemEditando.nome.trim(),
        status: itemEditando.status,
        case_id: itemEditando.tipo === 'Equipamento' && itemEditando.case_id ? itemEditando.case_id : null,
      })
      .eq('id', itemEditando.id);

    setCarregando(false);

    if (!error) {
      setMensagem('Item atualizado com sucesso!');
      setItemEditando(null);
      carregarDados();
    } else {
      console.error('Erro ao atualizar no Supabase:', error);
      setMensagem('Erro ao atualizar o item.');
    }
  }

  async function toggleStatusEvento(id, statusAtual) {
    const novoStatus = statusAtual === 'finalizado' ? 'ativo' : 'finalizado';
    await supabase.from('eventos').update({ status: novoStatus }).eq('id', id);
    carregarDados();
  }

  const equipamentosDoCaseAtual = caseEmAcondicionamento
    ? equipamentos.filter((eq) => eq.case_id === caseEmAcondicionamento.id)
    : [];

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px 16px', fontFamily: "'Inter', system-ui, sans-serif", color: '#1e293b' }}>
      {/* Cabeçalho */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '20px', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Logo tamanho="pequena" />
          <div style={{ borderLeft: '2px solid #e2e8f0', paddingLeft: '16px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: '700', margin: 0, color: '#0f172a', lineHeight: '1.2' }}>Painel do Gestor</h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>Gestão de estoque e eventos</p>
          </div>
        </div>

        {carregando && <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Atualizando...</span>}
      </header>

      {/* Navegação */}
      <nav style={{ display: 'flex', gap: '8px', marginBottom: '24px', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
        {[
          { id: 'resumo', label: '📊 Visão Geral' },
          { id: 'eventos', label: '📅 Eventos' },
          { id: 'equipamentos', label: '📦 Cadastro & Leitor' },
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
              boxShadow: abaAtiva === aba.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            {aba.label}
          </button>
        ))}
      </nav>

      {/* Alerta */}
      {mensagem && (
        <div style={{ padding: '12px 16px', backgroundColor: mensagem.includes('Erro') || mensagem.includes('⚠️') ? '#fef2f2' : '#f0fdf4', border: `1px solid ${mensagem.includes('Erro') || mensagem.includes('⚠️') ? '#fecaca' : '#bbf7d0'}`, color: mensagem.includes('Erro') || mensagem.includes('⚠️') ? '#991b1b' : '#166534', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{mensagem}</span>
          <button onClick={() => setMensagem('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 'bold' }}>✕</button>
        </div>
      )}

      {/* ABA 1: RESUMO */}
      {abaAtiva === 'resumo' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <button
            onClick={iniciarCadastroEquipamento}
            style={{ backgroundColor: '#0284c7', color: 'white', padding: '18px', fontSize: '16px', fontWeight: 'bold', border: 'none', borderRadius: '10px', cursor: 'pointer' }}
          >
            📷 + Cadastrar Equipamento
          </button>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '16px' }}>
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
          <div style={{ padding: '20px', backgroundColor: '#fffbeb', border: '1px solid #fef08a', borderRadius: '10px' }}>
            <span style={{ fontSize: '13px', color: '#854d0e', fontWeight: '500' }}>Programados</span>
            <p style={{ fontSize: '30px', fontWeight: '700', margin: '8px 0 0 0', color: '#ca8a04' }}>{estatisticas.eventosProgramados}</p>
          </div>
          </div>
        </div>
      )}

      {/* ABA 2: EVENTOS */}
      {abaAtiva === 'eventos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ padding: '20px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#0f172a' }}>Cadastrar Novo Evento</h3>
            <form onSubmit={handleCriarEvento} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <input type="text" placeholder="Nome do Evento" value={novoEvento.nome} onChange={(e) => setNovoEvento({ ...novoEvento, nome: e.target.value })} style={{ flex: '2 1 200px', padding: '10px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }} required />
              <input type="text" placeholder="Cliente / Contratante" value={novoEvento.cliente} onChange={(e) => setNovoEvento({ ...novoEvento, cliente: e.target.value })} style={{ flex: '1 1 150px', padding: '10px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }} />
              <input type="date" value={novoEvento.data_inicio} onChange={(e) => setNovoEvento({ ...novoEvento, data_inicio: e.target.value })} style={{ flex: '1 1 140px', padding: '10px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }} required />
              <button type="submit" style={{ backgroundColor: '#0284c7', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>Cadastrar</button>
            </form>
          </div>

          <div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: '#0f172a' }}>Eventos Cadastrados</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {eventos.map((ev) => {
                const statusCalculado = obterStatusCalculado(ev);
                let tagBg = statusCalculado === 'programado' ? '#fefce8' : statusCalculado === 'finalizado' ? '#f1f5f9' : '#f0fdf4';
                let tagColor = statusCalculado === 'programado' ? '#854d0e' : statusCalculado === 'finalizado' ? '#64748b' : '#166534';
                let tagBorder = statusCalculado === 'programado' ? '#fef08a' : statusCalculado === 'finalizado' ? '#e2e8f0' : '#bbf7d0';

                return (
                  <li key={ev.id} style={{ padding: '14px 16px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong style={{ fontSize: '15px', color: '#0f172a' }}>{ev.nome}</strong>
                      {ev.cliente && <span style={{ color: '#64748b', marginLeft: '8px', fontSize: '14px' }}>• {ev.cliente}</span>}
                      <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '4px', backgroundColor: tagBg, color: tagColor, border: `1px solid ${tagBorder}` }}>
                          {statusCalculado.toUpperCase()}
                        </span>
                        {ev.data_inicio && <span style={{ fontSize: '12px', color: '#64748b' }}>Data: {new Date(ev.data_inicio + 'T00:00:00').toLocaleDateString('pt-BR')}</span>}
                      </div>
                    </div>
                    <button onClick={() => toggleStatusEvento(ev.id, ev.status)} style={{ padding: '8px 14px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', backgroundColor: ev.status === 'finalizado' ? '#f0f9ff' : '#fef2f2', color: ev.status === 'finalizado' ? '#0284c7' : '#dc2626' }}>
                      {ev.status === 'finalizado' ? 'Reativar Evento' : 'Encerrar Evento'}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      {/* ABA 3: EQUIPAMENTOS (SCAN FIRST LOGIC) */}
      {abaAtiva === 'equipamentos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* MODO ACONDICIONAMENTO DE CASE (SE ATIVO) */}
          {caseEmAcondicionamento && (
            <div style={{ padding: '16px', backgroundColor: '#e0f2fe', border: '2px solid #0284c7', borderRadius: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '11px', color: '#0369a1', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    🧳 MODO CASE ATIVO
                  </span>
                  <h4 style={{ margin: '4px 0 0 0', color: '#0c4a6e', fontSize: '16px' }}>
                    Acondicionando em: <strong>{caseEmAcondicionamento.nome}</strong> (#{caseEmAcondicionamento.patrimonio})
                  </h4>
                </div>
                <button
                  onClick={() => setCaseEmAcondicionamento(null)}
                  style={{ backgroundColor: '#0284c7', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}
                >
                  ✓ Concluir Case
                </button>
              </div>

              {/* Lista de itens já acondicionados no Case atual */}
              {equipamentosDoCaseAtual.length > 0 && (
                <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed #7dd3fc' }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#0369a1' }}>
                    Itens dentro deste Case ({equipamentosDoCaseAtual.length}):
                  </span>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                    {equipamentosDoCaseAtual.map((item) => (
                      <span key={item.id} style={{ fontSize: '12px', backgroundColor: '#ffffff', color: '#0369a1', padding: '4px 8px', borderRadius: '4px', border: '1px solid #bae6fd', fontWeight: '500' }}>
                        🔌 {item.nome} (#{item.patrimonio})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PAINEL DE LEITURA E CADASTRO */}
          <div style={{ padding: '20px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
            
            {/* PASSO 1: LER CÂMERA / DIGITAR */}
            {passoScan === 1 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#0f172a' }}>
                    📷 Passo 1: Aproxime a Câmera do Código
                  </h3>
                  <button
                    onClick={() => setUsarCamera(!usarCamera)}
                    style={{ backgroundColor: usarCamera ? '#ef4444' : '#0284c7', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    {usarCamera ? 'Fechar Câmera' : '📷 Abrir Câmera'}
                  </button>
                </div>

                {usarCamera && (
                  <div style={{ marginBottom: '20px', padding: '10px', border: '2px dashed #0284c7', borderRadius: '8px', backgroundColor: '#f8fafc', textAlign: 'center' }}>
                    <BarcodeReader onScanSuccess={handleCodigoLidoCamera} mostrarTitulo={false} />
                    <p style={{ fontSize: '12px', color: '#0284c7', margin: '8px 0 0 0', fontWeight: 'bold' }}>
                      Centralize o código de barras ou QR na câmera
                    </p>
                  </div>
                )}

                <form onSubmit={handleFormCodigoManual} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    placeholder="Ou digite o código/patrimônio manual..."
                    value={novoEquipamento.codigo_barras}
                    onChange={(e) => setNovoEquipamento({ ...novoEquipamento, codigo_barras: e.target.value })}
                    style={{ flex: 1, padding: '12px 14px', borderRadius: '6px', border: '2px solid #0284c7', fontSize: '15px' }}
                    autoFocus
                    required
                  />
                  <button type="submit" style={{ backgroundColor: '#0284c7', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                    Avançar ➔
                  </button>
                </form>
              </div>
            )}

            {/* PASSO 2: ESCOLHER TIPO E NOME DO ITEM */}
            {passoScan === 2 && (
              <form onSubmit={handleSalvarCadastro} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#0f172a' }}>
                    📝 Código Lido / Patrimônio: <span style={{ color: '#0284c7', fontWeight: '800' }}>#{novoEquipamento.codigo_barras}</span>
                  </h3>
                  <button type="button" onClick={() => setPassoScan(1)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '13px' }}>← Cancelar / Refazer Scan</button>
                </div>

                {/* Seleção do Tipo */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>
                    Este código pertence a um:
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <button
                      type="button"
                      onClick={() => setNovoEquipamento((prev) => ({ ...prev, tipo: 'Equipamento' }))}
                      style={{
                        padding: '14px',
                        borderRadius: '8px',
                        border: novoEquipamento.tipo === 'Equipamento' ? '2px solid #0284c7' : '1px solid #cbd5e1',
                        backgroundColor: novoEquipamento.tipo === 'Equipamento' ? '#f0f9ff' : '#ffffff',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <strong style={{ display: 'block', fontSize: '15px', color: '#0f172a' }}>🔌 Equipamento</strong>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>Microfone, cabo, mesa, caixa, etc.</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setNovoEquipamento((prev) => ({ ...prev, tipo: 'Case' }))}
                      style={{
                        padding: '14px',
                        borderRadius: '8px',
                        border: novoEquipamento.tipo === 'Case' ? '2px solid #0284c7' : '1px solid #cbd5e1',
                        backgroundColor: novoEquipamento.tipo === 'Case' ? '#f0f9ff' : '#ffffff',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <strong style={{ display: 'block', fontSize: '15px', color: '#0f172a' }}>🧳 Case / Baú</strong>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>Rack/Maleta que armazena itens.</span>
                    </button>
                  </div>
                </div>

                {/* Descrição / Nome */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                    Descrição / Nome do {novoEquipamento.tipo}:
                  </label>
                  <input
                    type="text"
                    placeholder={novoEquipamento.tipo === 'Case' ? "Ex: Case Mics Sem Fio #01" : "Ex: Microfone Shure SM58"}
                    value={novoEquipamento.nome}
                    onChange={(e) => setNovoEquipamento({ ...novoEquipamento, nome: e.target.value })}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '15px', boxSizing: 'border-box' }}
                    autoFocus
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={carregando}
                  style={{ backgroundColor: '#0284c7', color: 'white', padding: '14px', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', marginTop: '8px' }}
                >
                  {carregando ? 'Salvando...' : `Salvar ${novoEquipamento.tipo} #${novoEquipamento.codigo_barras} e Continuar ➔`}
                </button>
              </form>
            )}
          </div>

          {/* PAINEL DE EDIÇÃO DE ITEM EXISTENTE */}
          {itemEditando && (
            <div style={{ padding: '16px', backgroundColor: '#fffbeb', border: '2px solid #d97706', borderRadius: '10px' }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#92400e', fontSize: '15px' }}>
                ✏️ Editando: #{itemEditando.nome}
              </h4>
              <form onSubmit={handleSalvarEdicao} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                    Nome / Descrição
                  </label>
                  <input
                    type="text"
                    value={itemEditando.nome}
                    onChange={(e) => setItemEditando({ ...itemEditando, nome: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                    Status
                  </label>
                  <select
                    value={itemEditando.status}
                    onChange={(e) => setItemEditando({ ...itemEditando, status: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  >
                    <option value="Disponível">Disponível</option>
                    <option value="Em Uso">Em Uso</option>
                    <option value="Em Manutenção">Em Manutenção</option>
                  </select>
                </div>

                {itemEditando.tipo === 'Equipamento' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                      Case
                    </label>
                    <select
                      value={itemEditando.case_id}
                      onChange={(e) => setItemEditando({ ...itemEditando, case_id: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                    >
                      <option value="">Nenhum (avulso)</option>
                      {equipamentos
                        .filter((c) => c.tipo === 'Case' && c.id !== itemEditando.id)
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nome} (#{c.patrimonio})
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                  <button
                    type="submit"
                    disabled={carregando}
                    style={{ flex: 1, backgroundColor: '#d97706', color: 'white', padding: '12px', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}
                  >
                    {carregando ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setItemEditando(null)}
                    style={{ flex: 1, backgroundColor: '#f1f5f9', color: '#475569', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* LISTA DE ESTOQUE CADASTRADO */}
          <div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: '#0f172a' }}>
              Estoque Cadastrado ({equipamentos.length})
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {equipamentos.map((eq) => {
                const casePai = eq.case_id ? equipamentos.find((c) => c.id === eq.case_id) : null;
                const corStatus =
                  eq.status === 'Disponível'
                    ? { bg: '#f0fdf4', text: '#166534', border: '#bbf7d0' }
                    : eq.status === 'Em Manutenção'
                    ? { bg: '#fffbeb', text: '#92400e', border: '#fde68a' }
                    : { bg: '#fef2f2', text: '#991b1b', border: '#fecaca' };

                return (
                  <li key={eq.id} style={{ padding: '12px 16px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ fontSize: '14px', color: '#0f172a' }}>{eq.nome}</strong>
                        {eq.tipo === 'Case' && <span style={{ fontSize: '10px', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>CASE</span>}
                        <span style={{ fontSize: '11px', backgroundColor: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                          PAT / CÓD: #{eq.patrimonio || eq.codigo_barras}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                        {casePai && <span style={{ color: '#0284c7', fontWeight: '500' }}>🧳 Acondicionado em: {casePai.nome}</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '6px', backgroundColor: corStatus.bg, color: corStatus.text, border: `1px solid ${corStatus.border}`, fontWeight: '600' }}>
                        {eq.status}
                      </span>
                      <button
                        onClick={() => abrirEdicao(eq)}
                        style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '6px', backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', fontWeight: '600', cursor: 'pointer' }}
                      >
                        ✏️ Editar
                      </button>
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