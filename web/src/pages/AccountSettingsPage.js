// Página para alterar definições como notificações
import { useEffect, useState } from 'react';
import { isNotificationsEnabled, setNotificationsEnabled } from '../services/settings';

function AccountSettingsPage() {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    setEnabled(isNotificationsEnabled());
  }, []);

  const toggle = () => {
    const val = !enabled;
    setEnabled(val);
    setNotificationsEnabled(val);
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h1>Notificações</h1>
      <label>
        <input type="checkbox" checked={enabled} onChange={toggle} /> Ativar
      </label>
    </div>
  );
}

export default AccountSettingsPage;
