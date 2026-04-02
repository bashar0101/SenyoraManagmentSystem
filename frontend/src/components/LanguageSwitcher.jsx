import { useTranslation } from 'react-i18next';
import { changeLanguage } from '../i18n.js';

const LANGS = [
  { code: 'en', label: 'EN', flag: '🇬🇧' },
  { code: 'tr', label: 'TR', flag: '🇹🇷' },
  { code: 'ar', label: 'AR', flag: '🇸🇦' }
];

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const current = i18n.language;

  return (
    <div className="flex items-center gap-1">
      {LANGS.map(lang => (
        <button
          key={lang.code}
          onClick={() => changeLanguage(lang.code)}
          title={lang.label}
          className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
            current === lang.code
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
          }`}
        >
          {/* <span>{lang.flag}</span> */}
          <span>{lang.label}</span>
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;
