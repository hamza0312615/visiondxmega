require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');

const app = express();
const PORT = process.env.PORT || 3001;

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

app.use(express.json());

// ── Microsoft Edge Neural Voice Map ──────────────────────────────────────────
// All voices are FREE - Microsoft Azure Neural TTS via Edge browser integration
// No API key required, no billing, no Google Console
const EDGE_VOICES = {
  'ur':    'ur-PK-UzmaNeural',      // Urdu (Female) — excellent Urdu script pronunciation
  'ur-pk': 'ur-PK-UzmaNeural',
  'hi':    'hi-IN-SwaraNeural',     // Hindi (Female) — Neural2 quality
  'hi-in': 'hi-IN-SwaraNeural',
  'ar':    'ar-SA-ZariyahNeural',   // Arabic Saudi Arabia (Female)
  'ar-sa': 'ar-SA-ZariyahNeural',
  'ar-xa': 'ar-SA-ZariyahNeural',
  'bn':    'bn-IN-TanishaaNeural',  // Bengali India (Female)
  'bn-in': 'bn-IN-TanishaaNeural',
  'bn-bd': 'bn-IN-TanishaaNeural',
  'pa':    'pa-IN-VaaniNeural',     // Punjabi India (Female)
  'pa-in': 'pa-IN-VaaniNeural',
  'ps':    'ps-AF-LatifaNeural',    // Pashto Afghanistan (Female) — UNIQUE to Edge TTS!
  'ps-af': 'ps-AF-LatifaNeural',
  'sd':    'sd-PK-SanaNeural',      // Sindhi Pakistan (Female) — UNIQUE to Edge TTS!
  'sd-pk': 'sd-PK-SanaNeural',
  'en':    'en-US-JennyNeural',     // English US (Female) — warm, clear
  'en-us': 'en-US-JennyNeural',
  'en-gb': 'en-GB-SoniaNeural',
  // Roman Urdu: use Hindi neural (best for Hindustani phonetics in Latin script)
  'ur-roman': 'hi-IN-SwaraNeural',
};

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    provider: process.env.WHATSAPP_PROVIDER || 'wasender',
    ttsEngine: 'Microsoft Edge Neural TTS (FREE)'
  });
});

// ── Microsoft Edge Neural TTS Endpoint ───────────────────────────────────────
// Replaces the old unofficial google-tts-api proxy
// Supports: ur, hi, ar, bn, pa, ps (Pashto!), sd (Sindhi!), en
// No API key needed, no 200-char limit, neural quality voices
app.get('/api/tts', async (req, res) => {
  const { text, lang } = req.query;

  if (!text) {
    return res.status(400).json({ error: 'text query param is required' });
  }

  // Normalize lang code to lowercase
  const langKey = (lang || 'en').toLowerCase().replace('_', '-');
  
  // Pick the best neural voice
  const voiceName = EDGE_VOICES[langKey]
    || EDGE_VOICES[langKey.split('-')[0]]
    || EDGE_VOICES['en'];

  console.log(`[Edge TTS] lang="${langKey}" → voice="${voiceName}" | text="${text.substring(0, 60)}..."`);

  try {
    const tts = new MsEdgeTTS();
    await tts.setMetadata(voiceName, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
    
    // toStream() returns { audioStream, metadataStream, requestId }
    const { audioStream } = tts.toStream(text);

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    audioStream.on('data', (chunk) => res.write(chunk));
    audioStream.on('end', () => res.end());
    audioStream.on('error', (err) => {
      console.error('[Edge TTS] Stream error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Edge TTS stream error' });
      }
    });

  } catch (err) {
    console.error('[Edge TTS] Fatal error:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate speech', details: err.message });
    }
  }
});

// ── List available Edge TTS voices (helper endpoint) ─────────────────────────
app.get('/api/tts/voices', (req, res) => {
  res.json({ voices: EDGE_VOICES, count: Object.keys(EDGE_VOICES).length });
});

// ── Generate TTS Audio as base64 (for WhatsApp voice notes) ──────────────────
// Returns { audioBase64, mimeType, voiceName, lang } so the frontend/backend
// can forward the audio to WhatsApp as a voice note or embed it in responses.
app.post('/api/tts/generate', async (req, res) => {
  const { text, lang } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'text body field is required' });
  }

  const langKey = (lang || 'en').toLowerCase().replace('_', '-');
  const voiceName = EDGE_VOICES[langKey]
    || EDGE_VOICES[langKey.split('-')[0]]
    || EDGE_VOICES['en'];

  console.log(`[TTS Generate] lang="${langKey}" → voice="${voiceName}" | "${text.substring(0, 60)}..."`);

  try {
    const tts = new MsEdgeTTS();
    await tts.setMetadata(voiceName, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);

    const { audioStream } = tts.toStream(text);

    const chunks = [];
    await new Promise((resolve, reject) => {
      audioStream.on('data', (chunk) => chunks.push(chunk));
      audioStream.on('end', resolve);
      audioStream.on('error', reject);
    });

    const audioBuffer = Buffer.concat(chunks);
    const audioBase64 = audioBuffer.toString('base64');

    return res.json({
      success: true,
      audioBase64,
      mimeType: 'audio/mpeg',
      voiceName,
      lang: langKey,
      size: audioBuffer.length
    });

  } catch (err) {
    console.error('[TTS Generate] Error:', err.message);
    return res.status(500).json({ error: 'Failed to generate audio', details: err.message });
  }
});


// ── WhatsApp Triage Dispatch Endpoint ─────────────────────────────────────────
app.post('/api/send-triage', async (req, res) => {
  const { doctorPhone, patientSymptoms, triageAdvice, urgency, language } = req.body;

  if (!doctorPhone) {
    return res.status(400).json({ success: false, error: 'Doctor phone number is required.' });
  }

  let formattedPhone = doctorPhone.trim().replace(/[\s\-\(\)]/g, '');
  if (!formattedPhone.startsWith('+') && !formattedPhone.startsWith('whatsapp:')) {
    formattedPhone = '+' + formattedPhone;
  }

  const urgencySymbol = urgency === 'EMERGENCY' ? '🚨' : urgency === 'SEE_DOCTOR' ? '⚠️' : '✅';
  const cleanAdvice = (triageAdvice || '').replace(/\*\*/g, '').trim();

  const messageBody = `🏥 *VISIONDX CLINICAL TRIAGE REPORT* 🏥
----------------------------------------
${urgencySymbol} *Urgency Level:* ${urgency || 'SEE_DOCTOR'}
🗣️ *Language:* ${language || 'Urdu'}
📝 *Patient Symptoms:* "${patientSymptoms || 'Voice consultation'}"

📌 *AI Triage Assessment & Advice:*
${cleanAdvice}

----------------------------------------
🎙️ *Voice Note:* Audio triage available — listen to AI advice below.
⚠️ *Medical Disclaimer:* VisionDX recommendations are computer-generated simulations. Always consult a certified healthcare practitioner.`;

  // ── Generate TTS voice audio of the advice ─────────────────────────────────
  let ttsAudioBase64 = null;
  let ttsVoiceName = null;
  try {
    const langKey = (language || 'en').toLowerCase().replace(/[^a-z-]/g, '').split('/')[0].trim();
    const voiceKey = langKey.includes('urdu') ? 'ur' :
                     langKey.includes('hindi') ? 'hi' :
                     langKey.includes('arabic') ? 'ar' :
                     langKey.includes('punjabi') ? 'pa' :
                     langKey.includes('bengali') ? 'bn' :
                     langKey.includes('pashto') ? 'ps' :
                     langKey.includes('sindhi') ? 'sd' :
                     langKey.includes('roman') ? 'hi' : 'en';

    ttsVoiceName = EDGE_VOICES[voiceKey] || EDGE_VOICES['en'];
    const tts = new MsEdgeTTS();
    await tts.setMetadata(ttsVoiceName, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);

    // Use plain text version for TTS (strip markdown)
    const ttsText = cleanAdvice.replace(/[#*_`]/g, '').replace(/\n{2,}/g, '. ').trim();
    const { audioStream } = tts.toStream(ttsText);

    const chunks = [];
    await new Promise((resolve, reject) => {
      audioStream.on('data', (c) => chunks.push(c));
      audioStream.on('end', resolve);
      audioStream.on('error', reject);
    });
    ttsAudioBase64 = Buffer.concat(chunks).toString('base64');
    console.log(`[TTS] Generated ${chunks.length} chunks using ${ttsVoiceName}`);
  } catch (ttsErr) {
    console.warn('[TTS] Audio generation for WhatsApp skipped:', ttsErr.message);
  }

  const provider = (process.env.WHATSAPP_PROVIDER || 'wasender').toLowerCase();


  try {
    if (provider === 'meta') {
      const token = process.env.META_ACCESS_TOKEN;
      const phoneId = process.env.META_PHONE_NUMBER_ID;

      if (!token || !phoneId) {
        throw new Error('Meta API credentials missing (META_ACCESS_TOKEN / META_PHONE_NUMBER_ID).');
      }

      const metaPhone = formattedPhone.replace('+', '');
      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: metaPhone,
        type: 'text',
        text: { preview_url: false, body: messageBody }
      };

      const metaUrl = `https://graph.facebook.com/v19.0/${phoneId}/messages`;
      console.log(`[Meta API] Dispatching to ${metaPhone}`);
      const response = await axios.post(metaUrl, payload, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });

      return res.status(200).json({
        success: true,
        message: 'Triage alert dispatched successfully via Meta Cloud API.',
        details: response.data,
        ttsAudioBase64,
        ttsVoiceName
      });

    } else {
      const apiKey = process.env.WASENDER_API_KEY;
      const apiUrl = process.env.WASENDER_URL;

      if (!apiKey || !apiUrl) {
        throw new Error('WaSender credentials missing.');
      }

      const payload = { to: formattedPhone, text: messageBody };
      console.log(`[WaSender API] Dispatching to ${formattedPhone}`);

      const response = await axios.post(apiUrl, payload, {
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
      });

      return res.status(200).json({
        success: true,
        message: 'Triage alert dispatched successfully via WaSender API.',
        response: response.data,
        ttsAudioBase64,
        ttsVoiceName
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

app.listen(PORT, () => {
  console.log(`\n🚀 [VisionDX Backend] Server running at http://localhost:${PORT}`);
  console.log(`🎙️  [TTS Engine] Microsoft Edge Neural TTS (FREE - No API key required)`);
  console.log(`📞 [WhatsApp] Provider: ${process.env.WHATSAPP_PROVIDER || 'wasender'}`);
  console.log(`\n🌐 Supported Neural Voices:`);
  console.log(`   • Urdu      → ur-PK-UzmaNeural`);
  console.log(`   • Hindi     → hi-IN-SwaraNeural`);
  console.log(`   • Arabic    → ar-SA-ZariyahNeural`);
  console.log(`   • Punjabi   → pa-IN-VaaniNeural`);
  console.log(`   • Bengali   → bn-IN-TanishaaNeural`);
  console.log(`   • Pashto    → ps-AF-LatifaNeural  ✨`);
  console.log(`   • Sindhi    → sd-PK-SanaNeural    ✨`);
  console.log(`   • English   → en-US-JennyNeural\n`);
});
