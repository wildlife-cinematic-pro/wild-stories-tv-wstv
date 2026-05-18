import expandedVocabulary from "@/data/jlpt-n2/vocabulary.expanded.json";
import expandedKanji from "@/data/jlpt-n2/kanji.expanded.json";
import expandedGrammar from "@/data/jlpt-n2/grammar.expanded.json";
import expandedReading from "@/data/jlpt-n2/reading.expanded.json";
import expandedListening from "@/data/jlpt-n2/listening.expanded.json";
import expandedMock from "@/data/jlpt-n2/mock.expanded.json";

export type JlptN2SourceCategory =
  | "kanji"
  | "vocabulary"
  | "grammar"
  | "reading"
  | "listening"
  | "mock test"
  | "mistakes"
  | "srs";

export type JlptN2Source = {
  id: string;
  name: string;
  category: JlptN2SourceCategory;
  level: "N2" | "N2 cumulative" | "User";
  url: string;
  notes: string;
  best_use?: string;
  favorite?: boolean;
  externalOnly: boolean;
  hasImportedPersonalNotes: boolean;
  lastStudiedDate: string;
  usefulnessRating: number;
};

export type ImportedStudyItem = {
  id: string;
  module: JlptN2SourceCategory;
  term: string;
  reading?: string;
  meaning?: string;
  explanation?: string;
  example?: string;
  source_name?: string;
  source_url?: string;
  source_type?: string;
  copyright_status?: string;
  user_notes?: string;
  nepali_meaning?: string;
  english_meaning?: string;
  meaning_np?: string;
  meaning_en?: string;
  example_jp?: string;
  example_np?: string;
  kanji_form?: string;
  kana_form?: string;
  part_of_speech?: string;
  similar_words?: string;
  collocations?: string;
  common_mistake?: string;
  related_kanji?: string;
  onyomi?: string;
  kunyomi?: string;
  radicals?: string;
  similar_kanji?: string;
  common_mistakes?: string;
  formation?: string;
  nuance?: string;
  register?: string;
  usage_context?: string;
  similar_patterns?: string;
  explanation_np?: string;
  quiz_items?: string;
  reading_type?: string;
  furigana?: string;
  audio_url?: string;
  weakness_category?: string;
  question?: string;
  correct_answer?: string;
  mistake_reason?: string;
  retry_status?: string;
  language_score?: string;
  reading_score?: string;
  listening_score?: string;
  timer_target?: string;
  questions?: string;
  vocabulary_notes?: string;
  grammar_notes?: string;
  why_wrong?: string;
  key_vocabulary?: string;
  key_grammar?: string;
  dictation_text?: string;
  shadowing_checklist?: string;
  mini_mock_items?: string;
  word?: string;
  kanji?: string;
  pattern?: string;
  jlpt_estimated_level?: string;
  level_confidence?: string;
  priority_score?: string | number;
  tags?: string;
  n2_purpose?: string;
  title?: string;
  passage_jp?: string;
  passage_type?: string;
  difficulty?: string;
  estimated_time_minutes?: string | number;
  target_time_seconds?: string | number;
  correct_answers?: string;
  script_jp?: string;
  conversation_type?: string;
  question_type?: string;
  key_vocab?: string;
  audio_url_optional?: string;
  example_words?: string;
  n2_priority_words?: string;
  weak_section_repair?: string;
  score_strategy?: string;
  created_by_user: boolean;
};

export type VocabularyEntry = ImportedStudyItem & {
  module: "vocabulary";
  term: string;
  reading: string;
  meaning: string;
  example: string;
};

export type KanjiCard = ImportedStudyItem & {
  module: "kanji";
  term: string;
  reading: string;
  meaning: string;
};

export type GrammarPattern = ImportedStudyItem & {
  module: "grammar";
  term: string;
  explanation: string;
  example: string;
};

export type PracticePassage = ImportedStudyItem & {
  module: "reading" | "listening";
  term: string;
  explanation: string;
  example: string;
};

export const EXTERNAL_REFERENCE_REMINDER =
  "External sources are for study reference only. This app stores your own notes and original practice content.";

export const COVERAGE_TARGETS = [
  { id: "kanji-cumulative", label: "Kanji cumulative", currentKey: "kanji", target: "1,000", numericTarget: 1000 },
  { id: "kanji-n2", label: "N2 new kanji focus", currentKey: "kanji", target: "350-400", numericTarget: 350 },
  { id: "vocab-cumulative", label: "Vocabulary cumulative", currentKey: "vocabulary", target: "6,000", numericTarget: 6000 },
  { id: "vocab-n2", label: "N2-focused vocabulary", currentKey: "vocabulary", target: "2,000-2,500", numericTarget: 2000 },
  { id: "grammar", label: "Grammar patterns", currentKey: "grammar", target: "180-220", numericTarget: 180 },
  { id: "reading", label: "Reading practices over time", currentKey: "reading", target: "300", numericTarget: 300 },
  { id: "listening", label: "Listening practices over time", currentKey: "listening", target: "300", numericTarget: 300 },
] as const;

export const STARTER_SOURCES: JlptN2Source[] = [
  {
    id: "jlpt-sensei-n2-kanji",
    name: "JLPT Sensei - N2 Kanji list",
    category: "kanji",
    level: "N2",
    url: "https://jlptsensei.com/jlpt-n2-kanji-list/",
    notes: "Coverage reference for kanji topics. Store only your own notes here.",
    externalOnly: true,
    hasImportedPersonalNotes: false,
    lastStudiedDate: "",
    usefulnessRating: 4,
  },
  {
    id: "jlpt-sensei-n2-vocabulary",
    name: "JLPT Sensei - N2 Vocabulary list",
    category: "vocabulary",
    level: "N2",
    url: "https://jlptsensei.com/jlpt-n2-vocabulary-list/",
    notes: "Reference link for vocabulary coverage, not a copied dataset.",
    externalOnly: true,
    hasImportedPersonalNotes: false,
    lastStudiedDate: "",
    usefulnessRating: 4,
  },
  {
    id: "jlpt-sensei-n2-grammar",
    name: "JLPT Sensei - N2 Grammar list",
    category: "grammar",
    level: "N2",
    url: "https://jlptsensei.com/jlpt-n2-grammar-list/",
    notes: "Use to check topic coverage. Create original Nepali explanations in-app.",
    externalOnly: true,
    hasImportedPersonalNotes: false,
    lastStudiedDate: "",
    usefulnessRating: 4,
  },
  {
    id: "bunpro-n2-grammar",
    name: "Bunpro - N2 Grammar deck",
    category: "grammar",
    level: "N2",
    url: "https://bunpro.jp/decks/jlpt-n2-grammar",
    notes: "External grammar deck reference. Do not import paid or site-specific explanations.",
    externalOnly: true,
    hasImportedPersonalNotes: false,
    lastStudiedDate: "",
    usefulnessRating: 5,
  },
  {
    id: "nihongo-no-mori-n2-grammar",
    name: "日本語の森 - N2 grammar videos",
    category: "grammar",
    level: "N2",
    url: "https://www.youtube.com/results?search_query=%E6%97%A5%E6%9C%AC%E8%AA%9E%E3%81%AE%E6%A3%AE+N2+%E6%96%87%E6%B3%95",
    notes: "Video study reference for grammar. Add your own timestamps and notes manually.",
    externalOnly: true,
    hasImportedPersonalNotes: false,
    lastStudiedDate: "",
    usefulnessRating: 5,
  },
  {
    id: "nihongo-no-mori-n2-vocab",
    name: "日本語の森 - N2 vocabulary videos",
    category: "vocabulary",
    level: "N2",
    url: "https://www.youtube.com/results?search_query=%E6%97%A5%E6%9C%AC%E8%AA%9E%E3%81%AE%E6%A3%AE+N2+%E6%96%87%E5%AD%97%E8%AA%9E%E5%BD%99",
    notes: "External video reference for 文字語彙 coverage.",
    externalOnly: true,
    hasImportedPersonalNotes: false,
    lastStudiedDate: "",
    usefulnessRating: 4,
  },
  {
    id: "nihongo-no-mori-n2-listening",
    name: "日本語の森 - N2 listening videos",
    category: "listening",
    level: "N2",
    url: "https://www.youtube.com/results?search_query=%E6%97%A5%E6%9C%AC%E8%AA%9E%E3%81%AE%E6%A3%AE+N2+%E8%81%B4%E8%A7%A3",
    notes: "Listening practice references. Keep transcripts and scripts original or user-owned.",
    externalOnly: true,
    hasImportedPersonalNotes: false,
    lastStudiedDate: "",
    usefulnessRating: 5,
  },
  {
    id: "japanese-test4you-n2-vocab",
    name: "JapaneseTest4You - N2 vocabulary",
    category: "vocabulary",
    level: "N2",
    url: "https://japanesetest4you.com/category/jlpt-n2/jlpt-n2-vocabulary/",
    notes: "Use as an external practice reference only.",
    externalOnly: true,
    hasImportedPersonalNotes: false,
    lastStudiedDate: "",
    usefulnessRating: 3,
  },
  {
    id: "japanese-test4you-n2-grammar",
    name: "JapaneseTest4You - N2 grammar",
    category: "grammar",
    level: "N2",
    url: "https://japanesetest4you.com/category/jlpt-n2/jlpt-n2-grammar/",
    notes: "External grammar reference. Do not copy explanations or quiz questions.",
    externalOnly: true,
    hasImportedPersonalNotes: false,
    lastStudiedDate: "",
    usefulnessRating: 3,
  },
  {
    id: "japanese-test4you-n2-reading",
    name: "JapaneseTest4You - N2 reading-style practice",
    category: "reading",
    level: "N2",
    url: "https://japanesetest4you.com/category/jlpt-n2/jlpt-n2-reading-test/",
    notes: "External reading-style practice reference. Store original passages or your own notes.",
    externalOnly: true,
    hasImportedPersonalNotes: false,
    lastStudiedDate: "",
    usefulnessRating: 3,
  },
  {
    id: "my-notebook",
    name: "My notebook",
    category: "vocabulary",
    level: "User",
    url: "",
    notes: "Manual user notes and legal personal material.",
    externalOnly: false,
    hasImportedPersonalNotes: true,
    lastStudiedDate: "",
    usefulnessRating: 5,
  },
  {
    id: "my-csv-imports",
    name: "My CSV imports",
    category: "mock test",
    level: "User",
    url: "",
    notes: "User-owned CSV/JSON imports for vocabulary, kanji, grammar, reading, or listening.",
    externalOnly: false,
    hasImportedPersonalNotes: true,
    lastStudiedDate: "",
    usefulnessRating: 5,
  },
  {
    id: "my-anki-data",
    name: "My Anki-style data",
    category: "srs",
    level: "User",
    url: "",
    notes: "Personal spaced repetition data exported by the user.",
    externalOnly: false,
    hasImportedPersonalNotes: true,
    lastStudiedDate: "",
    usefulnessRating: 4,
  },
];

const vocabularySeeds = [
  ["方針", "ほうしん", "policy; direction", "新しい方針をチームで確認しました。"],
  ["余裕", "よゆう", "room; margin; composure", "時間に余裕があれば、資料を読み直します。"],
  ["提出", "ていしゅつ", "submission", "申請書を金曜日までに提出してください。"],
  ["改善", "かいぜん", "improvement", "小さな改善を毎週続けています。"],
  ["確認", "かくにん", "confirmation", "予約の時間をもう一度確認しました。"],
  ["影響", "えいきょう", "influence; effect", "雨の影響で電車が少し遅れました。"],
  ["対象", "たいしょう", "target; subject", "このサービスは留学生を対象にしています。"],
  ["状況", "じょうきょう", "situation", "現場の状況を落ち着いて説明しました。"],
  ["手続き", "てつづき", "procedure", "引っ越しの手続きには時間がかかります。"],
  ["判断", "はんだん", "judgment", "十分な情報を集めてから判断します。"],
  ["報告", "ほうこく", "report", "会議の結果を上司に報告しました。"],
  ["責任", "せきにん", "responsibility", "最後まで責任を持って対応します。"],
  ["理解", "りかい", "understanding", "相手の立場を理解することが大切です。"],
  ["比較", "ひかく", "comparison", "二つの方法を比較して決めましょう。"],
  ["準備", "じゅんび", "preparation", "試験に向けて少しずつ準備しています。"],
  ["許可", "きょか", "permission", "撮影には事前の許可が必要です。"],
  ["条件", "じょうけん", "condition", "この条件なら参加できると思います。"],
  ["申請", "しんせい", "application", "ビザの更新をオンラインで申請しました。"],
  ["制度", "せいど", "system; institution", "新しい制度について説明を受けました。"],
  ["設備", "せつび", "equipment; facilities", "図書館の設備が新しくなりました。"],
  ["延期", "えんき", "postponement", "台風のためイベントは延期されました。"],
  ["減少", "げんしょう", "decrease", "最近、紙の使用量が減少しています。"],
  ["増加", "ぞうか", "increase", "観光客の数が少しずつ増加しています。"],
  ["適切", "てきせつ", "appropriate", "場面に合った適切な表現を選びます。"],
  ["共通", "きょうつう", "common", "二人には共通の趣味があります。"],
  ["原因", "げんいん", "cause", "ミスの原因を一緒に探しました。"],
  ["結果", "けっか", "result", "努力した結果、合格できました。"],
  ["資料", "しりょう", "materials; documents", "発表に使う資料を印刷しました。"],
  ["関係", "かんけい", "relationship", "仕事と健康の関係について調べています。"],
  ["経験", "けいけん", "experience", "海外で働いた経験があります。"],
  ["印象", "いんしょう", "impression", "丁寧な説明が良い印象を残しました。"],
  ["費用", "ひよう", "cost", "旅行の費用を前もって計算しました。"],
  ["管理", "かんり", "management", "パスワードを安全に管理してください。"],
  ["記事", "きじ", "article", "経済に関する記事を読みました。"],
  ["契約", "けいやく", "contract", "契約の内容をよく確認しましょう。"],
  ["支給", "しきゅう", "payment; provision", "交通費は会社から支給されます。"],
  ["参加", "さんか", "participation", "来月の説明会に参加する予定です。"],
  ["不足", "ふそく", "shortage", "睡眠不足で集中できませんでした。"],
  ["公開", "こうかい", "release; opening to public", "新しい動画が今日公開されました。"],
  ["検討", "けんとう", "consideration", "別の案も検討してみます。"],
  ["連絡", "れんらく", "contact", "到着したらすぐ連絡します。"],
  ["変更", "へんこう", "change", "予定を少し変更しました。"],
  ["対応", "たいおう", "response; handling", "問い合わせに丁寧に対応しました。"],
  ["保存", "ほぞん", "saving; preservation", "大事なデータを保存してください。"],
  ["募集", "ぼしゅう", "recruitment", "ボランティアを募集しています。"],
  ["締切", "しめきり", "deadline", "申し込みの締切は明日です。"],
  ["移動", "いどう", "movement; transfer", "駅から会場までバスで移動します。"],
  ["目的", "もくてき", "purpose", "留学の目的をはっきり説明しました。"],
  ["態度", "たいど", "attitude", "面接では落ち着いた態度が大切です。"],
  ["努力", "どりょく", "effort", "毎日の努力が少しずつ力になります。"],
] as const;

export const STARTER_VOCABULARY: VocabularyEntry[] = vocabularySeeds.map(
  ([term, reading, meaning, example], index) => ({
    id: `starter-vocab-${index + 1}`,
    module: "vocabulary",
    term,
    reading,
    meaning,
    example,
    source_name: "Original starter content",
    source_url: "",
    source_type: "original",
    copyright_status: "original",
    user_notes: "नेपाली नोट थप्न सकिन्छ।",
    created_by_user: false,
  })
);

const kanjiSeeds = [
  ["針", "シン / はり", "needle; policy direction"],
  ["余", "ヨ / あまる", "extra; surplus"],
  ["提", "テイ / さげる", "present; submit"],
  ["善", "ゼン / よい", "good; improve"],
  ["確", "カク / たしか", "certain; confirm"],
  ["影", "エイ / かげ", "shadow; influence"],
  ["響", "キョウ / ひびく", "echo; effect"],
  ["象", "ショウ / ゾウ", "phenomenon; elephant"],
  ["況", "キョウ", "condition; situation"],
  ["続", "ゾク / つづく", "continue"],
  ["断", "ダン / たつ", "cut off; decide"],
  ["責", "セキ / せめる", "responsibility"],
  ["任", "ニン / まかせる", "duty; entrust"],
  ["解", "カイ / とく", "solve; understand"],
  ["較", "カク", "compare"],
  ["準", "ジュン", "standard; prepare"],
  ["許", "キョ / ゆるす", "permit"],
  ["条", "ジョウ", "article; condition"],
  ["申", "シン / もうす", "say humbly; apply"],
  ["制", "セイ", "system; control"],
  ["備", "ビ / そなえる", "equip; prepare"],
  ["延", "エン / のびる", "extend; postpone"],
  ["減", "ゲン / へる", "decrease"],
  ["増", "ゾウ / ふえる", "increase"],
  ["適", "テキ", "suitable"],
  ["共", "キョウ / とも", "together"],
  ["因", "イン / よる", "cause"],
  ["果", "カ / はたす", "result; fruit"],
  ["資", "シ", "resources; materials"],
  ["費", "ヒ / ついやす", "expense"],
] as const;

export const STARTER_KANJI: KanjiCard[] = kanjiSeeds.map(([term, reading, meaning], index) => ({
  id: `starter-kanji-${index + 1}`,
  module: "kanji",
  term,
  reading,
  meaning,
  source_name: "Original starter content",
  source_url: "",
  source_type: "original",
  copyright_status: "original",
  user_notes: "यो कार्ड original starter हो।",
  created_by_user: false,
}));

const grammarSeeds = [
  ["一方で", "दुई फरक पक्ष तुलना गर्दा प्रयोग हुन्छ।", "都市は便利な一方で、生活費が高いです。"],
  ["に限らず", "A मात्र होइन, B पनि भन्ने अर्थ दिन्छ।", "学生に限らず、社会人もこの講座に参加できます。"],
  ["からすると", "कुनै दृष्टिकोणबाट विचार गर्दा।", "利用者からすると、この画面は少し分かりにくいです。"],
  ["に応じて", "अवस्था वा आवश्यकताअनुसार परिवर्तन हुनु।", "レベルに応じて宿題の量を調整します。"],
  ["ものの", "यद्यपि भन्ने concessive अर्थ।", "説明を聞いたものの、まだ不安が残っています。"],
  ["とは限らない", "सधैं त्यस्तो हुन्छ भन्ने छैन।", "有名だからといって、必ずしも自分に合うとは限りません。"],
  ["に加えて", "यसका साथै अर्को कुरा थप्दा।", "文法に加えて、語彙の復習も必要です。"],
  ["を通して", "कुनै माध्यम वा अवधिभरि।", "留学生活を通して多くのことを学びました。"],
  ["に比べて", "तुलना गर्दा।", "去年に比べて、今年は雨が多いです。"],
  ["としても", "यदि त्यस्तो भए पनि।", "失敗したとしても、次の経験になります。"],
  ["に関して", "कुनै विषयसँग सम्बन्धित रूपमा।", "試験の申し込みに関して質問があります。"],
  ["わけではない", "पूर्ण रूपमा त्यस्तो होइन भनेर नरम रूपमा अस्वीकार।", "日本語が嫌いなわけではなく、勉強時間が足りないだけです。"],
  ["たびに", "हरेक पटक।", "この曲を聞くたびに、京都の旅行を思い出します。"],
  ["に伴って", "एउटा परिवर्तनसँगै अर्को परिवर्तन हुनु।", "人口が増えるに伴って、交通量も増えました。"],
  ["上で", "कुनै प्रक्रिया पूरा गरेपछि अर्को काम गर्नु।", "内容を確認した上で、署名してください。"],
  ["をもとに", "कुनै आधारमा बनाउनु।", "アンケートの結果をもとに計画を立てました。"],
  ["に違いない", "बलियो अनुमान।", "あの人は毎日練習しているから、上達するに違いありません。"],
  ["かねない", "नकारात्मक सम्भावना हुन सक्छ।", "このまま確認しないと、大きなミスにつながりかねません。"],
  ["次第", "जति सक्दो चाँडो जब X हुन्छ।", "準備ができ次第、出発しましょう。"],
  ["つつある", "बिस्तारै परिवर्तन भइरहेको अवस्था।", "オンライン学習は一般的になりつつあります。"],
] as const;

export const STARTER_GRAMMAR: GrammarPattern[] = grammarSeeds.map(
  ([term, explanation, example], index) => ({
    id: `starter-grammar-${index + 1}`,
    module: "grammar",
    term,
    explanation,
    example,
    source_name: "Original starter content",
    source_url: "",
    source_type: "original",
    copyright_status: "original",
    user_notes: "नेपाली व्याख्या original हो।",
    created_by_user: false,
  })
);

export const STARTER_READING: PracticePassage[] = [
  {
    id: "starter-reading-1",
    module: "reading",
    term: "Community Library Notice",
    explanation: "स्थानीय पुस्तकालयको सेवा परिवर्तनबारे छोटो सूचना।",
    example:
      "市立図書館では、来月から夜間の利用時間を一時間延長することになりました。一方で、月曜日の午前中は設備点検のため利用できません。利用者の意見をもとに、今後もサービスを改善していく予定です。",
    source_name: "Original starter content",
    source_url: "",
    source_type: "original",
    copyright_status: "original",
    user_notes: "",
    created_by_user: false,
  },
  {
    id: "starter-reading-2",
    module: "reading",
    term: "Part-time Work Email",
    explanation: "कामको shift परिवर्तनबारे इमेल शैली अभ्यास।",
    example:
      "田中さん、明日の勤務時間について連絡します。店長の都合により、開始時間が午後三時から四時に変更されました。急な変更で申し訳ありませんが、確認した上で返信してください。",
    source_name: "Original starter content",
    source_url: "",
    source_type: "original",
    copyright_status: "original",
    user_notes: "",
    created_by_user: false,
  },
  {
    id: "starter-reading-3",
    module: "reading",
    term: "Study Habit Essay",
    explanation: "अध्ययन बानी सुधारबारे छोटो लेख।",
    example:
      "語学の上達には、長時間の勉強だけでなく、毎日続ける工夫も必要だ。短い記事を読んだり、新しい単語を三つだけ覚えたりする小さな努力が、数か月後には大きな結果につながる。",
    source_name: "Original starter content",
    source_url: "",
    source_type: "original",
    copyright_status: "original",
    user_notes: "",
    created_by_user: false,
  },
  {
    id: "starter-reading-4",
    module: "reading",
    term: "Office Policy",
    explanation: "कार्यालय नीति सम्बन्धी संक्षिप्त सूचना।",
    example:
      "新しい方針により、会議資料は印刷せず、共有フォルダーに保存することになりました。紙の使用量を減らす目的があります。必要な場合に限り、上司の許可を得て印刷できます。",
    source_name: "Original starter content",
    source_url: "",
    source_type: "original",
    copyright_status: "original",
    user_notes: "",
    created_by_user: false,
  },
  {
    id: "starter-reading-5",
    module: "reading",
    term: "Event Postponement",
    explanation: "कार्यक्रम延期 सूचना।",
    example:
      "週末に予定されていた交流会は、悪天候の影響で延期されました。新しい日程は決まり次第、参加者にメールで知らせます。すでに支払われた費用はそのまま次回に利用できます。",
    source_name: "Original starter content",
    source_url: "",
    source_type: "original",
    copyright_status: "original",
    user_notes: "",
    created_by_user: false,
  },
];

export const STARTER_LISTENING: PracticePassage[] = [
  {
    id: "starter-listening-1",
    module: "listening",
    term: "Station Announcement",
    explanation: "रेल स्टेशनमा सुनिने घोषणा अभ्यास।",
    example:
      "まもなく二番線に快速電車が参ります。この電車は途中の東町駅には止まりません。東町へお越しのお客様は、次の普通電車をご利用ください。",
    source_name: "Original starter content",
    source_url: "",
    source_type: "original",
    copyright_status: "original",
    user_notes: "",
    created_by_user: false,
  },
  {
    id: "starter-listening-2",
    module: "listening",
    term: "Workplace Request",
    explanation: "कार्यालय अनुरोध सुन्ने अभ्यास।",
    example:
      "すみません、午後の会議で使う資料を十部コピーしておいてもらえますか。色は白黒で大丈夫です。終わったら会議室の机に置いてください。",
    source_name: "Original starter content",
    source_url: "",
    source_type: "original",
    copyright_status: "original",
    user_notes: "",
    created_by_user: false,
  },
  {
    id: "starter-listening-3",
    module: "listening",
    term: "Class Schedule",
    explanation: "कक्षाको तालिका परिवर्तन।",
    example:
      "来週の文法クラスは、先生の出張に伴って水曜日から金曜日に変更されます。時間と教室はいつもと同じです。",
    source_name: "Original starter content",
    source_url: "",
    source_type: "original",
    copyright_status: "original",
    user_notes: "",
    created_by_user: false,
  },
  {
    id: "starter-listening-4",
    module: "listening",
    term: "Shop Conversation",
    explanation: "पसलमा सामान साट्ने वार्तालाप।",
    example:
      "昨日こちらで買ったシャツなんですが、サイズが少し大きかったので交換できますか。レシートは持っています。",
    source_name: "Original starter content",
    source_url: "",
    source_type: "original",
    copyright_status: "original",
    user_notes: "",
    created_by_user: false,
  },
  {
    id: "starter-listening-5",
    module: "listening",
    term: "Doctor Appointment",
    explanation: "अस्पताल appointment confirmation।",
    example:
      "予約の確認です。明日の午前十時に内科で診察があります。保険証と前回の検査結果を忘れずにお持ちください。",
    source_name: "Original starter content",
    source_url: "",
    source_type: "original",
    copyright_status: "original",
    user_notes: "",
    created_by_user: false,
  },
];

export const EXPANDED_ITEMS = [
  ...(expandedVocabulary as ImportedStudyItem[]),
  ...(expandedKanji as ImportedStudyItem[]),
  ...(expandedGrammar as ImportedStudyItem[]),
  ...(expandedReading as ImportedStudyItem[]),
  ...(expandedListening as ImportedStudyItem[]),
  ...(expandedMock as ImportedStudyItem[]),
];

export const STARTER_ITEMS: ImportedStudyItem[] = mergeStudyItems(
  [
    ...STARTER_VOCABULARY,
    ...STARTER_KANJI,
    ...STARTER_GRAMMAR,
    ...STARTER_READING,
    ...STARTER_LISTENING,
  ],
  EXPANDED_ITEMS
);

export const MODULES: Array<{
  id: JlptN2SourceCategory;
  label: string;
  japaneseLabel: string;
  importFile: string;
  description: string;
}> = [
  { id: "vocabulary", label: "Vocabulary", japaneseLabel: "語彙", importFile: "vocabulary.csv", description: "Original terms, user notes, and legal imports." },
  { id: "kanji", label: "Kanji", japaneseLabel: "漢字", importFile: "kanji.csv", description: "Cards plus database-driven vocabulary expansion." },
  { id: "grammar", label: "Grammar", japaneseLabel: "文法", importFile: "grammar.csv", description: "Original Nepali explanations and practice." },
  { id: "reading", label: "Reading", japaneseLabel: "読解", importFile: "reading.csv", description: "Original passages and imported personal material." },
  { id: "listening", label: "Listening", japaneseLabel: "聴解", importFile: "listening.csv", description: "Original scripts and external video references." },
  { id: "mock test", label: "Mock tests", japaneseLabel: "模試", importFile: "mock-tests.csv", description: "User-created mixed drills and practical coverage checks." },
  { id: "mistakes", label: "Mistakes", japaneseLabel: "間違い", importFile: "mistakes.csv", description: "Review log for weak points and corrections." },
  { id: "srs", label: "SRS", japaneseLabel: "復習", importFile: "anki-style.csv", description: "Spaced repetition staging for user-owned items." },
];

export function parseStudyImport(
  rawInput: string,
  module: JlptN2SourceCategory
): ImportedStudyItem[] {
  const trimmed = rawInput.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    const parsed = JSON.parse(trimmed) as unknown;
    const rows = Array.isArray(parsed) ? parsed : [parsed];
    return rows.map((row, index) => normalizeImportRow(row, module, index));
  }

  const rows = parseCsv(trimmed);
  return rows.map((row, index) => normalizeImportRow(row, module, index));
}

export function findSourcesByCategory(
  sources: JlptN2Source[],
  category: JlptN2SourceCategory
) {
  return sources.filter((source) => source.category === category);
}

export function getCoverageCounts(items: ImportedStudyItem[]) {
  return MODULES.reduce<Record<string, number>>((counts, module) => {
    counts[module.id] = items.filter((item) => item.module === module.id).length;
    return counts;
  }, {});
}

export function getVocabularyForKanji(kanji: string, items: ImportedStudyItem[]) {
  return items.filter(
    (item) => item.module === "vocabulary" && [item.term, item.kanji_form, item.related_kanji].filter(Boolean).join(" ").includes(kanji)
  );
}

export function mergeStudyItems(
  primary: ImportedStudyItem[] | null | undefined,
  fallback: ImportedStudyItem[]
) {
  const seen = new Set<string>();
  return [...(primary ?? []), ...fallback].filter((item) => {
    const key = item.id || item.module + ":" + item.term + ":" + (item.reading ?? "");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizeImportRow(
  row: unknown,
  module: JlptN2SourceCategory,
  index: number
): ImportedStudyItem {
  const record = typeof row === "object" && row ? (row as Record<string, unknown>) : {};
  const term = stringifyField(record.term) || stringifyField(record.word) || stringifyField(record.kanji) || stringifyField(record.pattern) || stringifyField(record.title) || `Imported item ${index + 1}`;

  return {
    id: stringifyField(record.id) || `import-${module}-${Date.now()}-${index}`,
    module: normalizeModule(stringifyField(record.module) || stringifyField(record.category) || module),
    term,
    reading: stringifyField(record.reading),
    meaning: stringifyField(record.meaning) || stringifyField(record.meaning_np) || stringifyField(record.nepali_meaning) || stringifyField(record.translation),
    explanation: stringifyField(record.explanation) || stringifyField(record.explanation_np) || stringifyField(record.notes),
    example: stringifyField(record.example) || stringifyField(record.example_jp) || stringifyField(record.sentence) || stringifyField(record.script) || stringifyField(record.passage),
    source_name: stringifyField(record.source_name),
    source_url: stringifyField(record.source_url),
    source_type: stringifyField(record.source_type),
    copyright_status: stringifyField(record.copyright_status) || "user-provided",
    user_notes: stringifyField(record.user_notes),
    nepali_meaning: stringifyField(record.nepali_meaning) || stringifyField(record.meaning_np),
    english_meaning: stringifyField(record.english_meaning) || stringifyField(record.meaning_en),
    meaning_np: stringifyField(record.meaning_np) || stringifyField(record.nepali_meaning),
    meaning_en: stringifyField(record.meaning_en) || stringifyField(record.english_meaning),
    example_jp: stringifyField(record.example_jp),
    example_np: stringifyField(record.example_np),
    kanji_form: stringifyField(record.kanji_form),
    kana_form: stringifyField(record.kana_form),
    part_of_speech: stringifyField(record.part_of_speech),
    similar_words: stringifyField(record.similar_words),
    collocations: stringifyField(record.collocations),
    common_mistake: stringifyField(record.common_mistake),
    related_kanji: stringifyField(record.related_kanji),
    onyomi: stringifyField(record.onyomi),
    kunyomi: stringifyField(record.kunyomi),
    radicals: stringifyField(record.radicals),
    similar_kanji: stringifyField(record.similar_kanji),
    common_mistakes: stringifyField(record.common_mistakes),
    formation: stringifyField(record.formation),
    nuance: stringifyField(record.nuance),
    register: stringifyField(record.register),
    usage_context: stringifyField(record.usage_context),
    similar_patterns: stringifyField(record.similar_patterns),
    explanation_np: stringifyField(record.explanation_np),
    quiz_items: stringifyField(record.quiz_items),
    reading_type: stringifyField(record.reading_type),
    furigana: stringifyField(record.furigana),
    audio_url: stringifyField(record.audio_url),
    weakness_category: stringifyField(record.weakness_category),
    question: stringifyField(record.question),
    correct_answer: stringifyField(record.correct_answer),
    mistake_reason: stringifyField(record.mistake_reason),
    retry_status: stringifyField(record.retry_status),
    language_score: stringifyField(record.language_score),
    reading_score: stringifyField(record.reading_score),
    listening_score: stringifyField(record.listening_score),
    timer_target: stringifyField(record.timer_target),
    questions: stringifyField(record.questions),
    vocabulary_notes: stringifyField(record.vocabulary_notes),
    grammar_notes: stringifyField(record.grammar_notes),
    why_wrong: stringifyField(record.why_wrong),
    key_vocabulary: stringifyField(record.key_vocabulary),
    key_grammar: stringifyField(record.key_grammar),
    dictation_text: stringifyField(record.dictation_text),
    shadowing_checklist: stringifyField(record.shadowing_checklist),
    mini_mock_items: stringifyField(record.mini_mock_items),
    word: stringifyField(record.word),
    kanji: stringifyField(record.kanji),
    pattern: stringifyField(record.pattern),
    jlpt_estimated_level: stringifyField(record.jlpt_estimated_level),
    level_confidence: stringifyField(record.level_confidence),
    priority_score: stringifyField(record.priority_score),
    tags: stringifyField(record.tags),
    n2_purpose: stringifyField(record.n2_purpose),
    title: stringifyField(record.title),
    passage_jp: stringifyField(record.passage_jp),
    passage_type: stringifyField(record.passage_type),
    difficulty: stringifyField(record.difficulty),
    estimated_time_minutes: stringifyField(record.estimated_time_minutes),
    target_time_seconds: stringifyField(record.target_time_seconds),
    correct_answers: stringifyField(record.correct_answers),
    script_jp: stringifyField(record.script_jp),
    conversation_type: stringifyField(record.conversation_type),
    question_type: stringifyField(record.question_type),
    key_vocab: stringifyField(record.key_vocab),
    audio_url_optional: stringifyField(record.audio_url_optional),
    example_words: stringifyField(record.example_words),
    n2_priority_words: stringifyField(record.n2_priority_words),
    weak_section_repair: stringifyField(record.weak_section_repair),
    score_strategy: stringifyField(record.score_strategy),
    created_by_user: stringifyBoolean(record.created_by_user, true),
  };
}

function normalizeModule(value: string): JlptN2SourceCategory {
  const lowered = value.toLowerCase();
  const found = MODULES.find((module) => module.id === lowered || module.label.toLowerCase() === lowered);
  return found?.id ?? "vocabulary";
}

function stringifyField(value: unknown) {
  return typeof value === "string" ? value.trim() : value === undefined || value === null ? "" : String(value).trim();
}

function stringifyBoolean(value: unknown, fallback: boolean) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    return ["true", "yes", "1"].includes(value.toLowerCase());
  }
  return fallback;
}

function parseCsv(input: string): Array<Record<string, string>> {
  const lines = input.split(/\r?\n/).filter(Boolean);
  const headers = splitCsvLine(lines[0]).map((header) => header.trim());
  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    return headers.reduce<Record<string, string>>((record, header, index) => {
      record[header] = cells[index]?.trim() ?? "";
      return record;
    }, {});
  });
}

function splitCsvLine(line: string) {
  const cells: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === "\"" && quoted && next === "\"") {
      current += "\"";
      index += 1;
    } else if (char === "\"") {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  cells.push(current);
  return cells;
}
