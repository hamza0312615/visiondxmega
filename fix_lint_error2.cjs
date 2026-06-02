const fs = require('fs');
let code = fs.readFileSync('src/pages/VoiceDoc.jsx', 'utf8');
code = code.replace("import LoadingSpinner from \"../components/LoadingSpinner\";\n", "");
fs.writeFileSync('src/pages/VoiceDoc.jsx', code);
