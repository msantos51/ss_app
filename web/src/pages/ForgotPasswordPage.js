// Página para solicitar recuperação de palavra-passe
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { requestPasswordReset } from '../services/api';

// ForgotPasswordPage
function ForgotPasswordPage() {
  // navigate
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  // handleSubmit
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await requestPasswordReset(email);
      alert('Verifique o seu e-mail para definir nova palavra-passe');
      navigate('/login');
    } catch {
      setError('Erro ao solicitar recuperação');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '2rem auto' }}>
      <h1>Recuperar Palavra-passe</h1>
      <form onSubmit={handleSubmit}>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
        />
        <button type="submit">Enviar</button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </form>
    </div>
  );
}

export default ForgotPasswordPage;
