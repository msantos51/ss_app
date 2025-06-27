import { Link } from 'react-router-dom';
import styles from './NavBar.module.css';

function NavBar() {
  return (
    <nav className={styles.navbar}>
      <h1 className={styles.title}>Sunny Sales</h1>
      <ul className={styles.links}>
        <li>
          <Link to="/">Mapa</Link>
        </li>
        <li>
          <Link to="/login">Entrar</Link>
        </li>
        <li>
          <Link to="/register">Registar</Link>
        </li>
        <li>
          <Link to="/about">Sobre</Link>
        </li>
      </ul>
    </nav>
  );
}

export default NavBar;
