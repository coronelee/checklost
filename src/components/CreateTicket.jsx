import React from 'react'
import axios from 'axios';
export default function CreateTicket() {

  // для Node.js
  // или import axios from 'axios'; // для ES modules

  async function login() {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        login: "oper",
        password: "pidaras"
      });

      console.log(response.data);
      return response.data;
    } catch (error) {
      console.error('Ошибка при входе:', error.response?.data || error.message);
    }
  }



  // login();
  return (
    <div><button onClick={() => login()}>Create</button>

    </div>
    // <div>CreateTicket</div>
  )
}
