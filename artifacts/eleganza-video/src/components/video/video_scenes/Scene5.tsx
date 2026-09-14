import { motion } from 'framer-motion';

import { MediaFrame, SafeFrame } from '@/lib/video';

import { Caption, Eyebrow, NumberMark, Rule, asset } from './sceneUtils';

export function Scene5() {
  return (
    <SafeFrame style={{ position: 'relative', background: 'linear-gradient(150deg, #f6eadc 0%, #efd0bd 45%, #c77c61 100%)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.3 }} animate={{ opacity: 0.35, scale: 1 }} exit={{ opacity: 0, scale: 2.7 }} transition={{ duration: 1.2 }} style={{ position: 'absolute', width: '76vw', height: '76vw', borderRadius: '50%', right: '-33vw', top: '-9vh', border: '1px solid var(--color-cream)', boxShadow: '0 0 0 1.5vw rgba(246,234,220,.15), 0 0 0 3vw rgba(246,234,220,.08)' }} />
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.76 }} exit={{ opacity: 0 }} transition={{ duration: 0.7 }} style={{ position: 'absolute', inset: 'auto 0 0 0', height: '32vh', background: 'linear-gradient(0deg, rgba(104,37,47,.4), transparent)' }} />
      <div style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Eyebrow>04 — The edit</Eyebrow>
          <NumberMark>05 / 05</NumberMark>
        </motion.div>
        <div style={{ position: 'relative', marginTop: '-2vh' }}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}><Rule width="16vw" /></motion.div>
          <motion.h2 className="film-font" initial={{ opacity: 0, scale: 0.84, y: 26 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 1.15 }} transition={{ delay: 0.42, duration: 1.05, ease: [0.16, 1, 0.3, 1] }} style={{ margin: '2.5vh 0 2vh', color: 'var(--color-ink)', fontSize: '17vw', lineHeight: 0.7, fontWeight: 500, letterSpacing: '-0.05em' }}>
            Made for<br /><span style={{ color: 'var(--color-wine)', fontStyle: 'italic' }}>your</span> ritual.
          </motion.h2>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.92, duration: 0.7 }} style={{ width: '58%', marginLeft: '22%' }}>
            <Caption>Eleganza brings the whole world of beauty into one considered, cinematic edit.</Caption>
          </motion.div>
        </div>
        <motion.div initial={{ opacity: 0, y: 26, rotate: 4 }} animate={{ opacity: 1, y: 0, rotate: -3 }} exit={{ opacity: 0, y: -26, rotate: 4 }} transition={{ delay: 0.72, duration: 0.95, ease: [0.16, 1, 0.3, 1] }} style={{ height: '23vh', width: '100%', display: 'flex', gap: '1vw', overflow: 'hidden' }}>
          {['lip-product.jpg', 'bag-product.jpg', 'blouse-product.jpg', 'loafers-product.jpg'].map((file, index) => (
            <motion.div key={file} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.84 + index * 0.09, duration: 0.55 }} style={{ flex: index === 1 ? 1.25 : 1, minWidth: 0, border: '1px solid rgba(104,37,47,.32)', padding: '0.35vw', background: 'rgba(246,234,220,.48)' }}>
              <MediaFrame><img src={asset(file)} alt="" /></MediaFrame>
            </motion.div>
          ))}
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3, duration: 0.6 }} style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <div className="film-font" style={{ color: 'var(--color-wine)', fontSize: '8.5vw', lineHeight: 0.7, fontWeight: 600, letterSpacing: '-0.04em' }}>Eleganza</div>
            <div className="film-body" style={{ marginTop: '1.7vh', color: 'rgba(32,23,19,.66)', fontSize: '1.35vw', letterSpacing: '0.2em' }}>BEAUTY, EDITED BEAUTIFULLY</div>
          </div>
          <div style={{ width: '19vw', marginBottom: '0.8vh' }}><Rule width="19vw" /></div>
        </motion.div>
      </div>
    </SafeFrame>
  );
}