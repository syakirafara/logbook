// The four views of the app, one per role.
export type TabId = 'register' | 'intern' | 'supervisor' | 'verify';

export const TAB_IDS: TabId[] = ['register', 'intern', 'supervisor', 'verify'];

export function isTabId(value: string | null): value is TabId {
  return TAB_IDS.includes(value as TabId);
}
