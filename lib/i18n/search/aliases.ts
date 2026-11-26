import type { AppLocale } from '../registry';
import type { SearchAliasCatalog } from './types';
import en from './en';
import ru from './ru';
import de from './de';
import fr from './fr';
import uk from './uk';
import es from './es';
import ptBR from './pt-BR';
import it from './it';
import pl from './pl';
import tr from './tr';
import zhHans from './zh-Hans';
import zhHant from './zh-Hant';
import hi from './hi';
import bn from './bn';
import ar from './ar';
import ur from './ur';
import te from './te';
import ta from './ta';
import ja from './ja';
import vi from './vi';
import mr from './mr';
import id from './id';
import ko from './ko';
import nl from './nl';
import nb from './nb';
import fi from './fi';
import cs from './cs';
import da from './da';
import sv from './sv';
import th from './th';

export const searchAliases: Record<AppLocale, SearchAliasCatalog> = {
  hi,
  bn,
  ar,
  ur,
  te,
  ta,
  ja,
  vi,
  mr,
  id,
  ko,
  nl,
  nb,
  fi,
  cs,
  da,
  sv,
  th,
  en,
  ru,
  de,
  fr,
  uk,
  es,
  'pt-BR': ptBR,
  it,
  pl,
  tr,
  'zh-Hans': zhHans,
  'zh-Hant': zhHant,
};
