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
import hi from './hi';
import bn from './bn';
import ar from './ar';
import ja from './ja';
import vi from './vi';

export const searchAliases: Record<AppLocale, SearchAliasCatalog> = {
  hi,
  bn,
  ar,
  ja,
  vi,
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
};
