// Página de registo de novos vendedores
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerVendor } from '../services/api';

function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [product, setProduct] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await registerVendor({ name, email, password, product });
      alert('Registo efetuado. Verifique o seu email.');
      navigate('/login');
    } catch {
      setError('Erro no registo');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '2rem auto' }}>
      <h1>Registar Vendedor</h1>
      <form onSubmit={handleSubmit}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome"
        />
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
        <input
          value={product}
          onChange={(e) => setProduct(e.target.value)}
          placeholder="Produto"
        />
        <button type="submit">Registar</button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </form>
    </div>
  );
}

export default RegisterPage;
