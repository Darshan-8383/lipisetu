/**
 * LipiSetu — Sanskrit learning content.
 * Alphabet, basic words, simple sentences, vocabulary and quiz bank.
 * Each item carries Sanskrit (Devanagari), IAST transliteration,
 * English and Kannada meanings.
 */

export type Letter = {
  devanagari: string;
  iast: string;
  kannada: string;
  hint: string;
};

export type LetterGroup = {
  title: string;
  subtitle: string;
  letters: Letter[];
};

export const ALPHABET: LetterGroup[] = [
  {
    title: "स्वराः — Vowels",
    subtitle: "Svara · Independent vowel letters",
    letters: [
      { devanagari: "अ", iast: "a", kannada: "ಅ", hint: "like 'u' in 'but'" },
      { devanagari: "आ", iast: "ā", kannada: "ಆ", hint: "like 'a' in 'father'" },
      { devanagari: "इ", iast: "i", kannada: "ಇ", hint: "like 'i' in 'kit'" },
      { devanagari: "ई", iast: "ī", kannada: "ಈ", hint: "like 'ee' in 'see'" },
      { devanagari: "उ", iast: "u", kannada: "ಉ", hint: "like 'u' in 'put'" },
      { devanagari: "ऊ", iast: "ū", kannada: "ಊ", hint: "like 'oo' in 'boot'" },
      { devanagari: "ऋ", iast: "ṛ", kannada: "ಋ", hint: "like 'ri' in 'rink'" },
      { devanagari: "ए", iast: "e", kannada: "ಏ", hint: "like 'e' in 'hey'" },
      { devanagari: "ऐ", iast: "ai", kannada: "ಐ", hint: "like 'ai' in 'aisle'" },
      { devanagari: "ओ", iast: "o", kannada: "ಓ", hint: "like 'o' in 'open'" },
      { devanagari: "औ", iast: "au", kannada: "ಔ", hint: "like 'ou' in 'out'" },
      { devanagari: "अं", iast: "aṃ", kannada: "ಅಂ", hint: "nasal anusvāra" },
      { devanagari: "अः", iast: "aḥ", kannada: "ಅಃ", hint: "breathy visarga" },
    ],
  },
  {
    title: "कण्ठ्याः — Guttural (Ka-series)",
    subtitle: "Kaṇṭhya · pronounced from the throat",
    letters: [
      { devanagari: "क", iast: "ka", kannada: "ಕ", hint: "unaspirated k" },
      { devanagari: "ख", iast: "kha", kannada: "ಖ", hint: "aspirated kh" },
      { devanagari: "ग", iast: "ga", kannada: "ಗ", hint: "unaspirated g" },
      { devanagari: "घ", iast: "gha", kannada: "ಘ", hint: "aspirated gh" },
      { devanagari: "ङ", iast: "ṅa", kannada: "ಙ", hint: "nasal ṅ" },
    ],
  },
  {
    title: "तालव्याः — Palatal (Cha-series)",
    subtitle: "Tālavya · pronounced with the palate",
    letters: [
      { devanagari: "च", iast: "ca", kannada: "ಚ", hint: "like 'ch' in 'church'" },
      { devanagari: "छ", iast: "cha", kannada: "ಛ", hint: "aspirated ch" },
      { devanagari: "ज", iast: "ja", kannada: "ಜ", hint: "like 'j' in 'jug'" },
      { devanagari: "झ", iast: "jha", kannada: "ಝ", hint: "aspirated jh" },
      { devanagari: "ञ", iast: "ña", kannada: "ಞ", hint: "nasal ñ" },
    ],
  },
  {
    title: "मूर्धन्याः — Cerebral (Ta-series)",
    subtitle: "Mūrdhanya · retroflex, tongue curled back",
    letters: [
      { devanagari: "ट", iast: "ṭa", kannada: "ಟ", hint: "hard retroflex t" },
      { devanagari: "ठ", iast: "ṭha", kannada: "ಠ", hint: "aspirated retroflex" },
      { devanagari: "ड", iast: "ḍa", kannada: "ಡ", hint: "retroflex d" },
      { devanagari: "ढ", iast: "ḍha", kannada: "ಢ", hint: "aspirated retroflex d" },
      { devanagari: "ण", iast: "ṇa", kannada: "ಣ", hint: "retroflex n" },
    ],
  },
  {
    title: "दन्त्याः — Dental (ta-series)",
    subtitle: "Dantya · tongue against the teeth",
    letters: [
      { devanagari: "त", iast: "ta", kannada: "ತ", hint: "soft dental t" },
      { devanagari: "थ", iast: "tha", kannada: "ಥ", hint: "aspirated dental" },
      { devanagari: "द", iast: "da", kannada: "ದ", hint: "dental d" },
      { devanagari: "ध", iast: "dha", kannada: "ಧ", hint: "aspirated dental d" },
      { devanagari: "न", iast: "na", kannada: "ನ", hint: "dental n" },
    ],
  },
  {
    title: "ओष्ठ्याः — Labial (Pa-series)",
    subtitle: "Oṣṭhya · pronounced with the lips",
    letters: [
      { devanagari: "प", iast: "pa", kannada: "ಪ", hint: "unaspirated p" },
      { devanagari: "फ", iast: "pha", kannada: "ಫ", hint: "aspirated ph" },
      { devanagari: "ब", iast: "ba", kannada: "ಬ", hint: "like 'b' in 'bat'" },
      { devanagari: "भ", iast: "bha", kannada: "ಭ", hint: "aspirated bh" },
      { devanagari: "म", iast: "ma", kannada: "ಮ", hint: "like 'm' in 'man'" },
    ],
  },
  {
    title: "अन्तःस्थाः — Semivowels & Sibilants",
    subtitle: "Antaḥstha · approximants and fricatives",
    letters: [
      { devanagari: "य", iast: "ya", kannada: "ಯ", hint: "like 'y' in 'yes'" },
      { devanagari: "र", iast: "ra", kannada: "ರ", hint: "trilled r" },
      { devanagari: "ल", iast: "la", kannada: "ಲ", hint: "like 'l' in 'lake'" },
      { devanagari: "व", iast: "va", kannada: "ವ", hint: "between v and w" },
      { devanagari: "श", iast: "śa", kannada: "ಶ", hint: "palatal sh" },
      { devanagari: "ष", iast: "ṣa", kannada: "ಷ", hint: "retroflex sh" },
      { devanagari: "स", iast: "sa", kannada: "ಸ", hint: "dental s" },
      { devanagari: "ह", iast: "ha", kannada: "ಹ", hint: "breathy h" },
    ],
  },
  {
    title: "संयुक्ताक्षराणि — Compound consonants",
    subtitle: "Saṃyuktākṣara · conjunct letters seen in inscriptions",
    letters: [
      { devanagari: "क्ष", iast: "kṣa", kannada: "ಕ್ಷ", hint: "k + ṣ" },
      { devanagari: "त्र", iast: "tra", kannada: "ತ್ರ", hint: "t + r" },
      { devanagari: "ज्ञ", iast: "jña", kannada: "ಜ್ಞ", hint: "j + ñ" },
      { devanagari: "श्र", iast: "śra", kannada: "ಶ್ರ", hint: "ś + r" },
    ],
  },
];

export type Word = {
  devanagari: string;
  iast: string;
  english: string;
  kannada: string;
  category: string;
};

export const BASIC_WORDS: Word[] = [
  { devanagari: "जलम्", iast: "jalam", english: "water", kannada: "ನೀರು", category: "Nature" },
  { devanagari: "गृहम्", iast: "gṛham", english: "house", kannada: "ಮನೆ", category: "Daily life" },
  { devanagari: "माता", iast: "mātā", english: "mother", kannada: "ತಾಯಿ", category: "Family" },
  { devanagari: "पिता", iast: "pitā", english: "father", kannada: "ತಂದೆ", category: "Family" },
  { devanagari: "सूर्यः", iast: "sūryaḥ", english: "sun", kannada: "ಸೂರ್ಯ", category: "Nature" },
  { devanagari: "चन्द्रः", iast: "candraḥ", english: "moon", kannada: "ಚಂದ್ರ", category: "Nature" },
  { devanagari: "वनम्", iast: "vanam", english: "forest", kannada: "ಕಾಡು", category: "Nature" },
  { devanagari: "नदी", iast: "nadī", english: "river", kannada: "ನದಿ", category: "Nature" },
  { devanagari: "गिरिः", iast: "giriḥ", english: "mountain", kannada: "ಬೆಟ್ಟ", category: "Nature" },
  { devanagari: "पुष्पम्", iast: "puṣpam", english: "flower", kannada: "ಹೂವು", category: "Nature" },
  { devanagari: "गजः", iast: "gajaḥ", english: "elephant", kannada: "ಆನೆ", category: "Animals" },
  { devanagari: "अश्वः", iast: "aśvaḥ", english: "horse", kannada: "ಕುದುರೆ", category: "Animals" },
  { devanagari: "सिंहः", iast: "siṃhaḥ", english: "lion", kannada: "ಸಿಂಹ", category: "Animals" },
  { devanagari: "काकः", iast: "kākaḥ", english: "crow", kannada: "ಕಾಗೆ", category: "Animals" },
  { devanagari: "पुस्तकम्", iast: "pustakam", english: "book", kannada: "ಪುಸ್ತಕ", category: "Study" },
  { devanagari: "विद्यालयः", iast: "vidyālayaḥ", english: "school", kannada: "ಶಾಲೆ", category: "Study" },
  { devanagari: "विद्या", iast: "vidyā", english: "knowledge", kannada: "ವಿದ್ಯೆ", category: "Study" },
  { devanagari: "लेखनी", iast: "lekhanī", english: "pen", kannada: "ಲೇಖನಿ", category: "Study" },
  { devanagari: "अन्नम्", iast: "annam", english: "food / rice", kannada: "ಅನ್ನ", category: "Daily life" },
  { devanagari: "दुग्धम्", iast: "dugdham", english: "milk", kannada: "ಹಾಲು", category: "Daily life" },
  { devanagari: "पथम्", iast: "patham", english: "road / path", kannada: "ದಾರಿ", category: "Daily life" },
  { devanagari: "नगरम्", iast: "nagaram", english: "city / town", kannada: "ನಗರ", category: "Daily life" },
  { devanagari: "देवः", iast: "devaḥ", english: "god / deity", kannada: "ದೇವರು", category: "Temple" },
  { devanagari: "मन्दिरम्", iast: "mandiram", english: "temple", kannada: "ದೇವಸ್ಥಾನ", category: "Temple" },
  { devanagari: "पूजा", iast: "pūjā", english: "worship", kannada: "ಪೂಜೆ", category: "Temple" },
  { devanagari: "दानम्", iast: "dānam", english: "gift / donation", kannada: "ದಾನ", category: "Temple" },
];

export type Sentence = {
  devanagari: string;
  iast: string;
  english: string;
  kannada: string;
};

export const SIMPLE_SENTENCES: Sentence[] = [
  {
    devanagari: "रामः गृहं गच्छति।",
    iast: "rāmaḥ gṛhaṃ gacchati.",
    english: "Rama goes to the house.",
    kannada: "ರಾಮನು ಮನೆಗೆ ಹೋಗುತ್ತಾನೆ.",
  },
  {
    devanagari: "सा पुस्तकं पठति।",
    iast: "sā pustakaṃ paṭhati.",
    english: "She reads a book.",
    kannada: "ಅವಳು ಪುಸ್ತಕವನ್ನು ಓದುತ್ತಾಳೆ.",
  },
  {
    devanagari: "बालकः क्रीडां करोति।",
    iast: "bālakaḥ krīḍāṃ karoti.",
    english: "The boy plays.",
    kannada: "ಬಾಲಕ ಆಟವಾಡುತ್ತಾನೆ.",
  },
  {
    devanagari: "गजः जलं पिबति।",
    iast: "gajaḥ jalaṃ pibati.",
    english: "The elephant drinks water.",
    kannada: "ಆನೆ ನೀರನ್ನು ಕುಡಿಯುತ್ತದೆ.",
  },
  {
    devanagari: "सूर्यः प्रातः उदेति।",
    iast: "sūryaḥ prātaḥ udeti.",
    english: "The sun rises in the morning.",
    kannada: "ಸೂರ್ಯ ಬೆಳಿಗ್ಗೆ ಉದಿಸುತ್ತಾನೆ.",
  },
  {
    devanagari: "विद्या वित्तं च रक्षति।",
    iast: "vidyā vittaṃ ca rakṣati.",
    english: "Knowledge and wealth protect (a person).",
    kannada: "ವಿದ್ಯೆ ಮತ್ತು ಸಂಪತ್ತು ರಕ್ಷಿಸುತ್ತವೆ.",
  },
  {
    devanagari: "अहं विद्यालयं गच्छामि।",
    iast: "ahaṃ vidyālayaṃ gacchāmi.",
    english: "I go to school.",
    kannada: "ನಾನು ಶಾಲೆಗೆ ಹೋಗುತ್ತೇನೆ.",
  },
  {
    devanagari: "त्वं कुत्र गच्छसि?",
    iast: "tvaṃ kutra gacchasi?",
    english: "Where are you going?",
    kannada: "ನೀನು ಎಲ್ಲಿಗೆ ಹೋಗುತ್ತಿರುವೆ?",
  },
  {
    devanagari: "मम नाम लिपिसेतु अस्ति।",
    iast: "mama nāma lipisetu asti.",
    english: "My name is LipiSetu.",
    kannada: "ನನ್ನ ಹೆಸರು ಲಿಪಿಸೇತು.",
  },
  {
    devanagari: "सत्यं वद। धर्मं चर।",
    iast: "satyaṃ vada. dharmaṃ cara.",
    english: "Speak the truth. Walk the path of righteousness.",
    kannada: "ಸತ್ಯವನ್ನು ಹೇಳು. ಧರ್ಮದಲ್ಲಿ ನಡೆ.",
  },
];

export type VocabItem = {
  devanagari: string;
  iast: string;
  english: string;
  kannada: string;
};

export type VocabCategory = {
  category: string;
  icon: string;
  items: VocabItem[];
};

export const VOCABULARY: VocabCategory[] = [
  {
    category: "परिवारः · Family",
    icon: "Users",
    items: [
      { devanagari: "माता", iast: "mātā", english: "mother", kannada: "ತಾಯಿ" },
      { devanagari: "पिता", iast: "pitā", english: "father", kannada: "ತಂದೆ" },
      { devanagari: "भ्राता", iast: "bhrātā", english: "brother", kannada: "ಅಣ್ಣ/ತಮ್ಮ" },
      { devanagari: "भगिनी", iast: "bhaginī", english: "sister", kannada: "ಅಕ್ಕ/ತಂಗಿ" },
      { devanagari: "पुत्रः", iast: "putraḥ", english: "son", kannada: "ಮಗ" },
      { devanagari: "पुत्री", iast: "putrī", english: "daughter", kannada: "ಮಗಳು" },
      { devanagari: "पतिः", iast: "patiḥ", english: "husband", kannada: "ಗಂಡ" },
      { devanagari: "पत्नी", iast: "patnī", english: "wife", kannada: "ಹೆಂಡತಿ" },
    ],
  },
  {
    category: "संख्याः · Numbers",
    icon: "Hash",
    items: [
      { devanagari: "एकम्", iast: "ekam", english: "one", kannada: "ಒಂದು" },
      { devanagari: "द्वे", iast: "dve", english: "two", kannada: "ಎರಡು" },
      { devanagari: "त्रीणि", iast: "trīṇi", english: "three", kannada: "ಮೂರು" },
      { devanagari: "चत्वारि", iast: "catvāri", english: "four", kannada: "ನಾಲ್ಕು" },
      { devanagari: "पञ्च", iast: "pañca", english: "five", kannada: "ಐದು" },
      { devanagari: "षट्", iast: "ṣaṭ", english: "six", kannada: "ಆರು" },
      { devanagari: "सप्त", iast: "sapta", english: "seven", kannada: "ಏಳು" },
      { devanagari: "अष्ट", iast: "aṣṭa", english: "eight", kannada: "ಎಂಟು" },
      { devanagari: "नव", iast: "nava", english: "nine", kannada: "ಒಂಬತ್ತು" },
      { devanagari: "दश", iast: "daśa", english: "ten", kannada: "ಹತ್ತು" },
    ],
  },
  {
    category: "वर्णाः · Colors",
    icon: "Palette",
    items: [
      { devanagari: "रक्तः", iast: "raktaḥ", english: "red", kannada: "ಕೆಂಪು" },
      { devanagari: "नीलः", iast: "nīlaḥ", english: "blue", kannada: "ನೀಲಿ" },
      { devanagari: "पीतः", iast: "pītaḥ", english: "yellow", kannada: "ಹಳದಿ" },
      { devanagari: "हरितः", iast: "haritaḥ", english: "green", kannada: "ಹಸಿರು" },
      { devanagari: "श्वेतः", iast: "śvetaḥ", english: "white", kannada: "ಬಿಳಿ" },
      { devanagari: "कृष्णः", iast: "kṛṣṇaḥ", english: "black", kannada: "ಕಪ್ಪು" },
    ],
  },
  {
    category: "शिलालेखशब्दाः · Inscription words",
    icon: "Landmark",
    items: [
      { devanagari: "स्वस्ति श्री", iast: "svasti śrī", english: "auspicious prosperity (opening formula)", kannada: "ಸ್ವಸ್ತಿ ಶ್ರೀ" },
      { devanagari: "सिद्धम्", iast: "siddham", english: "success! (scribal invocation)", kannada: "ಸಿದ್ಧಂ" },
      { devanagari: "शासनम्", iast: "śāsanam", english: "royal edict / inscription", kannada: "ಶಾಸನ" },
      { devanagari: "लेखः", iast: "lekhaḥ", english: "writing / record", kannada: "ಲೇಖ" },
      { devanagari: "दानम्", iast: "dānam", english: "donation / gift", kannada: "ದಾನ" },
      { devanagari: "राजा", iast: "rājā", english: "king", kannada: "ರಾಜ" },
      { devanagari: "स्थापतिः", iast: "sthāpatiḥ", english: "master sculptor / architect", kannada: "ಸ್ಥಪತಿ" },
      { devanagari: "शके", iast: "śake", english: "in the Śaka year (dating formula)", kannada: "ಶಕೆ" },
      { devanagari: "प्रशस्तिः", iast: "praśastiḥ", english: "eulogy / praise poem", kannada: "ಪ್ರಶಸ್ತಿ" },
      { devanagari: "ताम्रपत्रम्", iast: "tāmrapatram", english: "copper-plate charter", kannada: "ತಾಮ್ರಪತ್ರ" },
    ],
  },
  {
    category: "क्रियापदानि · Common verbs",
    icon: "Zap",
    items: [
      { devanagari: "गच्छति", iast: "gacchati", english: "(he/she) goes", kannada: "ಹೋಗುತ್ತಾನೆ" },
      { devanagari: "पठति", iast: "paṭhati", english: "(he/she) reads", kannada: "ಓದುತ್ತಾನೆ" },
      { devanagari: "लिखति", iast: "likhati", english: "(he/she) writes", kannada: "ಬರೆಯುತ್ತಾನೆ" },
      { devanagari: "पिबति", iast: "pibati", english: "(he/she) drinks", kannada: "ಕುಡಿಯುತ್ತಾನೆ" },
      { devanagari: "खादति", iast: "khādati", english: "(he/she) eats", kannada: "ತಿನ್ನುತ್ತಾನೆ" },
      { devanagari: "वदति", iast: "vadati", english: "(he/she) speaks", kannada: "ಆಡುತ್ತಾನೆ" },
      { devanagari: "पश्यति", iast: "paśyati", english: "(he/she) sees", kannada: "ನೋಡುತ್ತಾನೆ" },
      { devanagari: "करोति", iast: "karoti", english: "(he/she) does / makes", kannada: "ಮಾಡುತ್ತಾನೆ" },
    ],
  },
];

export type QuizQuestion = {
  id: string;
  topic: string;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
};

export const QUIZ_BANK: QuizQuestion[] = [
  {
    id: "q1",
    topic: "Alphabet",
    question: "Which vowel is this? आ",
    options: ["i (इ)", "ā (आ)", "u (उ)", "e (ए)"],
    answer: 1,
    explanation: "आ is the long 'ā' vowel, pronounced like 'a' in 'father'. Its Kannada equivalent is ಆ.",
  },
  {
    id: "q2",
    topic: "Alphabet",
    question: "What is the IAST transliteration of ष?",
    options: ["śa", "sa", "ṣa", "ha"],
    answer: 2,
    explanation: "ष is the retroflex sibilant 'ṣa', distinct from palatal श (śa) and dental स (sa).",
  },
  {
    id: "q3",
    topic: "Alphabet",
    question: "Which conjunct letter is 'kṣa'?",
    options: ["ज्ञ", "त्र", "श्र", "क्ष"],
    answer: 3,
    explanation: "क्ष = क् + ष. It appears frequently in inscription words like 'lakṣaṇa'.",
  },
  {
    id: "q4",
    topic: "Words",
    question: "'जलम्' means…",
    options: ["fire", "water", "earth", "wind"],
    answer: 1,
    explanation: "जलम् (jalam) = water, in Kannada ನೀರು (nīru). A very common word in land-grant inscriptions.",
  },
  {
    id: "q5",
    topic: "Words",
    question: "What is the Kannada meaning of 'दानम्' (dānam)?",
    options: ["ದಂಡ (fine)", "ದಾನ (donation)", "ದೇವರು (god)", "ದಾರಿ (road)"],
    answer: 1,
    explanation: "दानम् means gift or donation — inscriptions often record royal gifts to temples and Brahmins.",
  },
  {
    id: "q6",
    topic: "Words",
    question: "'मन्दिरम्' (mandiram) means…",
    options: ["market", "palace", "temple", "garden"],
    answer: 2,
    explanation: "मन्दिरम् = temple. Stone inscriptions are most often found on temple walls and pillars.",
  },
  {
    id: "q7",
    topic: "Sentences",
    question: "Translate: 'रामः गृहं गच्छति।'",
    options: [
      "Rama reads a book.",
      "Rama goes to the house.",
      "Rama builds a house.",
      "Rama leaves the house.",
    ],
    answer: 1,
    explanation: "रामः (subject) + गृहम् (object, accusative) + गच्छति (verb, 'goes'). Kannada: ರಾಮನು ಮನೆಗೆ ಹೋಗುತ್ತಾನೆ.",
  },
  {
    id: "q8",
    topic: "Sentences",
    question: "Which sentence means 'The elephant drinks water'?",
    options: [
      "गजः जलं पिबति।",
      "गजः अन्नं खादति।",
      "बालकः जलं पिबति।",
      "गजः वनं गच्छति।",
    ],
    answer: 0,
    explanation: "गजः (elephant) + जलं (water) + पिबति (drinks). Kannada: ಆನೆ ನೀರನ್ನು ಕುಡಿಯುತ್ತದೆ.",
  },
  {
    id: "q9",
    topic: "Vocabulary",
    question: "What does the inscription opening 'स्वस्ति श्री' signify?",
    options: [
      "The date of the inscription",
      "An auspicious benediction invoking prosperity",
      "The name of the king",
      "A warning to readers",
    ],
    answer: 1,
    explanation: "'svasti śrī' opens countless medieval inscriptions — an auspicious formula wishing well-being and prosperity.",
  },
  {
    id: "q10",
    topic: "Vocabulary",
    question: "'पञ्च' (pañca) is the number…",
    options: ["four", "five", "six", "seven"],
    answer: 1,
    explanation: "पञ्च = five (Kannada ಐದು). Remember 'pañcāṅga' — the five-limbed almanac.",
  },
  {
    id: "q11",
    topic: "Vocabulary",
    question: "Which word means 'copper-plate charter'?",
    options: ["प्रशस्तिः", "ताम्रपत्रम्", "शासनपत्रम्", "स्तम्भः"],
    answer: 1,
    explanation: "ताम्रपत्रम् (tāmrapatram) — royal land grants were engraved on copper plates, many in Sanskrit.",
  },
  {
    id: "q12",
    topic: "Inscriptions",
    question: "A 'स्थापतिः' (sthāpatiḥ) in an inscription is a…",
    options: [
      "royal poet",
      "master sculptor / architect",
      "tax collector",
      "temple priest",
    ],
    answer: 1,
    explanation: "The sthāpati designed and supervised temple construction — his name is often recorded in foundation inscriptions.",
  },
];

export const SAMPLE_INSCRIPTIONS = [
  {
    id: "temple",
    name: "Temple Wall Verse",
    description: "Carved Sanskrit verses on a red stone temple wall",
    path: "/samples/sample-temple.jpg",
  },
  {
    id: "pillar",
    name: "Pillar Inscription",
    description: "Devanagari record painted on an ancient pillar",
    path: "/samples/sample-pillar.jpg",
  },
  {
    id: "stele",
    name: "Weathered Stele",
    description: "A tall weathered stone slab — try image enhancement on this one",
    path: "/samples/sample-stele.jpg",
  },
  {
    id: "heritage",
    name: "Heritage Stone",
    description: "A South Indian heritage inscription stone",
    path: "/samples/sample-heritage.jpg",
  },
];
