import React from 'react';

const Calendar = () => {
  return (
    <div className="bg-theme-bg theme-transition -m-6 min-h-[calc(100vh-0px)] w-[calc(100%+3rem)]">
      <div className="p-6 min-h-full">
        <div className="bg-theme-surface rounded-lg shadow p-6 flex flex-col items-center justify-center min-h-[400px] theme-transition">
          <h1 className="text-2xl font-bold mb-4 text-theme-text">Kalender</h1>
          <div className="text-lg text-theme-text-secondary mb-2">Kommt bald</div>
          <p className="text-sm text-theme-text-muted text-center max-w-md">
            Dieser Bereich wird in Kürze verfügbar sein. Bleiben Sie gespannt für kommende Funktionen!
          </p>
        </div>
      </div>
    </div>
  );
};

export default Calendar;