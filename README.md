# CivicFix Project

This project consists of three main parts:

- `backend/`: A Node.js and Express server to handle API requests.
- `admin/`: A web-based admin dashboard (details to be added).
- `mobile/`: A React Native (Expo) mobile application for users to report issues.

## Development Setup

To run this project in a local development environment, the mobile app needs to connect to the backend server running on your local machine.

### Connecting the Mobile App to the Local Backend

When you switch to a different Wi-Fi network, your computer's local IP address will likely change. You must update the mobile app's configuration to point to the new IP address.

**Step 1: Find Your Local IP Address**

1.  Open a Command Prompt or PowerShell on the Windows machine running the backend server.
2.  Run the following command:
    ```sh
    ipconfig
    ```
3.  Look for the "IPv4 Address" under your active Wi-Fi network adapter. It will typically look like `192.168.x.x` or `10.x.x.x`.

**Step 2: Update the Mobile App Configuration**

1.  Open the following file in the mobile project: `mobile/src/utils/api.js`.
2.  Find the line that defines `DEV_SERVER_IP`.
3.  Replace the old IP address with the new one you found in Step 1.

    ```javascript
    // mobile/src/utils/api.js

    // Replace this with your computer's current local IP address
    const DEV_SERVER_IP = "YOUR_NEW_IP_ADDRESS_HERE";
    const PORT = 5000;

    export const API_BASE_URL = `http://${DEV_SERVER_IP}:${PORT}`;

    // ... rest of the file
    ```

**Step 3: Relaunch the App**

1.  Ensure your backend server is running.
2.  Restart the Expo development server for the mobile app.
3.  Relaunch the CivicFix app on your mobile device.

**Important:** Your mobile device and your computer running the backend server **must** be connected to the same Wi-Fi network for this to work.

---

## Troubleshooting Issue Upload Problems

If you've updated the IP address but still can't upload issues, check these common problems:

### Problem 1: Backend Server Not Running

**Solution:** Make sure the backend server is running:

```sh
cd backend
npm run dev
```

The server should show: `🚀 Server is running on port 5000 (listening on 0.0.0.0)`

### Problem 2: Windows Firewall Blocking Connections

**Solution:** Add a firewall rule to allow Node.js:

```powershell
# Run PowerShell as Administrator and execute:
netsh advfirewall firewall add rule name="Node.js Server" dir=in action=allow protocol=TCP localport=5000
```

### Problem 3: Mobile Device Not on Same Network

**Solution:** Ensure both your computer and mobile device are connected to the **exact same Wi-Fi network**. Check:

- Your computer's Wi-Fi network name
- Your phone's Wi-Fi network name
- They must match exactly

### Problem 4: Photo EXIF Metadata Issues

The backend validates photos for security and authenticity. Photos **must**:

- Be taken with your device's camera app (not downloaded or edited photos)
- Be less than 48 hours old
- Have GPS location data enabled in your camera settings
- Have EXIF metadata (camera make, model, timestamp)

**Solution:**

1. Enable Location Services for your Camera app
2. Take a new photo directly with your device's camera
3. Don't use photos from gallery that are old or edited
4. Don't use screenshots or images downloaded from internet

### Problem 5: GPS Location Validation

The backend checks if the photo's GPS coordinates match your device's location (within 1km).

**Solution:**

- Take the photo at the same location where you're reporting the issue
- Ensure GPS/Location is enabled on your device
- Wait a few seconds for GPS to get accurate location before taking photo

### Problem 6: Authentication Token Issues

**Solution:** Try logging out and logging back in to refresh your authentication token.

### Problem 7: Network Request Timeout

If uploads are timing out, the backend might be slow or unreachable.

**Solution:**

- Check backend console for errors
- Restart the backend server
- Check your WiFi signal strength
- Try moving closer to your WiFi router

---

## Testing Your Connection

To verify everything is set up correctly:

1. **Test backend health from your computer:**

   ```sh
   curl http://YOUR_IP_ADDRESS:5000/health
   ```

   Should return: `{"status":"ok"}`

2. **Check the mobile app logs:**

   - In Expo, check the console for connection errors
   - Look for messages like: `[api] health ok` (good) or `[api] health check failed` (bad)

3. **Try creating an issue:**
   - Take a fresh photo with your camera
   - Fill in title and description
   - Submit and check backend console for error messages
