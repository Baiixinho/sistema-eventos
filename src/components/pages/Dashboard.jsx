import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export function Dashboard() {
  const [abaAtiva, setAbaAtiva] = useState('resumo'); // 'resumo', 'eventos', 'equipamentos'
  
  // Dados de resumo
  const [estatisticas, setEstatisticas] = useState({ total: 0, disponiveis: 0, emUso: 0, eventosAtivos: 0 });
  
  // Listas de dados
  const [eventos, setEventos] = useState([]);
  const [equipamentos, setEquipamentos] = useState([]);
  
  // Form Eventos
  const [novoEvento, setNovoEvento] = useState({ nome: '', cliente: '' });
  
  // Form Equipamentos
  const [novoEquipamento, setNovoEquipamento] = useState({ nome: '', codigo_barras: '', condicao: 'Novo' });

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
      const disp = eqData.filter(i => i.status === 'Disponível').length;
      const uso = eqData.filter(i => i.status === 'Em Uso').length;
      setEstatisticas(prev => ({ ...prev, total: eqData.length, disponiveis: disp, emUso: uso }));
    }

    // Busca eventos
    const { data: evData } = await supabase.from('eventos').select('*').order('created_at', { ascending: false });
    if (evData) {
      setEventos(evData);
      const ativos = evData.filter(e => e.status === 'ativo').length;
      setEstatisticas(prev => ({ ...prev, eventosAtivos: ativos }));
    }

    setCarregando(false);
  }

  // Cadastrar Evento
  async function handleCriarEvento(e) {
    e.preventDefault();
    if (!novoEvento.nome.trim()) return;

    const { error } = await supabase.from('eventos').insert([{
      nome: novoEvento.nome,
      cliente: novoEvento.cliente,
      status: 'ativo'
    }]);

    if (!error) {
      setMensagem('Evento cadastrado com sucesso!');
      setNovoEvento({ nome: '', cliente: '' });
      carregarDados();
    }
  }

  // Cadastrar Equipamento
  async function handleCriarEquipamento(e) {
    e.preventDefault();
    if (!novoEquipamento.nome.trim() || !novoEquipamento.codigo_barras.trim()) return;

    const { error } = await supabase.from('equipamentos').insert([{
      nome: novoEquipamento.nome,
      codigo_barras: novoEquipamento.codigo_barras,
      condicao: novoEquipamento.condicao,
      status: 'Disponível'
    }]);

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
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1>Painel do Gestor</h1>
      
      {/* Navegação por Abas */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button 
          onClick={() => setAbaAtiva('resumo')} 
          style={{ padding: '10px 15px', borderRadius: '6px', border: 'none', cursor: 'pointer', backgroundColor: abaAtiva === 'resumo' ? '#2563eb' : '#e5e7eb', color: abaAtiva === 'resumo' ? 'white' : '#374151', fontWeight: 'bold' }}
        >
          📊 Visão Geral
        </button>
        <button 
          onClick={() => setAbaAtiva('eventos')} 
          style={{ padding: '10px 15px', borderRadius: '6px', border: 'none', cursor: 'pointer', backgroundColor: abaAtiva === 'eventos' ? '#2563eb' : '#e5e7eb', color: abaAtiva === 'eventos' ? 'white' : '#374151', fontWeight: 'bold' }}
        >
          📅 Eventos
        </button>
        <button 
          onClick={() => setAbaAtiva('equipamentos')} 
          style={{ padding: '10px 15px', borderRadius: '6px', border: 'none', cursor: 'pointer', backgroundColor: abaAtiva === 'equipamentos' ? '#2563eb' : '#e5e7eb', color: abaAtiva === 'equipamentos' ? 'white' : '#374151', fontWeight: 'bold' }}
        >
          📦 Equipamentos
        </button>
      </div>

      {mensagem && (
        <div style={{ padding: '10px', backgroundColor: '#dcfce7', color: '#166534', borderRadius: '6px', marginBottom: '15px' }}>
          {mensagem}
        </div>
      )}

      {/* ABA 1: RESUMO */}
      {abaAtiva === 'resumo' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', marginBottom: '20px' }}>
            <div style={{ padding: '15px', backgroundColor: '#f3f4f6', borderRadius: '8px', textAlign: 'center' }}>
              <h3 style={{ margin: 0, color: '#4b5563' }}>Total Equipamentos</h3>
              <p style={{ fontSize: '28px', fontWeight: 'bold', margin: '5px 0 0 0' }}>{estatisticas.total}</p>
            </div>
            <div style={{ padding: '15px', backgroundColor: '#dcfce7', borderRadius: '8px', textAlign: 'center' }}>
              <h3 style={{ margin: 0, color: '#166534' }}>Disponíveis</h3>
              <p style={{ fontSize: '28px', fontWeight: 'bold', margin: '5px 0 0 0', color: '#166534' }}>{estatisticas.disponiveis}</p>
            </div>
            <div style={{ padding: '15px', backgroundColor: '#fee2e2', borderRadius: '8px', textAlign: 'center' }}>
              <h3 style={{ margin: 0, color: '#991b1b' }}>Em Uso (Fora)</h3>
              <p style={{ fontSize: '28px', fontWeight: 'bold', margin: '5px 0 0 0', color: '#991b1b' }}>{estatisticas.emUso}</p>
            </div>
            <div style={{ padding: '15px', backgroundColor: '#e0f2fe', borderRadius: '8px', textAlign: 'center' }}>
              <h3 style={{ margin: 0, color: '#075985' }}>Eventos Ativos</h3>
              <p style={{ fontSize: '28px', fontWeight: 'bold', margin: '5px 0 0 0', color: '#075985' }}>{estatisticas.eventosAtivos}</p>
            </div>
          </div>
        </div>
      )}

      {/* ABA 2: EVENTOS */}
      {abaAtiva === 'eventos' && (
        <div>
          <h3>Cadastrar Novo Evento</h3>
          <form onSubmit={handleCriarEvento} style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <input 
              type="text" 
              placeholder="Nome do Evento (ex: Show Sertanejo)" 
              value={novoEvento.nome} 
              onChange={e => setNovoEvento({ ...novoEvento, nome: e.target.value })}
              style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
              required 
            />
            <input 
              type="text" 
              placeholder="Cliente / Contratante" 
              value={novoEvento.cliente} 
              onChange={e => setNovoEvento({ ...novoEvento, cliente: e.target.value })}
              style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
            />
            <button type="submit" style={{ backgroundColor: '#16a34a', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
              Cadastrar
            </button>
          </form>

          <h3>Eventos Cadastrados</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {eventos.map(ev => (
              <li key={ev.id} style={{ padding: '12px', border: '1px solid #e5e7eb', borderRadius: '6px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{ev.nome}</strong> {ev.cliente && <span style={{ color: '#6b7280' }}>- {ev.cliente}</span>}
                  <div><span style={{ fontSize: '12px', padding: '2px 6px', borderRadius: '4px', backgroundColor: ev.status === 'ativo' ? '#dcfce7' : '#f3f4f6', color: ev.status === 'ativo' ? '#166534' : '#6b7280' }}>{ev.status.toUpperCase()}</span></div>
                </div>
                <button 
                  onClick={() => toggleStatusEvento(ev.id, ev.status)}
                  style={{ padding: '6px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer', backgroundColor: ev.status === 'ativo' ? '#e11d48' : '#2563eb', color: 'white' }}
                >
                  {ev.status === 'ativo' ? 'Encerrar Evento' : 'Reativar Evento'}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ABA 3: EQUIPAMENTOS */}
      {abaAtiva === 'equipamentos' && (
        <div>
          <h3>Cadastrar Novo Equipamento</h3>
          <form onSubmit={handleCriarEquipamento} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
            <input 
              type="text" 
              placeholder="Nome do Equipamento (ex: Caixa RCF)" 
              value={novoEquipamento.nome} 
              onChange={e => setNovoEquipamento({ ...novoEquipamento, nome: e.target.value })}
              style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
              required 
            />
            <input 
              type="text" 
              placeholder="Código de Barras" 
              value={novoEquipamento.codigo_barras} 
              onChange={e => setNovoEquipamento({ ...novoEquipamento, codigo_barras: e.target.value })}
              style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
              required 
            />
            <button type="submit" style={{ gridColumn: 'span 2', backgroundColor: '#16a34a', color: 'white', padding: '10px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
              Salvar Equipamento
            </button>
          </form>

          <h3>Estoque Cadastrado ({equipamentos.length})</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {equipamentos.map(eq => (
              <li key={eq.id} style={{ padding: '10px', border: '1px solid #e5e7eb', borderRadius: '6px', marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <strong>{eq.nome}</strong>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>Cód: {eq.codigo_barras}</div>
                </div>
                <div>
                  <span style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '4px', backgroundColor: eq.status === 'Disponível' ? '#dcfce7' : '#fee2e2', color: eq.status === 'Disponível' ? '#166534' : '#991b1b', fontWeight: 'bold' }}>
                    {eq.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}