import React from 'react'
import headerStyles from '../styles/Header.module.css'
import { IoLogOutOutline } from "react-icons/io5";
export default function Header({ setIsSelectedPage, isLoggedIn }) {
  // const [isSelectedPage, setIsSelectedPage] = React.useState("asd");
  return (

    <div className={headerStyles.header} >
      <div>
        <button onClick={() => setIsSelectedPage("myTickets")}>My Tickets</button>
        <button onClick={() => setIsSelectedPage("createTicket")}>Create ticket</button>
        <button onClick={() => setIsSelectedPage("checkWallet")}>Check wallet</button>
      </div>
      <div>
        <button onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); window.location.reload(); }}>{JSON.parse(localStorage.getItem('user')).login}<IoLogOutOutline /></button>
      </div>
    </div>

  )
}
