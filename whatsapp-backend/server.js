require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const googleTTS = require('google-tts-api');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration - support both development and customizable frontend URLs
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Strictly validate origin against allowed list.
    // This rejects both unauthorized origins and requests without an Origin header.
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

app.use(express.json());

// Diagnostics / Health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    provider: process.env.WHATSAPP_PROVIDER || 'wasender'
  });
});

// Primary Endpoint to dispatch programmatically medical triage alerts
app.post('/api/send-triage', async (req, res) => {
  const { doctorPhone, patientSymptoms, triageAdvice, urgency, language } = req.body;

  if (!doctorPhone) {
    return res.status(400).json({ success: false, error: 'Doctor phone number is required.' });
  }

  // Format the phone number (strip whitespace, ensure '+' prefix for global routing)
  let formattedPhone = doctorPhone.trim().replace(/[\s\-\(\)]/g, '');
  if (!formattedPhone.startsWith('+') && !formattedPhone.startsWith('whatsapp:')) {
    formattedPhone = '+' + formattedPhone;
  }

  const urgencySymbol = urgency === 'EMERGENCY' ? '🚨' : urgency === 'SEE_DOCTOR' ? '⚠️' : '✅';
  const cleanAdvice = (triageAdvice || '').replace(/\*\*/g, '').trim();

  // Create professional visual layout text payload
  const messageBody = `🏥 *VISIONDX CLINICAL TRIAGE REPORT* 🏥
----------------------------------------
${urgencySymbol} *Urgency Level:* ${urgency || 'SEE_DOCTOR'}
🗣️ *Language:* ${language || 'Urdu'}
📝 *Patient Symptoms:* "${patientSymptoms || 'Voice consultation'}"

📌 *AI Triage Assessment & Advice:*
${cleanAdvice}

----------------------------------------
⚠️ *Important Medical Disclaimer:* VisionDX recommendations are computer-generated simulations. Always consult a certified healthcare practitioner.`;

  const provider = (process.env.WHATSAPP_PROVIDER || 'wasender').toLowerCase();

  try {
    if (provider === 'meta') {
      // 1. Meta WhatsApp Cloud API Implementation
      const token = process.env.META_ACCESS_TOKEN;
      const phoneId = process.env.META_PHONE_NUMBER_ID;

      if (!token || !phoneId) {
        throw new Error('Meta API credentials missing (META_ACCESS_TOKEN / META_PHONE_NUMBER_ID).');
      }

      const metaPhone = formattedPhone.replace('+', ''); // Meta uses digits only without leading '+'
      
      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: metaPhone,
        type: 'text',
        text: {
          preview_url: false,
          body: messageBody
        }
      };

      const metaUrl = `https://graph.facebook.com/v19.0/${phoneId}/messages`;
      
      console.log(`[Meta API] Dispatching dispatch payload to ${metaPhone}`);
      const response = await axios.post(metaUrl, payload, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('[Meta API] Dispatch successful:', response.data);
      return res.status(200).json({
        success: true,
        message: 'Triage alert dispatched successfully via Meta Cloud API.',
        details: response.data
      });

    } else {
      // 2. WaSender API Implementation (Default)
      const apiKey = process.env.WASENDER_API_KEY;
      const apiUrl = process.env.WASENDER_URL; // e.g., https://wasender.domain.com/api/send

      if (!apiKey || !apiUrl) {
        throw new Error('WaSender credentials missing (WASENDER_API_KEY / WASENDER_URL). Please set them in your .env file.');
      }

      const waPhone = formattedPhone.replace('+', ''); // WaSender typically expects numbers without '+'

      // Using the user-provided WaSender API structure
      const payload = {
        to: formattedPhone, // WaSender wants phone number with or without '+' (user provided +92 305...)
        text: messageBody
      };

      console.log(`[WaSender API] Dispatching message to ${formattedPhone} via ${apiUrl}`);
      
      const response = await axios.post(apiUrl, payload, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('[WaSender API] Dispatch successful:', response.data);
      return res.status(200).json({
        success: true,
        message: 'Triage alert dispatched successfully via WaSender API.',
        response: response.data
      });
    }
  } catch (err) {
    console.error(`[WhatsApp Error] Provider: ${provider} failed:`, err.response?.data || err.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to dispatch WhatsApp triage report.',
      message: err.response?.data?.message || err.response?.data?.error || err.message
    });
  }
});

// Google TTS Proxy
app.get('/api/tts', async (req, res) => {
  const { text, lang } = req.query;
  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }
  
  try {
    const targetLang = lang || 'en';
    const url = googleTTS.getAudioUrl(text, {
      lang: targetLang,
      slow: false,
      host: 'https://translate.google.com',
    });
    
    // Fetch the audio buffer and pipe it back
    const audioResponse = await axios.get(url, { responseType: 'arraybuffer' });
    res.set('Content-Type', 'audio/mpeg');
    res.send(audioResponse.data);
  } catch (error) {
    console.error('TTS Proxy Error:', error);
    res.status(500).json({ error: 'Failed to generate TTS' });
  }
});

app.listen(PORT, () => {
  console.log(`[VisionDX Backend] Server running at http://localhost:${PORT}`);
  console.log(`[VisionDX Backend] Configured Provider: ${process.env.WHATSAPP_PROVIDER || 'wasender'}`);
});
