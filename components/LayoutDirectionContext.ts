import { createContext, useContext } from 'react';
import type { LayoutDirection } from '@/lib/i18n/direction';

export const LayoutDirectionContext = createContext<LayoutDirection>('ltr');
export const useLayoutDirection = () => useContext(LayoutDirectionContext);
