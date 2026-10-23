import { Suspense, useEffect, useRef, useState } from 'react';

// Reserve space to limit layout movement; load below-fold modules near the viewport.
export default function DeferredSection({ children }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!('IntersectionObserver' in window)) { setVisible(true); return; }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); observer.disconnect(); }
    }, { rootMargin: '600px' });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return <section ref={ref} style={{ minHeight: visible ? undefined : 400 }}>
    {visible && <Suspense fallback={null}>{children}</Suspense>}
  </section>;
}
