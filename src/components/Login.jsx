import React, { useEffect } from 'react'
import styles from '../styles/Login.module.css';
import axios from 'axios';
export default function Login({ setIsLoggedIn }) {




  //  const login  = ()  =>  {
  //       const user = {
  //           login: document.getElementById('login').value,
  //           password: document.getElementById('password').value
  //         };
  //          fetch("https://7cc58021f96a1497.mokky.dev/auth", {
  //         method: "POST",
  //         headers: {
  //           Accept: "application/json",
  //           "Content-Type": "application/json"
  //         },
  //         body: JSON.stringify({
  //           login: user.login,
  //           password: user.password
  //         })
  //       })
  //       .then(response => response.json())
  //       .then(response => {
  //         if (response.token){
  //             localStorage.setItem('token', response.token);
  //             localStorage.setItem('user', JSON.stringify(user));
  //             setIsLoggedIn(true); 

  //             return true;
  //         }
  //         alert('Wrong login or password');
  //         return false;
  //       });

  //   }


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
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        login: user.login,
        password: user.password
      });
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(user));
        setIsLoggedIn(true);

        return true;
      }
      console.log(response.data.token);
      return response.data;
    } catch (error) {
      console.error('Ошибка при входе:', error.response?.data || error.message);
    }
  }
  return (
    <div className={styles.wrapper}>
      <div className={styles.login}>
        <h1>Authorization</h1>
        <input type="text" id='login' placeholder='Login' className={styles.loginInput} name='login' />
        <input type="password" id='password' placeholder='Password' className={styles.loginInput} name='password' />
        <button onClick={() => login()}>Log in</button>
      </div>
      <div className={styles.circle}></div>
      <div className={styles.circle2}></div>
    </div>

  )
}
