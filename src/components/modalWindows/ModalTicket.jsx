import React from 'react'
import styles from '../../styles/ModalTicket.module.css';
import { IoClose, IoTrash, IoSendOutline } from "react-icons/io5";
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
export default function ModalTicket({ ticket, tickets, setOpenedTicket }) {
    const { orderId, userId, amount, trxid } = ticket;
    const [message, setMessage] = useState([]);
    const user = JSON.parse(localStorage.getItem('user'));
    // const [imageId, setImageId] = useState(null);
    const [pastedImage, setPastedImage] = useState(null);
    const inputRef = useRef(null);
    const getMessages = (ticket_id) => {
        axios.get(`https://7cc58021f96a1497.mokky.dev/messages?_relations=tickets`)
            .then((response) => {
                response.data.map((message) => message.ticket.id === ticket.id && `${message.user_login}: ${message.message}, ${message.time}, ${message.id}, ${message.ticket.id}`).join('\n');
                if (response.data.length === message.length) return;
                else setMessage(response.data.map((message) => message.ticket.id === ticket.id && message));
            })
    }



    const sendMessage = (file) => {
        const message = document.getElementById('sendMessage').value;
        document.getElementById('sendMessage').value = '';

        async function uploadFile() {
            const formData = new FormData();

            formData.append('file', pastedImage);

            const res = await fetch('https://7cc58021f96a1497.mokky.dev/uploads', {
                method: 'POST',
                body: formData
            });
            if (res.ok) {
                setPastedImage(null);
                let imageId = await res.json();
                axios.post('https://7cc58021f96a1497.mokky.dev/messages', {
                    message,
                    ticket_id: ticket.id,
                    user_login: user.login,
                    time: new Date().toLocaleString(),
                    image: imageId.url
                }).then((response) => {
                    getMessages();
                })
                // alert(imageId.id);


                axios.patch(`https://7cc58021f96a1497.mokky.dev/tickets/${ticket.id}`, { images: ticket.images.concat(imageId.id) })
            }


        }

        if (pastedImage != null) {
            uploadFile();
        }
        else {
            axios.post('https://7cc58021f96a1497.mokky.dev/messages', {
                message,
                ticket_id: ticket.id,
                user_login: user.login,
                time: new Date().toLocaleString(),
            }).then((response) => {
                getMessages();
            })
        }
        axios.patch(`https://7cc58021f96a1497.mokky.dev/tickets/${ticket.id}`, { last_update: new Date().toLocaleString() })
    }


    useEffect(() => {
        const intervalId = setInterval(() => {
            getMessages();
        }, 3000);
        return () => {
            clearInterval(intervalId);
        };
    }, [message]);

    useEffect(() => {
        getMessages();

    }, []);

    useEffect(() => {
        const chat = document.getElementById('chat');
        chat.scrollTop = chat.scrollHeight;
    }, [message, setOpenedTicket]);


    useEffect(() => {
        const prewiewImage = document.getElementById('prewiewImage');
        let blob = null
        if (pastedImage != null) {
            blob = URL.createObjectURL(pastedImage);
        }
        prewiewImage.src = blob;
    }, [pastedImage]);


    const uploadFile = (e) => {
        if (!e.clipboardData.files[0]) return;
        const formData = new FormData();
        const inputFile = document.getElementById('sendMessage');

        const file = e.clipboardData.files[0];
        const blob = URL.createObjectURL(file);
        setPastedImage(file);
    }

    const openImage = (url) => {
        window.open(url);
    }

    const deleteMessage = (id) => {
        axios.delete(`https://7cc58021f96a1497.mokky.dev/messages/${id}`).then((response) => {
            getMessages();
        })
    }

    const closeTicket = (id) => {
        axios.patch(`https://7cc58021f96a1497.mokky.dev/tickets/${id}`, { status: 'Resolved' }).then((response) => { })
        setOpenedTicket(null);
    }
    const [ticketImages, setTicketImages] = useState([]);

    const getImages = async (id) => {
        const arr = []

        await axios.get(`https://7cc58021f96a1497.mokky.dev/tickets/${id}`).then((response) => {
            const imgId = response.data.images;
            if (imgId.length === 0) return;
            for (let i = 0; i < imgId.length; i++) {
                axios.get(`https://7cc58021f96a1497.mokky.dev/uploads/${imgId[i]}`).then((response) => {
                    if (response.data.url === undefined) return;
                    if (id !== ticket.id) return;
                    if (ticket.id !== id) return;
                    arr[i] = (response.data.url);
                })
            }
            // alert(imgId);
            setTicketImages(arr);
        })
    }


    useEffect(() => {
        getImages(ticket.id);
    }, []);

    return (
        <div className={styles.wrapper}>
            <div className={styles.ticket}>
                <button className={styles.closeButton} onClick={() => setOpenedTicket(null)}><IoClose style={{ fontSize: '30px' }} /></button>
                <div className={styles.chatWithPS}>
                    <div className={styles.input}>
                        <div style={{ display: pastedImage ? 'block' : 'none' }} className={styles.prewiewImage}><img id='prewiewImage' /><button onClick={() => setPastedImage(null)}><IoClose /> </button></div>
                        <input
                            ref={inputRef}
                            id='sendMessage'
                            type="text"
                            placeholder="Write a message or insert a file..."
                            onPaste={uploadFile}
                            onKeyDown={(e) => {
                                if (e.keyCode === 13) {
                                    sendMessage();
                                }
                            }}
                        />
                        <button onClick={sendMessage}><IoSendOutline /></button>
                    </div>
                    <div className={styles.chat} id='chat'>

                        {message.map((message) => (message.message || message.image) && (
                            <div сlassName={styles.messageBlock} style={message.user_login === user.login ? { alignSelf: 'flex-end' } : { alignSelf: 'flex-start' }}>
                                <block className={styles.headerMessage}>
                                    <span style={message.user_login === user.login ? { color: 'green' } : { color: 'red' }} className={styles.userName}>{message.user_login}</span>
                                    {message.user_login === user.login ? <button onClick={() => deleteMessage(message.id)}><IoTrash /></button> : null}
                                </block>
                                <span className={styles.messageText}>{message.message}</span>
                                {message.image ? <button className={styles.messageImageButton} onClick={() => openImage(message.image)}><img className={styles.messageImage} src={message.image} /></button> : null}
                                <span className={styles.messageTime}>{message.time}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div>
                    <div className={styles.ticketInfoWrapper}>
                        <div className={styles.ticketInfo}>
                            <p>Request ID: <input type="text" value={orderId} /></p>
                            <p>User ID: <input type="text" value={userId} /></p>
                            <p>Amount: <input type="text" value={amount} /></p>
                            <p>TRX ID: <input type="text" value={trxid} /></p>
                            <div className={styles.imagesTicket} id='imagesTicket'>
                                {
                                    ticketImages?.map((image) => (
                                        <button key={image} onClick={() => openImage(image)}>
                                            <img style={{ width: '150px' }} src={image} alt="ticket" />
                                        </button>
                                    ))
                                }
                            </div>
                        </div>
                        <div className={styles.ticketActions}>
                            <button>Edit</button><button onClick={() => closeTicket(ticket.id)}>Close ticket</button>
                        </div>
                    </div>

                </div>
            </div>

        </div>
    )
}
