import type { Locale } from '@/types';
import { en } from './en';
import { es, type Messages } from './es';

export const MESSAGES: Record<Locale, Messages> = { es, en };
