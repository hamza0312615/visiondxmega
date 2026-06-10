/**
 * Native Browser WebSocket Client for Microsoft Edge Neural TTS
 * Bypasses the need for a backend proxy, allowing Edge TTS to work natively on static online deployments.
 */

export async function generateEdgeTTSInBrowser(text, voiceName) {
  return new Promise((resolve, reject) => {
    try {
      const ws = new WebSocket('wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=6A5AA1D4EAFF4E9FB37E23D68491D6F4');

      // Add a timeout just in case it hangs
      const timeoutId = setTimeout(() => {
        ws.close();
        reject(new Error('Edge TTS WebSocket timeout'));
      }, 15000);

      ws.onopen = () => {
        const timestamp = new Date().toISOString();
        const config = `X-Timestamp: ${timestamp}\r\nContent-Type: application/json; charset=utf-8\r\nPath: speech.config\r\n\r\n{"context":{"synthesis":{"audio":{"metadataoptions":{"sentenceBoundaryEnabled":"false","wordBoundaryEnabled":"true"},"outputFormat":"audio-24khz-48kbitrate-mono-mp3"}}}}`;
        ws.send(config);
        
        // Escape text for SSML to prevent XML parsing errors
        const escapeXml = (str) => {
          return str.replace(/[<>&'"]/g, function (c) {
              switch (c) {
                  case '<': return '&lt;';
                  case '>': return '&gt;';
                  case '&': return '&amp;';
                  case '\'': return '&apos;';
                  case '"': return '&quot;';
                  default: return c;
              }
          });
        };
        const safeText = escapeXml(text);
        
        const ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'><voice name='${voiceName}'><prosody pitch='+0Hz' rate='1.0'>${safeText}</prosody></voice></speak>`;
        
        const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });

        const request = `X-RequestId: ${uuid}\r\nContent-Type: application/ssml+xml\r\nX-Timestamp: ${timestamp}\r\nPath: ssml\r\n\r\n${ssml}`;
        ws.send(request);
      };
      
      const audioChunks = [];
      ws.onmessage = async (event) => {
        if (typeof event.data === 'string') {
          if (event.data.includes('Path: turn.end')) {
            clearTimeout(timeoutId);
            ws.close();
            const blob = new Blob(audioChunks, { type: 'audio/mpeg' });
            resolve(blob);
          }
        } else {
          // Binary data (audio mp3)
          // The binary message contains text headers before the audio payload
          const buffer = await event.data.arrayBuffer();
          const view = new Uint8Array(buffer);
          
          // Search for end of headers "\r\n\r\n" (0x0d 0x0a 0x0d 0x0a)
          let headerEndIndex = -1;
          for (let i = 0; i < view.length - 3; i++) {
            if (view[i] === 13 && view[i+1] === 10 && view[i+2] === 13 && view[i+3] === 10) {
              headerEndIndex = i + 4;
              break;
            }
          }
          if (headerEndIndex !== -1) {
            audioChunks.push(buffer.slice(headerEndIndex));
          }
        }
      };

      ws.onerror = (err) => {
        clearTimeout(timeoutId);
        reject(new Error('WebSocket connection failed'));
      };

    } catch (err) {
      reject(err);
    }
  });
}
