import Header from './components/Header';
import CreateTicket from './components/CreateTicket';
import CheckWallet from './components/CheckWallet';
import Login from './components/Login';
import React from 'react';
import './App.css';
import MyTickets from './components/MyTickets';
import LoadApi from './components/LoadApi.js';

function App() {
  const { paymentSystems, tickets, loading, refreshData } = LoadApi(); // 👈 Получаем refreshData
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [isSelectedPage, setIsSelectedPage] = React.useState("myTickets");
  const [isCreateTicketPage, setIsCreateTicketPage] = React.useState(false);

  // Проверяем токен при загрузке
  React.useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  // Если данные загружаются и пользователь авторизован, показываем загрузку
  if (loading && isLoggedIn) {
    return <div>Загрузка данных...</div>;
  }

  return (
    <div className="App">
      {isLoggedIn && (
        <Header
          setIsSelectedPage={setIsSelectedPage}
          setIsCreateTicketPage={setIsCreateTicketPage}
          isSelectedPage={isSelectedPage}
        />
      )}
      <div className='wrapper'>
        {isSelectedPage === 'myTickets' && isLoggedIn && (
          <MyTickets
            setIsCreateTicketPage={setIsCreateTicketPage}
            isCreateTicketPage={isCreateTicketPage}
            paymentSystems={paymentSystems}
            tickets={tickets}
            refreshTickets={refreshData} // 👈 Передаем функцию обновления
          />
        )}
        {isSelectedPage === 'checkWallet' && (
          <CheckWallet
            paymentSystems={paymentSystems}
            tickets={tickets}
          />
        )}
        {!isLoggedIn && <Login setIsLoggedIn={setIsLoggedIn} />}
      </div>
    </div>
  );
}

export default App;