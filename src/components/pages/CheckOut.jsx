import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { BarcodeReader } from '../components/BarcodeReader';

export function CheckOut() {
  const [mostrarLeitor, setMostrarLeitor] = useState(false);
  const [codigoLido, setCodigoLido] = useState('');
  const [equipamento, setEquipamento] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [mensagemErro, setMensagemErro] = useState('');

  // Função chamada automaticamente quando a câmera detecta um código de barras
  const handleCodigoLido = async (codigo) => {
    setMostrarLeitor(false); // Desliga a câmera
    setCodigoLido(codigo);
    setMensagemErro('');
    setEquipamento(null);
    setCarregando(true);

    // Consulta no Supabase pelo código de barras bipado
    const { data, error } = await supabase
      .from('equipamentos')
      .select('*')
      .eq('codigo_barras', codigo)
      .single();

    setCarregando(false);

    if (error || !data) {
      setMensagemErro(`Nenhum equipamento encontrado com o código: ${codigo}`);
    } else {
      setEquipamento(data);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1>Conferência de Estoque (Galpão)</h1>
      <p>Teste de leitura de código de barras e busca no Supabase</p>

      <hr style={{ margin: '20px 0' }} />

      {/* Botão para abrir a câmera */}
      {!mostrarLeitor && (
        <button
          onClick={() => setMostrarLeitor(true)}
          style={{
            backgroundColor: '#2563eb',
            color: 'white',
            padding: '12px 24px',
            fontSize: '16px',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            width: '100%'
          }}
        >
          📷 Abrir Câmera para Bipar
        </button>
      )}

      {/* Exibe o componente de leitor da câmera */}
      {mostrarLeitor && (
        <div>
          <BarcodeReader onScanSuccess={handleCodigoLido} />
          <button
            onClick={() => setMostrarLeitor(false)}
            style={{
              marginTop: '15px',
              backgroundColor: '#6b7280',
              color: 'white',
              padding: '8px 16px',
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

      {/* Indicador de Busca */}
      {carregando && <p style={{ color: '#2563eb', fontWeight: 'bold' }}>🔍 Buscando no Supabase...</p>}

      {/* Mensagem de Erro */}
      {mensagemErro && (
        <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '15px', borderRadius: '8px', marginTop: '20px' }}>
          <strong>Aviso:</strong> {mensagemErro}
        </div>
      )}

      {/* Card do Equipamento Encontrado */}
      {equipamento && (
        <div style={{ border: '2px solid #22c55e', borderRadius: '8px', padding: '20px', marginTop: '20px', backgroundColor: '#f0fdf4' }}>
          <span style={{ backgroundColor: '#22c55e', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
            ITEM LOCALIZADO
          </span>
          <h2 style={{ margin: '10px 0 5px 0' }}>{equipamento.nome}</h2>
          <p><strong>Código de Barras:</strong> {codigoLido}</p>
          <p><strong>Status Atual:</strong> {equipamento.status}</p>
          <p><strong>Condição:</strong> {equipamento.condicao}</p>
        </div>
      )}
    </div>
  );
}