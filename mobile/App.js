import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  Platform,
  ScrollView,
  RefreshControl,
  useState,
  useEffect,
} from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';

export default function App() {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [codes, setCodes] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  useEffect(() => {
    if (hasPermission === null) return;

    const ws = new WebSocket(`wss://localhost:8080/code`);
    ws.onopen = () => console.log('WS connected');
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'barcode') {
        setCodes(prev => [data.data, ...prev].slice(0, 50));
      }
    };
    ws.onclose = () => console.log('WS disconnected');

    return () => ws.close();
  }, [hasPermission]);

  const handleScan = async () => {
    if (!hasPermission) return Alert.alert('Permission denied');
    setScanning(true);
    const result = await BarCodeScanner.scanBarcodeAsync({
      types: ['all'],
    });
    setScanning(false);
    if (result.type === 'success') {
      setCodes(prev => [result.data, ...prev].slice(0, 50));
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshed={refreshing}
      onRefresh={handleRefresh}
    >
      <StatusBar style="auto" />

      <View style={styles.scannerContainer}>
        {hasPermission && !scanning ? (
          <BarCodeScanner
            scanBarcode={setResult}
            top={0}
            alwaysShowMenu={true}
            orientationLocked={['portrait']}
          />
        ) : null}

        <View style={styles.container}>
          <Text style={styles.title}>Barcode-QR Relay</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.fab}
        onPress={hasPermission ? handleScan : () => Alert.alert('Permission denied')}
        accessibilityLabel="Scan barcode/QR"
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {result && (
        <View style={styles.resultBox}>
          <Text style={styles.resultText}>Scanned: {result.data}</Text>
          <TouchableOpacity style={styles.copyBtn} onPress={() => {
            const text = result.data;
            const copy = Platform.select({ ios: 'UIPasteboard.generalAndroid.setString', android: 'clipboard.setString' });
            copy(text);
            Alert.alert('Copied', text);
          }}>
            <Text style={styles.copyText}>Copiar</Text>
          </TouchableOpacity>
        </View>
      )}

      {scanning && <Text style={styles.loadingText}>Lendo...</Text>}

      <View style={styles.listSection}>
        <Text style={styles.listTitle}>Histórico</Text>
        <Text style={styles.emptyText}>Nenhum código ainda</Text>
        {codes.length > 0 ? (
          <View style={styles.codesList}>
            {codes.map((code, i) => (
              <View key={i} style={style.codeItem}>
                <Text style={style.codeText}>{code}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scannerContainer: {
    flex: 1,
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  fabText: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
  },
  resultBox: {
    backgroundColor: '#fff',
    padding: 12,
    marginVertical: 12,
    borderRadius: 8,
    marginHorizontal: 16,
  },
  resultText: {
    fontSize: 16,
    color: '#333',
  },
  copyBtn: {
    marginTop: 8,
    padding: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
  copyText: {
    fontSize: 12,
    color: '#666',
  },
  loadingText: {
    marginHorizontal: 16,
    color: '#888',
  },
  listSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  emptyText: {
    color: '#888',
    fontStyle: 'italic',
  },
  codesList: {},
  codeItem: {
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 8,
    borderRadius: 6,
  },
  codeText: {
    fontSize: 14,
    color: '#555',
  },
});