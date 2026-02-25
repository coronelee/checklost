import React from 'react'
import { useState, useEffect } from 'react';
import styles from '../styles/MyTickets.module.css';
import ModalTicket from './modalWindows/ModalTicket';
import ModalCreateTicket from './modalWindows/ModalCreateTicket';

export default function MyTickets({
    paymentSystems,
    tickets: initialTickets,
    isCreateTicketPage,
    setIsCreateTicketPage,
    refreshTickets
}) {
    const [tickets, setTickets] = useState(initialTickets || []);
    const [searchViaReqId, setSearchViaReqId] = useState('');
    const [searchViaUserId, setSearchViaUserId] = useState('');
    const [searchViaAmount, setSearchViaAmount] = useState('');
    const [searchViaTRXID, setSearchViaTRXID] = useState('');
    const [selectedPaymentSystem, setSelectedPaymentSystem] = useState('*');
    const [selectedCountry, setSelectedCountry] = useState('*');
    const [filteredTickets, setFilteredTickets] = useState(tickets);
    const [openedTicket, setOpenedTicket] = useState(null);
    const [createdTicket, setCreatedTicket] = useState(null);
    const [statusFilter, setStatusFilter] = useState('*');

    // Состояния для сортировки
    const [sortConfig, setSortConfig] = useState({
        key: 'id',
        direction: 'desc'
    });

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userType = user?.type;

    useEffect(() => {
        setTickets(initialTickets || []);
    }, [initialTickets]);

    const uniqueCountries = React.useMemo(() => {
        const countries = tickets
            .map(ticket => ticket.country)
            .filter(country => country && country !== 'Не указана');
        return ['*', ...new Set(countries)];
    }, [tickets]);

    // Функция для сортировки
    const sortTickets = (ticketsToSort) => {
        if (!sortConfig.key) return ticketsToSort;

        return [...ticketsToSort].sort((a, b) => {
            let aValue = a[sortConfig.key];
            let bValue = b[sortConfig.key];

            // Обработка числовых значений
            if (sortConfig.key === 'id' || sortConfig.key === 'orderid' || sortConfig.key === 'userid') {
                aValue = Number(aValue) || 0;
                bValue = Number(bValue) || 0;
            }

            // Обработка строк
            if (typeof aValue === 'string') {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            }

            if (aValue < bValue) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    };

    // Обработчик клика по заголовку
    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    // Получение иконки сортировки
    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return '↕';
        return sortConfig.direction === 'asc' ? '↑' : '↓';
    };

    useEffect(() => {
        if (!tickets || tickets.length === 0) {
            setFilteredTickets([]);
            return;
        }

        // Сначала фильтруем
        const filtered = tickets.filter(ticket => {
            const matchesReq = !searchViaReqId ||
                String(ticket.orderid).toLowerCase().includes(searchViaReqId.toLowerCase());

            const matchesUser = !searchViaUserId ||
                String(ticket.userid).toLowerCase().includes(searchViaUserId.toLowerCase());

            const matchesAmount = !searchViaAmount ||
                String(ticket.amount).toLowerCase().includes(searchViaAmount.toLowerCase());

            const matchesTrx = !searchViaTRXID ||
                String(ticket.trxid).toLowerCase().includes(searchViaTRXID.toLowerCase());

            const matchesSystem = userType === 'mb_staff'
                ? (selectedPaymentSystem === "*" || !selectedPaymentSystem || ticket.system_name === selectedPaymentSystem)
                : true;

            const matchesStatus = statusFilter === "*" ||
                (ticket.display_status || ticket.status) === statusFilter;

            const matchesCountry = selectedCountry === "*" ||
                ticket.country === selectedCountry;

            return matchesReq && matchesUser && matchesAmount && matchesTrx &&
                matchesSystem && matchesStatus && matchesCountry;
        });

        // Затем сортируем
        const sorted = sortTickets(filtered);
        setFilteredTickets(sorted);
    }, [
        tickets,
        searchViaReqId,
        searchViaUserId,
        searchViaAmount,
        searchViaTRXID,
        selectedPaymentSystem,
        statusFilter,
        selectedCountry,
        userType,
        sortConfig
    ]);

    const handleFilterChange = (event) => {
        const { name, value } = event.target;
        switch (name) {
            case 'searchViaReqId': setSearchViaReqId(value); break;
            case 'searchViaUserId': setSearchViaUserId(value); break;
            case 'searchViaAmount': setSearchViaAmount(value); break;
            case 'searchViaTRXID': setSearchViaTRXID(value); break;
            case 'selectPS': setSelectedPaymentSystem(value); break;
            case 'statusFilter': setStatusFilter(value); break;
            case 'countryFilter': setSelectedCountry(value); break;
        }
    };

    const handleTicketUpdated = (updatedTicket) => {
        if (!updatedTicket.system_name && paymentSystems) {
            const system = paymentSystems.find(s => s.id === updatedTicket.system_id);
            if (system) {
                updatedTicket.system_name = system.name;
            }
        }

        setTickets(prevTickets =>
            prevTickets.map(t =>
                t.id === updatedTicket.id ? updatedTicket : t
            )
        );

        if (openedTicket && openedTicket.id === updatedTicket.id) {
            setOpenedTicket(updatedTicket);
        }
    };

    const handleTicketCreated = (newTicket) => {
        setTickets(prevTickets => [newTicket, ...prevTickets]);
    };

    return (
        <div className={styles.wrapper}>
            <div className={styles.filter}>
                {userType === 'mb_staff' && (
                    <select name="selectPS" id="selectPS" value={selectedPaymentSystem} onChange={handleFilterChange}>
                        <option value="*">All Systems</option>
                        {paymentSystems.map((paymentSystem) => (
                            <option key={paymentSystem.id} value={paymentSystem.name}>
                                {paymentSystem.name}
                            </option>
                        ))}
                    </select>
                )}

                <select name="countryFilter" value={selectedCountry} onChange={handleFilterChange}>
                    <option value="*">All Countries</option>
                    {uniqueCountries.filter(c => c !== '*').map(country => (
                        <option key={country} value={country}>
                            {country}
                        </option>
                    ))}
                </select>

                <select name="statusFilter" value={statusFilter} onChange={handleFilterChange}>
                    <option value="*">All Status</option>
                    <option value="New">New</option>
                    <option value="Pending">Pending</option>
                    <option value="Resolved">Resolved</option>
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
                        <th onClick={() => handleSort('id')} className={styles.sortable}>
                            ID {getSortIcon('id')}
                        </th>
                        {userType === 'mb_staff' && (
                            <th onClick={() => handleSort('system_name')} className={styles.sortable}>
                                System {getSortIcon('system_name')}
                            </th>
                        )}
                        <th onClick={() => handleSort('country')} className={styles.sortable}>
                            Country {getSortIcon('country')}
                        </th>
                        <th onClick={() => handleSort('orderid')} className={styles.sortable}>
                            Order ID {getSortIcon('orderid')}
                        </th>
                        <th onClick={() => handleSort('userid')} className={styles.sortable}>
                            User ID {getSortIcon('userid')}
                        </th>
                        <th onClick={() => handleSort('amount')} className={styles.sortable}>
                            Amount {getSortIcon('amount')}
                        </th>
                        <th onClick={() => handleSort('trxid')} className={styles.sortable}>
                            Trx ID {getSortIcon('trxid')}
                        </th>
                        <th onClick={() => handleSort('type')} className={styles.sortable}>
                            Type {getSortIcon('type')}
                        </th>
                        <th onClick={() => handleSort('status')} className={styles.sortable}>
                            Status {getSortIcon('status')}
                        </th>
                        <th onClick={() => handleSort('last_update')} className={styles.sortable}>
                            Last Update {getSortIcon('last_update')}
                        </th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredTickets.map((ticket) => (
                        <tr key={ticket.id} className={styles.row}>
                            <td>{ticket.id}</td>
                            {userType === 'mb_staff' && (
                                <td>{ticket.system_name || ticket.system?.name || 'Не указана'}</td>
                            )}
                            <td>{ticket.country || 'Не указана'}</td>
                            <td>{ticket.orderid}</td>
                            <td>{ticket.userid}</td>
                            <td>{ticket.amount}</td>
                            <td>{ticket.trxid}</td>
                            <td>{ticket.type}</td>
                            <td style={{
                                color: ticket.status === 'Resolved' ? 'green' :
                                    ticket.status === 'Pending' ? 'orange' :
                                        'blue'
                            }}>
                                {ticket.display_status || ticket.status}
                            </td>
                            <td>{ticket.last_update}</td>
                            <td>
                                <div className={styles.actions}>
                                    <button onClick={() => setOpenedTicket(ticket)}>Open</button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {openedTicket && (
                <ModalTicket
                    ticket={openedTicket}
                    setOpenedTicket={setOpenedTicket}
                    onTicketUpdated={handleTicketUpdated}
                    paymentSystems={paymentSystems}
                />
            )}

            {isCreateTicketPage && userType === 'mb_staff' && (
                <ModalCreateTicket
                    setIsCreateTicketPage={setIsCreateTicketPage}
                    paymentSystems={paymentSystems}
                    onTicketCreated={handleTicketCreated}
                />
            )}
        </div>
    );
}