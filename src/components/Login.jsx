import React, { useEffect } from 'react';
import styles from '../styles/Login.module.css';
import axios from 'axios';

export default function Login({ setIsLoggedIn }) {
  useEffect(() => {
    if (localStorage.getItem('token')) {
      setIsLoggedIn(true);
    }
  }, [setIsLoggedIn]);

  async function login() {
    const user = {
      login: document.getElementById('login').value,
      password: document.getElementById('password').value
    };

    try {
      const response = await axios.post('http://38.101.3.71:5000/api/auth/login', {
        login: user.login,
        password: user.password
      });

      if (response.data.token) {
        // Сохраняем токен И данные пользователя
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        console.log('✅ Вход выполнен:', response.data.user);
        setIsLoggedIn(true);

        // Перезагружаем страницу чтобы LoadApi загрузил данные с токеном
        window.location.reload();
      }
    } catch (error) {
      console.error('❌ Ошибка при входе:', error.response?.data || error.message);
      alert('Ошибка входа: ' + (error.response?.data?.error || error.message));
    }
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.login}>
        <h1>Authorization</h1>
        <input type="text" id='login' placeholder='Login' className={styles.loginInput} />
        <input type="password" id='password' placeholder='Password' className={styles.loginInput} />
        <button onClick={login}>Log in</button>
      </div>
      <div className={styles.circle}></div>
      <div className={styles.circle2}></div>
    </div>
  );
}