// Página com ações para alteração e remoção de conta
function ManageAccountPage() {
  const changePassword = () => {
    alert('Funcionalidade indisponível');
  };

  const deleteAccount = () => {
    alert('Funcionalidade indisponível');
  };

  return (
    <div style={{ maxWidth: '400px', margin: '2rem auto' }}>
      <h1>Definições de Conta</h1>
      <button onClick={changePassword}>Alterar Palavra-passe</button>
      <button onClick={deleteAccount}>Apagar Conta</button>
    </div>
  );
}

export default ManageAccountPage;
