import Header from './components/Header';
import CreateTicket from './components/CreateTicket';
import CheckWallet from './components/CheckWallet';
import Login from './components/Login';
import React from 'react';
import './App.css';
import MyTickets from './components/MyTickets';
import LoadApi from './components/LoadApi.js';
function App() {
  const paymentSystems = LoadApi().paymentSystems;
  const tickets = LoadApi().tickets; 
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [isSelectedPage, setIsSelectedPage] = React.useState("myTickets");
  return (
    <div className="App">
      {isLoggedIn && (
          <Header setIsSelectedPage={setIsSelectedPage} isSelectedPage={isSelectedPage}/>
      )}
        <div className='wrapper'>
          {isSelectedPage === 'myTickets' && isLoggedIn  && <MyTickets paymentSystems={paymentSystems} tickets={tickets} />} 
          {isSelectedPage === 'createTicket' && <CreateTicket paymentSystems={paymentSystems} tickets={tickets} />}
          {isSelectedPage === 'checkWallet' && <CheckWallet paymentSystems={paymentSystems}  tickets={tickets} />}
          {!isLoggedIn && <Login setIsLoggedIn={setIsLoggedIn} />}
        </div>
        {/* {tickets.map((ticket) => (
          <li key={ticket.id}>{ticket.system.name}</li>
        ))} */}
       {/* {paymentSystems.map((paymentSystem) => (<p>{paymentSystem.name}</p>))} */}
    </div>
    
  );
}

export default App;
