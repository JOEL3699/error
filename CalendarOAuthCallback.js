import React from 'react';
import { useNavigate } from 'react-router-dom';

const CalendarOAuthCallback = () => {
  const navigate = useNavigate();
  
  // Einfach zur Kalenderseite zurückleiten
  React.useEffect(() => {
    // Kurze Verzögerung, dann zurück zum Calendar
    setTimeout(() => {
      navigate('/calendar');
    }, 1000);
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Kalender-Funktion noch nicht verfügbar</h2>
          <p className="text-gray-500">Sie werden zur Kalenderseite weitergeleitet...</p>
        </div>
      </div>
    </div>
  );
};

export default CalendarOAuthCallback;