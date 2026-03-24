'use client';

import { useState, useRef, useEffect } from 'react';

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];

const HOLIDAYS: Record<string, string> = {
  '01-01': '새해', '03-01': '삼일절', '05-05': '어린이날',
  '06-06': '현충일', '08-15': '광복절', '10-03': '개천절',
  '10-09': '한글날', '12-25': '성탄절',
};

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
}

export default function DatePicker({ value, onChange, placeholder = '날짜 선택' }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [cur, setCur] = useState(() => value ? new Date(value + 'T00:00:00') : new Date());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const y = cur.getFullYear(), m = cur.getMonth();
  const first = new Date(y, m, 1).getDay();
  const days = new Date(y, m + 1, 0).getDate();
  const prevDays = new Date(y, m, 0).getDate();
  const fmt = (y: number, m: number, d: number) => `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;

  const cells: { d: number; other: boolean; str: string }[] = [];
  for (let i = first - 1; i >= 0; i--) cells.push({ d: prevDays - i, other: true, str: '' });
  for (let d = 1; d <= days; d++) cells.push({ d, other: false, str: fmt(y, m, d) });
  const rem = 42 - cells.length;
  for (let d = 1; d <= rem; d++) cells.push({ d, other: true, str: '' });

  const todayStr = (() => { const t = new Date(); return fmt(t.getFullYear(), t.getMonth(), t.getDate()); })();

  const displayText = value
    ? new Date(value + 'T00:00:00').toLocaleDateString('ko', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })
    : '';

  return (
    <div className="dp-wrap" ref={ref}>
      <button
        type="button"
        className="dp-trigger"
        onClick={() => { setOpen(!open); if (value) setCur(new Date(value + 'T00:00:00')); }}
      >
        <span className={displayText ? '' : 'dp-placeholder'}>{displayText || placeholder}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
      </button>
      {open && (
        <div className="dp-dropdown">
          <div className="dp-header">
            <button type="button" onClick={() => setCur(new Date(y, m - 1, 1))}>‹</button>
            <span>{y}년 {m + 1}월</span>
            <button type="button" onClick={() => setCur(new Date(y, m + 1, 1))}>›</button>
          </div>
          <div className="dp-grid">
            {DAYS.map((d, i) => (
              <div key={d} className={`dp-wday ${i === 0 ? 'sun' : ''} ${i === 6 ? 'sat' : ''}`}>{d}</div>
            ))}
            {cells.map((c, i) => {
              const dayOfWeek = i % 7;
              const hol = c.str ? HOLIDAYS[c.str.slice(5)] : null;
              const isSel = c.str === value;
              const isToday = c.str === todayStr;
              return (
                <button
                  key={i}
                  type="button"
                  className={[
                    'dp-cell',
                    c.other ? 'other' : '',
                    isSel ? 'selected' : '',
                    isToday ? 'today' : '',
                    dayOfWeek === 0 || hol ? 'sun' : '',
                    dayOfWeek === 6 ? 'sat' : '',
                  ].filter(Boolean).join(' ')}
                  disabled={c.other}
                  onClick={() => { onChange(c.str); setOpen(false); }}
                >
                  {c.d}
                </button>
              );
            })}
          </div>
          <div className="dp-footer">
            <button type="button" className="dp-today-btn" onClick={() => { onChange(todayStr); setOpen(false); }}>오늘</button>
            {value && <button type="button" className="dp-clear-btn" onClick={() => { onChange(''); setOpen(false); }}>초기화</button>}
          </div>
        </div>
      )}
    </div>
  );
}
