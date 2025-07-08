import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BASE_URL } from '../config';

export default function VendorDashboard() {
  const [vendor, setVendor] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [paymentsOpen, setPaymentsOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const navigate = useNavigate();

  // carrega dados do vendedor guardados no localStorage
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      setVendor(JSON.parse(stored));
    }
  }, []);

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/vendor-login');
  };

  const paySubscription = async () => {
    if (!vendor) return;
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${BASE_URL}/vendors/${vendor.id}/create-checkout-session`,
        null,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      if (res.data.checkout_url) window.open(res.data.checkout_url, '_blank');
    } catch {
      alert('Erro no pagamento');
    }
  };

  return (
    <div style={styles.container}>

      <button
        style={styles.menuButton}
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Abrir menu"
      >
        ☰
      </button>


      {menuOpen && (
        <div style={styles.menu}>
          <div>
            <button style={styles.sectionHeader} onClick={() => setPaymentsOpen(!paymentsOpen)}>Pagamentos</button>
            {paymentsOpen && (
              <div style={styles.subMenu}>
                <button style={styles.menuItem} onClick={() => { setMenuOpen(false); paySubscription(); }}>Pagar Semanalidade</button>
                <Link to="/paid-weeks" style={styles.menuItem} onClick={() => setMenuOpen(false)}>Semanas Pagas</Link>
                <Link to="/invoices" style={styles.menuItem} onClick={() => setMenuOpen(false)}>Faturas</Link>
              </div>
            )}
          </div>
          <div>
            <button style={styles.sectionHeader} onClick={() => setStatsOpen(!statsOpen)}>Estatísticas</button>
            {statsOpen && (
              <div style={styles.subMenu}>
                <Link to="/routes" style={styles.menuItem} onClick={() => setMenuOpen(false)}>Trajetos</Link>
                <Link to="/stats" style={styles.menuItem} onClick={() => setMenuOpen(false)}>Distância Percorrida</Link>
              </div>
            )}
          </div>
          <div>
            <button style={styles.sectionHeader} onClick={() => setAccountOpen(!accountOpen)}>Definições de Conta</button>
            {accountOpen && (
              <div style={styles.subMenu}>
                <Link to="/account" style={styles.menuItem} onClick={() => setMenuOpen(false)}>Atualizar Dados Pessoais</Link>
                <Link to="/account" style={styles.menuItem} onClick={() => setMenuOpen(false)}>Apagar Conta</Link>
              </div>
            )}
          </div>
          <div>
            <button style={styles.sectionHeader} onClick={() => setHelpOpen(!helpOpen)}>Sobre e Ajuda</button>
            {helpOpen && (
              <div style={styles.subMenu}>
                <Link to="/terms" style={styles.menuItem} onClick={() => setMenuOpen(false)}>Termos e Condições</Link>
                <button style={styles.menuItem} onClick={() => { setMenuOpen(false); window.location.href = 'mailto:suporte@sunnysales.com'; }}>Contactar Suporte</button>
              </div>
            )}
          </div>
        </div>
      )}

      <h2 style={styles.title}>Painel do Vendedor</h2>
      {vendor && (
        <>
          {vendor.profile_photo && (
            <img
              src={`${BASE_URL.replace(/\/$/, '')}/${vendor.profile_photo}`}
              alt="Foto"
              style={styles.photo}
            />
          )}
          <p><strong>Nome:</strong> {vendor.name}</p>
          <p><strong>Produto:</strong> {vendor.product}</p>
          {vendor.subscription_active && (
            <p style={styles.subActive}>Subscrição ativa</p>
          )}
        </>
      )}

      <button style={styles.logout} onClick={logout}>Sair</button>
    </div>
  );
}

const styles = {
  container: {
    padding: '2rem',
    maxWidth: '600px',
    margin: '0 auto',
    textAlign: 'center',
    position: 'relative',
  },
  title: {
    marginBottom: '1rem',
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: '50%',
    objectFit: 'cover',
    marginBottom: '1rem',
  },
  subActive: {
    color: 'green',
    fontWeight: 'bold',
  },
  logout: {
    width: 250,
    margin: '12px auto',
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '12px',
    backgroundColor: '#19a0a4',
    cursor: 'pointer',
    display: 'block',
  },
  menuButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    fontSize: '2rem',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    zIndex: 20,

  },
  menu: {
    position: 'absolute',
    top: 70,
    left: 16,
    backgroundColor: '#fff',
    border: '1px solid #ccc',
    padding: '1rem',
    borderRadius: '12px',
    zIndex: 10,
  },
  menuItem: {
    display: 'block',
    width: '100%',
    textAlign: 'left',
    padding: '0.5rem 0',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    textDecoration: 'none',
    color: '#0077cc',
  },
  sectionHeader: {
    fontWeight: 'bold',
    marginTop: '0.5rem',
  },
  subMenu: {
    paddingLeft: '1rem',
  },
};
