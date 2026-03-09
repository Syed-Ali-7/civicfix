# 🔍 CivicFix Debugging Guide

## Quick Reference

### Backend Debugging
```javascript
const logger = require('./utils/logger');

// Always shown (even in production)
logger.error('Database connection failed', error);
logger.warn('Deprecated API endpoint used');
logger.info('Server started on port 5000');
logger.success('Issue created successfully');

// Only in development (NODE_ENV=development)
logger.debug('User data', { id: 123, email: 'test@test.com' });
logger.request('POST', '/api/issues', { title: 'Test' });
logger.response(201, '/api/issues', { id: 'abc-123' });
```

### Mobile Debugging
```javascript
import logger from './utils/logger';

// Always shown
logger.error('API request failed', error);
logger.warn('Photo too large');
logger.info('App started');
logger.success('Issue submitted');

// Only in __DEV__ mode
logger.debug('State updated', { loading: false });
logger.api('POST', '/api/issues', formData);
logger.nav('HomeScreen', { userId: 123 });
logger.form('Submit clicked', { valid: true });
```

---

## 📱 Mobile App Debugging

### Method 1: React Native Debugger (Recommended)

1. **Install React Native Debugger**
   ```bash
   # Windows
   choco install react-native-debugger
   
   # Or download from: https://github.com/jhen0409/react-native-debugger/releases
   ```

2. **Enable Debug Mode**
   - Shake your device/emulator
   - Select "Debug" from the menu
   - React Native Debugger will open automatically

3. **Features**
   - Console logs
   - Network requests
   - Redux DevTools
   - Component inspector

### Method 2: Expo Dev Tools

1. **Start Expo**
   ```bash
   cd mobile
   npm start
   ```

2. **Open Browser Console**
   - Press `Shift + M` to open browser console
   - All console.logs appear here

3. **View Logs in Terminal**
   - Logs also appear directly in the terminal
   - Color-coded by severity

### Method 3: On-Device Console

**For Android:**
```bash
# View live logs
adb logcat *:S ReactNative:V ReactNativeJS:V

# Filter for errors only
adb logcat | grep -i "error"
```

**For iOS:**
```bash
# Open Console app
# Select your device
# Filter by "React Native"
```

---

## 🖥️ Backend Debugging

### Method 1: VS Code Debugger

1. **Create `.vscode/launch.json`**
   ```json
   {
     "version": "0.2.0",
     "configurations": [
       {
         "type": "node",
         "request": "launch",
         "name": "Debug Backend",
         "skipFiles": ["<node_internals>/**"],
         "program": "${workspaceFolder}/backend/server.js",
         "cwd": "${workspaceFolder}/backend",
         "envFile": "${workspaceFolder}/backend/.env"
       }
     ]
   }
   ```

2. **Set Breakpoints**
   - Click left of line numbers to add breakpoints
   - Press F5 to start debugging

3. **Debug Features**
   - Step through code (F10, F11)
   - Inspect variables
   - Watch expressions
   - Call stack

### Method 2: Console Logs with Logger

**Current setup in your project:**
```javascript
// backend/src/controllers/issueController.js
const logger = require('../utils/logger');

logger.debug('AI verification', { confidence: 0.87 });  // Only in dev
logger.success('Issue created', { id: 'abc' });         // Always shown
logger.error('Upload failed', error);                   // Always shown
```

### Method 3: Node Inspector

```bash
cd backend
node --inspect server.js

# Then open Chrome and go to:
# chrome://inspect
```

---

## 🔧 Common Debugging Scenarios

### Scenario 1: Mobile App Can't Connect to Backend

**Check:**
```javascript
// mobile/src/utils/api.js
console.log("🌐 Backend at:", API_BASE_URL);
```

**Solution:**
1. Verify backend is running: `http://10.100.39.79:5000/health`
2. Check firewall settings
3. Ensure same WiFi network
4. Run `ipconfig` on backend machine

### Scenario 2: Issue Upload Fails

**Mobile Side:**
```javascript
logger.form('Submit started', {
  hasTitle: !!title,
  hasPhoto: !!photo,
  coords: locationCoords
});

logger.error('Upload failed', {
  status: error.response?.status,
  message: error.message
});
```

**Backend Side:**
```javascript
logger.request('POST', '/api/issues', {
  hasFile: !!req.file,
  latitude: req.body.latitude
});

logger.error('Validation failed', errors);
```

### Scenario 3: AI Detection Not Working

```javascript
// backend/src/utils/potholeDetectionAI.js
logger.debug('Python model prediction', {
  isPothole: result.isPothole,
  confidence: result.confidence,
  threshold: 0.65
});
```

### Scenario 4: EXIF Validation Failing

```javascript
// backend/src/controllers/issueController.js
logger.debug('EXIF data', {
  hasMake: !!exif.Make,
  hasGPS: !!exif.GPSLatitude,
  dateTime: exif.DateTimeOriginal
});
```

### Scenario 5: pHash Duplicate Detection

```javascript
logger.debug('pHash comparison', {
  currentHash: phash,
  similarCount: similarImages.length,
  threshold: 80
});
```

---

## 🎯 Debugging Checklist

### Before Reporting an Issue:

- [ ] Check console logs for errors
- [ ] Verify backend is running (`/health` endpoint)
- [ ] Confirm mobile app is on same network
- [ ] Check file permissions (uploads folder)
- [ ] Verify database connection
- [ ] Test with Postman/Thunder Client
- [ ] Check environment variables (.env)
- [ ] Review recent code changes

### Information to Gather:

1. **Error message** (exact text)
2. **Console logs** (backend + mobile)
3. **Request payload** (what was sent)
4. **Response** (what came back)
5. **Environment** (dev/production)
6. **Steps to reproduce**

---

## 🚀 Production vs Development

### Development Mode
- All `logger.debug()` calls are shown
- Detailed error messages
- Stack traces visible
- Request/response logging enabled

### Production Mode
Set `NODE_ENV=production` in `.env`

- Only error/warn/info/success logs
- No debug logs
- Minimal stack traces
- Clean user-facing errors

---

## 📊 Log Levels

| Level | When to Use | Example |
|-------|-------------|---------|
| `error` | Something broke | Database connection failed |
| `warn` | Suspicious but not broken | Using deprecated API |
| `info` | Important milestones | Server started successfully |
| `success` | Completed successfully | Issue created (ID: 123) |
| `debug` | Development details | User state: { loading: false } |
| `api` | HTTP requests/responses | POST /api/issues (201) |

---

## 🛠️ Tools Installed

### Backend
✅ Custom logger (`backend/src/utils/logger.js`)
- Color-coded console output
- Development/production aware
- Structured logging

### Mobile
✅ Custom logger (`mobile/src/utils/logger.js`)
- __DEV__ flag aware
- API request tracking
- Form/navigation logging

---

## 💡 Tips

1. **Use logger.groupStart/End** for related logs
2. **Add context** to every log (IDs, timestamps)
3. **Don't log sensitive data** (passwords, tokens)
4. **Use descriptive messages** ("AI verification failed" not "Error")
5. **Log at decision points** (before if/else, try/catch)
6. **Clean up temporary logs** before committing

---

## 🔗 Useful Commands

```bash
# Backend logs
cd backend
npm run dev

# Mobile logs (Expo)
cd mobile
npm start
# Press 'j' to open debugger

# Check backend API
curl http://10.100.39.79:5000/health

# View all errors
# Backend: Check terminal
# Mobile: Shake device → Show Dev Menu → Enable Debug
```

---

## ✅ Your Debugging Setup

### Enabled:
- ✅ Backend logger with color-coded output
- ✅ Mobile logger with __DEV__ flag
- ✅ API interceptors for request/response logging
- ✅ Error boundaries on critical operations
- ✅ Strategic debug points in controllers

### Ready to Use:
```javascript
// Backend
logger.debug('Current state', data);

// Mobile
logger.debug('Screen state', state);
logger.api('POST', '/api/issues');
logger.nav('HomeScreen');
```

**All debug logs automatically disabled in production! 🎉**
