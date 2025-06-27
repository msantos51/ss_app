// Página de login para clientes
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clientLogin, fetchClientProfile } from '../services/api';

// ClientLoginPage
function ClientLoginPage() {
  // navigate
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // handleSubmit
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // data
      const data = await clientLogin(email, password);
      localStorage.setItem('clientToken', data.access_token);
      // id
      const id = JSON.parse(atob(data.access_token.split('.')[1])).sub;
      // profile
      const profile = await fetchClientProfile(id);
      localStorage.setItem('client', JSON.stringify(profile));
      navigate('/client');
    } catch {
      setError('Credenciais inválidas');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '2rem auto' }}>
      <h1>Login Cliente</h1>
      <form onSubmit={handleSubmit}>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
        />
        <button type="submit">Entrar</button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </form>
    </div>
  );
}

export default ClientLoginPage;
