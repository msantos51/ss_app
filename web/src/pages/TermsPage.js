// Página web que mostra os Termos e Condições completos
import React from 'react';

// TermsPage
function TermsPage() {
  return (
    <div style={{ padding: '1rem' }}>
      <h1>Termos e Condições</h1>
      <h2>1. Aceitação dos Termos</h2>
      <p>
        Ao criar uma conta e utilizar a aplicação Sunny Sales, o utilizador
        (vendedor) concorda com estes Termos e Condições. Caso não concorde, não
        deve utilizar a aplicação.
      </p>
      <h2>2. Registo e Conta</h2>
      <p>
        O vendedor é responsável por fornecer informações verdadeiras e
        atualizadas no momento do registo. A falsificação de dados poderá
        resultar no cancelamento da conta.
      </p>
      <h2>3. Privacidade e Partilha de Localização</h2>
      <p>
        A aplicação recolhe e partilha a localização do vendedor apenas durante o
        período em que este estiver ativo. Esta localização é visível
        publicamente aos clientes para fins de identificação de vendedores
        disponíveis.
      </p>
      <h2>4. Pagamentos e Subscrição</h2>
      <p>
        O pagamento da subscrição semanal é obrigatório para manter a conta
        ativa e visível no mapa. O não pagamento pode suspender temporariamente
        ou cancelar a conta até que a situação seja regularizada.
      </p>
      <h2>5. Obrigações do Vendedor</h2>
      <p>
        O vendedor compromete-se a cumprir a legislação aplicável, garantir a
        qualidade dos produtos e não utilizar a aplicação para fins ilegais.
      </p>
      <h2>6. Suspensão e Cancelamento</h2>
      <p>
        A administração da Sunny Sales pode suspender ou cancelar contas que
        violem estes termos ou utilizem a aplicação de forma abusiva.
      </p>
      <h2>7. Limitação de Responsabilidade</h2>
      <p>
        A Sunny Sales não se responsabiliza por perdas ou danos resultantes de
        transações comerciais entre vendedores e clientes. O uso da aplicação é
        da responsabilidade do utilizador.
      </p>
      <h2>8. Alterações aos Termos</h2>
      <p>
        Estes termos podem ser atualizados periodicamente. Notificaremos os
        utilizadores em caso de alterações significativas.
      </p>
      <h2>9. Contacto</h2>
      <p>
        Para dúvidas contacte a equipa de suporte através do email:
        suporte@sunnysales.com
      </p>
    </div>
  );
}

export default TermsPage;
