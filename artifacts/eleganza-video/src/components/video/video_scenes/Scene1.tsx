import { motion } from 'framer-motion';

import { MediaFrame, SafeFrame } from '@/lib/video';

import { Caption, Eyebrow, NumberMark, Rule, asset } from './sceneUtils';

export function Scene1() {
  return (
    <SafeFrame style={{ position: 'relative' }}>
      <motion.div
        initial={{ opacity: 0, scale: 1.08 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.16 }}
        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          background: 'var(--color-ink)',
        }}
      >
        <MediaFrame style={{ position: 'absolute', inset: 0, opacity: 0.66 }}>
          <img src={asset('beauty-hero.jpg')} alt="" />
        </MediaFrame>
        <div
          className="slow-sheen"
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(90deg, rgba(32,23,19,.95) 0%, rgba(32,23,19,.32) 45%, rgba(32,23,19,.08) 100%)',
          }}
        />
      </motion.div>

      <motion.div
        className="ambient-orb"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 0.68, scale: 1 }}
        exit={{ opacity: 0, scale: 1.8 }}
        transition={{ duration: 1.1, delay: 0.35 }}
        style={{
          position: 'absolute',
          width: '42vw',
          height: '42vw',
          right: '-16vw',
          top: '17vh',
          borderRadius: '50%',
          border: '1px solid rgba(217,170,104,.48)',
          boxShadow: '0 0 0 1.5vw rgba(217,170,104,.06), 0 0 0 3vw rgba(217,170,104,.035)',
        }}
      />

      <div style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <motion.div
          initial={{ opacity: 0, y: -18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.6 }}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <div className="film-body" style={{ color: 'var(--color-cream)', fontSize: '1.35vw', letterSpacing: '0.28em', fontWeight: 600 }}>
            E / 24
          </div>
          <div className="film-body" style={{ color: 'rgba(246,234,220,.72)', fontSize: '1.25vw', letterSpacing: '0.18em' }}>
            BEAUTY / OBJECTS
          </div>
        </motion.div>

        <div style={{ marginTop: '-3vh', maxWidth: '80%' }}>
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.58, duration: 0.72 }}>
            <Eyebrow light>Introducing</Eyebrow>
          </motion.div>
          <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.72, duration: 0.75 }} style={{ transformOrigin: 'left', margin: '1.4vh 0 2.4vh' }}>
            <Rule width="18vw" light />
          </motion.div>
          <motion.h1
            className="film-font"
            initial={{ opacity: 0, y: 30, letterSpacing: '0.08em' }}
            animate={{ opacity: 1, y: 0, letterSpacing: '-0.035em' }}
            exit={{ opacity: 0, scale: 1.2 }}
            transition={{ delay: 0.8, duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            style={{ color: 'var(--color-cream)', fontSize: '18vw', fontWeight: 500, lineHeight: 0.72, margin: 0 }}
          >
            Eleganza
          </motion.h1>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.45, duration: 0.7 }} style={{ marginTop: '3.5vh', maxWidth: '58%' }}>
            <Caption light>A storefront for the beautiful everyday — fragrance, makeup, and the finishing touch.</Caption>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.75, duration: 0.55 }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <NumberMark>01 / 05</NumberMark>
          <div className="vertical-word film-body" style={{ color: 'rgba(246,234,220,.66)', fontSize: '1.25vw', letterSpacing: '0.18em' }}>THE BEAUTY EDIT</div>
        </motion.div>
      </div>
    </SafeFrame>
  );
}