'use client';

import { useState } from 'react';

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];

interface CalendarProps {
  proposedDates?: string[];
  confirmedDates?: string[];
  onDateClick?: (date: string) => void;
}

export default function Calendar({ proposedDates = [], confirmedDates = [], onDateClick }: CalendarProps) {
  const [cur, setCur] = useState(new Date());
  const y = cur.getFullYear(), m = cur.getMonth();
  const first = new Date(y, m, 1).getDay();
  const days = new Date(y, m + 1, 0).getDate();
  const prevDays = new Date(y, m, 0).getDate();
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

  const fmt = (y: number, m: number, d: number) => `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;

  const cells = [];
  for (let i = first - 1; i >= 0; i--) cells.push({ d: prevDays - i, other: true, str: '' });
  for (let d = 1; d <= days; d++) cells.push({ d, other: false, str: fmt(y, m, d) });
  const rem = 42 - cells.length;
  for (let d = 1; d <= rem; d++) cells.push({ d, other: true, str: '' });

  return (
    <div className="section">
      <div className="cal-nav">
        <div className="cal-nav-btns">
          <button onClick={() => setCur(new Date(y, m-1, 1))}>‹</button>
        </div>
        <h3>{y}년 {m+1}월</h3>
        <div className="cal-nav-btns">
          <button className="cal-today-btn" onClick={() => setCur(new Date())}>오늘</button>
          <button onClick={() => setCur(new Date(y, m+1, 1))}>›</button>
        </div>
      </div>
      <div className="cal-grid">
        {DAYS.map(d => <div key={d} className="cal-head">{d}</div>)}
        {cells.map((c, i) => {
          const isToday = c.str === todayStr;
          const hasProp = proposedDates.includes(c.str);
          const hasConf = confirmedDates.includes(c.str);
          const clickable = hasConf && onDateClick;
          return (
            <div
              key={i}
              className={`cal-day ${c.other ? 'other' : ''} ${isToday ? 'today' : ''} ${hasConf ? 'confirmed-day' : ''}`}
              onClick={() => clickable && onDateClick(c.str)}
              style={clickable ? {cursor:'pointer'} : undefined}
            >
              {c.d}
              {(hasProp || hasConf) && (
                <div className="cal-dots">
                  {hasProp && !hasConf && <span className="cal-dot" />}
                  {hasConf && <span className="cal-dot confirmed" />}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
