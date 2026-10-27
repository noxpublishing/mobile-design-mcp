import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

export function useStudyMotion() {
  const initial = useReducedMotion();
  const [reduced, setReduced] = useState(initial);
  useEffect(() => {
    let active = true;
    let eventReceived = false;
    const listener = AccessibilityInfo.addEventListener('reduceMotionChanged', value => {
      eventReceived = true; setReduced(value);
    });
    AccessibilityInfo.isReduceMotionEnabled().then(value => {
      if (active && !eventReceived) setReduced(value);
    }).catch(() => { /* Keep the synchronous native preference if querying fails. */ });
    return () => { active = false; listener.remove(); };
  }, []);
  return reduced;
}
