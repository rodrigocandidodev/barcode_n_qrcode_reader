# Barcode & QR Code Reader - Multi-Component Project

A complete project with Mobile (React Native), Desktop (React + Electron), and Server (Node.js WebSocket relay) components.

## Project Structure

```
barcode_n_qrcode_reader/
├── server/          # Node.js WebSocket relay (wss)
├── desktop/         # React + Electron application
└── mobile/          # React Native application
```

## Prerequisites

- Node.js (>= v20)
- npm or yarn
- Expo Go app (for mobile physical device)
- Electron installed globally (optional, for desktop)
- Docker (for server containerization)

## Setup Instructions

### 1. Server (Node.js WebSocket Relay)

```bash
cd server
npm install
# Create TLS certs (already generated)
openssl req -x509 -newkey rsa:2048 -keyout certs/key.pem -out certs/cert.pem -days 365 -nodes -subj "/O=BarcodeRelay/CN=localhost"
npm start
```

The server will run on `wss://localhost:8080` by default.

### 2. Desktop (React + Electron)

```bash
cd desktop
npm install
npm start
# To build the Electron app:
npm run build
# Or package for distribution:
npx electron-packager . "Barcode-QR-Desktop" --out=dist --platform=win32 --arch=x64
```

The desktop app will:
- Generate a session ID and QR code
- Connect to the WebSocket relay server
- Display received codes in a list
- Support clipboard copy and file history saving
- Allow manual session joining via code

### 3. Mobile (React Native)

```bash
cd mobile
npm install
npm start
# Scan the QR code with Expo Go app or run on device/emulator
# npm run android   # for Android
# npm run ios       # for iOS
# npm run web       # for web browser
```

The mobile app features:
- Floating FAB button with code icon for scanning
- Barcode/QR code scanner using expo-barcode-scanner
- Real-time code transmission to desktop via WebSocket
- Copy to clipboard functionality
- Historical code list that clears on close

## Pairing Process

### QR Code Pairing
1. Start the server: `cd server && npm start`
2. Start the desktop: `cd desktop && npm start`
3. Start the mobile: `cd mobile && npm start`
4. The desktop will display a session code and QR code
5. Mobile will automatically connect via WebSocket when scanning starts
6. Codes scanned on mobile appear on desktop list

### Manual Code Entry
1. On desktop, click "Join" and enter the manual code displayed
2. Or on mobile, use the input field to enter the session code
3. Connection established and code sharing begins

## Protocol - JSON via WebSocket

All communication uses JSON messages over WebSocket (wss://):

| Message Type | Direction | Description |
|-------------|-----------|-------------|
| `type: "barcode"` | mobile → server → desktop | Sent when a barcode/QR is scanned on mobile |
| `type: "qr"` | desktop → mobile | QR code data (session code) |
| `sessionId` | all messages | Routes messages to correct session |
| `token` | all messages | Short token for session identification |

Example message:
```json
{
  "type": "barcode",
  "data": "123456789012",
  "sessionId": "a1b2c3d4",
  "token": "xyz123abc456"
}
```

## Security

- **Transport**: wss (WebSocket Secure) with TLS encryption
- **Tokens**: Short 12-character UUID tokens per connection
- **Sanitization**: Message payloads are parsed as JSON; malformed messages are caught and logged
- **Session routing**: Messages routed by sessionId only; no cross-session broadcasting

## Persistence

- **In-memory list**: Code history exists only during the session
- **Optional desktop history**: Codes can be saved to `~/barcode-history/{sessionId}.json` (disabled by default)
- **Volatile list**: List clears when the desktop app is closed

## Docker (Server)

```bash
cd server
docker build -t barcode-relay .
docker run -d -p 8080:8080 barcode-relay
```

The Dockerfile uses Node.js 20 Alpine and exposes port 8080.

## Development Scripts

- `yarn start` - Start the respective application
- `yarn build` - Build the respective application
- `npm test` - Run basic tests (currently placeholder)

## Unit Tests

Basic test structure is in place. Run tests with:

```bash
# Server
cd server && npm test

# Desktop
cd desktop && npm test

# Mobile tests require expo-config
```