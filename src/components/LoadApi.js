import React, { useState, useEffect } from 'react';
import axios from 'axios';

function LoadApi() {
    const [paymentSystems, setPaymentSystems] = useState([]);
    const [tickets, setTickets] = useState([]);
    const [messages, setMessages] = useState([]);


    useEffect(() => {
        axios.get('https://7cc58021f96a1497.mokky.dev/systems')
        .then((response) => {
            setPaymentSystems(response.data);
        })
        .catch((error) => {
            console.error(error);
        });
    }, []);

    useEffect(() => {
        const intervalId = setInterval(() => {
            axios.get('https://7cc58021f96a1497.mokky.dev/tickets?_relations=systems')
            .then((response) => {
                setTickets(response.data);
            })  
        }, 1000);
        return () => {
            clearInterval(intervalId);
        };
    }, []);

    useEffect(() => {
        axios.get('https://7cc58021f96a1497.mokky.dev/tickets?_relations=systems')
            .then((response) => {
                setTickets(response.data);
            })  
    }, [])

    const checkAuth = (user) => {
        axios.get('https://7cc58021f96a1497.mokky.dev/users')
        .then((response) => { 
            for (let i = 0; i < response.data.length; i++) {
                if (response.data[i].login === user.login && response.data[i].password === user.password) {
                    return true;
                }
            }
            return false;
        })
        return false;
    }

    const getMessages = () => {
        axios.get('https://7cc58021f96a1497.mokky.dev/messages')
        .then((response) => {
            setMessages(response.data);
        })
    }


    return {paymentSystems, tickets, checkAuth, getMessages};
}

export default LoadApi;