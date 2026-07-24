const VARIANTES = {
  grande: {
    barWidth: 10,
    barHeight: 45,
    dotSize: 14,
    dotOffsets: [18, 8, 22, 10, 26],
    tituloSize: 20,
    subtituloSize: 18,
    marcaSize: 9,
  },
  pequena: {
    barWidth: 8,
    barHeight: 38,
    dotSize: 12,
    dotOffsets: [14, 6, 18, 8, 22],
    tituloSize: 16,
    subtituloSize: 14,
    marcaSize: 7.5,
  },
};

export function Logo({ tamanho = 'grande', style }) {
  const v = VARIANTES[tamanho] || VARIANTES.grande;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', ...style }}>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '8px' }}>
        {v.dotOffsets.map((top, i) => (
          <div
            key={i}
            style={{
              width: `${v.barWidth}px`,
              height: `${v.barHeight}px`,
              borderRadius: '5px',
              background: 'linear-gradient(180deg, #001f54 0%, #00b4d8 100%)',
              position: 'relative',
            }}
          >
            <div
              style={{
                width: `${v.dotSize}px`,
                height: `${v.dotSize}px`,
                borderRadius: '50%',
                border: '2px solid #000',
                backgroundColor: '#fff',
                position: 'absolute',
                top: `${top}px`,
                left: '-4px',
              }}
            ></div>
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'center' }}>
        <div style={{ color: '#0f172a', fontWeight: '900', fontSize: `${v.tituloSize}px`, letterSpacing: '3px', lineHeight: '1.1' }}>
          PAULINHO
        </div>
        <div style={{ color: '#0f172a', fontWeight: '900', fontSize: `${v.subtituloSize}px`, letterSpacing: '2px', lineHeight: '1.1', marginTop: '2px' }}>
          PRODUÇÕES
        </div>
        <div style={{ color: '#0284c7', fontSize: `${v.marcaSize}px`, fontWeight: 'bold', letterSpacing: '2px', marginTop: '4px' }}>
          TECNOLOGIA E ESTRUTURA
        </div>
      </div>
    </div>
  );
}
