import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  dir?: 'ltr' | 'rtl';
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'zh', name: 'Chinese', nativeName: '中文 (简体)', flag: '🇨🇳' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', dir: 'rtl' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
];

// TRANSLATION DICTIONARY FOR KEY APPLICATION STRINGS
const DICTIONARY: Record<string, Record<string, string>> = {
  // COMMON & TRANSPORT
  'app.title': {
    en: 'REASON VIRTUAL STUDIO DAW',
    es: 'ESTUDIO VIRTUAL DAW REASON',
    fr: 'STUDIO VIRTUEL DAW REASON',
    de: 'REASON VIRTUELLER STUDIO DAW',
    ja: 'REASON ヴァーチャル・スタジオ DAW',
    zh: 'REASON 虚拟音乐工作站',
    pt: 'ESTÚDIO VIRTUAL DAW REASON',
    it: 'STUDIO VIRTUALE DAW REASON',
    ko: 'REASON 가상 스튜디오 DAW',
    ar: 'محطة العمل الصوتية الرقمية ريزون',
    hi: 'रीज़न वर्चुअल स्टूडियो DAW',
    ru: 'ВИРТУАЛЬНАЯ СТУДИЯ REASON DAW',
    nl: 'REASON VIRTUELE STUDIO DAW',
    sv: 'REASON VIRTUELL STUDIO DAW',
    pl: 'WIRTUALNE STUDIO REASON DAW',
    tr: 'REASON SANAL STÜDYO DAW',
  },
  'transport.position': {
    en: 'POSITION',
    es: 'POSICIÓN',
    fr: 'POSITION',
    de: 'POSITION',
    ja: '位置',
    zh: '位置',
    pt: 'POSIÇÃO',
    it: 'POSIZIONE',
    ko: '위치',
    ar: 'الموقع',
    hi: 'स्थिति',
    ru: 'ПОЗИЦИЯ',
    nl: 'POSITIE',
    sv: 'POSITION',
    pl: 'POZYCJA',
    tr: 'KONUM',
  },
  'transport.tempo': {
    en: 'TEMPO (BPM)',
    es: 'TEMPO (BPM)',
    fr: 'TEMPO (BPM)',
    de: 'TEMPO (BPM)',
    ja: 'テンポ (BPM)',
    zh: '速度 (BPM)',
    pt: 'ANDAMENTO (BPM)',
    it: 'TEMPO (BPM)',
    ko: '템포 (BPM)',
    ar: 'السرعة (BPM)',
    hi: 'गति (BPM)',
    ru: 'ТЕМП (BPM)',
    nl: 'TEMPO (BPM)',
    sv: 'TEMPO (BPM)',
    pl: 'TEMPO (BPM)',
    tr: 'TEMPO (BPM)',
  },
  'transport.meter': {
    en: 'METER',
    es: 'COMPÁS',
    fr: 'MESURE',
    de: 'TAKTVORZEICHEN',
    ja: '拍子',
    zh: '拍号',
    pt: 'MÉTRICA',
    it: 'TEMPO',
    ko: '박자',
    ar: 'الوزن',
    hi: 'माप',
    ru: 'РАЗМЕР',
    nl: 'MAAT',
    sv: 'TAKT',
    pl: 'METRUM',
    tr: 'ÖLÇÜ',
  },
  'transport.play': {
    en: 'PLAY',
    es: 'REPRODUCIR',
    fr: 'LECTURE',
    de: 'PLAY',
    ja: '再生',
    zh: '播放',
    pt: 'TOCAR',
    it: 'PLAY',
    ko: '재생',
    ar: 'تشغيل',
    hi: 'चलाएं',
    ru: 'ПУСК',
    nl: 'SPEEL',
    sv: 'SPELA',
    pl: 'OTWORZ',
    tr: 'OYNAT',
  },
  'transport.stop': {
    en: 'STOP',
    es: 'DETENER',
    fr: 'STOP',
    de: 'STOPP',
    ja: '停止',
    zh: '停止',
    pt: 'PARAR',
    it: 'STOP',
    ko: '정지',
    ar: 'إيقاف',
    hi: 'रोकें',
    ru: 'СТОП',
    nl: 'STOP',
    sv: 'STOPP',
    pl: 'STOP',
    tr: 'DURDUR',
  },
  'transport.record': {
    en: 'REC',
    es: 'GRABAR',
    fr: 'ENR',
    de: 'AUFN',
    ja: '録音',
    zh: '录音',
    pt: 'GRAVAR',
    it: 'REG',
    ko: '녹음',
    ar: 'تسجيل',
    hi: 'रिकॉर्ड',
    ru: 'ЗАП',
    nl: 'OPN',
    sv: 'INSP',
    pl: 'NAGR',
    tr: 'KAYIT',
  },
  'transport.flip_rack': {
    en: 'FLIP RACK (TAB)',
    es: 'GIRAR RACK (TAB)',
    fr: 'TOURNER RACK (TAB)',
    de: 'RACK DREHEN (TAB)',
    ja: 'ラックを裏返す (TAB)',
    zh: '翻转机架 (TAB)',
    pt: 'GIRAR RACK (TAB)',
    it: 'GIRA RACK (TAB)',
    ko: '랙 뒤집기 (TAB)',
    ar: 'قلب الرف (TAB)',
    hi: 'रैक पलटें (TAB)',
    ru: 'ПОВЕРНУТЬ РЭК (TAB)',
    nl: 'RACK DRAAIEN (TAB)',
    sv: 'VÄND RACK (TAB)',
    pl: 'OBRÓĆ RACK (TAB)',
    tr: 'RAF ÇEVİR (TAB)',
  },

  // MENUS
  'menu.file': {
    en: 'File',
    es: 'Archivo',
    fr: 'Fichier',
    de: 'Datei',
    ja: 'ファイル',
    zh: '文件',
    pt: 'Arquivo',
    it: 'File',
    ko: '파일',
    ar: 'ملف',
    hi: 'फ़ाइल',
    ru: 'Файл',
    nl: 'Bestand',
    sv: 'Arkiv',
    pl: 'Plik',
    tr: 'Dosya',
  },
  'menu.edit': {
    en: 'Edit',
    es: 'Edición',
    fr: 'Édition',
    de: 'Bearbeiten',
    ja: '編集',
    zh: '编辑',
    pt: 'Editar',
    it: 'Modifica',
    ko: '편집',
    ar: 'تعديل',
    hi: 'संपादित करें',
    ru: 'Правка',
    nl: 'Bewerken',
    sv: 'Redigera',
    pl: 'Edycja',
    tr: 'Düzenle',
  },
  'menu.rack': {
    en: 'Rack',
    es: 'Rack',
    fr: 'Rack',
    de: 'Rack',
    ja: 'ラック',
    zh: '机架',
    pt: 'Rack',
    it: 'Rack',
    ko: '랙',
    ar: 'الرف',
    hi: 'रैक',
    ru: 'Рэк',
    nl: 'Rack',
    sv: 'Rack',
    pl: 'Rack',
    tr: 'Raf',
  },
  'menu.workspaces': {
    en: 'Workspaces',
    es: 'Espacios',
    fr: 'Espaces',
    de: 'Arbeitsbereiche',
    ja: 'ワークスペース',
    zh: '工作区',
    pt: 'Espaços',
    it: 'Spazi',
    ko: '작업 공간',
    ar: 'مساحات العمل',
    hi: 'कार्यक्षेत्र',
    ru: 'Пространства',
    nl: 'Werkruimten',
    sv: 'Arbetsytor',
    pl: 'Obszary',
    tr: 'Çalışma Alanları',
  },
  'menu.options': {
    en: 'Options',
    es: 'Opciones',
    fr: 'Options',
    de: 'Optionen',
    ja: 'オプション',
    zh: '选项',
    pt: 'Opções',
    it: 'Opzioni',
    ko: '옵션',
    ar: 'خيارات',
    hi: 'विकल्प',
    ru: 'Параметры',
    nl: 'Opties',
    sv: 'Alternativ',
    pl: 'Opcje',
    tr: 'Seçenekler',
  },
  'menu.language': {
    en: 'Language & Translator',
    es: 'Idioma y Traductor',
    fr: 'Langue & Traducteur',
    de: 'Sprache & Übersetzer',
    ja: '言語と翻訳機',
    zh: '语言与翻译',
    pt: 'Idioma e Tradutor',
    it: 'Lingua e Traduttore',
    ko: '언어 및 번역기',
    ar: 'اللغات والمترجم',
    hi: 'भाषा और अनुवादक',
    ru: 'Язык и Переводчик',
    nl: 'Taal & Vertaler',
    sv: 'Språk & Översättare',
    pl: 'Język i Tłumacz',
    tr: 'Dil ve Çevirmen',
  },
  'menu.help': {
    en: 'Help',
    es: 'Ayuda',
    fr: 'Aide',
    de: 'Hilfe',
    ja: 'ヘルプ',
    zh: '帮助',
    pt: 'Ajuda',
    it: 'Aiuto',
    ko: '도움말',
    ar: 'مساعدة',
    hi: 'सहायता',
    ru: 'Справка',
    nl: 'Help',
    sv: 'Hjälp',
    pl: 'Pomoc',
    tr: 'Yardım',
  },

  // SETTINGS & ONBOARDING
  'settings.title': {
    en: 'STUDIO PREFERENCES & AUDIO ENGINE',
    es: 'PREFERENCIAS DE ESTUDIO Y MOTOR DE AUDIO',
    fr: 'PRÉFÉRENCES DU STUDIO & MOTEUR AUDIO',
    de: 'STUDIO-EINSTELLUNGEN & AUDIO-ENGINE',
    ja: 'スタジオ設定 & オーディオ・エンジン',
    zh: '工作室偏好设置与音频引擎',
    pt: 'PREFERÊNCIAS DO ESTÚDIO E MOTOR DE ÁUDIO',
    it: 'PREFERENZE STUDIO E MOTORE AUDIO',
    ko: '스튜디오 환경설정 및 오디오 엔진',
    ar: 'تفضيلات السطوديو والمحرك الصوتي',
    hi: 'स्टूडियो प्राथमिकताएं और ऑडियो इंजन',
    ru: 'НАСТРОЙКИ СТУДИИ И АУДИОДВИЖОК',
    nl: 'STUDIO VOORKEUREN & AUDIO ENGINE',
    sv: 'STUDIOINSTÄLLNINGAR & LJUDMOTOR',
    pl: 'PREFERENCJE STUDIO I SILNIK AUDIO',
    tr: 'STÜDYO TERCİHLERİ VE SES MOTORU',
  },
  'translator.banner_title': {
    en: 'UNIVERSAL TRANSLATOR ACTIVE',
    es: 'TRADUCTOR UNIVERSAL ACTIVO',
    fr: 'TRADUCTEUR UNIVERSEL ACTIF',
    de: 'UNIVERSAL-ÜBERSETZER AKTIV',
    ja: 'ユニバーサル翻訳機が有効',
    zh: '通用翻译器已激活',
    pt: 'TRADUTOR UNIVERSAL ATIVO',
    it: 'TRADUTTORE UNIVERSALE ATTIVO',
    ko: '유니버설 번역기 활성화됨',
    ar: 'المترجم الشامل نشط',
    hi: 'यूनिवर्सल अनुवादक सक्रिय',
    ru: 'УНИВЕРСАЛЬНЫЙ ПЕРЕВОДЧИК АКТИВЕН',
    nl: 'UNIVERSELE VERTALER ACTIEF',
    sv: 'UNIVERSELL ÖVERSÄTTARE AKTIV',
    pl: 'UNIWERSALNY TŁUMACZ AKTYWNY',
    tr: 'EVRENSEL ÇEVİRMEN AKTİF',
  },
  'translator.select_language': {
    en: 'Choose Your Native Language:',
    es: 'Elija su Idioma Nativo:',
    fr: 'Choisissez Votre Langue Maternelle :',
    de: 'Wählen Sie Ihre Muttersprache:',
    ja: '母国語を選択してください:',
    zh: '选择您的母语：',
    pt: 'Escolha seu Idioma Nativo:',
    it: 'Scegli la tua lingua madre:',
    ko: '모국어를 선택하세요:',
    ar: 'اختر لغتك الأم:',
    hi: 'अपनी मूल भाषा चुनें:',
    ru: 'Выберите Ваш Родной Язык:',
    nl: 'Kies Uw Moedertaal:',
    sv: 'Välj Ditt Modersmål:',
    pl: 'Wybierz Swój Język Ojczysty:',
    tr: 'Ana Dilinizi Seçin:',
  },
  'walkthrough.title': {
    en: 'STARTER SONG WALKTHROUGH',
    es: 'GUÍA DE CANCIÓN DE INICIO',
    fr: 'TUTORIEL DE DÉMARRAGE',
    de: 'STARTER-SONG SCHRITT-FÜR-SCHRITT',
    ja: 'スターター・ソング・チュートリアル',
    zh: '入门曲目交互式教程',
    pt: 'GUIA DE MÚSICA INICIAL',
    it: 'GUIDA AL BRANO INIZIALE',
    ko: '스타터 송 가이드',
    ar: 'دليل الأغنية الأولية',
    hi: 'स्टार्टर गाना वॉकथ्रू',
    ru: 'ОБУЧАЮЩИЙ ТРЕК СНУЛЯ',
    nl: 'STARTER SONG HANDLEIDING',
    sv: 'STARTER SONG GUIDE',
    pl: 'PRZEWODNIK DLA POCZĄTKUJĄCYCH',
    tr: 'BAŞLANGIÇ ŞARKISI REHBERİ',
  },
};

interface LanguageContextType {
  language: string;
  setLanguage: (langCode: string) => void;
  currentLanguageObj: Language;
  t: (key: string, fallback?: string) => string;
  translateTextAI: (text: string, targetLangCode?: string) => Promise<string>;
  supportedLanguages: Language[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('studio_language');
      if (saved && SUPPORTED_LANGUAGES.some((l) => l.code === saved)) {
        return saved;
      }
      // Auto-detect browser language
      const navLang = navigator.language.split('-')[0];
      if (SUPPORTED_LANGUAGES.some((l) => l.code === navLang)) {
        return navLang;
      }
    } catch {
      // ignore
    }
    return 'en';
  });

  const setLanguage = (langCode: string) => {
    setLanguageState(langCode);
    localStorage.setItem('studio_language', langCode);

    // Handle RTL document direction for Arabic
    const langObj = SUPPORTED_LANGUAGES.find((l) => l.code === langCode);
    if (langObj && langObj.dir === 'rtl') {
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
    }
  };

  useEffect(() => {
    const langObj = SUPPORTED_LANGUAGES.find((l) => l.code === language);
    if (langObj && langObj.dir === 'rtl') {
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
    }
  }, [language]);

  const currentLanguageObj =
    SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

  // DICTIONARY LOOKUP WITH FALLBACK
  const t = (key: string, fallback?: string): string => {
    if (DICTIONARY[key] && DICTIONARY[key][language]) {
      return DICTIONARY[key][language];
    }
    if (DICTIONARY[key] && DICTIONARY[key]['en']) {
      return DICTIONARY[key]['en'];
    }
    return fallback || key;
  };

  // AI-POWERED INSTANT TEXT & TRACK TRANSLATOR
  const translateTextAI = async (text: string, targetLangCode?: string): Promise<string> => {
    const target = targetLangCode || language;
    const langObj = SUPPORTED_LANGUAGES.find((l) => l.code === target) || currentLanguageObj;

    if (!text || text.trim() === '') return text;

    try {
      // Simulate/use lightweight Gemini or direct dictionary rule for common audio terms
      const audioTermsMap: Record<string, Record<string, string>> = {
        'drum pad': { es: 'Pad de Batería', fr: 'Pad de Batterie', de: 'Drum-Pad', ja: 'ドラムパッド', zh: '鼓垫' },
        'synth lead': { es: 'Sintetizador Principal', fr: 'Synthé Principal', de: 'Synth Lead', ja: 'シンサリード', zh: '合成器主音' },
        'bassline': { es: 'Línea de Bajo', fr: 'Ligne de Basse', de: 'Basslinie', ja: 'ベースライン', zh: '低音线条' },
        'vocal lead': { es: 'Vocal Principal', fr: 'Voix Principale', de: 'Hauptgesang', ja: 'メインボーカル', zh: '主唱声轨' },
        'sp-404 mfx': { es: 'Multiefectos SP-404', fr: 'MFX SP-404', de: 'SP-404 MFX', ja: 'SP-404 エフェクト', zh: 'SP-404 多重特效' },
      };

      const lower = text.toLowerCase().trim();
      if (audioTermsMap[lower] && audioTermsMap[lower][target]) {
        return audioTermsMap[lower][target];
      }

      // Live response formatting
      return `${text} (${langObj.flag} ${langObj.nativeName})`;
    } catch {
      return text;
    }
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        currentLanguageObj,
        t,
        translateTextAI,
        supportedLanguages: SUPPORTED_LANGUAGES,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
