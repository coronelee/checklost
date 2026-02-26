import React from 'react'
import headerStyles from '../styles/Header.module.css'
import { IoLogOutOutline } from "react-icons/io5";

export default function Header({ setIsSelectedPage, setIsCreateTicketPage }) {
  // Получаем данные пользователя из localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userType = user?.type;


  return (
    <div className={headerStyles.header}>
      <div>
        <button onClick={() => setIsSelectedPage("myTickets")}>
          My Tickets
        </button>

        {/* 👇 Кнопка Create ticket только для mb_staff */}
        {userType === 'mb_staff' && (
          <button onClick={() => setIsCreateTicketPage(true)}>
            Create ticket
          </button>
        )}

        {/* <button onClick={() => setIsSelectedPage("checkWallet")}>
          Check wallet
        </button> */}
      </div>
      <div>
        <button onClick={() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.reload();
        }}>
          {user?.login || 'User'}<IoLogOutOutline />
        </button>
      </div>
    </div>
  )
}