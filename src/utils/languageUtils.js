export function getLanguageInstructions(language) {
  const voices = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
  const hasUrduVoice = !!voices.find(v => v.lang.includes('ur') || v.name.includes('Urdu'));
  const useRomanUrdu = language.includes('Roman') || (language.includes('Urdu') && !hasUrduVoice);

  const displayLangName = useRomanUrdu ? 'Roman Urdu / رومن اردو' : language;

  let langInstruction = '';
  if (useRomanUrdu) {
    langInstruction = `Translate/generate your compassionate clinical response directly in highly conversational, friendly, and clear Roman Urdu (Urdu language written in standard Latin/English letters, e.g., "Aap ki report ke mutabik sab theek hai. Kisi fikar ki baat nahi hai"). Use simple everyday phrases. Keep it natural, easy to read aloud by an English voice, and extremely concise. Only write in standard Latin letters. Do NOT use Urdu script.`;
  } else if (language.includes('Urdu')) {
    langInstruction = `Provide compassionate, clear, and reassuring first-aid or home care advice directly in extremely clear, polite, and simple conversational Urdu (اردو) script. Use standard everyday Urdu words that are very easy to understand and speak aloud. Avoid difficult or archaic Persian/Arabic medical vocabulary (for example, use 'bukhār' instead of 'tap-e-shuda', 'jild' instead of 'poast', 'āṅkh' instead of 'chashm'). Keep it concise.`;
  } else {
    langInstruction = `Provide compassionate, clear, and reassuring first-aid or home care advice directly in clear, simple, conversational "${language}". Keep sentences simple and easy to understand when spoken aloud. Keep it concise.`;
  }

  return { displayLangName, langInstruction };
}
