import { useState, useEffect, useRef } from "react";

const useResendCooldown = (cooldownSec = 60, storageKey = null) => {
  const timer = useRef(null);

  // проверяем активен ли кулдаун или нет
  const getRemaining = () => {
    if (!storageKey) return 0;
    const until = localStorage.getItem(storageKey);
    if (!until) return 0;
    const remaining = Math.ceil((parseInt(until) - Date.now()) / 1000);
    return remaining > 0 ? remaining : 0;
  };

  const [seconds, setSeconds] = useState(() => getRemaining());

  const runTimer = (initialSeconds) => {
    clearInterval(timer.current);
    setSeconds(initialSeconds);
    timer.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(timer.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  // восстанавливаем таймер если кулдаун не истёк
  useEffect(() => {
    const remaining = getRemaining();
    if (remaining > 0) runTimer(remaining);
    return () => clearInterval(timer.current);
  }, []);

  const start = () => {
    if (storageKey) {
      localStorage.setItem(storageKey, String(Date.now() + cooldownSec * 1000));
    }
    runTimer(cooldownSec);
  };

  return { seconds, isActive: seconds > 0, start };
};

export default useResendCooldown;