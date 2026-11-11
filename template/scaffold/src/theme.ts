import type {ShotRole} from './types';

/** Colours and type of the placeholder cards, text slots and captions. Restyle freely. */
export const theme = {
  bg: '#0D1017',
  panel: '#151A23',
  line: '#2B3442',
  text: '#F3EFE6',
  muted: '#93A0B4',
  accent: '#FFB224',
  fontFamily: 'Inter, "Helvetica Neue", Helvetica, Arial, sans-serif',
  monoFamily: '"JetBrains Mono", ui-monospace, SFMono-Regular, Consolas, monospace',
};

export const roleColor: Record<ShotRole, string> = {
  hook: '#FF6B5E',
  setup: '#4CC9F0',
  proof: '#A78BFA',
  payoff: '#6EE7A0',
  cta: '#FFB224',
  other: '#93A0B4',
};
