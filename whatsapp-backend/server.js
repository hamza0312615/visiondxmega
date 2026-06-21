require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');

const app = express();
const PORT = process.env.PORT || 3001;

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  '*',
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

  // Strip emojis and formatting for clean TTS output
  const cleanTtsText = text.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').replace(/[#*_~`]/g, '').trim();

  console.log(`[Edge TTS] lang="${langKey}" → voice="${voiceName}" | text="${cleanTtsText.substring(0, 60)}..."`);

  try {
    const tts = new MsEdgeTTS();
    await tts.setMetadata(voiceName, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
    
    // toStream() returns { audioStream, metadataStream, requestId }
    const { audioStream } = tts.toStream(cleanTtsText);

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

  // Strip emojis and formatting for clean TTS output
  const cleanTtsText = text.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').replace(/[#*_~`]/g, '').trim();

  console.log(`[TTS Generate] lang="${langKey}" → voice="${voiceName}" | "${cleanTtsText.substring(0, 60)}..."`);

  try {
    const tts = new MsEdgeTTS();
    await tts.setMetadata(voiceName, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);

    const { audioStream } = tts.toStream(cleanTtsText);

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

  const messageBody = `*🌟 VisionDX Medical AI Analysis 🌟*
━━━━━━━━━━━━━━━━━━━━━━━━━━
${urgencySymbol} *Urgency Assessment:* ${urgency || 'SEE_DOCTOR'}
🗣️ *Consultation Language:* ${language || 'Urdu'}
📝 *Patient Symptoms:* _"${patientSymptoms || 'Voice consultation'}"_

*🩺 AI Triage & Clinical Advice*
━━━━━━━━━━━━━━━━━━━━━━━━━━
${cleanAdvice}

*⚠️ Important Medical Disclaimer*
This is an AI-generated clinical simulation for educational purposes. Please consult a certified healthcare professional before taking any medication or making medical decisions.`;

  // ── Generate TTS voice audio of the advice ─────────────────────────────────
  let ttsAudioBase64 = null;
  let ttsVoiceName = null;
  try {
    const langKey = (language || 'en').toLowerCase().replace(/[^a-z-]/g, '').split('/')[0].trim();
    const voiceKey = langKey.includes('roman') ? 'ur-roman' :
                     langKey.includes('urdu') ? 'ur' :
                     langKey.includes('hindi') ? 'hi' :
                     langKey.includes('arabic') ? 'ar' :
                     langKey.includes('punjabi') ? 'pa' :
                     langKey.includes('bengali') ? 'bn' :
                     langKey.includes('pashto') ? 'ps' :
                     langKey.includes('sindhi') ? 'sd' : 'en';

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
      const textPayload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: metaPhone,
        type: 'text',
        text: { preview_url: false, body: messageBody }
      };

      const metaUrl = `https://graph.facebook.com/v19.0/${phoneId}/messages`;
      console.log(`[Meta API] Dispatching text to ${metaPhone}`);
      const response = await axios.post(metaUrl, textPayload, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });

      let audioMediaId = null;
      let audioSent = false;
      // ── Upload & Send Audio Message if generated ───────────────────────────
      if (ttsAudioBase64) {
        try {
          console.log(`[Meta API] Uploading TTS Voice Note to WhatsApp...`);
          // Use native fetch to upload multipart/form-data
          const audioBuffer = Buffer.from(ttsAudioBase64, 'base64');
          const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
          const formData = new FormData();
          formData.append('messaging_product', 'whatsapp');
          formData.append('file', audioBlob, 'triage_audio.mp3');

          const uploadUrl = `https://graph.facebook.com/v19.0/${phoneId}/media`;
          const uploadRes = await fetch(uploadUrl, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
          });
          const uploadData = await uploadRes.json();
          
          if (uploadData.id) {
            audioMediaId = uploadData.id;
            console.log(`[Meta API] Audio uploaded successfully. Media ID: ${audioMediaId}`);
            
            // Send the audio message
            const audioPayload = {
              messaging_product: 'whatsapp',
              recipient_type: 'individual',
              to: metaPhone,
              type: 'audio',
              audio: { id: audioMediaId }
            };
            
            await axios.post(metaUrl, audioPayload, {
              headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            });
            audioSent = true;
            console.log(`[Meta API] Audio voice note delivered to ${metaPhone}`);
          } else {
            console.warn(`[Meta API] Failed to upload audio:`, uploadData);
          }
        } catch (audioErr) {
          console.warn(`[Meta API] Error sending WhatsApp audio message:`, audioErr.message);
        }
      }

      return res.status(200).json({
        success: true,
        message: 'Triage alert dispatched successfully via Meta Cloud API.',
        audioSent,
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

// ── WhatsApp Webhook (Meta Verification) ──────────────────────────────────────
app.get('/webhook', (req, res) => {
  const verifyToken = process.env.WEBHOOK_VERIFY_TOKEN;
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === verifyToken) {
      console.log('[Meta Webhook] Verified successfully!');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  } else {
    res.status(400).send('Missing parameters');
  }
});

const processedMessageIds = new Set();

// ── WhatsApp Webhook (Incoming Messages) ──────────────────────────────────────
app.post('/webhook', async (req, res) => {
  // Acknowledge receipt to Meta immediately
  res.sendStatus(200);

  const body = req.body;

  if (body.object === 'whatsapp_business_account') {
    try {
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const message = changes?.value?.messages?.[0];
      
      if (!message || !message.id) return;

      // Deduplicate messages (Meta sometimes sends retries or duplicate webhook events)
      if (processedMessageIds.has(message.id)) {
        return;
      }
      processedMessageIds.add(message.id);
      
      // Prevent memory leak by clearing old IDs periodically
      if (processedMessageIds.size > 1000) {
        processedMessageIds.clear();
      }

      const userPhone = message.from;
      const groqKey = process.env.GROQ_API_KEY;
      const metaToken = process.env.META_ACCESS_TOKEN;
      const phoneId = process.env.META_PHONE_NUMBER_ID;

      if (!groqKey || !metaToken || !phoneId) {
        console.error('[WhatsApp Incoming] Missing API keys to process message.');
        return;
      }

      let userMessage = "";
      let base64Image = null;

      // ── Handle Incoming Image ─────────────────────────────────────────────────
      if (message.type === 'image') {
        const imageId = message.image.id;
        userMessage = message.image.caption || "Please analyze this medical image.";
        console.log(`[WhatsApp Incoming] Image received from ${userPhone} with caption: "${userMessage}"`);

        // Fetch image URL from Meta
        const mediaUrlRes = await axios.get(`https://graph.facebook.com/v19.0/${imageId}`, {
          headers: { 'Authorization': `Bearer ${metaToken}` }
        });
        
        // Download binary image data
        const mediaFileRes = await axios.get(mediaUrlRes.data.url, {
          headers: { 'Authorization': `Bearer ${metaToken}` },
          responseType: 'arraybuffer'
        });
        
        const mimeType = mediaUrlRes.data.mime_type || 'image/jpeg';
        base64Image = `data:${mimeType};base64,${Buffer.from(mediaFileRes.data, 'binary').toString('base64')}`;
      } 
      // ── Handle Incoming Audio/Voice Note ──────────────────────────────────────
      else if (message.type === 'audio' || message.type === 'voice') {
        const audioId = message.type === 'audio' ? message.audio.id : message.voice.id;
        console.log(`[WhatsApp Incoming] Voice note received from ${userPhone}. Transcribing...`);

        // Fetch audio URL from Meta
        const mediaUrlRes = await axios.get(`https://graph.facebook.com/v19.0/${audioId}`, {
          headers: { 'Authorization': `Bearer ${metaToken}` }
        });

        // Download binary audio data
        const mediaFileRes = await axios.get(mediaUrlRes.data.url, {
          headers: { 'Authorization': `Bearer ${metaToken}` },
          responseType: 'arraybuffer'
        });

        // Use native fetch to upload to Groq Whisper
        const audioBlob = new Blob([Buffer.from(mediaFileRes.data, 'binary')], { type: 'audio/ogg' });
        const formData = new FormData();
        formData.append('file', audioBlob, 'voice.ogg');
        formData.append('model', 'whisper-large-v3');

        const whisperRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${groqKey}` },
          body: formData
        });
        const whisperData = await whisperRes.json();
        userMessage = whisperData.text || "Voice note could not be transcribed.";
        console.log(`[WhatsApp Incoming] Transcribed Voice Note: "${userMessage}"`);
      } 
      // ── Handle Incoming Text ──────────────────────────────────────────────────
      else if (message.type === 'text') {
        userMessage = message.text.body;
        console.log(`[WhatsApp Incoming] Text from ${userPhone}: "${userMessage}"`);
      } else {
        console.log(`[WhatsApp Incoming] Unsupported message type: ${message.type}`);
        return;
      }

      // 1. Send to Groq AI for analysis (with JSON formatting for perfect TTS accents)
      const systemInstruction = `You are "VisionDX Medical AI", a highly advanced clinical doctor and vision analyzer.
User message: "${userMessage}"

If the user uploaded an IMAGE, you must detect what it is and analyze it in extreme detail:
- If it's a MEDICINE/PILL/BOX (e.g., Panadol): Act as a Medicine Verifier. Provide: 1) Verification of the drug, 2) Active ingredients, 3) Detailed Usage & Dosages, 4) Precautions & Safety measures, 5) Harmful side effects.
- If it's a SKIN RASH or WOUND: Act as a Dermatologist. Analyze the visual symptoms, suggest possible skin conditions, provide specific home care precautions, and advise if it needs a doctor.
- If it's an EYE: Act as an Ophthalmologist. Analyze redness, swelling, or abnormalities, suggest early care, and provide a medical urgency level.
- If it's general symptoms: Provide detailed possible causes, home care tips, and SUGGESTED GENERIC MEDICINES for temporary relief.

IMPORTANT: You MUST return a valid JSON object EXACTLY like this:
{
  "text_reply": "Your full, highly detailed text reply to send to the user on WhatsApp. Use emojis. (Use the exact language/script the user used, e.g., Roman Urdu, English, etc.)",
  "tts_script": "The exact same reply translated STRICTLY into the NATIVE script of that language (e.g., Arabic script for Urdu 'اردو', Devanagari for Hindi). This is for the Text-to-Speech engine so it pronounces it perfectly with the correct accent! If the reply is in English, just use English.",
  "language_code": "ur"
}
Valid language codes: 'ur' (Urdu), 'hi' (Hindi), 'en' (English), 'ar' (Arabic), 'bn' (Bengali), 'pa' (Punjabi), 'ps' (Pashto), 'sd' (Sindhi).`;

      let aiResponseText = "";
      let aiTtsScript = "";
      let voiceLangCode = "en";

      if (base64Image) {
        // Vision Model Call (Using Gemini 2.0 Flash because Groq decommissioned Vision models)
        console.log(`[Meta API] Sending image to Gemini 2.0 Flash for medical analysis...`);
        try {
          const geminiKey = process.env.GEMINI_API_KEY;
          const genAI = new GoogleGenerativeAI(geminiKey);
          const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
          
          // Format base64 for Gemini
          const b64Data = base64Image.split(',')[1];
          const mimeType = base64Image.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/)[1];

          const geminiPrompt = systemInstruction + `\n\nEnsure your ONLY output is the RAW JSON object, no markdown code blocks formatting.`;

          const result = await model.generateContent([
            geminiPrompt,
            { inlineData: { data: b64Data, mimeType } }
          ]);
          
          let responseText = result.response.text().trim();
          if (responseText.startsWith('\`\`\`json')) {
            responseText = responseText.replace(/^\`\`\`json/i, '').replace(/\`\`\`$/i, '').trim();
          }
          
          const parsed = JSON.parse(responseText);
          aiResponseText = parsed.text_reply;
          aiTtsScript = parsed.tts_script;
          voiceLangCode = parsed.language_code;
        } catch (visionErr) {
          console.error('[Gemini Vision Error]', visionErr);
          aiResponseText = "Sorry, I am currently unable to analyze images right now. Please describe your symptoms in text or voice.";
          aiTtsScript = aiResponseText;
          voiceLangCode = 'en';
        }
      } else {
        // Text Model Call
        const textRes = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: systemInstruction }],
          response_format: { type: "json_object" },
          temperature: 0.3
        }, { headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' } });
        
        const parsed = JSON.parse(textRes.data.choices[0].message.content);
        aiResponseText = parsed.text_reply;
        aiTtsScript = parsed.tts_script;
        voiceLangCode = parsed.language_code;
      }

      // 2. Format the WhatsApp Text Response
      const messageBody = `*🌟 VisionDX Medical AI Analysis 🌟*
━━━━━━━━━━━━━━━━━━━━━━━━━━
🗣️ *Your Message/Image:* _"${userMessage}"_

*🩺 AI Clinical Advice:*
━━━━━━━━━━━━━━━━━━━━━━━━━━
${aiResponseText}

*⚠️ Important Medical Disclaimer*
This is an AI-generated simulation for educational purposes. Always consult a certified healthcare professional.`;

      const metaUrl = `https://graph.facebook.com/v19.0/${phoneId}/messages`;

      // 3. Send Text Reply
      await axios.post(metaUrl, {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: userPhone,
        type: 'text',
        text: { preview_url: false, body: messageBody }
      }, { headers: { 'Authorization': `Bearer ${metaToken}` }});

      // 4. Generate & Send Voice Note using Edge TTS (Using the native script!)
      console.log(`[Meta API] Generating TTS Voice Note (Lang: ${voiceLangCode})...`);
      const voiceName = EDGE_VOICES[voiceLangCode.toLowerCase()] || EDGE_VOICES['hi'];
      
      const tts = new MsEdgeTTS();
      await tts.setMetadata(voiceName, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
      
      // Clean up native text for TTS (remove emojis and markdown)
      const cleanTtsText = aiTtsScript.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '')
        .replace(/[*_~`]/g, '')
        .replace(/[\n\r]+/g, ', ')
        .replace(/\s{2,}/g, ' ')
        .trim();
      const { audioStream } = tts.toStream(cleanTtsText);
      
      const chunks = [];
      await new Promise((resolve, reject) => {
        audioStream.on('data', (c) => chunks.push(c));
        audioStream.on('end', resolve);
        audioStream.on('error', reject);
      });
      
      const audioBuffer = Buffer.concat(chunks);
      const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
      const formData = new FormData();
      formData.append('messaging_product', 'whatsapp');
      formData.append('file', audioBlob, 'reply_audio.mp3');

      // Upload Media
      const uploadRes = await fetch(`https://graph.facebook.com/v19.0/${phoneId}/media`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${metaToken}` },
        body: formData
      });
      const uploadData = await uploadRes.json();
      
      if (uploadData.id) {
        // Send Audio
        await axios.post(metaUrl, {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: userPhone,
          type: 'audio',
          audio: { id: uploadData.id }
        }, { headers: { 'Authorization': `Bearer ${metaToken}` }});
        console.log(`[Meta API] Auto-reply text and native-accent voice note delivered to ${userPhone}!`);
      }

    } catch (err) {
      console.error('[WhatsApp Incoming] Error processing message:', err.response?.data || err.message);
    }
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
