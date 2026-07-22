import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType, Html5QrcodeSupportedFormats } from 'html5-qrcode';

export function BarcodeReader({ onScanSuccess, onScanError }) {
  const scannerRef = useRef(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Configurações do leitor de código de barras
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
      ],
      supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA]
    };

    // Inicializa o leitor na div com id="reader"
    scannerRef.current = new Html5QrcodeScanner('reader', config, false);

    const success = (decodedText) => {
      // Para a câmera assim que lê um código para evitar bipar 2 vezes seguidas
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.error(err));
      }
      
      if (onScanSuccess) {
        onScanSuccess(decodedText);
      }
    };

    const error = (err) => {
      if (err?.includes("No MultiFormat Readers were able to detect the code")) {
        return; // Ignora avisos normais enquanto a câmera está procurando o código
      }
      if (onScanError) {
        onScanError(err);
      } else {
        setErrorMessage(`Aviso da câmera: ${err}`);
      }
    };

    scannerRef.current.render(success, error);

    // Fecha a câmera ao fechar a tela/componente
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.error(err));
      }
    };
  }, [onScanSuccess, onScanError]);

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '500px', margin: '0 auto' }}>
      <h3 style={{ textAlign: 'center' }}>Aproxime o Código de Barras da Câmera</h3>
      
      {/* Área onde o vídeo da câmera será exibido */}
      <div id="reader"></div>

      {errorMessage && (
        <div style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '10px', marginTop: '10px', borderRadius: '6px' }}>
          {errorMessage}
        </div>
      )}
    </div>
  );
}