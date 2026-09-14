import { motion } from 'framer-motion';

import { MediaFrame, SafeFrame } from '@/lib/video';

import { Caption, Eyebrow, NumberMark, Rule, asset } from './sceneUtils';

export function Scene4() {
  return (
    <SafeFrame style={{ position: 'relative', background: 'linear-gradient(130deg, #211714 0%, #3a2422 48%, #68252f 100%)' }}>
      <motion.div className="micro-drift" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 0.75, x: 0 }} exit={{ opacity: 0, x: 40 }} transition={{ duration: 0.9 }} style={{ position: 'absolute', inset: '10% -18% auto 36%', height: '44vh', borderRadius: '50%', background: 'radial-gradient(circle, rgba(217,170,104,.27), transparent 67%)' }} />
      <div style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Eyebrow light>03 — Finishing touch</Eyebrow>
          <div className="film-body" style={{ color: 'var(--color-gold)', fontSize: '1.35vw', fontWeight: 600, letterSpacing: '0.16em' }}>04 / 05</div>
        </motion.div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '3vh' }}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}><Rule width="18vw" light /></motion.div>
          <motion.h2 className="film-font" initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -60 }} transition={{ delay: 0.38, duration: 0.9 }} style={{ margin: 0, color: 'var(--color-cream)', fontSize: '16vw', lineHeight: 0.72, fontWeight: 500, letterSpacing: '-0.045em' }}>
            Details<br /><span style={{ color: 'var(--color-gold)', fontStyle: 'italic' }}>that</span><br />linger.
          </motion.h2>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 0.6 }} style={{ width: '54%', marginLeft: '22%' }}>
            <Caption light>Gold in the light. A silhouette in motion. Your signature, made visible.</Caption>
          </motion.div>
        </div>
        <motion.div initial={{ opacity: 0, rotate: 9, scale: 0.86 }} animate={{ opacity: 1, rotate: -5, scale: 1 }} exit={{ opacity: 0, scale: 1.2, rotate: -16 }} transition={{ delay: 0.55, duration: 1.08, ease: [0.16, 1, 0.3, 1] }} style={{ position: 'absolute', right: '-5vw', bottom: '9vh', width: '58vw', height: '38vh', border: '1px solid rgba(217,170,104,.68)', padding: '0.7vw', background: 'rgba(246,234,220,.08)' }}>
          <MediaFrame><img src={asset('jewelry-product.jpg')} alt="" /></MediaFrame>
        </motion.div>
        <motion.div initial={{ opacity: 0, scaleX: 0 }} animate={{ opacity: 1, scaleX: 1 }} transition={{ delay: 1.05, duration: 0.8 }} style={{ position: 'absolute', left: 0, bottom: '6.2vh', width: '34vw', transformOrigin: 'left' }}><Rule width="34vw" light /></motion.div>
      </div>
    </SafeFrame>
  );
}