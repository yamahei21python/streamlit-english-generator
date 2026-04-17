// UI 定数
export const UI = {
  colors: {
    primary: '#262626',
    background: '#171717',
    text: '#171717',
    textMuted: '#999999',
    textSecondary: '#666666',
    border: 'rgba(0,0,0,0.08)',
    borderLight: 'rgba(0,0,0,0.06)',
  },
  shadows: {
    card: '0_0_0_1px_rgba(0,0,0,0.08),0_2px_4px_rgba(0,0,0,0.04)',
    button: '0_0_0_1px_rgba(0,0,0,0.08)',
    select: '0_0_0_1px_rgba(0,0,0,0.08)',
  },
  radii: {
    card: 'rounded-xl',
    button: 'rounded-full',
    input: 'rounded-lg',
  },
} as const;