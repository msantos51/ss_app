// Página com ações para alteração e remoção de conta
function ManageAccountPage() {
  // changePassword
  const changePassword = () => {
    alert('Funcionalidade indisponível');
  };

  // deleteAccount
  const deleteAccount = () => {
    alert('Funcionalidade indisponível');
  };

  return (
    <main style={{ maxWidth: '400px', margin: '2rem auto' }}>
      <h1>Definições de Conta</h1>
      <button onClick={changePassword}>Alterar Palavra-passe</button>
      <button onClick={deleteAccount}>Apagar Conta</button>
    </main>
  );
}

export default ManageAccountPage;
