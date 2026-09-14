import { AnimatePresence, motion } from 'framer-motion';

import {
  VideoCanvas,
  useVideoPlayer,
  type VideoAspectRatio,
} from '@/lib/video';

import { Scene1 } from './video_scenes/Scene1';
import { Scene2 } from './video_scenes/Scene2';
import { Scene3 } from './video_scenes/Scene3';
import { Scene4 } from './video_scenes/Scene4';
import { Scene5 } from './video_scenes/Scene5';

const SCENE_DURATIONS = {
  arrival: 4700,
  olfactive: 4100,
  chromatic: 3900,
  finishing: 4100,
  ritual: 5000,
};

const VIDEO_ASPECT_RATIO: VideoAspectRatio = '9:16';

const SCENE_TINTS = [
  'radial-gradient(circle at 82% 17%, rgba(184,109,72,.34), transparent 30%), linear-gradient(140deg, #201713 0%, #39261f 54%, #68252f 100%)',
  'radial-gradient(circle at 8% 85%, rgba(220,155,131,.24), transparent 32%), linear-gradient(140deg, #3a2018 0%, #6d2f28 54%, #b86d48 100%)',
  'radial-gradient(circle at 18% 66%, rgba(104,37,47,.2), transparent 28%), linear-gradient(150deg, #dca497 0%, #f0c5b5 58%, #f6eadc 100%)',
  'radial-gradient(circle at 76% 19%, rgba(217,170,104,.16), transparent 30%), linear-gradient(130deg, #211714 0%, #3a2422 48%, #68252f 100%)',
  'radial-gradient(circle at 86% 13%, rgba(246,234,220,.36), transparent 28%), linear-gradient(150deg, #f6eadc 0%, #efd0bd 45%, #c77c61 100%)',
];

export default function VideoTemplate() {
  const { currentScene } = useVideoPlayer({
    durations: SCENE_DURATIONS,
    loop: true,
  });

  const sceneBackground = SCENE_TINTS[currentScene] ?? SCENE_TINTS[0];

  return (
    <VideoCanvas
      className="film-canvas"
      aspectRatio={VIDEO_ASPECT_RATIO}
      style={{ background: sceneBackground }}
    >
      <motion.div
        aria-hidden="true"
        animate={{
          background: sceneBackground,
          opacity: currentScene === 2 || currentScene === 4 ? 0.36 : 0.72,
        }}
        transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
        style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}
      />
      <motion.div
        aria-hidden="true"
        className="ambient-orb"
        animate={{
          x: currentScene === 0 ? '12vw' : currentScene === 1 ? '45vw' : currentScene === 2 ? '-12vw' : currentScene === 3 ? '18vw' : '38vw',
          y: currentScene === 0 ? '4vh' : currentScene === 1 ? '18vh' : currentScene === 2 ? '42vh' : currentScene === 3 ? '-4vh' : '10vh',
          scale: currentScene === 0 ? 1.1 : currentScene === 2 ? 0.66 : 0.86,
          borderColor: currentScene === 2 || currentScene === 4 ? 'rgba(104,37,47,.26)' : 'rgba(217,170,104,.26)',
        }}
        transition={{ duration: 2.1, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'absolute',
          width: '28vw',
          height: '28vw',
          top: '16vh',
          left: '-14vw',
          border: '1px solid',
          borderRadius: '50%',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />
      <motion.div
        aria-hidden="true"
        animate={{ rotate: currentScene * 23, opacity: currentScene === 2 || currentScene === 4 ? 0.12 : 0.18 }}
        transition={{ duration: 1.7, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'absolute',
          width: '78vw',
          height: '78vw',
          right: '-42vw',
          bottom: '9vh',
          border: '1px solid var(--color-gold)',
          borderRadius: '50%',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: '6vmin',
          right: '6vmin',
          top: '6vmin',
          bottom: '6vmin',
          border: '1px solid rgba(246,234,220,.18)',
          zIndex: 5,
          pointerEvents: 'none',
        }}
      />
      <div
        aria-hidden="true"
        className="film-body"
        style={{
          position: 'absolute',
          top: '50%',
          right: '2.1vmin',
          color: 'rgba(246,234,220,.32)',
          fontSize: '1.05vw',
          letterSpacing: '0.3em',
          writingMode: 'vertical-rl',
          transform: 'translateY(-50%)',
          zIndex: 5,
          pointerEvents: 'none',
        }}
      >
        ELEGANZA / 2024
      </div>
      <AnimatePresence mode="sync" initial={false}>
        {currentScene === 0 && <Scene1 key="arrival" />}
        {currentScene === 1 && <Scene2 key="olfactive" />}
        {currentScene === 2 && <Scene3 key="chromatic" />}
        {currentScene === 3 && <Scene4 key="finishing" />}
        {currentScene === 4 && <Scene5 key="ritual" />}
      </AnimatePresence>
    </VideoCanvas>
  );
}