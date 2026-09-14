import { motion } from 'framer-motion';

import { MediaFrame, SafeFrame } from '@/lib/video';

import { Caption, Eyebrow, NumberMark, Rule, asset } from './sceneUtils';

export function Scene3() {
  return (
    <SafeFrame style={{ position: 'relative', background: 'linear-gradient(160deg, #dca497 0%, #f0c5b5 58%, #f6eadc 100%)' }}>
      <motion.div initial={{ opacity: 0, rotate: -8, scale: 0.7 }} animate={{ opacity: 0.45, rotate: 12, scale: 1 }} exit={{ opacity: 0, scale: 2 }} transition={{ duration: 1.1 }} style={{ position: 'absolute', width: '62vw', height: '62vw', borderRadius: '50%', border: '1px solid var(--color-cream)', left: '-30vw', top: '29vh' }} />
      <div style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Eyebrow>02 — Chromatic</Eyebrow>
          <NumberMark>03 / 05</NumberMark>
        </motion.div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.24, duration: 0.5 }}><Rule width="14vw" /></motion.div>
          <motion.h2 className="film-font" initial={{ opacity: 0, y: 32, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -24 }} transition={{ delay: 0.36, duration: 1 }} style={{ margin: '2.4vh 0 1.5vh', color: 'var(--color-ink)', fontSize: '18vw', lineHeight: 0.68, fontWeight: 500, letterSpacing: '-0.05em' }}>
            Color<br /><span style={{ color: 'var(--color-wine)' }}>with</span><br />a pulse.
          </motion.h2>
          <motion.div initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.85, duration: 0.65 }} style={{ maxWidth: '53%', marginLeft: '23%' }}>
            <Caption>Soft-focus blush, a little drama, and the glow that makes a room look back.</Caption>
          </motion.div>
        </div>
        <motion.div initial={{ opacity: 0, y: 25, rotate: 6 }} animate={{ opacity: 1, y: 0, rotate: -4 }} exit={{ opacity: 0, y: 70, rotate: 10 }} transition={{ delay: 0.64, duration: 0.98, ease: [0.16, 1, 0.3, 1] }} style={{ position: 'absolute', width: '46vw', height: '34vh', left: '48%', bottom: '9vh', transformOrigin: 'center', border: '0.8vw solid var(--color-cream)', boxShadow: '1vw 1.4vw 0 rgba(104,37,47,.18)' }}>
          <MediaFrame><img src={asset('makeup-product.jpg')} alt="" /></MediaFrame>
        </motion.div>
        <motion.div className="film-body" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.12 }} style={{ position: 'absolute', right: 0, bottom: '5vh', color: 'var(--color-wine)', fontSize: '1.25vw', letterSpacing: '0.2em', writingMode: 'vertical-rl' }}>LUMEN / CHEEK COLOR</motion.div>
      </div>
    </SafeFrame>
  );
}