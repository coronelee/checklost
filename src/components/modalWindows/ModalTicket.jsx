import React from 'react'
import styles from '../../styles/ModalTicket.module.css';
import { IoClose, IoTrash, IoSendOutline, IoImage, IoDocument, IoMusicalNote, IoVideocam } from "react-icons/io5";
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

export default function ModalTicket({ ticket, setOpenedTicket }) {
    const { orderid, userid, amount, trxid } = ticket;
    const [message, setMessage] = useState([]);
    const user = JSON.parse(localStorage.getItem('user'));
    const [attachedFiles, setAttachedFiles] = useState([]); // Массив прикрепленных файлов
    const inputRef = useRef(null);
    const fileInputRef = useRef(null); // Реф для скрытого file input

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
            }
            return config;
        },
        error => {
            return Promise.reject(error);
        }
    );

    const getMessages = () => {
        api.get(`/messages/ticket/${ticket.id}`)
            .then((response) => {
                if (response.data.length === 0 || response.data === null || response.data === undefined) {
                    return;
                }
                if (response.data.length === message.length) {
                    return;
                }
                const messagesArray = response.data.map(
                    (message) => ({
                        id: message.id,
                        message: message.message,
                        time: message.time,
                        user: message.user_login,
                        files: message.files || [] // Предполагаем, что сервер возвращает файлы
                    })
                );
                setMessage(messagesArray);
            })
    }

    useEffect(() => {
        // console.log('Сообщения обновлены:', message);
    }, [message]);

    // Функция для загрузки файлов на сервер
    const uploadFiles = async (files) => {
        const formData = new FormData();
        files.forEach(file => {
            formData.append('files', file);
        });

        try {
            const response = await api.post('/uploads', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data; // Ожидаем массив с информацией о загруженных файлах
        } catch (error) {
            console.error('Ошибка загрузки файлов:', error);
            return [];
        }
    };

    const sendMessage = async () => {
        const messageText = document.getElementById('sendMessage').value;
        document.getElementById('sendMessage').value = '';

        try {
            // 1. Сначала отправляем текстовое сообщение
            const messageResponse = await api.post('/messages', {
                message: messageText,
                ticket_id: ticket.id,
                user_login: user.login,
                time: new Date().toLocaleString()
            });

            // 2. Если есть файлы, отправляем их по одному
            if (attachedFiles.length > 0) {
                for (const fileObj of attachedFiles) {
                    const fileFormData = new FormData();
                    fileFormData.append('file', fileObj.file);
                    fileFormData.append('ticket_id', ticket.id);
                    fileFormData.append('message_id', message.id);

                    try {
                        // Используем существующий endpoint для загрузки файлов
                        await api.post('/files/upload', fileFormData, {
                            headers: {
                                'Content-Type': 'multipart/form-data'
                            }
                        });
                    } catch (fileError) {
                        console.error('Ошибка загрузки файла:', fileObj.name, fileError);
                    }
                }
            }

            // Обновляем сообщения
            getMessages();

            // Очищаем файлы
            attachedFiles.forEach(file => {
                if (file.preview) {
                    URL.revokeObjectURL(file.preview);
                }
            });
            setAttachedFiles([]);

        } catch (error) {
            console.error('Ошибка отправки сообщения:', error);
            alert('Ошибка при отправке сообщения');
        }

        // Обновляем время последнего обновления тикета
        try {
            await api.patch(`/tickets/${ticket.id}`, {
                last_update: new Date().toLocaleString()
            });
        } catch (error) {
            console.error('Ошибка обновления времени тикета:', error);
        }
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
        if (chat) {
            chat.scrollTop = chat.scrollHeight;
        }
    }, [message, attachedFiles]);

    // Обновленная функция для вставки файлов
    const handlePaste = (e) => {
        if (!e.clipboardData.files || e.clipboardData.files.length === 0) return;

        const files = Array.from(e.clipboardData.files);
        const validFiles = files.filter(file => {
            const allowedTypes = [
                'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
                'application/pdf',
                'audio/mpeg', 'audio/mp3', 'audio/wav',
                'video/mp4', 'video/quicktime'
            ];
            const fileExtension = file.name.split('.').pop().toLowerCase();
            const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'mp3', 'wav', 'mp4', 'mov'];

            return allowedTypes.includes(file.type) || allowedExtensions.includes(fileExtension);
        });

        if (validFiles.length === 0) {
            alert('Поддерживаются только файлы: изображения, PDF, MP3, MP4');
            return;
        }

        // Добавляем файлы с превью
        const newFiles = validFiles.map(file => ({
            file: file,
            preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
            name: file.name,
            type: file.type,
            size: file.size,
            id: Date.now() + Math.random() // Уникальный ID для React key
        }));

        setAttachedFiles(prev => [...prev, ...newFiles]);
    }

    // Функция для выбора файлов через диалог
    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        const newFiles = files.map(file => ({
            file: file,
            preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
            name: file.name,
            type: file.type,
            size: file.size,
            id: Date.now() + Math.random()
        }));

        setAttachedFiles(prev => [...prev, ...newFiles]);
        // Очищаем input, чтобы можно было выбрать те же файлы снова
        e.target.value = '';
    }

    // Удаление файла из списка
    const removeFile = (fileId) => {
        setAttachedFiles(prev => {
            const fileToRemove = prev.find(f => f.id === fileId);
            if (fileToRemove?.preview) {
                URL.revokeObjectURL(fileToRemove.preview); // Очищаем память
            }
            return prev.filter(f => f.id !== fileId);
        });
    }

    // Функция для получения иконки файла
    const getFileIcon = (file) => {
        if (file.type.startsWith('image/')) {
            return <img src={file.preview} alt={file.name} className={styles.filePreviewImage} />;
        } else if (file.type.includes('pdf')) {
            return <IoDocument className={styles.fileIcon} />;
        } else if (file.type.includes('audio')) {
            return <IoMusicalNote className={styles.fileIcon} />;
        } else if (file.type.includes('video')) {
            return <IoVideocam className={styles.fileIcon} />;
        }
        return <IoDocument className={styles.fileIcon} />;
    }

    // Форматирование размера файла
    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    const openImage = (url) => {
        window.open(url);
    }

    const deleteMessage = (id) => {
        api.delete(`/messages/${id}`).then((response) => {
            getMessages();
        })
    }

    const closeTicket = (id) => {
        api.patch(`/tickets/${id}`, { status: 'Resolved' }).then((response) => { })
        setOpenedTicket(null);
    }

    // Очистка URL объектов при размонтировании
    useEffect(() => {
        return () => {
            attachedFiles.forEach(file => {
                if (file.preview) {
                    URL.revokeObjectURL(file.preview);
                }
            });
        };
    }, []);

    return (
        <div className={styles.wrapper}>
            <div className={styles.ticket}>
                <button className={styles.closeButton} onClick={() => setOpenedTicket(null)}>
                    <IoClose style={{ fontSize: '30px' }} />
                </button>
                <div className={styles.chatWithPS}>
                    <div className={styles.input}>
                        {/* Блок превью для множественных файлов */}
                        {attachedFiles.length > 0 && (
                            <div className={styles.filesPreview}>
                                {attachedFiles.map((file) => (
                                    <div key={file.id} className={styles.filePreviewItem}>
                                        {getFileIcon(file)}
                                        <div className={styles.fileInfo}>
                                            <span className={styles.fileName}>{file.name}</span>
                                            <span className={styles.fileSize}>{formatFileSize(file.size)}</span>
                                        </div>
                                        <button
                                            className={styles.removeFileBtn}
                                            onClick={() => removeFile(file.id)}
                                        >
                                            <IoClose />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className={styles.inputContainer}>
                            {/* Кнопка для выбора файлов */}
                            <button
                                className={styles.attachButton}
                                onClick={() => fileInputRef.current.click()}
                                type="button"
                            >
                                📎
                            </button>

                            <input
                                ref={inputRef}
                                id='sendMessage'
                                type="text"
                                placeholder="Write a message or insert files..."
                                onPaste={handlePaste}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        sendMessage();
                                    }
                                }}
                            />

                            <button onClick={sendMessage} className={styles.sendButton}>
                                <IoSendOutline />
                            </button>
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="image/*,.pdf,audio/*,video/*"
                            onChange={handleFileSelect}
                            style={{ display: 'none' }}
                        />
                    </div>

                    <div className={styles.chat} id='chat'>
                        {message.map((msg, index) => (
                            <div
                                key={msg.id || index}
                                className={styles.messageBlock}
                                style={msg.user === user.login ?
                                    { alignSelf: 'flex-end' } :
                                    { alignSelf: 'flex-start' }
                                }
                            >
                                <block className={styles.headerMsg}>
                                    <span
                                        style={msg.user === user.login ?
                                            { color: 'green' } :
                                            { color: 'red' }
                                        }
                                        className={styles.userName}
                                    >
                                        {msg.user}
                                    </span>
                                    {msg.user === user.login && (
                                        <button onClick={() => deleteMessage(msg.id)}>
                                            <IoTrash />
                                        </button>
                                    )}
                                </block>

                                {msg.message && (
                                    <span className={styles.messageText}>{msg.message}</span>
                                )}

                                {msg.files && msg.files.length > 0 && (
                                    <div className={styles.messageFiles}>
                                        {msg.files.map((file, fileIndex) => (
                                            <button
                                                key={fileIndex}
                                                className={styles.messageFileButton}
                                                onClick={() => openImage(file.url)}
                                            >
                                                {file.type?.startsWith('image/') ? (
                                                    <img
                                                        className={styles.messageFile}
                                                        src={file.url}
                                                        alt="file"
                                                    />
                                                ) : (
                                                    <div className={styles.fileAttachment}>
                                                        <IoDocument />
                                                        <span>{file.name}</span>
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                <span className={styles.messageTime}>{msg.time}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <div className={styles.ticketInfoWrapper}>
                        <div className={styles.ticketInfo}>
                            <p>Request ID: <input type="text" value={orderid} readOnly /></p>
                            <p>User ID: <input type="text" value={userid} readOnly /></p>
                            <p>Amount: <input type="text" value={amount} readOnly /></p>
                            <p>TRX ID: <input type="text" value={trxid} readOnly /></p>
                        </div>
                        <div className={styles.ticketActions}>
                            <button>Edit</button>
                            <button onClick={() => closeTicket(ticket.id)}>Close ticket</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}