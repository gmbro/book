'use client';

import { useState } from 'react';

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];
const MONTH_NAMES = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

interface CalendarProps {
  proposedDates?: string[];
  confirmedDates?: string[];
  confirmedTimes?: Record<string, string>;
  onDateClick?: (date: string) => void;
}

export default function Calendar({ proposedDates = [], confirmedDates = [], confirmedTimes = {}, onDateClick }: CalendarProps) {
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

  // 음력 공휴일 등 특별 날짜 (간단 표시용)
  const getHolidayLabel = (dateStr: string): string | null => {
    if (!dateStr) return null;
    const md = dateStr.slice(5); // MM-DD
    const holidays: Record<string, string> = {
      '01-01': '새해', '03-01': '삼일절', '05-05': '어린이날',
      '06-06': '현충일', '08-15': '광복절', '10-03': '개천절',
      '10-09': '한글날', '12-25': '성탄절',
    };
    return holidays[md] || null;
  };

  return (
    <div className="section kr-calendar">
      {/* 헤더 */}
      <div className="kr-cal-header">
        <button className="kr-cal-arrow" onClick={() => setCur(new Date(y, m-1, 1))}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div className="kr-cal-title">
          <span className="kr-cal-year">{y}년</span>
          <span className="kr-cal-month">{MONTH_NAMES[m]}</span>
        </div>
        <button className="kr-cal-arrow" onClick={() => setCur(new Date(y, m+1, 1))}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
        <button className="kr-cal-today" onClick={() => setCur(new Date())}>오늘</button>
      </div>

      {/* 요일 헤더 */}
      <div className="kr-cal-grid">
        {DAYS.map((d, i) => (
          <div key={d} className={`kr-cal-weekday ${i === 0 ? 'sun' : ''} ${i === 6 ? 'sat' : ''}`}>{d}</div>
        ))}

        {/* 날짜 */}
        {cells.map((c, i) => {
          const isToday = c.str === todayStr;
          const hasProp = proposedDates.includes(c.str);
          const hasConf = confirmedDates.includes(c.str);
          const confirmedTime = confirmedTimes[c.str];
          const clickable = hasConf && onDateClick;
          const dayOfWeek = i % 7;
          const isSun = dayOfWeek === 0;
          const isSat = dayOfWeek === 6;
          const holiday = getHolidayLabel(c.str);

          return (
            <div
              key={i}
              className={[
                'kr-cal-cell',
                c.other ? 'other' : '',
                isToday ? 'today' : '',
                hasConf ? 'confirmed' : '',
                isSun || holiday ? 'holiday' : '',
                isSat ? 'saturday' : '',
              ].filter(Boolean).join(' ')}
              onClick={() => clickable && onDateClick(c.str)}
              style={clickable ? {cursor:'pointer'} : undefined}
            >
              <span className="kr-cal-date">{c.d}</span>
              {holiday && !c.other && <span className="kr-cal-holiday-label">{holiday}</span>}
              {(hasProp || hasConf) && !c.other && (
                <div className="kr-cal-indicator">
                  {hasConf ? (
                    <span className="kr-cal-badge conf">{confirmedTime || '모임'}</span>
                  ) : (
                    <span className="kr-cal-badge prop" />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 범례 */}
      <div className="kr-cal-legend">
        <span className="kr-cal-legend-item"><span className="kr-cal-badge prop" /> 제안</span>
        <span className="kr-cal-legend-item"><span className="kr-cal-badge conf">모임</span> 확정</span>
      </div>
    </div>
  );
}
