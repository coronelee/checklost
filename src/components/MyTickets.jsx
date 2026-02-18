import React from 'react'
import { useState, useEffect } from 'react';
import styles from '../styles/MyTickets.module.css';
import ModalTicket from './modalWindows/ModalTicket';
export default function MyTickets({paymentSystems, tickets}) {
    const [searchViaReqId, setSearchViaReqId] = useState('');
    const [searchViaUserId, setSearchViaUserId] = useState('');
    const [searchViaAmount, setSearchViaAmount] = useState('');
    const [searchViaTRXID, setSearchViaTRXID] = useState('');
    const [selectedPaymentSystem, setSelectedPaymentSystem] = useState('*');
    const [filteredTickets, setFilteredTickets] = useState(tickets);
    const [openedTicket, setOpenedTicket] = useState(null);

    const handleFilterChange = (event) => {
        const { name, value } = event.target;
        
        switch(name) {
            case 'searchViaReqId': setSearchViaReqId(value); break;
            case 'searchViaUserId': setSearchViaUserId(value); break;
            case 'searchViaAmount': setSearchViaAmount(value); break;
            case 'searchViaTRXID': setSearchViaTRXID(value); break;
            case 'selectPS': setSelectedPaymentSystem(value); break;
        }
    };

    

    useEffect(() => {
        const filtered = tickets.filter(ticket => {
            const matchesReq = !searchViaReqId || 
                String(ticket.orderId).toLowerCase().includes(searchViaReqId.toLowerCase());
            
            const matchesUser = !searchViaUserId || 
                String(ticket.userId).toLowerCase().includes(searchViaUserId.toLowerCase());
            
            const matchesAmount = !searchViaAmount || 
                String(ticket.amount).toLowerCase().includes(searchViaAmount.toLowerCase());
            
            const matchesTrx = !searchViaTRXID || 
                String(ticket.trxid).toLowerCase().includes(searchViaTRXID.toLowerCase());
            
            const matchesSystem = selectedPaymentSystem === "*" || !selectedPaymentSystem ||
                ticket.system?.name === selectedPaymentSystem;

            return matchesReq && matchesUser && matchesAmount && matchesTrx && matchesSystem;
        });
        
        setFilteredTickets(filtered);
    }, [tickets, searchViaReqId, searchViaUserId, searchViaAmount, searchViaTRXID, selectedPaymentSystem]); 

    return (
        <div className={styles.wrapper}>
            <div className={styles.filter}>
                <select name="selectPS" id="selectPS" value={selectedPaymentSystem} onChange={handleFilterChange}>
                    <option value="*">All</option>
                    {paymentSystems.map((paymentSystem) => (
                        <option key={paymentSystem.id} value={paymentSystem.name}>
                            {paymentSystem.name}
                        </option>
                    ))}
                </select>
                <input 
                    type="text" 
                    name="searchViaReqId" 
                    placeholder="Order ID" 
                    value={searchViaReqId}
                    onChange={handleFilterChange}
                />
                <input 
                    type="text" 
                    name="searchViaUserId" 
                    placeholder="User ID" 
                    value={searchViaUserId}
                    onChange={handleFilterChange}
                />
                <input 
                    type="text" 
                    name="searchViaAmount" 
                    placeholder="Amount" 
                    value={searchViaAmount}
                    onChange={handleFilterChange}
                />
                <input 
                    type="text" 
                    name="searchViaTRXID" 
                    placeholder="TRX ID" 
                    value={searchViaTRXID}
                    onChange={handleFilterChange}
                />
            </div>
            
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>System</th>
                        <th>Order ID</th>
                        <th>User ID</th>
                        <th>Amount</th>
                        <th>Trx ID</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Last Update</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredTickets.map((ticket) => (
                        <tr key={ticket.id} className={styles.row}>
                            <td>{ticket.id}</td>
                            <td>{ticket.system.name}</td>
                            <td>{ticket.orderId}</td>
                            <td>{ticket.userId}</td>
                            <td>{ticket.amount}</td>
                            <td>{ticket.trxid}</td>
                            <td>{ticket.type}</td>
                            <td styles={{color: ticket.status == 'Resolved' ? 'green' : 'red'}}>{ticket.status}</td>
                            <td>{ticket.last_update}</td>
                            <div className={styles.actions}>
                              {/* <button >Edit</button> */}
                              <button onClick={() => setOpenedTicket(ticket)}>Open</button>
                            </div>
                        </tr>
                    ))}
                </tbody>
            </table>

            {openedTicket && <ModalTicket ticket={openedTicket} setOpenedTicket={setOpenedTicket} />}
        </div>
    );
}