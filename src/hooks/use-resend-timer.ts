import { useEffect, useState } from "react";

/** Seconds left before another code may be requested. Counts from mount, and again from `restart`. */
export function useResendTimer(seconds: number) {
  const [sentAt, setSentAt] = useState(() => Date.now());
  const [now, setNow] = useState(sentAt);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [sentAt]);

  const restart = () => {
    const t = Date.now();
    setSentAt(t);
    setNow(t);
  };

  return { left: Math.max(0, seconds - Math.floor((now - sentAt) / 1000)), restart };
}
