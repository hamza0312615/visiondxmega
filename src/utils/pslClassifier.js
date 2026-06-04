// Pakistani Sign Language (PSL) Real-Time Gesture Classifier
// Synced exactly with the 71 classes from the Dynamic Word Level Pakistan Sign Language Dataset

export const PSL_DICTIONARY = [
  { id: 'assalamualaikum', english: 'Assalam-o-Alaikum', urdu: 'السلام علیکم', description: 'Flat hand raised near the forehead, saluting gently.', category: 'Greetings' },
  { id: 'walaikumassalam', english: 'Walaikum Assalam', urdu: 'وعلیکم السلام', description: 'Salute hand returning the greeting outwards.', category: 'Greetings' },
  { id: 'hi/hello', english: 'Hello / Hi', urdu: 'ہیلو', description: 'Waving open flat hand near head.', category: 'Greetings' },
  { id: 'thankyou', english: 'Thank You', urdu: 'شکریہ', description: 'Bring active flat hand to mouth/chin and move it downwards and outward.', category: 'Greetings' },
  { id: 'goodbye', english: 'Goodbye', urdu: 'الوداع', description: 'Open hand waving side-to-side moving away.', category: 'Greetings' },
  { id: 'excuseme', english: 'Excuse Me', urdu: 'معاف کیجئے گا', description: 'Gently tapping index finger of active hand onto passive open palm.', category: 'Greetings' },
  { id: 'please', english: 'Please', urdu: 'برائے مہربانی', description: 'Place both flat open palms together in front of the chest.', category: 'Greetings' },
  { id: 'welcome', english: 'Welcome', urdu: 'خوش آمدید', description: 'Open both hands, palms facing up, moving slightly inwards towards the chest.', category: 'Greetings' },
  { id: 'goodmorning', english: 'Good Morning', urdu: 'صبح بخیر', description: 'Right open hand sweeps up like a rising sun over left arm.', category: 'Greetings' },
  { id: 'goodafternoon', english: 'Good Afternoon', urdu: 'سہ پہر بخیر', description: 'Right index pointing up, then tilting forward slightly.', category: 'Greetings' },
  { id: 'goodnight', english: 'Good Night', urdu: 'شب بخیر', description: 'Left hand horizontal, right open hand sweeps down closing over it (sunset).', category: 'Greetings' },
  { id: 'haveagoodday', english: 'Have a Good Day!', urdu: 'آپ کا دن اچھا گزرے!', description: 'Fist with thumb up (Good) followed by waving open hand.', category: 'Greetings' },
  { id: 'seeyoulater', english: 'See You Later!', urdu: 'پھر ملیں گے!', description: 'Point index to eye (See), then point forward (You) and tilt hand.', category: 'Greetings' },
  { id: 'welldone', english: 'Well Done!', urdu: 'بہت اچھے / شاباش', description: 'Both fists with thumbs up (double thumbs up) shaking slightly.', category: 'Greetings' },

  // --- Pronouns & Adverbs (7) ---
  { id: 'you', english: 'You', urdu: 'آپ', description: 'Point index finger directly forward toward the camera.', category: 'Pronouns' },
  { id: 'we', english: 'We', urdu: 'ہم', description: 'Point index finger and trace a horizontal semicircle in front of the chest.', category: 'Pronouns' },
  { id: 'mine', english: 'Mine', urdu: 'میرا', description: 'Place flat hand flat against the center of the chest.', category: 'Pronouns' },
  { id: 'all', english: 'All', urdu: 'سب', description: 'Open hand sweeping in a full horizontal circle to indicate everyone.', category: 'Pronouns' },
  { id: 'both', english: 'Both', urdu: 'دونوں', description: 'Extend index and middle fingers (V shape), moving them side-to-side.', category: 'Pronouns' },
  { id: 'absolutely', english: 'Absolutely', urdu: 'بالکل', description: 'Fist hitting flat passive palm firmly.', category: 'Adverbs' },
  { id: 'also', english: 'Also / Too', urdu: 'بھی', description: 'Index fingers of both hands touching side-by-side horizontally.', category: 'Adverbs' },

  // --- Household & Bedroom (12) ---
  { id: 'fan', english: 'Fan', urdu: 'پنکھا', description: 'Index finger pointing up, swirling in circular motions overhead.', category: 'Household' },
  { id: 'water', english: 'Water', urdu: 'پانی', description: 'Extend index, middle, and ring fingers in a W-shape. Curl thumb and pinky.', category: 'Household' },
  { id: 'bulb', english: 'Light Bulb', urdu: 'بلب', description: 'Gather fingertips together pointing up, then open them wide (flashing light).', category: 'Household' },
  { id: 'mobilephone', english: 'Mobile Phone', urdu: 'موبائل فون', description: 'Thumb and pinky extended, held near the ear (making call sign).', category: 'Household' },
  { id: 'generator', english: 'Generator', urdu: 'جنریٹر', description: 'Fist pulling a mock engine starter cord downwards.', category: 'Household' },
  { id: 'door', english: 'Door', urdu: 'دروازہ', description: 'Both flat hands side-by-side, opening outwards like double doors.', category: 'Household' },
  { id: 'garden', english: 'Garden', urdu: 'باغ', description: 'Both hands tracing flower/bush shapes in a horizontal sweep.', category: 'Household' },
  { id: 'bed', english: 'Bed', urdu: 'بستر', description: 'Hold open flat palms next to cheek, tilting head.', category: 'Household' },
  { id: 'cupboard', english: 'Cupboard', urdu: 'الماری', description: 'Hands pull open two doors, then trace shelves vertically.', category: 'Household' },
  { id: 'bedroom', english: 'Bedroom', urdu: 'سونے کا کمرہ', description: 'Sleep sign followed by tracing roof/walls outline.', category: 'Household' },
  { id: 'bench', english: 'Bench', urdu: 'بینچ', description: 'Flat hands outline horizontal seating surface, then drop down.', category: 'Household' },
  { id: 'atm', english: 'ATM', urdu: 'اے ٹی ایم', description: 'Index finger inserting a card vertically, then tapping keys.', category: 'Household' },

  // --- Bathroom & Beauty (9) ---
  { id: 'nailcutter', english: 'Nail Cutter', urdu: 'ناخن تراش', description: 'Thumb and index fingers pinching near opposite fingernails.', category: 'Bathroom' },
  { id: 'shampoo', english: 'Shampoo', urdu: 'شیمپو', description: 'Both hands rubbing hair in circular scrubbing motions.', category: 'Bathroom' },
  { id: 'razor', english: 'Razor', urdu: 'استرا', description: 'Crooked index finger dragging down cheek/chin area.', category: 'Bathroom' },
  { id: 'shower', english: 'Shower', urdu: 'شاور', description: 'Hand held above head, fingers wiggling downwards (representing water drops).', category: 'Bathroom' },
  { id: 'tissuepaper', english: 'Tissue Paper', urdu: 'ٹشو پیپر', description: 'Pinching gesture pulling virtual tissue from palm.', category: 'Bathroom' },
  { id: 'toothbrush', english: 'Toothbrush', urdu: 'ٹوتھ برش', description: 'Index finger moving horizontally back-and-forth in front of teeth.', category: 'Bathroom' },
  { id: 'toothpaste', english: 'Toothpaste', urdu: 'ٹوتھ پیسٹ', description: 'Pinching thumb and index, squeezing virtual tube onto other index.', category: 'Bathroom' },
  { id: 'beard', english: 'Beard', urdu: 'داڑھی', description: 'Stroke chin downwards with fingers gathered.', category: 'Beauty' },
  { id: 'facelotion', english: 'Face Lotion', urdu: 'فیس لوشن', description: 'Both flat hands rubbing cheeks in upward circular motions.', category: 'Beauty' },
  { id: 'bald', english: 'Bald', urdu: 'گنجا', description: 'Flat hand sweeping across the head from front to back.', category: 'Beauty' },

  // --- Transport & Places (6) ---
  { id: 'policecar', english: 'Police Car', urdu: 'پولیس کی گاڑی', description: 'Index finger waving loop above head (siren), then steering wheels.', category: 'Transport' },
  { id: 'bicycle', english: 'Bicycle', urdu: 'سائیکل', description: 'Both fists rotating in vertical loops (pedaling wheels).', category: 'Transport' },
  { id: 'bridge', english: 'Bridge', urdu: 'پل', description: 'Both open hands arc up and down from the center horizontally.', category: 'Transport' },
  { id: 'beach', english: 'Beach', urdu: 'ساحل سمندر', description: 'Open hands waving like ocean waves hitting sand.', category: 'Beach' },
  { id: 'sunglasses', english: 'Sunglasses', urdu: 'دھوپ کی عینک', description: 'C-shape with fingers near eyes, representing lenses.', category: 'Beach' },
  { id: 'lifejacket', english: 'Life Jacket', urdu: 'لائف جیکٹ', description: 'Hands trace vest outline on chest, clicking a clasp.', category: 'Beach' },
  { id: 'umbrella', english: 'Umbrella', urdu: 'چھتری', description: 'Fist holding mock handle, other open hand arcing above it.', category: 'Beach' },
  { id: 'tide', english: 'Tide', urdu: 'جوار بھاٹا', description: 'Wavy hand movements moving upwards to indicate high tide.', category: 'Beach' },

  // --- Animals & Birds (10) ---
  { id: 'dog', english: 'Dog', urdu: 'کتا', description: 'Pinching thumb and middle fingers, clicking them side-by-side.', category: 'Animals' },
  { id: 'bear', english: 'Bear', urdu: 'ریچھ', description: 'Crossing arms over chest and scratching shoulders with claw fingers.', category: 'Animals' },
  { id: 'chimpanzee', english: 'Chimpanzee', urdu: 'چمپینزی', description: 'Scratching under arms with loose fists.', category: 'Animals' },
  { id: 'elephant', english: 'Elephant', urdu: 'ہاتھی', description: 'Active arm held near nose, waving up/down like a trunk.', category: 'Animals' },
  { id: 'cow', english: 'Cow', urdu: 'گائے', description: 'Y-shape (thumb and pinky extended) on both sides of head (horns).', category: 'Animals' },
  { id: 'deer', english: 'Deer', urdu: 'ہرن', description: 'Open fingers on both hands held above ears (antlers).', category: 'Animals' },
  { id: 'peacock', english: 'Peacock', urdu: 'مور', description: 'Index and thumb pinch, other fingers open behind head (feathers).', category: 'Birds' },
  { id: 'penguin', english: 'Penguin', urdu: 'پینگوئن', description: 'Arms stiff by sides, palms flat, waddling hands.', category: 'Birds' },
  { id: 'beak', english: 'Beak', urdu: 'چونچ', description: 'Index and thumb pinching in front of mouth (representing bird beak).', category: 'Birds' },
  { id: 'crow', english: 'Crow', urdu: 'کوا', description: 'Finger beak pinching while flapping elbows.', category: 'Birds' },

  // --- Verbs & Actions (3) ---
  { id: 'bring', english: 'Bring', urdu: 'لانا', description: 'Both open hands facing up, pulling towards body.', category: 'Verbs' },
  { id: 'goaway', english: 'Go Away!', urdu: 'دور ہو جاؤ!', description: 'Flick open hand outwards aggressively (shooing motion).', category: 'Verbs' },
  { id: 'comehere', english: 'Come Here!', urdu: 'یہاں آؤ!', description: 'Active open hand waving inwards, fingers curling.', category: 'Verbs' },

  // --- Airport & Sentences (9) ---
  { id: 'airplane', english: 'Airplane', urdu: 'ہوائی جہاز', description: 'Thumb, index, and pinky extended (ILY shape) flying horizontally.', category: 'Airport' },
  { id: 'aircrash', english: 'Air Crash', urdu: 'ہوائی جہاز کا حادثہ', description: 'Airplane sign nose-diving downwards hitting passive palm.', category: 'Airport' },
  { id: 'arrival', english: 'Arrival', urdu: 'آمد', description: 'Airplane sign landing downwards onto passive flat arm.', category: 'Airport' },
  { id: 'conveyor-belt', english: 'Conveyor Belt', urdu: 'کنویئر بیلٹ', description: 'Both flat hands moving in horizontal continuous loops.', category: 'Airport' },
  { id: 'donttouch', english: "Don't Touch", urdu: 'ہاتھ مت لگائیں', description: 'Hands crossed in an X shape in front of chest shaking negatively.', category: 'Sentences' },
  { id: 'ihaveacomplaint', english: 'I Have a Complaint', urdu: 'میری ایک شکایت ہے', description: 'Index finger pointing up, then tapping passive palm repeatedly.', category: 'Sentences' },
  { id: 'cartoon', english: 'Cartoon', urdu: 'کارٹون', description: 'Index finger pulling corner of mouth sideways (funny face).', category: 'Arts' },
  { id: 'coloredpencils', english: 'Colored Pencils', urdu: 'رنگین پنسلیں', description: 'Pinching pencil sign moving across passive palm horizontally.', category: 'Arts' }
];

export const URDU_ALPHABETS = [
  { id: 'alif', letter: 'ا', english: 'Alif', description: 'Index finger pointing straight up.' },
  { id: 'bey', letter: 'ب', english: 'Bey', description: 'Hand flat horizontally, palm facing down.' },
  { id: 'pey', letter: 'پ', english: 'Pey', description: 'Three fingers extended pointing down.' },
  { id: 'tey', letter: 'ت', english: 'Tey', description: 'Index and middle finger touching horizontally.' },
  { id: 'ttey', letter: 'ٹ', english: 'Ttey', description: 'Index and middle extended, but crooked.' },
  { id: 'sey', letter: 'ث', english: 'Sey', description: 'Index, middle, and ring fingers pointing up.' },
  { id: 'jeem', letter: 'ج', english: 'Jeem', description: 'Fist with thumb extended out horizontally.' },
  { id: 'chey', letter: 'چ', english: 'Chey', description: 'Index and middle finger separated, making a C-like curve.' },
  { id: 'hey', letter: 'ح', english: 'Hey', description: 'Salute hand raised to forehead.' },
  { id: 'khey', letter: 'خ', english: 'Khey', description: 'Flat hand next to cheek.' },
  { id: 'dal', letter: 'د', english: 'Dal', description: 'Both flat hands side-by-side.' },
  { id: 'ddal', letter: 'ڈ', english: 'Ddal', description: 'Both index fingers curved.' },
  { id: 'zal', letter: 'ذ', english: 'Zal', description: 'Index finger pointing up and thumb out.' },
  { id: 'rey', letter: 'ر', english: 'Rey', description: 'Sideways index finger sweep.' },
  { id: 'rrey', letter: 'ڑ', english: 'Rrey', description: 'Sideways index finger sweep, tapping down.' },
  { id: 'zey', letter: 'ز', english: 'Zey', description: 'Index pointing up, moving in a small circle.' },
  { id: 'zhey', letter: 'ژ', english: 'Zhey', description: 'Index pointing up, moving in a circle, thumb out.' },
  { id: 'seen', letter: 'س', english: 'Seen', description: 'Waving hand moving side to side.' },
  { id: 'sheen', letter: 'ش', english: 'Sheen', description: 'Salute gesture or flat waving hand near head.' },
  { id: 'suad', letter: 'ص', english: 'Suad', description: 'Fist held horizontally.' },
  { id: 'zuad', letter: 'ض', english: 'Zuad', description: 'Fist held horizontally, thumb pointing up.' },
  { id: 'toey', letter: 'ط', english: 'Toey', description: 'Index finger pointing up and thumb curled to meet index joint.' },
  { id: 'zoey', letter: 'ظ', english: 'Zoey', description: 'Index finger pointing up, thumb curled, moving up.' },
  { id: 'ain', letter: 'ع', english: 'Ain', description: 'Flat palm on chest.' },
  { id: 'ghain', letter: 'غ', english: 'Ghain', description: 'Flat palm on chest, moving upwards.' },
  { id: 'fey', letter: 'ف', english: 'Fey', description: 'Index finger swirling loops overhead.' },
  { id: 'qaf', letter: 'ق', english: 'Qaf', description: 'Index and middle fingers pointing up like horns.' },
  { id: 'kaf', letter: 'ک', english: 'Kaf', description: 'Open palm facing sideways.' },
  { id: 'gaf', letter: 'گ', english: 'Gaf', description: 'Double flat hands facing sideways.' },
  { id: 'lam', letter: 'ل', english: 'Lam', description: 'L-shape (thumb and index extended).' },
  { id: 'meem', letter: 'م', english: 'Meem', description: 'Thumb and pinky extended like a receiver.' },
  { id: 'noon', letter: 'ن', english: 'Noon', description: 'Cup shape with open palm.' },
  { id: 'wao', letter: 'و', english: 'Wao', description: 'Sideways index finger sweep.' },
  { id: 'he_small', letter: 'ہ', english: 'Hey (small)', description: 'Salute hand raised to forehead.' },
  { id: 'hamza', letter: 'ء', english: 'Hamza', description: 'Index and thumb pinching.' },
  { id: 'ye_small', letter: 'ی', english: 'Yey (small)', description: 'ILY hand flying horizontally.' },
  { id: 'ye_large', letter: 'ے', english: 'Yey (large)', description: 'ILY hand flying, tilting up.' }
];

export const classifyUrduAlphabet = (gestureId) => {
  const mapping = {
    'welldone': { id: 'bey', letter: 'ب', english: 'Bey', description: 'Thumbs up / Bey' },
    'hi/hello': { id: 'sheen', letter: 'ش', english: 'Sheen', description: 'Waving hello / Sheen' },
    'assalamualaikum': { id: 'hey', letter: 'ہ', english: 'Hey', description: 'Salute / Hey' },
    'goodbye': { id: 'seen', letter: 'س', english: 'Seen', description: 'Waving hand / Seen' },
    'water': { id: 'pey', letter: 'پ', english: 'Pey', description: 'Water / Pey' },
    'mobilephone': { id: 'meem', letter: 'م', english: 'Meem', description: 'Mobile phone / Meem' },
    'bed': { id: 'khey', letter: 'خ', english: 'Khey', description: 'Palm on cheek / Khey' },
    'you': { id: 'alif', letter: 'ا', english: 'Alif', description: 'Pointing forward / Alif' },
    'we': { id: 'wao', letter: 'و', english: 'Wao', description: 'Sideways point / Wao' },
    'mine': { id: 'ain', letter: 'ع', english: 'Ain', description: 'Palm on chest / Ain' },
    'fan': { id: 'fey', letter: 'ف', english: 'Fey', description: 'Pointing up / Fey' },
    'airplane': { id: 'ye_small', letter: 'ی', english: 'Yey (small)', description: 'ILY sign / Yey' },
    'door': { id: 'dal', letter: 'د', english: 'Dal', description: 'Double open hands / Dal' },
    'bench': { id: 'bey', letter: 'ب', english: 'Bey', description: 'Flat palm down / Bey' },
    'friend': { id: 'dal', letter: 'د', english: 'Dal', description: 'Hooked index / Dal' },
    'please': { id: 'pey', letter: 'پ', english: 'Pey', description: 'Joined palms / Pey' },
    'welcome': { id: 'khey', letter: 'خ', english: 'Khey', description: 'Open palms up / Khey' },
    'donttouch': { id: 'tey', letter: 'ت', english: 'Tey', description: 'Wrists crossed / Tey' },
    'help': { id: 'meem', letter: 'م', english: 'Meem', description: 'Fist on palm / Meem' }
  };
  return mapping[gestureId] || null;
};

// Helper to determine Euclidean distance
const d = (p1, p2) => Math.hypot(p1.x - p2.x, p1.y - p2.y);

const getHandStates = (landmarks) => {
  const wrist = landmarks[0];
  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];
  const middleTip = landmarks[12];
  const ringTip = landmarks[16];
  const pinkyTip = landmarks[20];

  // Finger extensions
  const indexExt = landmarks[8].y < landmarks[6].y;
  const middleExt = landmarks[12].y < landmarks[10].y;
  const ringExt = landmarks[16].y < landmarks[14].y;
  const pinkyExt = landmarks[20].y < landmarks[18].y;

  // Thumb extension: check if thumb tip is far from index knuckle (5) and wrist (0)
  const thumbExt = d(landmarks[4], landmarks[9]) > d(landmarks[2], landmarks[9]) * 1.15;

  const extCount = (indexExt ? 1 : 0) + (middleExt ? 1 : 0) + (ringExt ? 1 : 0) + (pinkyExt ? 1 : 0);
  
  const isOpen = indexExt && middleExt && ringExt && pinkyExt;
  const isFist = !indexExt && !middleExt && !ringExt && !pinkyExt;

  // Palm forward heuristic: check if palm is facing camera
  const isPalmForward = landmarks[0].z < -0.01 || Math.abs(landmarks[5].z - landmarks[17].z) < 0.08;

  return {
    wrist,
    thumbTip,
    indexTip,
    middleTip,
    ringTip,
    pinkyTip,
    indexExt,
    middleExt,
    ringExt,
    pinkyExt,
    thumbExt,
    extCount,
    isOpen,
    isFist,
    isPalmForward,
    landmarks
  };
};

export const classifyGesture = (handList, handednessList, threshold = 0.65) => {
  if (!handList || handList.length === 0) return null;

  const count = handList.length;
  const hands = handList.map(getHandStates);
  
  // Calculate tolerance based on user threshold settings
  const tol = 1 - (threshold - 0.65) * 0.5;

  // --- TWO HAND GESTURES ---
  if (count === 2) {
    const [h1, h2] = hands;
    
    const distBetweenWrists = Math.hypot(h1.wrist.x - h2.wrist.x, h1.wrist.y - h2.wrist.y);
    const distBetweenIndexTips = Math.hypot(h1.indexTip.x - h2.indexTip.x, h1.indexTip.y - h2.indexTip.y);
    const distBetweenPalms = Math.hypot(h1.landmarks[9].x - h2.landmarks[9].x, h1.landmarks[9].y - h2.landmarks[9].y);

    let combinedMatch = null;

    // 1. Friend (Dost) - Index fingers crossed/hooked close
    if (h1.indexExt && h2.indexExt && h1.extCount === 1 && h2.extCount === 1 && distBetweenIndexTips < 0.08 * tol) {
      combinedMatch = { id: 'friend', english: "Friend", urdu: "دوست", description: "Hooking index fingers together." };
    }

    // 2. Please - Both open palms close together
    else if (h1.isOpen && h2.isOpen && distBetweenPalms < 0.12 * tol) {
      combinedMatch = { id: 'please', english: "Please", urdu: "برائے مہربانی", description: "Placing flat open hands together." };
    }

    // 3. Welcome - Both open hands, separated but within middle range
    else if (h1.isOpen && h2.isOpen && distBetweenPalms >= 0.12 * tol && distBetweenPalms < 0.35 * tol) {
      combinedMatch = { id: 'welcome', english: "Welcome", urdu: "خوش آمدید", description: "Opening both palms facing up." };
    }

    // 4. Don't Touch - Both wrists crossed forming an X shape
    else if (h1.isFist && h2.isFist && distBetweenWrists < 0.12 * tol) {
      combinedMatch = { id: 'donttouch', english: "Don't Touch", urdu: "ہاتھ مت لگائیں", description: "Crossing wrists in an X shape." };
    }

    // 5. Help (Madad) - One flat hand supporting a fist
    else if ((h1.isOpen && h2.isFist && Math.abs(h2.wrist.y - h1.wrist.y) < 0.18 * tol) ||
             (h2.isOpen && h1.isFist && Math.abs(h1.wrist.y - h2.wrist.y) < 0.18 * tol)) {
      combinedMatch = { id: 'help', english: "Help", urdu: "مدد", description: "One fist resting on a flat open palm." };
    }

    // 6. Door - Both flat hands side-by-side at similar height, separated outward
    else if (h1.isOpen && h2.isOpen && Math.abs(h1.wrist.y - h2.wrist.y) < 0.08 * tol && distBetweenPalms > 0.15 * tol) {
      combinedMatch = { id: 'door', english: "Door", urdu: "دروازہ", description: "Both flat hands side-by-side, opening outwards." };
    }

    // 7. Double thumbs up (Well Done)
    else if (h1.thumbExt && h1.extCount === 0 && h1.thumbTip.y < h1.landmarks[2].y &&
             h2.thumbExt && h2.extCount === 0 && h2.thumbTip.y < h2.landmarks[2].y) {
      combinedMatch = { id: 'welldone', english: "Well Done!", urdu: "بہت اچھے / شاباش", description: "Double thumbs up gesture." };
    }

    if (combinedMatch) {
      return {
        type: 'combined',
        gesture: combinedMatch
      };
    }
  }

  // --- INDIVIDUAL HAND GESTURES ---
  const gestures = [];
  for (let i = 0; i < hands.length; i++) {
    const label = handednessList?.[i]?.label || (i === 0 ? 'Right' : 'Left');
    const g = classifySingleHand(hands[i], tol);
    if (g) {
      gestures.push({
        gesture: g,
        handedness: label
      });
    }
  }

  return {
    type: 'individual',
    gestures: gestures
  };
};

const classifySingleHand = (h, tol) => {
  if (!h) return null;

  // 1. Good / Welldone / Thumbs Up
  if (h.thumbExt && h.extCount <= 1 && h.thumbTip.y < h.landmarks[2].y) {
    return { id: 'welldone', english: "Well Done!", urdu: "بہت اچھے", description: "Thumbs up gesture." };
  }

  // 2. Mobile Phone
  if (h.thumbExt && h.pinkyExt && !h.middleExt && !h.ringExt) {
    return { id: 'mobilephone', english: "Mobile Phone", urdu: "موبائل فون", description: "Thumb and pinky extended like a receiver." };
  }

  // 3. Airplane (ILY sign)
  if (h.thumbExt && h.indexExt && h.pinkyExt && !h.middleExt && !h.ringExt) {
    return { id: 'airplane', english: "Airplane", urdu: "ہوائی جہاز", description: "ILY hand flying horizontally." };
  }

  // 4. Water (W-shape)
  if (h.indexExt && h.middleExt && h.ringExt && !h.pinkyExt) {
    return { id: 'water', english: "Water", urdu: "پانی", description: "Index, middle, and ring fingers extended." };
  }

  // 5. Fan (Index finger pointing up high)
  if (h.indexExt && h.extCount === 1 && h.indexTip.y < 0.32) {
    return { id: 'fan', english: "Fan", urdu: "پنکھا", description: "Index finger pointing up." };
  }

  // 6. We (Pointing index sideways)
  if (h.indexExt && h.extCount === 1 && Math.abs(h.indexTip.x - h.wrist.x) > 0.16 / tol) {
    return { id: 'we', english: "We", urdu: "ہم", description: "Sideways index finger sweep." };
  }

  // 7. You (Pointing index forward)
  if (h.indexExt && h.extCount === 1) {
    return { id: 'you', english: "You", urdu: "آپ", description: "Index finger pointing forward." };
  }

  // 8. Bed / Sleep (Flat open hand next to cheek/ear)
  if (h.isOpen && h.wrist.y < 0.45 && Math.abs(h.wrist.x - 0.5) > 0.12 / tol && Math.abs(h.indexTip.x - h.wrist.x) < 0.06 * tol) {
    return { id: 'bed', english: "Bed", urdu: "بستر", description: "Open palm resting near ear/cheek." };
  }

  // 9. Assalamualaikum (Salute: flat palm tilted horizontally near head/forehead)
  if (h.isOpen && h.indexTip.y < 0.32 && Math.abs(h.indexTip.x - h.wrist.x) > 0.12 / tol) {
    return { id: 'assalamualaikum', english: "Assalam-o-Alaikum", urdu: "السلام علیکم", description: "Salute hand raised to forehead." };
  }

  // 10. Goodbye / Hello / Hi (Open hand waving upright and to the side of head)
  if ((h.isOpen || h.extCount >= 3) && h.indexTip.y < 0.45 && Math.abs(h.wrist.x - 0.5) > 0.08) {
    return { id: 'hi/hello', english: "Hello / Hi", urdu: "ہیلو", description: "Waving open flat hand near head." };
  }

  // 11. Bench / Table (Flat palm down, knuckles horizontal)
  if (h.isOpen && Math.abs(h.indexTip.y - h.pinkyTip.y) < 0.05 * tol && h.wrist.y > 0.52) {
    return { id: 'bench', english: "Bench", urdu: "بینچ", description: "Flat hand arcing downwards." };
  }

  // 12. Mine (Flat palm against center of the chest)
  if (h.isOpen && h.wrist.y > 0.5) {
    return { id: 'mine', english: "Mine", urdu: "میرا", description: "Flat palm on chest." };
  }

  return null;
};
