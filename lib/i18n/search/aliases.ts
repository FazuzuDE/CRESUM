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

export const searchAliases: Record<AppLocale, SearchAliasCatalog> = {
  hi,
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
