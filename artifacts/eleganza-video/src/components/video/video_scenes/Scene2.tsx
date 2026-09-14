import { motion } from 'framer-motion';

import { MediaFrame, SafeFrame } from '@/lib/video';

import { Caption, Eyebrow, NumberMark, Rule, asset } from './sceneUtils';

export function Scene2() {
  return (
    <SafeFrame style={{ position: 'relative', background: 'linear-gradient(142deg, #3a2018 0%, #6d2f28 54%, #b86d48 100%)' }}>
      <motion.div
        initial={{ clipPath: 'circle(0% at 12% 82%)', opacity: 0 }}
        animate={{ clipPath: 'circle(120% at 12% 82%)', opacity: 1 }}
        exit={{ clipPath: 'circle(0% at 86% 18%)', opacity: 0 }}
        transition={{ duration: 1.25, ease: [0.16, 1, 0.3, 1] }}
        style={{ position: 'absolute', inset: 0, background: 'var(--color-cream)' }}
      />
      <motion.div className="ambient-orb-delayed" initial={{ opacity: 0 }} animate={{ opacity: 0.72 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }} style={{ position: 'absolute', width: '48vw', height: '48vw', borderRadius: '50%', right: '-22vw', top: '11vh', border: '1px solid rgba(104,37,47,.34)' }} />
      <div style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.22, duration: 0.55 }} style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Eyebrow>01 — Olfactive</Eyebrow>
          <NumberMark>02 / 05</NumberMark>
        </motion.div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '3.5vh' }}>
          <motion.div initial={{ opacity: 0, x: -22 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.36, duration: 0.7 }}>
            <Rule width="22vw" />
          </motion.div>
          <motion.h2 className="film-font" initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.9 }} style={{ margin: 0, color: 'var(--color-ink)', fontSize: '15vw', lineHeight: 0.72, fontWeight: 500, letterSpacing: '-0.04em' }}>
            Scent<br /><span style={{ color: 'var(--color-wine)', fontStyle: 'italic' }}>as</span> memory.
          </motion.h2>
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.92, duration: 0.65 }} style={{ width: '52%', marginLeft: '23%' }}>
            <Caption>Warm woods, polished glass, and a quiet kind of confidence.</Caption>
          </motion.div>
        </div>
        <motion.div initial={{ opacity: 0, scale: 0.86, rotate: -3 }} animate={{ opacity: 1, scale: 1, rotate: 2 }} exit={{ opacity: 0, scale: 1.15, rotate: 6 }} transition={{ delay: 0.72, duration: 1.05, ease: [0.16, 1, 0.3, 1] }} style={{ position: 'absolute', width: '54vw', height: '42vh', right: '-4vw', bottom: '10vh', border: '0.5vw solid var(--color-ink)', padding: '0.8vw', background: 'var(--color-cream)' }}>
          <MediaFrame><img src={asset('perfume-product.jpg')} alt="" /></MediaFrame>
          <div className="film-body" style={{ position: 'absolute', right: '1vw', bottom: '-3.3vh', color: 'var(--color-wine)', fontSize: '1.2vw', letterSpacing: '0.16em' }}>PARFUM / NO. 01</div>
        </motion.div>
      </div>
    </SafeFrame>
  );
}