// Página com atalhos para os Termos e contacto com o suporte
import React from 'react';
import { Link } from 'react-router-dom';

// AboutPage
function AboutPage() {
  return (
    <div style={{ padding: '1rem' }}>
      <h1>Sobre e Ajuda</h1>
      <p>
        Esta área permite consultar os Termos e contactar a equipa de suporte.
      </p>
      <p>
        <Link to="/terms">Termos e Condições</Link>
      </p>
      <p>
        <a href="mailto:suporte@sunnysales.com">Contactar Suporte</a>
      </p>
    </div>
  );
}

export default AboutPage;
