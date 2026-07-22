import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { BarcodeReader } from '../BarcodeReader';

export function CheckOut() {
  const [tipoOperacao, setTipoOperacao] = useState('saida'); // 'saida' ou 'entrada'
  const [nomeEvento, setNomeEvento] = useState('');
  const [mostrarLeitor, setMostrarLeitor] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState('');
  const [mensagemErro, setMensagemErro] = useState('');
  const [ultimoItemRegistrado, setUltimoItemRegistrado] = useState(null);

  const handleCodigoLido = async (codigo) => {
    setMostrarLeitor(false);
    setMensagemErro('');
    setMensagemSucesso('');
    setUltimoItemRegistrado(null);

    if (!nomeEvento.trim()) {
      setMensagemErro('Por favor, digite o nome do Evento/Cliente antes de bipar!');
      return;
    }

    setCarregando(true);

    try {
      // 1. Busca o equipamento pelo código de barras
      const { data: equipamento, error: erroBusca } = await supabase
        .from('equipamentos')
        .select('*')
        .eq('codigo_barras', codigo)
        .single();

      if (erroBusca || !equipamento) {
        setMensagemErro(`Equipamento com código "${codigo}" não foi encontrado no sistema.`);
        setCarregando(false);
        return;
      }

      // 2. Define o novo status
      const novoStatus = tipoOperacao === 'saida' ? 'Em Uso' : 'Disponível';

      // 3. Atualiza o status na tabela equipamentos
      const { error: erroAtualizacao } = await supabase
        .from('equipamentos')
        .update({ status: novoStatus })
        .eq('id', equipamento.id);

      if (erroAtualizacao) throw erroAtualizacao;

      // 4. Registra no histórico de movimentações
      const { error: erroHistorico } = await supabase
        .from('movimentacoes')
        .insert([
          {
            equipamento_id: equipamento.id,
            tipo: tipoOperacao,
            evento: nomeEvento
          }
        ]);

      if (erroHistorico) throw erroHistorico;

      // Sucesso!
      setUltimoItemRegistrado({
        nome: equipamento.nome,
        codigo,
        status: novoStatus
      });
      setMensagemSucesso(
        `Sucesso: "${equipamento.nome}" registrado como [${tipoOperacao.toUpperCase()}] para o evento "${nomeEvento}".`
      );

    } catch (err) {
      console.error(err);
      setMensagemErro('Erro ao registrar a movimentação. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '5px' }}>Controle de Galpão</h1>
      <p style={{ textAlign: 'center', color: '#666', marginBottom: '20px' }}>
        Registro de Saídas e Entradas de Equipamentos
      </p>

      {/* Selector de Modo: SAÍDA vs ENTRADA */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button
          onClick={() => setTipoOperacao('saida')}
          style={{
            flex: 1,
            padding: '14px',
            fontSize: '16px',
            fontWeight: 'bold',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            backgroundColor: tipoOperacao === 'saida' ? '#dc2626' : '#f3f4f6',
            color: tipoOperacao === 'saida' ? 'white' : '#374151',
            transition: '0.2s'
          }}
        >
          🔴 SAÍDA (Check-out)
        </button>

        <button
          onClick={() => setTipoOperacao('entrada')}
          style={{
            flex: 1,
            padding: '14px',
            fontSize: '16px',
            fontWeight: 'bold',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            backgroundColor: tipoOperacao === 'entrada' ? '#16a34a' : '#f3f4f6',
            color: tipoOperacao === 'entrada' ? 'white' : '#374151',
            transition: '0.2s'
          }}
        >
          🟢 ENTRADA (Check-in)
        </button>
      </div>

      {/* Campo para identificar o Evento / Cliente */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px' }}>
          Nome do Evento / Cliente:
        </label>
        <input
          type="text"
          placeholder="Ex: Show Sertanejo / Casamento João e Maria"
          value={nomeEvento}
          onChange={(e) => setNomeEvento(e.target.value)}
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '16px',
            borderRadius: '8px',
            border: '1px solid #ccc',
            boxSizing: 'border-box'
          }}
        />
      </div>

      {/* Botão Câmera */}
      {!mostrarLeitor && (
        <button
          onClick={() => {
            if (!nomeEvento.trim()) {
              setMensagemErro('Informe o evento antes de abrir a câmera!');
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

      {/* Câmera / Leitor */}
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
            Cancelar Câmera
          </button>
        </div>
      )}

      {/* Status da busca */}
      {carregando && (
        <p style={{ textAlign: 'center', color: '#2563eb', fontWeight: 'bold', marginTop: '15px' }}>
          ⏳ Atualizando estoque no Supabase...
        </p>
      )}

      {/* Mensagens de Feedback */}
      {mensagemErro && (
        <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '15px', borderRadius: '8px', marginTop: '15px' }}>
          <strong>Aviso:</strong> {mensagemErro}
        </div>
      )}

      {mensagemSucesso && (
        <div style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '15px', borderRadius: '8px', marginTop: '15px' }}>
          {mensagemSucesso}
        </div>
      )}

      {/* Resumo do Último Item Processado */}
      {ultimoItemRegistrado && (
        <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '15px', marginTop: '15px', backgroundColor: '#fafafa' }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#374151' }}>Último Item Processado:</h4>
          <p style={{ margin: '4px 0' }}><strong>Item:</strong> {ultimoItemRegistrado.nome}</p>
          <p style={{ margin: '4px 0' }}><strong>Código:</strong> {ultimoItemRegistrado.codigo}</p>
          <p style={{ margin: '4px 0' }}><strong>Novo Status:</strong> {ultimoItemRegistrado.status}</p>
        </div>
      )}
    </div>
  );
}