// Página que lista semanas pagas pelo vendedor
import { useEffect, useState } from 'react';
import { fetchPaidWeeks } from '../services/api';

function PaidWeeksPage() {
  const [weeks, setWeeks] = useState([]);

  useEffect(() => {
    fetchPaidWeeks().then(setWeeks).catch(() => setWeeks([]));
  }, []);

  return (
    <div style={{ padding: '1rem' }}>
      <h1>Semanas Pagas</h1>
      <ul>
        {weeks.map((w) => (
          <li key={w.id}>
            {w.start_date} - {w.end_date}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default PaidWeeksPage;
