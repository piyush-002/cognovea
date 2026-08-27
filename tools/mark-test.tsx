/** Local harness: renders the real Mark + MarkCanvas so the animation can be checked. */
import { createRoot } from 'react-dom/client';
import Mark from '@/components/Mark';
import MarkCanvas from '@/components/MarkCanvas';

createRoot(document.getElementById('root')!).render(
  <div style={{ background: '#0A1024', padding: 40, display: 'grid', gap: 28, justifyItems: 'center' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <Mark />
      <span style={{ color: '#fff', fontFamily: 'sans-serif', fontSize: 22 }}>cognovea, lockup @34px</span>
    </div>
    <div style={{ width: 420, height: 420 }}>
      <MarkCanvas label="mark" />
    </div>
  </div>,
);
