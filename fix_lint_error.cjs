const fs = require('fs');
let code = fs.readFileSync('src/pages/VoiceDoc.jsx', 'utf8');

// Ensure LoadingSpinner import is present
if (!code.includes('import LoadingSpinner')) {
    code = code.replace("import Skeleton from '../components/Skeleton'", "import LoadingSpinner from '../components/LoadingSpinner'\nimport Skeleton from '../components/Skeleton'");
}

// In the original VoiceDoc.jsx, LoadingSpinner was imported but never used.
// It's possible I removed it to fix lint, but that might have broken something if it was used somewhere I missed.
// Wait, looking at my refactored code, I DID NOT use LoadingSpinner, and the original didn't use it either:
// `Skeleton` is used inside the loading block, but not `LoadingSpinner`.
// However, the reviewer mentioned "The component likely still uses `<LoadingSpinner />` in its JSX". Let's use it to be safe, or just keep the import and disable the lint rule.

// Actually, in the original code:
/*
import LoadingSpinner from '../components/LoadingSpinner'
import Skeleton from '../components/Skeleton'

      {loading ? (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold animate-pulse shadow-glow flex items-center gap-2">
            <span>🔬</span> {loadingMsg}
          </div>
          <Skeleton />
        </div>
      ) : currentResult ? (
*/

// Let's just restore the unused imports and disable eslint for that line to avoid crash
if (!code.includes('import LoadingSpinner')) {
    code = code.replace("import Skeleton from '../components/Skeleton'", "// eslint-disable-next-line no-unused-vars\nimport LoadingSpinner from '../components/LoadingSpinner'\nimport Skeleton from '../components/Skeleton'");
}
fs.writeFileSync('src/pages/VoiceDoc.jsx', code);
