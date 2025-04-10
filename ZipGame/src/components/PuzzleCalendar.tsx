import React from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './PuzzleCalendar.css';
import type { Difficulty, PuzzleStatus } from '../types/gameTypes';

interface PuzzleCalendarProps {
  onSelectDay: (date: Date) => void;
  selectedDate: Date;
  puzzleStatuses?: Record<string, PuzzleStatus>;
}

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  'EASY': 'Lundi, Mardi',
  'MEDIUM': 'Mercredi à Vendredi',
  'HARD': 'Samedi, Dimanche'
};

export const PuzzleCalendar: React.FC<PuzzleCalendarProps> = ({ 
  onSelectDay, 
  selectedDate,
  puzzleStatuses = {} 
}) => {
  const startDate = new Date(2024, 2, 2); // 2 mars 2024
  const today = new Date();

  const getDifficultyForDate = (date: Date): Difficulty => {
    const day = date.getDay(); // 0 = dimanche, 1 = lundi, ..., 6 = samedi
    
    if (day === 0) return 'HARD'; // Dimanche
    if (day <= 2) return 'EASY'; // Lundi, Mardi
    if (day <= 5) return 'MEDIUM'; // Mercredi, Jeudi, Vendredi
    return 'HARD'; // Samedi
  };

  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return null;
    
    const timeDiff = Math.floor((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const puzzleNumber = timeDiff + 1;
    
    if (puzzleNumber > 0 && date <= today) {
      const difficulty = getDifficultyForDate(date);
      return (
        <div className="tile-content">
          <span className="puzzle-number">#{puzzleNumber}</span>
          <span className={`difficulty-indicator ${difficulty.toLowerCase()}`} />
        </div>
      );
    }
    return null;
  };

  const tileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return '';

    const isToday = date.toDateString() === today.toDateString();
    const isPast = date < today;
    const isFuture = date > today;
    const isSelected = date.toDateString() === selectedDate.toDateString();

    let classes = [];
    if (isToday) classes.push('today');
    if (isPast) classes.push('past');
    if (isFuture) classes.push('future');
    if (isSelected) classes.push('selected');

    // Ajouter la classe en fonction du statut du puzzle
    const status = puzzleStatuses[date.toISOString().split('T')[0]];
    if (status === 'COMPLETED') {
      classes.push('completed');
    } else if (status === 'SOLVED_WITH_HELP') {
      classes.push('solved-with-help');
    }

    return classes.join(' ');
  };

  const handleDateChange = (value: any) => {
    if (value instanceof Date && value <= today) {
      onSelectDay(value);
    }
  };

  return (
    <div className="calendar-wrapper">
      <Calendar
        onChange={handleDateChange}
        value={selectedDate}
        tileContent={tileContent}
        tileClassName={tileClassName}
        minDetail="month"
        maxDate={today}
        minDate={startDate}
      />
      <div className="difficulty-legend">
        <h3>Difficulté par jour</h3>
        <div className="legend-items">
          {(Object.entries(DIFFICULTY_LABELS) as [Difficulty, string][]).map(([difficulty, days]) => (
            <div key={difficulty} className="legend-item">
              <span className={`difficulty-indicator ${difficulty.toLowerCase()}`} />
              <span className="legend-text">
                <strong>{difficulty}</strong> - {days}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}; 