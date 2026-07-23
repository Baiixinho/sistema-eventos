import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { BarcodeReader } from '../BarcodeReader';
// Importação direta da imagem em src/assets/logo.jpeg
import logoImg from '../assets/logo.jpeg'; 

export function CheckOut() {
  const [eventos, setEventos] = useState([]);
  const [eventoSelecionado, setEventoSelecionado] = useState('');
  const [tipoOperacao, setTipoOperacao] = useState('saida'); // 'saida' ou 'entrada'
  
  // Controle de Trava de Lote e Leitor
  const [operacaoIniciada, setOperacaoIniciada] = useState(false);
  const [mostrarLeitor, setMostrarLeitor] = useState(false);
  const [carregando, setCarregando] = useState(false);
  
  const [mensagemSucesso, setMensagemSucesso] = useState('');
  const [mensagemErro, setMensagemErro] = useState('');
  const [itensBipados, setItensBipados] = useState([]);

  // Ref para controle de leitura contínua sem repetições
  const processandoRef = useRef(false);

  // 🔊 GERADOR DE SOM (Web Audio API)
  const tocarSomBipe = (tipo = 'sucesso') => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (tipo === 'sucesso') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, ctx.currentTime); // Som agudo (sucesso)
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, ctx.currentTime); // Som grave (erro)
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch (e) {
      console.log('Audio API não iniciada.');
    }
  };

  // Carrega lista de eventos ativos
  useEffect(() => {
    async function carregarEventos() {
      const { data, error } = await supabase
        .from('eventos')
        .select('*')
        .eq('status', 'ativo')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setEventos(data);
        if (data.length > 0) setEventoSelecionado(data[0].nome);
      }
    }
    carregarEventos();
  }, []);

  // Processa leitura de código de barras
  const handleCodigoLido = async (codigo) => {
    if (processandoRef.current) return;
    processandoRef.current = true;

    setMensagemErro('');
    setMensagemSucesso('');

    if (!eventoSelecionado) {
      tocarSomBipe('erro');
      setMensagemErro('Selecione um evento antes de bipar!');
      setTimeout(() => { processandoRef.current = false; }, 1500);
      return;
    }

    const codigoLimpo = codigo.trim();

    // Trava de Duplicidade
    const jaNaLista = itensBipados.some(item => item.codigo === codigoLimpo);
    if (jaNaLista) {
      tocarSomBipe('erro');
      setMensagemErro(`⚠️ O Patrimônio "${codigoLimpo}" já está nesta lista!`);
      setTimeout(() => { processandoRef.current = false; }, 2000);
      return;
    }

    setCarregando(true);

    try {
      // 1. Busca item no banco
      const { data: equipamento, error: erroBusca } = await supabase
        .from('equipamentos')
        .select('*')
        .eq('codigo_barras', codigoLimpo)
        .single();

      if (erroBusca || !equipamento) {
        tocarSomBipe('erro');
        setMensagemErro(`❌ Patrimônio "${codigoLimpo}" não cadastrado no estoque.`);
        setTimeout(() => { processandoRef.current = false; }, 2000);
        return;
      }

      const novoStatus = tipoOperacao === 'saida' ? 'Em Uso' : 'Disponível';

      // 2. Atualiza status no banco
      const { error: erroAtualizacao } = await supabase
        .from('equipamentos')
        .update({ status: novoStatus })
        .eq('id', equipamento.id);

      if (erroAtualizacao) throw erroAtualizacao;

      // 3. Grava histórico
      const { data: movimentacao, error: erroHistorico } = await supabase
        .from('movimentacoes')
        .insert([
          {
            equipamento_id: equipamento.id,
            tipo: tipoOperacao,
            evento: eventoSelecionado
          }
        ])
        .select()
        .single();

      if (erroHistorico) throw erroHistorico;

      // Sucesso
      tocarSomBipe('sucesso');
      setOperacaoIniciada(true);

      const novoItem = {
        equipamento_id: equipamento.id,
        movimentacao_id: movimentacao?.id,
        nome: equipamento.nome,
        codigo: codigoLimpo,
        statusAnterior: equipamento.status,
        hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setItensBipados((prev) => [novoItem, ...prev]);
      setMensagemSucesso(`✅ "${equipamento.nome}" bipado com sucesso!`);

    } catch (err) {
      console.error(err);
      tocarSomBipe('erro');
      setMensagemErro('Erro ao salvar no banco de dados.');
    } finally {
      setCarregando(false);
      // Pausa de 1.5 segundo para mover a câmera para o próximo item
      setTimeout(() => {
        processandoRef.current = false;
      }, 1500);
    }
  };

  // Remoção do Item
  const handleRemoverItem = async (itemParaRemover) => {
    setMensagemErro('');
    setMensagemSucesso('');
    setCarregando(true);

    try {
      await supabase
        .from('equipamentos')
        .update({ status: itemParaRemover.statusAnterior || 'Disponível' })
        .eq('id', itemParaRemover.equipamento_id);

      await supabase
        .from('movimentacoes')
        .insert([
          {
            equipamento_id: itemParaRemover.equipamento_id,
            tipo: 'REMOVIDO_OPERADOR',
            evento: eventoSelecionado
          }
        ]);

      const novaLista = itensBipados.filter(item => item.codigo !== itemParaRemover.codigo);
      setItensBipados(novaLista);

      if (novaLista.length === 0) {
        setOperacaoIniciada(false);
      }

      tocarSomBipe('sucesso');
      setMensagemSucesso(`🗑️ Item "${itemParaRemover.nome}" removido (registro gravado).`);
    } catch (err) {
      console.error(err);
      tocarSomBipe('erro');
      setMensagemErro('Erro ao remover o item.');
    } finally {
      setCarregando(false);
    }
  };

  const resetarOperacao = () => {
    setOperacaoIniciada(false);
    setItensBipados([]);
    setMensagemSucesso('');
    setMensagemErro('');
    setMostrarLeitor(false);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      
      {/* Logotipo Oficial da Paulinho Produções via Import */}
      <div style={{ textAlign: 'center', marginBottom: '10px' }}>
        <img 
          src={logoImg} 
          alt="Paulinho Produções" 
          style={{ height: '75px', maxWidth: '100%', objectFit: 'contain' }} 
        />
      </div>

      <h1 style={{ textAlign: 'center', margin: '5px 0', color: '#0f172a', fontSize: '24px' }}>
        Montagem de Evento
      </h1>
      <p style={{ textAlign: 'center', color: '#64748b', marginTop: 0, marginBottom: '20px', fontSize: '14px' }}>
        Conferência de Entrada e Saída
      </p>

      {/* Trava de Lote */}
      {operacaoIniciada && (
        <div style={{ backgroundColor: '#fef3c7', color: '#92400e', padding: '10px 15px', borderRadius: '8px', marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: '500' }}>🔒 Lote em andamento ({itensBipados.length} itens)</span>
          <button
            onClick={resetarOperacao}
            style={{ backgroundColor: '#d97706', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Concluir Lote
          </button>
        </div>
      )}

      {/* Tipo de Operação */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
        <button
          disabled={operacaoIniciada}
          onClick={() => setTipoOperacao('saida')}
          style={{
            flex: 1,
            padding: '14px',
            fontSize: '16px',
            fontWeight: 'bold',
            borderRadius: '8px',
            border: 'none',
            opacity: operacaoIniciada && tipoOperacao !== 'saida' ? 0.4 : 1,
            backgroundColor: tipoOperacao === 'saida' ? '#dc2626' : '#f1f5f9',
            color: tipoOperacao === 'saida' ? 'white' : '#334155',
            cursor: operacaoIniciada ? 'not-allowed' : 'pointer'
          }}
        >
          🔴 SAÍDA
        </button>

        <button
          disabled={operacaoIniciada}
          onClick={() => setTipoOperacao('entrada')}
          style={{
            flex: 1,
            padding: '14px',
            fontSize: '16px',
            fontWeight: 'bold',
            borderRadius: '8px',
            border: 'none',
            opacity: operacaoIniciada && tipoOperacao !== 'entrada' ? 0.4 : 1,
            backgroundColor: tipoOperacao === 'entrada' ? '#16a34a' : '#f1f5f9',
            color: tipoOperacao === 'entrada' ? 'white' : '#334155',
            cursor: operacaoIniciada ? 'not-allowed' : 'pointer'
          }}
        >
          🟢 ENTRADA
        </button>
      </div>

      {/* Seleção de Evento */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px', color: '#334155' }}>
          Evento / Cliente Destino:
        </label>
        <select
          disabled={operacaoIniciada}
          value={eventoSelecionado}
          onChange={(e) => setEventoSelecionado(e.target.value)}
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '16px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            backgroundColor: operacaoIniciada ? '#e2e8f0' : 'white',
            cursor: operacaoIniciada ? 'not-allowed' : 'pointer'
          }}
        >
          {eventos.length === 0 ? (
            <option value="">Nenhum evento ativo cadastrado...</option>
          ) : (
            eventos.map((ev) => (
              <option key={ev.id} value={ev.nome}>
                {ev.nome} {ev.cliente ? `(${ev.cliente})` : ''}
              </option>
            ))
          )}
        </select>
      </div>

      {/* Botão Câmera */}
      {!mostrarLeitor ? (
        <button
          onClick={() => {
            if (!eventoSelecionado) {
              setMensagemErro('Selecione um evento antes de abrir a câmera.');
              tocarSomBipe('erro');
              return;
            }
            setMensagemErro('');
            setMostrarLeitor(true);
          }}
          style={{
            backgroundColor: tipoOperacao === 'saida' ? '#dc2626' : '#16a34a',
            color: 'white',
            padding: '16px',
            fontSize: '18px',
            fontWeight: 'bold',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            width: '100%'
          }}
        >
          📷 Abrir Câmera Contínua ({tipoOperacao.toUpperCase()})
        </button>
      ) : (
        <div style={{ marginTop: '10px' }}>
          <BarcodeReader onScanSuccess={handleCodigoLido} />
          
          <button
            onClick={() => setMostrarLeitor(false)}
            style={{
              marginTop: '10px',
              backgroundColor: '#475569',
              color: 'white',
              padding: '12px',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              width: '100%',
              fontWeight: 'bold'
            }}
          >
            ⏹️ Pausar Câmera
          </button>
        </div>
      )}

      {/* Loading */}
      {carregando && (
        <p style={{ textAlign: 'center', color: '#2563eb', fontWeight: 'bold', marginTop: '15px' }}>
          🔄 Gravando no banco...
        </p>
      )}

      {/* Mensagens */}
      {mensagemErro && (
        <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '12px', borderRadius: '8px', marginTop: '15px', fontWeight: 'bold' }}>
          {mensagemErro}
        </div>
      )}

      {mensagemSucesso && (
        <div style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '12px', borderRadius: '8px', marginTop: '15px', fontWeight: 'bold' }}>
          {mensagemSucesso}
        </div>
      )}

      {/* Lista do Lote */}
      {itensBipados.length > 0 && (
        <div style={{ marginTop: '25px', borderTop: '2px solid #e2e8f0', paddingTop: '15px' }}>
          <h3 style={{ color: '#1e293b' }}>Itens Processados Neste Lote ({itensBipados.length}):</h3>
          <ul style={{ listStyleType: 'none', padding: 0 }}>
            {itensBipados.map((item, index) => (
              <li
                key={index}
                style={{
                  padding: '10px 14px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  marginBottom: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <strong>{item.nome}</strong>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Cód: {item.codigo} • {item.hora}</div>
                </div>

                <button
                  onClick={() => handleRemoverItem(item)}
                  style={{
                    backgroundColor: '#fee2e2',
                    color: '#dc2626',
                    border: '1px solid #fca5a5',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  🗑️ Remover
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}