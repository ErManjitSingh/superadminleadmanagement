import { useEffect, useState } from 'react';

/** Greeting by local time: morning before 12, afternoon before 17, else evening */
export function getTimeGreeting(date = new Date()) {
  const h = date.getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

/** Ms until the next greeting boundary (noon, 5pm, or midnight) */
function msUntilNextGreetingChange(now = new Date()) {
  const next = new Date(now);
  const h = now.getHours();
  if (h < 12) {
    next.setHours(12, 0, 0, 0);
  } else if (h < 17) {
    next.setHours(17, 0, 0, 0);
  } else {
    next.setDate(next.getDate() + 1);
    next.setHours(0, 0, 0, 0);
  }
  return Math.max(next.getTime() - now.getTime(), 60_000);
}

/** Greeting that updates when the time period changes */
export function useTimeGreeting() {
  const [greeting, setGreeting] = useState(() => getTimeGreeting());

  useEffect(() => {
    setGreeting(getTimeGreeting());

    let timerId;
    const schedule = () => {
      timerId = window.setTimeout(() => {
        setGreeting(getTimeGreeting());
        schedule();
      }, msUntilNextGreetingChange());
    };
    schedule();

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        setGreeting(getTimeGreeting());
      }
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      window.clearTimeout(timerId);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return greeting;
}
