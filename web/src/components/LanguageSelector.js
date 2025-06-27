import { useLang } from '../i18n';

// LanguageSelector
function LanguageSelector() {
  const { lang, setLang } = useLang();
  return (
    <select value={lang} onChange={(e) => setLang(e.target.value)}>
      <option value="pt">PT</option>
      <option value="en">EN</option>
    </select>
  );
}

export default LanguageSelector;
