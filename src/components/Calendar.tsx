'use client';

import { useState } from 'react';

interface CalendarProps {
  proposedDates?: string[];
  confirmedDates?: string[];
  onDateClick?: (date: string) => void;
}

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];

export default function Calendar({ proposedDates = [], confirmedDates = [], onDateClick }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToday = () => {
    setCurrentDate(new Date());
  };

  const formatDateStr = (y: number, m: number, d: number) => {
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  };

  const renderDays = () => {
    const cells = [];

    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      cells.push(
        <div key={`prev-${day}`} className="calendar-day other-month">
          {day}
        </div>
      );
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = formatDateStr(year, month, day);
      const isToday = dateStr === todayStr;
      const hasProposal = proposedDates.includes(dateStr);
      const isConfirmed = confirmedDates.includes(dateStr);

      cells.push(
        <div
          key={`curr-${day}`}
          className={`calendar-day ${isToday ? 'today' : ''} ${hasProposal || isConfirmed ? 'has-proposal' : ''}`}
          onClick={() => (hasProposal || isConfirmed) && onDateClick?.(dateStr)}
        >
          {day}
          {(hasProposal || isConfirmed) && (
            <div className="calendar-dots">
              {hasProposal && <span className="calendar-dot" />}
              {isConfirmed && <span className="calendar-dot confirmed" />}
            </div>
          )}
        </div>
      );
    }

    // Next month days
    const remaining = 42 - cells.length;
    for (let day = 1; day <= remaining; day++) {
      cells.push(
        <div key={`next-${day}`} className="calendar-day other-month">
          {day}
        </div>
      );
    }

    return cells;
  };

  return (
    <div className="calendar">
      <div className="calendar-nav">
        <div className="calendar-nav-btns">
          <button onClick={prevMonth}>‹</button>
        </div>
        <h3>{year}년 {month + 1}월</h3>
        <div className="calendar-nav-btns">
          <button className="today-btn" onClick={goToday}>오늘</button>
          <button onClick={nextMonth}>›</button>
        </div>
      </div>
      <div className="calendar-grid">
        {DAYS.map(d => (
          <div key={d} className="calendar-day-header">{d}</div>
        ))}
        {renderDays()}
      </div>
    </div>
  );
}
