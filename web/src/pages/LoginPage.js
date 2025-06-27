import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/api';
import styles from './LoginPage.module.css';
import { useTranslation } from '../i18n';

function LoginPage() {
  const navigate = useNavigate();
  const t = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await login(email, password);
      localStorage.setItem('token', data.access_token);
      navigate('/vendor');
    } catch (err) {
      setError(t('invalidCredentials'));
    }
  };

  return (
    <div className={styles.container}>
      <h1>{t('loginTitle')}</h1>
      <form onSubmit={handleSubmit} className={styles.form}>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('emailPlaceholder')}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t('passwordPlaceholder')}
        />
        <button type="submit">{t('loginButton')}</button>
        {error && <p className={styles.error}>{error}</p>}
      </form>
    </div>
  );
}

export default LoginPage;
