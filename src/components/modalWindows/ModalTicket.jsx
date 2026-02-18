import React from 'react'
import styles from '../../styles/ModalTicket.module.css';
import { IoClose } from "react-icons/io5";
import { IoSendOutline } from "react-icons/io5";
import { useState, useEffect } from 'react';
import axios from 'axios';
export default function ModalTicket({ticket, setOpenedTicket}) {
    const {orderId, userId, amount, trxid} = ticket;
    const [message, setMessage] = useState([]);
    const user = JSON.parse(localStorage.getItem('user'));
   const getMessages = (ticket_id) => {
  axios.get(`https://7cc58021f96a1497.mokky.dev/messages?_relations=tickets`)
    .then((response) => {
      response.data = response.data.filter((message) => message.ticket_id === ticket_id);
      setMessage(response.data);
    })
}
    
    useEffect(() => {
        getMessages(ticket.id);
    }, [ticket.id]);


    const sendMessage = () => {
        const message = document.getElementById('sendMessage').value;
        document.getElementById('sendMessage').value = '';
        axios.post('https://7cc58021f96a1497.mokky.dev/messages', {message, ticket_id: ticket.id, user_login: user.login, time: new Date().toLocaleString()})
        .then((response) => {
            getMessages();
        })

        axios.patch(`https://7cc58021f96a1497.mokky.dev/tickets/${ticket.id}`, {last_update: new Date().toLocaleString()})

        const chat = document.getElementById('chat');
        chat.scrollTop = chat.scrollHeight;
    }

    useEffect(() => {
        const intervalId = setInterval(() => {
        getMessages();
        }, 1000);
        return () => {
        clearInterval(intervalId);
        };
    }, []);

  //

  return (
    <div className={styles.wrapper}>
        
        <div className={styles.ticket}>
            <button className={styles.closeButton} onClick={() => setOpenedTicket(null)}><IoClose /></button>
            <div className={styles.chatWithPS}>
                <div className={styles.input}>
                    <input type="text" id='sendMessage'/>
                    <button onClick={sendMessage}><IoSendOutline /></button>
                </div>
                <div className={styles.chat} id='chat'>
                

                {message.map((message) => (
                    <div сlassName={styles.message} style={message.user_login === user.login ? {alignSelf: 'flex-end'} : {alignSelf: 'flex-start'}}>
                        <span style={message.user_login === user.login ? {color: 'green'} : {color: 'red'}} className={styles.userName}>{message.user_login}</span>
                        <span className={styles.messageText}>{message.message}</span>
                        <span className={styles.messageTime}>{message.time}</span>
                    </div>
                ))} 
                </div>
                 
            </div>
            
            <div>
                <div className={styles.ticketInfo}>
                    <p>Request ID: {orderId}</p>
                    <p>User ID: {userId}</p>
                    <p>Amount: {amount}</p>
                    <p>TRX ID: {trxid}</p>
                </div>
            </div>
        </div>
        
    </div>
  )
}
