sed -i 's/import LoadingSpinner from '\''..\/components\/LoadingSpinner'\''//' src/pages/VoiceDoc.jsx
sed -i '/const error = micError || '\'''\''/d' src/pages/VoiceDoc.jsx
