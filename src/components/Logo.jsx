export function Logo({ tamanho = 'medio' }) {
  const escala = tamanho === 'pequeno' ? 0.7 : 1;

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', transform: `scale(${escala})` }}>
      
      {/* Equalizador */}
      <div style={{ display: 'flex', gap: '6px' }}>
        <div style={{ width: '10px', height: '45px', borderRadius: '5px', background: 'linear-gradient(180deg, #001f54 0%, #00b4d8 100%)', position: 'relative' }}>
          <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid #000', backgroundColor: '#fff', position: 'absolute', top: '18px', left: '-4px' }}></div>
        </div>
        <div style={{ width: '10px', height: '45px', borderRadius: '5px', background: 'linear-gradient(180deg, #001f54 0%, #00b4d8 100%)', position: 'relative' }}>
          <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid #000', backgroundColor: '#fff', position: 'absolute', top: '8px', left: '-4px' }}></div>
        </div>
        <div style={{ width: '10px', height: '45px', borderRadius: '5px', background: 'linear-gradient(180deg, #001f54 0%, #00b4d8 100%)', position: 'relative' }}>
          <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid #000', backgroundColor: '#fff', position: 'absolute', top: '22px', left: '-4px' }}></div>
        </div>
        <div style={{ width: '10px', height: '45px', borderRadius: '5px', background: 'linear-gradient(180deg, #001f54 0%, #00b4d8 100%)', position: 'relative' }}>
          <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid #000', backgroundColor: '#fff', position: 'absolute', top: '10px', left: '-4px' }}></div>
        </div>
        <div style={{ width: '10px', height: '45px', borderRadius: '5px', background: 'linear-gradient(180deg, #001f54 0%, #00b4d8 100%)', position: 'relative' }}>
          <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid #000', backgroundColor: '#fff', position: 'absolute', top: '26px', left: '-4px' }}></div>
        </div>
      </div>

      {/* Texto da Logo */}
      <div style={{ textAlign: 'left' }}>
        <div style={{ color: '#0f172a', fontWeight: '900', fontSize: '18px', letterSpacing: '2px', lineHeight: '1' }}>
          PAULINHO
        </div>
        <div style={{ color: '#0f172a', fontWeight: '900', fontSize: '16px', letterSpacing: '1px', lineHeight: '1', marginTop: '2px' }}>
          PRODUÇÕES
        </div>
        <div style={{ color: '#0284c7', fontSize: '8px', fontWeight: 'bold', letterSpacing: '1px', marginTop: '3px' }}>
          TECNOLOGIA E ESTRUTURA
        </div>
      </div>

    </div>
  );
}