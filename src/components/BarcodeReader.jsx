import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

export function BarcodeReader({ onScanSuccess, onScanError }) {
  const html5QrCodeRef = useRef(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Configurações do leitor
    const config = {
      fps: 10,
      qrbox: { width: 250, height: 150 },
      aspectRatio: 1.0,
      formatsToSupport: [
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.QR_CODE
      ]
    };

    // Cria a instância do leitor vinculada à div "reader"
    const html5QrCode = new Html5Qrcode('reader');
    html5QrCodeRef.current = html5QrCode;

    const success = (decodedText) => {
      // Para o vídeo e fecha a câmera ao detectar
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().then(() => {
          html5QrCodeRef.current.clear();
          if (onScanSuccess) {
            onScanSuccess(decodedText);
          }
        }).catch(err => console.error(err));
      } else if (onScanSuccess) {
        onScanSuccess(decodedText);
      }
    };

    const error = (err) => {
      if (typeof err === 'string' && err.includes("No MultiFormat Readers were able to detect the code")) {
        return; // Ignora avisos normais enquanto busca
      }
      if (onScanError) {
        onScanError(err);
      }
    };

    // Inicia a câmera TRASEIRA automaticamente ({ facingMode: "environment" })
    html5QrCode.start(
      { facingMode: 'environment' },
      config,
      success,
      error
    ).catch(err => {
      setErrorMessage('Não foi possível acessar a câmera traseira.');
      console.error(err);
    });

    // Finaliza e encerra o vídeo quando o componente for desmontado
    return () => {
      if (html5QrCodeRef.current) {
        if (html5QrCodeRef.current.isScanning) {
          html5QrCodeRef.current.stop().then(() => {
            html5QrCodeRef.current.clear();
          }).catch(err => console.error(err));
        } else {
          html5QrCodeRef.current.clear();
        }
      }
    };
  }, [onScanSuccess, onScanError]);

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '500px', margin: '0 auto' }}>
      <h3 style={{ textAlign: 'center' }}>Aproxime o Código de Barras da Câmera</h3>
      
      {/* Área de exibição da câmera */}
      <div id="reader" style={{ width: '100%', borderRadius: '8px', overflow: 'hidden' }}></div>

      {errorMessage && (
        <div style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '10px', marginTop: '10px', borderRadius: '6px' }}>
          {errorMessage}
        </div>
      )}
    </div>
  );
}