import { useState, useEffect } from 'react';

function App() {
  const [sessionId, setSessionId] = useState('');
  const [sessionCode, setSessionCode] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [codesList, setCodesList] = useState([]);
  const [inputCode, setInputCode] = useState('');
  const [qrImage, setQrImage] = useState(null);
  const [ws, setWs] = useState(null);

  useEffect(() => {
    async function init() {
      const { sessionId: newSessionId, code } = await window.electron.generateSession();
      setSessionId(newSessionId);
      setSessionCode(code);
    }
    init();
  }, []);

  useEffect(() => {
    const ws = new WebSocket(`wss://localhost:8080/${sessionId}`);
    setWs(ws);

    ws.onopen = () => setIsConnected(true);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'barcode') {
        setCodesList(prev => [...prev, data.data].slice(-50));
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    return () => ws.close();
  }, [sessionId]);

  const handleManualJoin = async () => {
    if (inputCode) {
      const result = await window.electron.joinSession({ sessionId, code: parseInt(inputCode) });
      setSessionCode(result.code);
    }
  };

  const handleGenerateQr = async () => {
    const dataUrl = await new Promise((resolve) => {
      qrcode.toDataURL(sessionCode, { width: 128 }, (err, url) => {
        if (err) resolve(''); else resolve(url);
      });
    });
    setQrImage(dataUrl);
  };

  const handleSendCode = async (code) => {
    await window.electron.sendCode({ sessionId, code });
  };

  const handleClose = () => {
    setCodesList([]);
    if (ws) ws.close();
  };

  return (
    <div style={{ padding: 24, maxWidth: 360 }}>
      <h2>Barcode-QR Relay</h2>

      <div style={{ marginBottom: 16, background: '#fff', padding: 16, borderRadius: 8 }}>
        <strong>Session ID:</strong> {sessionId}
        <br />
        <input
          type="text"
          value={inputCode}
          placeholder="Manual code"
          style={{ width: '100%', marginTop: 8, padding: 8, borderRadius: 4, border: '1pxddd' }}
        />
        <button onClick={handleManualJoin} style={{ marginTop: 8, padding: 8 16, borderRadius: 4, border: 'none', background: #007AFF, color: white }}>
          Join
        </button>
      </div>

      <div style={{ marginBottom: 16, background: '#fff', padding: 16, borderRadius: 8 }}>
        <strong>Session Code:</strong> {sessionCode}
        <button onClick={handleGenerateQr} style={{ padding: 4 8, borderRadius: 4, border: 'none', background: #10B981, color: white, marginLeft: 8 }}>
          QR
        </button>
      </div>

      {qrImage && (
        <div>
          <strong>QR Code:</strong><br />
          <img src={qrImage} alt="QR" style={{ maxWidth: 128, marginTop: 8 }} />
        </div>
      )}

      <div style={{ marginTop: 24, background: '#fff', padding: 16, borderRadius: 8 }}>
        <strong>Recent Codes:</strong>
        <ul style={{ padding: 0, margin: 0, listStyle: 'none' }}>
          {codesList.map((code, i) => (
            <li key={i} style={{ padding: 4 8, margin: 4 0, background: #fafafa, borderRadius: 4 }}>
              {code}
            </li>
          ))}
          {codesList.length === 0 && <li style={{ color: '666' }}>Nenhum código recebido</li>}
        </ul>
      </div>
    </div>
  );
}

export default App;