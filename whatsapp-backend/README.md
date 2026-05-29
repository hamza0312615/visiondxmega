# VisionDX WhatsApp Triage Integration Server

This is the standalone Node.js Express integration server for the **VisionDX-Mega** clinical AI diagnostics platform. It provides a secure middleware API (`POST /api/send-triage`) that programmatically formats and routes clinical assessments directly to doctors' WhatsApp numbers using either **Twilio WhatsApp API** or **Meta WhatsApp Cloud Graph API**.

---

## 🚀 Quick Start Setup

Follow these steps to run the server locally on your machine.

### Step 1: Install Dependencies
Open your terminal in this directory (`whatsapp-backend/`) and run:
```bash
npm install
```

### Step 2: Configure Environment Variables
Copy `.env.example` to create your own active environment file:
```bash
cp .env.example .env
```
Open `.env` in your text editor and choose which WhatsApp provider you want to configure (see below for instructions).

### Step 3: Run the Server
Start the local Express server in production or development mode:

**Start standard server:**
```bash
npm start
```

**Start watch mode (auto-reload on code change):**
```bash
npm run dev
```
The server will bind to `http://localhost:3001`. The frontend will automatically hook into it to route patient logs!

---

## 🛠️ Provider Configurations

Choose one of the two integrations below to receive automated triage dispatches.

### Option A: Twilio WhatsApp Sandbox (Recommended for Testing)

The Twilio Sandbox is completely free and takes less than 5 minutes to set up.

1. **Sign Up / Log In**: Go to [Twilio Console](https://www.twilio.com/console) and create a free account.
2. **Find Credentials**: On the console dashboard, copy your **Account SID** and **Auth Token**. Paste them into `.env`:
   ```env
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=your_auth_token_here
   ```
3. **Set Provider**: Set `WHATSAPP_PROVIDER=twilio` in your `.env`.
4. **Join the Sandbox**:
   - Go to **Messaging > Try it out > Send a WhatsApp message** in the Twilio sidebar.
   - You will see a phone number (usually `+14155238886`) and a message code (e.g., `join vertical-some`).
   - Send that code from your personal phone or the doctor's phone to the Sandbox number. This authorizes Twilio to deliver sandbox text dispatches to that device.
   - Configure `TWILIO_FROM_NUMBER=+14155238886` in `.env`.

---

### Option B: Meta WhatsApp Cloud API (Official Business Integration)

Meta's Cloud API allows you to send official notifications directly without forcing doctors to join a sandbox first.

1. **Create Developer Profile**: Visit the [Meta for Developers Portal](https://developers.facebook.com/) and register.
2. **Create Business App**:
   - Create a new App of type **Other** -> Select **Business**.
   - Under the products list, click **Set Up** next to **WhatsApp**.
3. **Configure Settings**:
   - In the sidebar, select **WhatsApp > Quick Start**.
   - You will see a temporary **System User Access Token**, a **Phone Number ID**, and a test phone number.
   - Copy these parameters and configure them in `.env`:
     ```env
     WHATSAPP_PROVIDER=meta
     META_ACCESS_TOKEN=your_temporary_or_permanent_system_token_here
     META_PHONE_NUMBER_ID=your_phone_number_id_here
     ```
4. **Authorize Recipient**: Add the doctor's phone number under the authorized test recipients list on the dashboard, send the initial confirmation text from the screen, and you are ready to send live clinical reports!

---

## 📡 API Endpoints

### 1. Health Status
- **URL**: `GET /api/health`
- **Response**:
  ```json
  {
    "status": "online",
    "timestamp": "2026-05-29T18:00:00.000Z",
    "provider": "twilio"
  }
  ```

### 2. Dispatch Triage Alert
- **URL**: `POST /api/send-triage`
- **Request Body**:
  ```json
  {
    "doctorPhone": "+923001234567",
    "patientSymptoms": "Severe continuous coughing, low oxygen readings, and 101F high temperature.",
    "triageAdvice": "Provide patient with direct hydration. Keep upright. Monitor O2 levels closely.",
    "urgency": "EMERGENCY",
    "language": "Urdu"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Triage alert dispatched successfully via Twilio API.",
    "sid": "SMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  }
  ```
