// Tiny hand-rolled i18n — no library needed for ~30 short strings across
// 3 languages. `language` is a global preference (src/services/preferences.js);
// the switcher lives only on the Guide screen, but every screen reads it.

export const LANGUAGES = ['en', 'ur', 'roman'];

export const LANGUAGE_LABEL = {
  en: '🇬🇧 English',
  ur: '🇵🇰 اردو',
  roman: '🇵🇰 Roman Urdu',
};

const DICT = {
  appName: { en: 'Rasta', ur: 'راستہ', roman: 'Rasta' },
  homeTitle: { en: 'Where do you want to go?', ur: 'کہاں جانا ہے؟', roman: 'Kahan jana hai?' },
  homeTitleNamed: {
    en: 'Where do you want to go, {name}?',
    ur: '{name}، کہاں جانا ہے؟',
    roman: 'Kahan jana hai, {name}?',
  },
  homeSubtitle: {
    en: 'Just speak — no need to type.',
    ur: 'بس بولیں — لکھنے کی ضرورت نہیں۔',
    roman: 'Bas bol dein — likhne ki zaroorat nahi.',
  },
  micHintTranscribing: { en: 'Listening to you...', ur: 'سمجھ رہا ہوں...', roman: 'Samajh raha hoon...' },
  micHintListening: {
    en: 'Listening — tap again to stop',
    ur: 'سن رہا ہوں — روکنے کے لیے دوبارہ ٹیپ کریں',
    roman: 'Sun raha hoon — dobara tap karein rukne ke liye',
  },
  micHintIdle: { en: 'Tap to speak', ur: 'بولنے کے لیے ٹیپ کریں', roman: 'Tap karke bolein' },
  micHintUnsupported: {
    en: 'Voice input needs mic access in this browser',
    ur: 'اس براؤزر میں مائیک کی اجازت درکار ہے',
    roman: 'Voice input needs mic access in this browser',
  },
  transcriptLabel: { en: 'You said:', ur: 'آپ نے کہا:', roman: 'Aapne kaha:' },
  goButton: { en: 'Show route →', ur: 'راستہ دکھائیں ←', roman: 'Rasta dikhayein →' },
  errorMicPermission: {
    en: "Couldn't access the mic. Check browser permissions.",
    ur: 'مائیک تک رسائی نہیں ملی۔ براؤزر کی اجازتیں چیک کریں۔',
    roman: 'Mic tak rasai nahi mili. Browser permissions check karein.',
  },
  errorNoSpeech: {
    en: "Didn't catch that. Try again.",
    ur: 'کچھ سنائی نہیں دیا۔ دوبارہ کوشش کریں۔',
    roman: 'Kuch sunai nahi diya. Dobara koshish karein.',
  },
  errorTranscribeFailed: {
    en: "Couldn't understand that. Try again.",
    ur: 'آواز سمجھ نہیں آئی۔ دوبارہ کوشش کریں۔',
    roman: 'Awaz samajh nahi aayi. Dobara koshish karein.',
  },
  errorVoiceSetup: {
    en: 'Voice AI is not configured yet. Add a Groq key to server/.env.',
    ur: 'وائس AI ابھی تیار نہیں۔ server/.env میں Groq key شامل کریں۔',
    roman: 'Voice AI setup nahi hai. server/.env mein Groq key add karein.',
  },
  demoLabel: { en: 'Or pick a place:', ur: 'یا کوئی جگہ چنیں:', roman: 'Ya phir ek jagah chunein:' },
  resumeBanner: {
    en: 'Active trip: "{q}" — show again',
    ur: '"{q}" جاری سفر — دوبارہ دکھائیں',
    roman: 'Chalu safar: "{q}" — wapas dikhayein',
  },
  back: { en: '← Back', ur: '← واپس', roman: '← Wapas' },
  endTrip: { en: 'End trip ✕', ur: 'سفر ختم کریں ✕', roman: 'Safar khatam karein ✕' },
  routeLoading: { en: 'Building your route...', ur: 'راستہ بن رہا ہے...', roman: 'Rasta ban raha hai...' },
  backToStart: { en: 'Go back', ur: 'واپس جائیں', roman: 'Wapas jayein' },
  destinationLabel: { en: 'Destination', ur: 'منزل', roman: 'Manzil' },
  playAll: { en: '🔊 Play the whole route', ur: '🔊 پورا راستہ سنائیں', roman: '🔊 Poora rasta sunayein' },
  liveNavStart: { en: '📍 Start live nav', ur: '📍 لائیو نیوی گیشن شروع کریں', roman: '📍 Live nav shuru karein' },
  liveNavStop: { en: '⏹ Stop live nav', ur: '⏹ لائیو نیوی گیشن روکیں', roman: '⏹ Live nav rokein' },
  calibrationNeeded: { en: 'Calibrating direction', ur: 'سمت درست کی جا رہی ہے', roman: 'Direction calibrate ho rahi hai' },
  directionReady: { en: 'Walk in the arrow direction', ur: 'تیر کی سمت چلیں', roman: 'Teer ki taraf chalein' },
  findingGps: { en: 'Finding a precise GPS fix...', ur: 'درست GPS مقام تلاش ہو رہا ہے...', roman: 'GPS location mil rahi hai...' },
  gpsAccuracy: { en: 'GPS accuracy about {m}m', ur: 'GPS کی درستگی تقریباً {m} میٹر', roman: 'GPS accuracy taqreeban {m}m' },
  mappedSafetyPoints: { en: '{n} mapped safety points along this route', ur: 'اس راستے پر {n} حفاظتی مقامات نقشے میں ہیں', roman: 'Is raste par {n} mapped safety points hain' },
  stepLabel: { en: 'Step {n}', ur: 'قدم {n}', roman: 'Qadam {n}' },
  awayLabel: { en: '{m}m away', ur: '{m} میٹر دور', roman: '{m}m away' },
  saliencyLabel: { en: 'saliency {n}', ur: 'saliency {n}', roman: 'saliency {n}' },
  languageLabel: { en: 'Language', ur: 'زبان', roman: 'Language' },
  settingsEyebrow: { en: 'Settings', ur: 'ترتیبات', roman: 'Settings' },
  settingsTitle: {
    en: 'Change your preferences',
    ur: 'اپنی ترجیحات تبدیل کریں',
    roman: 'Apni pasand tabdeel karein',
  },
  settingsSaved: { en: 'Saved ✓', ur: 'محفوظ ہو گیا ✓', roman: 'Save ho gaya ✓' },
  onboardingEyebrow: { en: 'Welcome to Rasta', ur: 'راستہ میں خوش آمدید', roman: 'Rasta mein khush aamdeed' },
  formName: { en: 'Your name (optional)', ur: 'آپ کا نام (اختیاری)', roman: 'Aapka naam (optional)' },
  formNamePlaceholder: { en: 'Enter your name', ur: 'نام لکھیں', roman: 'Naam likhein' },
  formVoice: { en: 'Voice', ur: 'آواز', roman: 'Awaz' },
  formVoiceFemale: { en: 'Uzma (female)', ur: 'عظمیٰ (خاتون)', roman: 'Uzma (female)' },
  formVoiceMale: { en: 'Asad (male)', ur: 'اسد (مرد)', roman: 'Asad (male)' },
  formOriginLocating: {
    en: 'Finding your location...',
    ur: 'آپ کا مقام تلاش کیا جا رہا ہے...',
    roman: 'Aap ka location dhoond rahe hain...',
  },
  formOriginLabel: {
    en: 'Where are you starting from?',
    ur: 'آپ کہاں سے شروع کر رہے ہیں؟',
    roman: 'Aap kahan se shuru kar rahe hain?',
  },
  formOriginPlaceholder: {
    en: 'Type a place in Blue Area',
    ur: 'بلیو ایریا میں کوئی جگہ لکھیں',
    roman: 'Blue Area mein jagah likhein',
  },
  formGpsButton: {
    en: '📍 Use my location',
    ur: '📍 میرا مقام استعمال کریں',
    roman: '📍 Mera location istemal karein',
  },
  formErrorOrigin: {
    en: '"{q}" not found. Try somewhere near Blue Area.',
    ur: '"{q}" نہیں ملا۔ بلیو ایریا کے قریب کوئی جگہ آزمائیں۔',
    roman: '"{q}" nahi mila. Blue Area ke qareeb koi jagah try karein.',
  },
  formSaving: { en: 'One sec...', ur: 'ایک منٹ...', roman: 'Ek minute...' },
  routeNotFound: {
    en: '"{q}" not found. Try somewhere near Blue Area.',
    ur: '"{q}" نہیں ملا۔ بلیو ایریا کے قریب کوئی جگہ آزمائیں۔',
    roman: '"{q}" nahi mila. Blue Area ke qareeb koi jagah try karein.',
  },
  routeBuildFailed: {
    en: 'Could not build the route. Try again.',
    ur: 'راستہ بنانے میں مسئلہ ہوا۔ دوبارہ کوشش کریں۔',
    roman: 'Rasta banane mein masla hua. Dobara koshish karein.',
  },
  gpsPermissionError: {
    en: "Couldn't access GPS. Check location permissions.",
    ur: 'GPS تک رسائی نہیں ملی۔ لوکیشن کی اجازت چیک کریں۔',
    roman: 'GPS tak rasai nahi mili. Location permission check karein.',
  },
  arrivedTitle: { en: 'You have arrived! 🎉', ur: 'آپ پہنچ گئے! 🎉', roman: 'Aap pohanch gaye! 🎉' },
  arrivedSubtitle: {
    en: "Rasta got you here safely.",
    ur: 'راستے نے آپ کو محفوظ پہنچا دیا۔',
    roman: 'Rasta ne aapko safe pohancha diya.',
  },
  arrivedDismiss: { en: 'Done', ur: 'ٹھیک ہے', roman: 'Theek hai' },
  headingPermissionDenied: {
    en: 'Compass access was denied — the direction arrow may not point correctly.',
    ur: 'کمپاس تک رسائی نہیں ملی — سمت کا تیر درست نہیں ہو سکتا۔',
    roman: 'Compass ki permission nahi mili — direction arrow sahi nahi ho sakta.',
  },
  showDebugOverlay: { en: 'Show landmark scoring', ur: 'لینڈ مارک اسکورنگ دکھائیں', roman: 'Landmark scoring dikhayein' },
  hideDebugOverlay: { en: 'Hide landmark scoring', ur: 'لینڈ مارک اسکورنگ چھپائیں', roman: 'Landmark scoring chupayein' },
  onboardingSubmit: { en: 'Get started →', ur: 'شروع کریں ←', roman: 'Shuru karein →' },
  onboardingNext: { en: 'Next →', ur: 'اگلا ←', roman: 'Aagey →' },
  onboardingNameTitle: { en: 'What should we call you?', ur: 'ہم آپ کو کیا کہیں؟', roman: 'Hum aapko kya kahen?' },
  onboardingNameHint: {
    en: 'Totally optional — just a friendly touch.',
    ur: 'بالکل اختیاری — بس ایک دوستانہ لمس کے لیے۔',
    roman: 'Bilkul optional — sirf ek friendly touch ke liye.',
  },
  onboardingVoiceTitle: { en: 'Which voice do you like?', ur: 'کونسی آواز پسند ہے؟', roman: 'Kaunsi awaz pasand hai?' },
  onboardingVoiceHint: {
    en: "This voice will guide you along the way.",
    ur: 'یہ آواز راستے میں آپ کی رہنمائی کرے گی۔',
    roman: 'Yeh awaz aapko raste mein guide karegi.',
  },
  onboardingOriginTitle: {
    en: 'Where are you starting from?',
    ur: 'آپ کہاں سے شروع کر رہے ہیں؟',
    roman: 'Aap kahan se shuru kar rahe hain?',
  },
  onboardingOriginHint: {
    en: "We'll build your first route from here.",
    ur: 'اسی سے ہم آپ کا پہلا راستہ بنائیں گے۔',
    roman: 'Isi se hum aapka pehla rasta banayenge.',
  },
  settingsSubmit: { en: 'Save', ur: 'محفوظ کریں', roman: 'Save karein' },
  navTabLabel: { en: 'Navigation', ur: 'نیویگیشن', roman: 'Navigation' },
  settingsTabLabel: { en: 'Settings', ur: 'ترتیبات', roman: 'Settings' },
  micAriaListening: { en: 'Listening — tap to stop', ur: 'سن رہا ہوں — روکنے کے لیے ٹیپ کریں', roman: 'Sun raha hoon — tap to stop' },
  micAriaIdle: { en: 'Tap to speak your destination', ur: 'اپنی منزل بولنے کے لیے ٹیپ کریں', roman: 'Tap to speak your destination' },

  reroutingMessage: { en: 'Off route — recalculating...', ur: 'راستے سے ہٹ گئے — دوبارہ حساب لگا رہے ہیں...', roman: 'Rasta se hat gaye — dobara calculate kar rahe hain...' },
  etaRemaining: { en: '{km} km · {min} min left', ur: '{km} کلومیٹر · {min} منٹ باقی', roman: '{km} km · {min} min baaqi' },
  previewNavStart: { en: '▶ Preview navigation', ur: '▶ نیویگیشن پیش نظارہ', roman: '▶ Preview chalayein' },
  previewNavStop: { en: '⏹ Stop preview', ur: '⏹ پیش نظارہ روکیں', roman: '⏹ Preview rokein' },
  previewBadge: { en: 'PREVIEW', ur: 'پیش نظارہ', roman: 'PREVIEW' },
  askQuestionIdle: { en: '🎤 Ask a question', ur: '🎤 سوال پوچھیں', roman: '🎤 Sawal poochein' },
  askQuestionListening: { en: '🎤 Listening... tap to stop', ur: '🎤 سن رہا ہوں... ٹیپ کریں', roman: '🎤 Sun raha hoon... tap karein' },
  askQuestionHint: {
    en: "Try: \"how far?\" or \"repeat that\"",
    ur: 'آزمائیں: "کتنی دور؟" یا "دوبارہ بولیں"',
    roman: 'Try karein: "kitna door hai?" ya "phir se bolo"',
  },
  recentTripsLabel: { en: 'Recent', ur: 'حالیہ', roman: 'Recent' },
  favoritesLabel: { en: 'Favorites', ur: 'پسندیدہ', roman: 'Favorites' },
  favoriteAdd: { en: 'Add to favorites', ur: 'پسندیدہ میں شامل کریں', roman: 'Favorites mein shamil karein' },
  favoriteRemove: { en: 'Remove from favorites', ur: 'پسندیدہ سے ہٹائیں', roman: 'Favorites se hatayein' },
  searchPlaceholder: { en: 'Or type a destination', ur: 'یا منزل لکھیں', roman: 'Ya manzil likhein' },
  suggestionsLabel: { en: 'Suggestions', ur: 'تجاویز', roman: 'Suggestions' },

  cameraAssistEyebrow: { en: 'Vision assist', ur: 'بصری معاونت', roman: 'Vision assist' },
  cameraAssistTitle: { en: 'Check the path ahead', ur: 'آگے کا راستہ چیک کریں', roman: 'Aage ka rasta check karein' },
  cameraAssistStart: { en: 'Start camera', ur: 'کیمرہ شروع کریں', roman: 'Camera shuru karein' },
  cameraAssistStop: { en: 'Stop camera', ur: 'کیمرہ بند کریں', roman: 'Camera band karein' },
  cameraAssistLoading: { en: 'Loading vision model...', ur: 'ماڈل لوڈ ہو رہا ہے...', roman: 'Vision model load ho raha hai...' },
  cameraAssistPermission: {
    en: 'Camera permission is needed for vision assist.',
    ur: 'بصری معاونت کے لیے کیمرے کی اجازت درکار ہے۔',
    roman: 'Vision assist ke liye camera permission chahiye.',
  },
  cameraAssistUnsupported: {
    en: 'This browser does not support camera access.',
    ur: 'یہ براؤزر کیمرے تک رسائی کو سپورٹ نہیں کرتا۔',
    roman: 'Yeh browser camera access support nahi karta.',
  },
  cameraAssistDetected: { en: 'Detected {name} {zone}', ur: '{name} {zone} نظر آیا', roman: '{name} {zone} nazar aaya' },
  cameraAssistZoneLeft: { en: 'on the left', ur: 'بائیں', roman: 'baen taraf' },
  cameraAssistZoneRight: { en: 'on the right', ur: 'دائیں', roman: 'daen taraf' },
  cameraAssistZoneAhead: { en: 'ahead', ur: 'آگے', roman: 'aagay' },
  cameraAssistNote: {
    en: 'Assists with common objects only. Keep watching the path yourself.',
    ur: 'صرف عام اشیاء میں مدد کرتا ہے۔ خود بھی راستے پر نظر رکھیں۔',
    roman: 'Sirf common objects mein madad karta hai. Khud bhi rasta dekhte rahein.',
  },
};

export function t(language, key, vars) {
  const entry = DICT[key];
  if (!entry) return key;
  let str = entry[language] ?? entry.roman ?? entry.en;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replaceAll(`{${k}}`, v);
    }
  }
  return str;
}
