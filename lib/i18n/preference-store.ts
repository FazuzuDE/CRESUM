import {
  isAppLocale,
  resolveLocale,
  type AppLocale,
  type LanguagePreference,
} from './registry';
export const LANGUAGE_PREFERENCE_KEY = 'cresum_language_preference_v1';
type Storage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<unknown>;
};
export type LocaleSnapshot = Readonly<{
  preference: LanguagePreference;
  locale: AppLocale;
  loading: boolean;
  saving: boolean;
  error: 'read' | 'save' | null;
}>;
export class LocaleStore {
  private snapshot: LocaleSnapshot = {
    preference: 'system',
    locale: 'en',
    loading: true,
    saving: false,
    error: null,
  };
  private listeners = new Set<() => void>();
  private queue: Promise<unknown> = Promise.resolve();
  private revision = 0;
  private readEpoch = 0;
  private pending = 0;
  constructor(
    private storage: Storage,
    private deviceTags: () => readonly string[],
    private enabled: readonly AppLocale[] = ['en', 'ru', 'de', 'fr'],
  ) {}
  getSnapshot = () => this.snapshot;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private update(value: Partial<LocaleSnapshot>) {
    this.snapshot = { ...this.snapshot, ...value };
    this.listeners.forEach((listener) => listener());
  }
  private resolve(preference: LanguagePreference): AppLocale {
    let tags: readonly string[] = [];
    try {
      tags = this.deviceTags();
    } catch {
      /* Device boundary failure uses English. */
    }
    const usable = tags.filter((tag) =>
      this.enabled.includes(resolveLocale('system', [tag])),
    );
    const resolved = resolveLocale(preference, usable);
    return this.enabled.includes(resolved) ? resolved : 'en';
  }
  load = async () => {
    const revision = this.revision;
    const read = ++this.readEpoch;
    const current = () => this.revision === revision && this.readEpoch === read;
    try {
      const raw = await this.storage.getItem(LANGUAGE_PREFERENCE_KEY);
      let preference: LanguagePreference = 'system';
      if (raw !== null) {
        const value: unknown = JSON.parse(raw);
        if (
          !value ||
          typeof value !== 'object' ||
          !('version' in value) ||
          value.version !== 1 ||
          !('preference' in value) ||
          !(value.preference === 'system' || isAppLocale(value.preference))
        )
          throw Error('Invalid locale preference');
        preference = value.preference;
        if (preference !== 'system' && !this.enabled.includes(preference))
          throw Error('Locale is not enabled');
      }
      if (current())
        this.update({
          preference,
          locale: this.resolve(preference),
          error: null,
        });
    } catch {
      if (current())
        this.update({
          locale: this.resolve(this.snapshot.preference),
          error: 'read',
        });
    } finally {
      if (current()) this.update({ loading: false });
    }
  };
  select = (preference: LanguagePreference): Promise<boolean> => {
    if (
      preference !== 'system' &&
      (!isAppLocale(preference) || !this.enabled.includes(preference))
    )
      return Promise.resolve(false);
    ++this.revision;
    ++this.pending;
    this.update({ saving: true });
    const work = this.queue.then(async () => {
      try {
        await this.storage.setItem(
          LANGUAGE_PREFERENCE_KEY,
          JSON.stringify({ version: 1, preference }),
        );
        // A read begun while this write was pending may still contain old data.
        ++this.readEpoch;
        this.update({
          preference,
          locale: this.resolve(preference),
          loading: false,
          error: null,
        });
        return true;
      } catch {
        this.update({ error: 'save', loading: false });
        return false;
      } finally {
        --this.pending;
        this.update({ saving: this.pending > 0 });
      }
    });
    this.queue = work;
    return work;
  };
  refreshDeviceLocales = () => {
    if (this.snapshot.preference === 'system')
      this.update({ locale: this.resolve('system') });
  };
  waitForPendingWrites = async () => {
    await this.queue;
  };
}
