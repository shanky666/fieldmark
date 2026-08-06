import { useState, useEffect } from 'react';
import { differenceInMinutes, parse, format, isWithinInterval, addDays } from 'date-fns';

interface ShiftData {
  window_start: string; // HH:MM:SS
  window_end: string;
}

export function useShiftWindow(shift: ShiftData | null) {
  const [isOpen, setIsOpen] = useState(false);
  const [timeRemainingText, setTimeRemainingText] = useState('');
  const [windowText, setWindowText] = useState('06:00 AM – 10:30 AM');

  useEffect(() => {
    function calculateShift() {
      const now = new Date();
      let startStr = '06:00:00';
      let endStr = '10:30:00';

      if (shift) {
        startStr = shift.window_start;
        endStr = shift.window_end;
      }

      // Convert times
      const todayStr = format(now, 'yyyy-MM-dd');
      const startTime = parse(`${todayStr} ${startStr}`, 'yyyy-MM-dd HH:mm:ss', new Date());
      let endTime = parse(`${todayStr} ${endStr}`, 'yyyy-MM-dd HH:mm:ss', new Date());

      // Handle overnight shifts
      if (endTime < startTime) {
        endTime = addDays(endTime, 1);
      }

      // Update window text
      setWindowText(`${format(startTime, 'hh:mm a')} – ${format(endTime, 'hh:mm a')}`);

      const within = now >= startTime && now <= endTime;
      setIsOpen(within);

      if (within) {
        const diffMins = differenceInMinutes(endTime, now);
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        
        if (hours > 0) {
          setTimeRemainingText(`${hours}h ${mins}m`);
        } else {
          setTimeRemainingText(`${mins}m`);
        }
      } else {
        setTimeRemainingText('');
      }
    }

    calculateShift();
    const interval = setInterval(calculateShift, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [shift]);

  return {
    isOpen,
    timeRemainingText,
    windowText
  };
}
