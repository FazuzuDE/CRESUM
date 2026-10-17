import { HOME_WIDGET_LAYOUT } from './home-dashboard';

export const HOME_LAYOUT_KEY = 'cresum_home_layout_v1';
export type HomeWidgetId = (typeof HOME_WIDGET_LAYOUT)[number]['id'];
export type HomeLayout = {
  version: 1;
  widgets: { id: HomeWidgetId; visible: boolean }[];
};
export const HOME_WIDGET_LABELS: Record<HomeWidgetId, string> = {
  week: 'Your week',
  primary: 'Start / resume workout',
  summary: 'Training summary',
  latest: 'Latest workout',
  templates: 'Other workouts',
};

export function defaultHomeLayout(): HomeLayout {
  return {
    version: 1,
    widgets: HOME_WIDGET_LAYOUT.map(({ id }) => ({ id, visible: true })),
  };
}

// Keep known order/visibility, append new modules, and never hide the main action.
export function parseHomeLayout(value: unknown): HomeLayout {
  const invalid = () => Error('Saved Home layout could not be read.');
  if (
    !value ||
    typeof value !== 'object' ||
    !('version' in value) ||
    value.version !== 1 ||
    !('widgets' in value) ||
    !Array.isArray(value.widgets)
  )
    throw invalid();
  const widgets: HomeLayout['widgets'] = [];
  for (const item of value.widgets) {
    if (
      !item ||
      typeof item !== 'object' ||
      typeof item.id !== 'string' ||
      typeof item.visible !== 'boolean'
    )
      throw invalid();
    const known = HOME_WIDGET_LAYOUT.find(({ id }) => id === item.id);
    if (known && !widgets.some(({ id }) => id === known.id))
      widgets.push({
        id: known.id,
        visible: known.id === 'primary' || item.visible,
      });
  }
  for (const { id } of HOME_WIDGET_LAYOUT) {
    if (!widgets.some((item) => item.id === id))
      widgets.push({ id, visible: true });
  }
  return { version: 1, widgets };
}

type Storage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<unknown>;
};
export class HomeLayoutRepository {
  constructor(private readonly storage: Storage) {}
  async load(): Promise<HomeLayout> {
    const raw = await this.storage.getItem(HOME_LAYOUT_KEY);
    return raw === null
      ? defaultHomeLayout()
      : parseHomeLayout(JSON.parse(raw));
  }
  async save(layout: HomeLayout): Promise<void> {
    const validated = parseHomeLayout(layout);
    await this.storage.setItem(HOME_LAYOUT_KEY, JSON.stringify(validated));
  }
}
