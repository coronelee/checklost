import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

function LoadApi() {
    const [paymentSystems, setPaymentSystems] = useState([]);
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);

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
            }
            return config;
        },
        error => Promise.reject(error)
    );

    const fetchData = useCallback(async () => {
        const token = localStorage.getItem('token');

        if (!token) {
            setLoading(false);
            return;
        }

        setLoading(true);

        try {
            const [systemsRes, ticketsRes] = await Promise.all([
                api.get('/systems'),
                api.get('/tickets')
            ]);

            setPaymentSystems(systemsRes.data);
            setTickets(ticketsRes.data.reverse());
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return {
        paymentSystems,
        tickets,
        loading,
        refreshData: fetchData
    };
}

export default LoadApi;