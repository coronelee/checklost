import { useState, useEffect } from 'react';
import axios from 'axios';

function LoadApi() {
    const [paymentSystems, setPaymentSystems] = useState([]);
    const [tickets, setTickets] = useState([]);


    const api = axios.create({
        baseURL: 'http://localhost:5000/api',
        headers: {
            'Content-Type': 'application/json',
        }
    });
    api.interceptors.request.use(
        config => {
            const token = localStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
                console.log('✅ Токен добавлен в запрос:', token.substring(0, 20) + '...');
            } else {
                console.log('❌ Токен отсутствует в localStorage');
            }
            return config;
        },
        error => {
            return Promise.reject(error);
        }
    );

    // useEffect(() => {
    //     axios.get('/systems')
    //         .then((response) => {
    //             setPaymentSystems(response.data);
    //         })
    //         .catch((error) => {
    //             console.error(error);
    //         });
    // }, []);


    useEffect(() => {
        api.get('/tickets')
            .then((response) => {
                setTickets(response.data.reverse());
            }).catch((error) => {
                console.error(error);
            });

    }, []);

    // useEffect(() => {
    //     axios.get('https://7cc58021f96a1497.mokky.dev/tickets?_relations=systems')
    //         .then((response) => {
    //             setTickets(response.data);
    //         })
    // }, [])

    const checkAuth = (user) => {
        axios.get('/auth/me')
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


    return { paymentSystems, tickets, checkAuth };
}

export default LoadApi;


// Пользователи
// GET / api / users - Получить всех пользователей

// GET / api / users /: id - Получить пользователя по ID

// POST / api / users - Создать пользователя

// PATCH / api / users /: id - Обновить пользователя

// DELETE / api / users /: id - Удалить пользователя

// Тикеты
// GET / api / tickets - Получить все тикеты

// GET / api / tickets /: id - Получить тикет по ID

// POST / api / tickets - Создать тикет

// PATCH / api / tickets /: id - Обновить тикет

// DELETE / api / tickets /: id - Удалить тикет

// Сообщения
// GET / api / messages / ticket /: ticketId - Получить сообщения тикета

// GET / api / messages /: id - Получить сообщение по ID

// POST / api / messages - Создать сообщение

// PATCH / api / messages /: id - Обновить сообщение

// DELETE / api / messages /: id - Удалить сообщение

// Системы
// GET / api / systems - Получить все системы

// GET / api / systems /: id - Получить систему по ID

// POST / api / systems - Создать систему

// PATCH / api / systems /: id - Обновить систему

// DELETE / api / systems /: id - Удалить систему

// Файлы
// GET / api / files / ticket /: ticketId - Получить файлы тикета

// GET / api / files /: id - Скачать файл

// POST / api / files / upload - Загрузить файл

// PATCH / api / files /: id - Обновить информацию о файле

// DELETE / api / files /: id - Удалить файл