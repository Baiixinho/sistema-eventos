import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { BarcodeReader } from '../BarcodeReader';

export function CheckOut() {
  const [eventos, setEventos] = useState([]);
  const [eventoSelecionado, setEventoSelecionado] = useState('');
  const [tipoOperacao, setTipoOperacao] = useState('saida'); // 'saida' ou 'entrada'
  
  // Controle de Trava de Segurança
  const [operacaoIniciada, setOperacaoIniciada] = useState(false);

  const [mostrarLeitor, setMostrarLeitor] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState('');
  const [mensagemErro, setMensagemErro] = useState('');
  const [itensBipados, setItensBipados] = useState([]);

  // Busca eventos ativos no Supabase ao carregar a tela
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

  const handleCodigoLido = async (codigo) => {
    setMostrarLeitor(false);
    setMensagemErro('');
    setMensagemSucesso('');

    if (!eventoSelecionado) {
      setMensagemErro('Selecione um evento antes de bipar!');
      return;
    }

    const codigoLimpo = codigo.trim();

    // 🔒 TRAVA 1: Impede bipar o mesmo código duas vezes na lista atual
    const jaNaLista = itensBipados.some(item => item.codigo === codigoLimpo);
    if (jaNaLista) {
      setMensagemErro(`⚠️ O Patrimônio "${codigoLimpo}" já foi bipado neste lote!`);
      return;
    }

    setCarregando(true);

    try {
      // 1. Busca o equipamento no Supabase
      const { data: equipamento, error: erroBusca } = await supabase
        .from('equipamentos')
        .select('*')
        .eq('codigo_barras', codigoLimpo)
        .single();

      if (erroBusca || !equipamento) {
        setMensagemErro(`Item com código "${codigoLimpo}" não cadastrado no estoque.`);
        setCarregando(false);
        return;
      }

      const novoStatus = tipoOperacao === 'saida' ? 'Em Uso' : 'Disponível';

      // 2. Atualiza status na tabela de equipamentos
      const { error: erroAtualizacao } = await supabase
        .from('equipamentos')
        .update({ status: novoStatus })
        .eq('id', equipamento.id);

      if (erroAtualizacao) throw erroAtualizacao;

      // 3. Grava histórico na tabela de movimentações
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

      // Trava os seletores no 1º bipe para garantir segurança do lote
      setOperacaoIniciada(true);

      // Adiciona na lista de itens bipados na sessão atual (guardando IDs para permitir remoção)
      const novoItem = {
        equipamento_id: equipamento.id,
        movimentacao_id: movimentacao?.id,
        nome: equipamento.nome,
        codigo: codigoLimpo,
        statusAnterior: equipamento.status,
        hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setItensBipados((prev) => [novoItem, ...prev]);

      setMensagemSucesso(`✅ "${equipamento.nome}" registrado com sucesso!`);

    } catch (err) {
      console.error(err);
      setMensagemErro('Erro ao salvar movimentação. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  // 🗑️ REMOÇÃO DE ITEM COM REGISTRO DE AUDITORIA
  const handleRemoverItem = async (itemParaRemover) => {
    setMensagemErro('');
    setMensagemSucesso('');
    setCarregando(true);

    try {
      // 1. Restaura o status original do equipamento
      await supabase
        .from('equipamentos')
        .update({ status: itemParaRemover.statusAnterior || 'Disponível' })
        .eq('id', itemParaRemover.equipamento_id);

      // 2. Registra o log de auditoria da remoção
      await supabase
        .from('movimentacoes')
        .insert([
          {
            equipamento_id: itemParaRemover.equipamento_id,
            tipo: 'REMOVIDO_OPERADOR',
            evento: eventoSelecionado
          }
        ]);

      // 3. Remove o item da lista visual do operador
      const novaLista = itensBipados.filter(item => item.codigo !== itemParaRemover.codigo);
      setItensBipados(novaLista);

      // Se a lista esvaziar, destrava os seletores
      if (novaLista.length === 0) {
        setOperacaoIniciada(false);
      }

      setMensagemSucesso(`🗑️ Item "${itemParaRemover.nome}" foi removido do lote (registro salvo no histórico).`);
    } catch (err) {
      console.error(err);
      setMensagemErro('Erro ao remover o item. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  const resetarOperacao = () => {
    setOperacaoIniciada(false);
    setItensBipados([]);
    setMensagemSucesso('');
    setMensagemErro('');
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '5px' }}>Galpão - Bipador</h1>
      <p style={{ textAlign: 'center', color: '#666', marginBottom: '20px' }}>
        Controle de Entrada e Saída
      </p>

      {/* Trava visual indicando lote em andamento */}
      {operacaoIniciada && (
        <div style={{ backgroundColor: '#fef3c7', color: '#92400e', padding: '10px 15px', borderRadius: '8px', marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>🔒 Lote em andamento ({itensBipados.length} itens)</span>
          <button
            onClick={resetarOperacao}
            style={{ backgroundColor: '#d97706', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Concluir / Trocar
          </button>
        </div>
      )}

      {/* Botões de Entrada / Saída */}
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
            backgroundColor: tipoOperacao === 'saida' ? '#dc2626' : '#f3f4f6',
            color: tipoOperacao === 'saida' ? 'white' : '#374151',
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
            backgroundColor: tipoOperacao === 'entrada' ? '#16a34a' : '#f3f4f6',
            color: tipoOperacao === 'entrada' ? 'white' : '#374151',
            cursor: operacaoIniciada ? 'not-allowed' : 'pointer'
          }}
        >
          🟢 ENTRADA
        </button>
      </div>

      {/* Seleção do Evento (Dropdown do Banco) */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px' }}>
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
            border: '1px solid #ccc',
            backgroundColor: operacaoIniciada ? '#e5e7eb' : 'white',
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

      {/* Botão de Câmera */}
      {!mostrarLeitor && (
        <button
          onClick={() => {
            if (!eventoSelecionado) {
              setMensagemErro('Selecione um evento cadastrado no sistema.');
              return;
            }
            setMensagemErro('');
            setMostrarLeitor(true);
          }}
          style={{
            backgroundColor: tipoOperacao === 'saida' ? '#dc2626' : '#16a34a',
            color: 'white',
            padding: '14px',
            fontSize: '18px',
            fontWeight: 'bold',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            width: '100%'
          }}
        >
          📷 Bipar Item para {tipoOperacao === 'saida' ? 'Saída' : 'Entrada'}
        </button>
      )}

      {/* Leitor da Câmera */}
      {mostrarLeitor && (
        <div style={{ marginTop: '15px' }}>
          <BarcodeReader onScanSuccess={handleCodigoLido} />
          <button
            onClick={() => setMostrarLeitor(false)}
            style={{
              marginTop: '15px',
              backgroundColor: '#6b7280',
              color: 'white',
              padding: '10px',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              width: '100%'
            }}
          >
            Fechar Câmera
          </button>
        </div>
      )}

      {/* Indicador de carregamento */}
      {carregando && (
        <p style={{ textAlign: 'center', color: '#2563eb', fontWeight: 'bold', marginTop: '15px' }}>
          🔍 Processando no Supabase...
        </p>
      )}

      {/* Alertas */}
      {mensagemErro && (
        <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '12px', borderRadius: '8px', marginTop: '15px', fontWeight: '500' }}>
          {mensagemErro}
        </div>
      )}

      {mensagemSucesso && (
        <div style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '12px', borderRadius: '8px', marginTop: '15px', fontWeight: '500' }}>
          {mensagemSucesso}
        </div>
      )}

      {/* Lista do Lote Atual Bipado */}
      {itensBipados.length > 0 && (
        <div style={{ marginTop: '25px', borderTop: '2px solid #eee', paddingTop: '15px' }}>
          <h3>Itens Processados Neste Lote ({itensBipados.length}):</h3>
          <ul style={{ listStyleType: 'none', padding: 0 }}>
            {itensBipados.map((item, index) => (
              <li
                key={index}
                style={{
                  padding: '10px 14px',
                  backgroundColor: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  marginBottom: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <strong>{item.nome}</strong>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>Cód: {item.codigo} • {item.hora}</div>
                </div>

                {/* Botão de Remover com Auditoria */}
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