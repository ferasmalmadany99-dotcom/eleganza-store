import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

export const asset = (file: string) =>
  `${import.meta.env.BASE_URL}eleganza/${file}`;

export function Eyebrow({
  children,
  light = false,
}: {
  children: ReactNode;
  light?: boolean;
}) {
  return (
    <div
      className="film-body"
      style={{
        color: light ? 'var(--color-cream)' : 'var(--color-gold)',
        fontSize: '1.55vw',
        fontWeight: 600,
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
      }}
    >
      {children}
    </div>
  );
}

export function Rule({
  width = '12vw',
  light = false,
}: {
  width?: string;
  light?: boolean;
}) {
  return (
    <motion.div
      className="hairline"
      initial={{ scaleX: 0, opacity: 0 }}
      animate={{ scaleX: 1, opacity: 0.8 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      style={{ color: light ? 'var(--color-cream)' : 'var(--color-copper)', width }}
    />
  );
}

export function Caption({
  children,
  light = false,
}: {
  children: ReactNode;
  light?: boolean;
}) {
  return (
    <div
      className="film-body"
      style={{
        color: light ? 'rgba(246,234,220,.74)' : 'rgba(32,23,19,.68)',
        fontSize: '1.55vw',
        lineHeight: 1.35,
        letterSpacing: '0.03em',
      }}
    >
      {children}
    </div>
  );
}

export function NumberMark({ children }: { children: ReactNode }) {
  return (
    <div
      className="film-body"
      style={{
        color: 'var(--color-copper)',
        fontSize: '1.35vw',
        fontWeight: 600,
        letterSpacing: '0.16em',
      }}
    >
      {children}
    </div>
  );
}