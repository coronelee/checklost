import React from 'react'
import styles from '../../styles/ModalTicket.module.css';
import { IoClose, IoTrash, IoSendOutline, IoDocument, IoMusicalNote, IoVideocam, IoImage, IoArrowBack, IoArrowForward } from "react-icons/io5";
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

export default function ModalTicket({ ticket, setOpenedTicket, onTicketUpdated, paymentSystems }) {
    const { orderid, userid, amount, trxid, system_id, id } = ticket;
    const [messages, setMessages] = useState([]);
    const [ticketFiles, setTicketFiles] = useState([]);
    const user = JSON.parse(localStorage.getItem('user'));
    const [attachedFiles, setAttachedFiles] = useState([]);
    const inputRef = useRef(null);
    const fileInputRef = useRef(null);
    const chatRef = useRef(null);
    const [prevMessagesLength, setPrevMessagesLength] = useState(0);

    const [fileViewerOpen, setFileViewerOpen] = useState(false);
    const [currentFile, setCurrentFile] = useState(null);
    const [currentFileIndex, setCurrentFileIndex] = useState(0);
    const [allViewerFiles, setAllViewerFiles] = useState([]);

    const [isEditing, setIsEditing] = useState(false);
    const [editFormData, setEditFormData] = useState({
        orderid: ticket.orderid || '',
        userid: ticket.userid || '',
        amount: ticket.amount || '',
        trxid: ticket.trxid || '',
        system_id: ticket.system_id || '',
        status: ticket.status || 'New'
    });

    const api = axios.create({
        baseURL: 'http://38.101.3.71:5000/api',
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
                const messagesArray = response.data.map(
                    (msg) => ({
                        id: msg.id,
                        message: msg.message,
                        time: msg.time,
                        user: msg.user_login,
                        files: msg.files || [] // ВАЖНО: сохраняем файлы из ответа
                    })
                );
                setMessages(messagesArray);
                console.log('Сообщения с файлами:', messagesArray); // для отладки
            })
            .catch((error) => {
                console.error(error);
            });
    };

    const getTicketFiles = () => {
        api.get(`/files/ticket/${ticket.id}`)
            .then((response) => {
                setTicketFiles(response.data);
            })
            .catch((error) => {
                console.error(error);
            });
    };

    useEffect(() => {
        getMessages();
        getTicketFiles();

        const intervalId = setInterval(() => {
            getMessages();
            getTicketFiles();
        }, 3000);

        return () => clearInterval(intervalId);
    }, [ticket.id]);

    useEffect(() => {
        if (chatRef.current && messages.length > prevMessagesLength) {
            chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }
        setPrevMessagesLength(messages.length);
    }, [messages]);

    useEffect(() => {
        setEditFormData({
            orderid: ticket.orderid || '',
            userid: ticket.userid || '',
            amount: ticket.amount || '',
            trxid: ticket.trxid || '',
            system_id: ticket.system_id || '',
            status: ticket.status || 'New'
        });
    }, [ticket]);

    useEffect(() => {
        return () => {
            if (attachedFiles && attachedFiles.length > 0) {
                attachedFiles.forEach(file => {
                    if (file?.preview) {
                        URL.revokeObjectURL(file.preview);
                    }
                });
            }
        };
    }, []);

    const getFileUrl = (file) => {
        if (!file) return '';

        if (file.file_path?.startsWith('http')) {
            return file.file_path;
        }
        else if (file.file_path?.startsWith('/uploads')) {
            return `http://38.101.3.71:5000${file.file_path}`;
        }
        else if (file.file_path) {
            const normalizedPath = file.file_path.replace(/\\/g, '/');
            const uploadsIndex = normalizedPath.indexOf('uploads/');
            if (uploadsIndex !== -1) {
                const relativePath = normalizedPath.substring(uploadsIndex);
                return `http://38.101.3.71:5000/${relativePath}`;
            } else {
                return `http://38.101.3.71:5000/uploads/${file.filename || file.original_name}`;
            }
        }
        else if (file.filename) {
            return `http://38.101.3.71:5000/uploads/${file.filename}`;
        }
        else if (file.original_name) {
            return `http://38.101.3.71:5000/uploads/${file.original_name}`;
        }

        return '';
    };

    const openFileInViewer = (file, allFiles = ticketFiles) => {
        if (!file) return;

        const files = allFiles.length > 0 ? allFiles : [file];
        setAllViewerFiles(files);

        const index = files.findIndex(f => f.id === file.id);
        setCurrentFileIndex(index >= 0 ? index : 0);
        setCurrentFile(file);
        setFileViewerOpen(true);
    };

    const nextFile = () => {
        if (allViewerFiles.length === 0) return;
        const nextIndex = (currentFileIndex + 1) % allViewerFiles.length;
        setCurrentFileIndex(nextIndex);
        setCurrentFile(allViewerFiles[nextIndex]);
    };

    const prevFile = () => {
        if (allViewerFiles.length === 0) return;
        const prevIndex = (currentFileIndex - 1 + allViewerFiles.length) % allViewerFiles.length;
        setCurrentFileIndex(prevIndex);
        setCurrentFile(allViewerFiles[prevIndex]);
    };

    const sendMessage = async () => {
        const messageText = document.getElementById('sendMessage')?.value || '';
        if (!messageText.trim() && attachedFiles.length === 0) return;

        if (document.getElementById('sendMessage')) {
            document.getElementById('sendMessage').value = '';
        }

        try {
            const messageResponse = await api.post('/messages', {
                message: messageText,
                ticket_id: ticket.id,
                user_login: user.login,
                time: new Date().toLocaleString()
            });

            const newMessage = messageResponse.data;

            if (attachedFiles.length > 0) {
                for (const fileObj of attachedFiles) {
                    const fileFormData = new FormData();
                    fileFormData.append('file', fileObj.file);
                    fileFormData.append('ticket_id', ticket.id);
                    fileFormData.append('message_id', String(newMessage.id));

                    try {
                        await api.post('/files/upload', fileFormData, {
                            headers: { 'Content-Type': 'multipart/form-data' }
                        });
                    } catch (fileError) {
                        console.error(fileError);
                    }
                }
            }

            await getMessages();
            await getTicketFiles();

            attachedFiles.forEach(file => {
                if (file.preview) URL.revokeObjectURL(file.preview);
            });
            setAttachedFiles([]);

        } catch (error) {
            console.error(error);
        }
    };

    const handlePaste = (e) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        const files = [];
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.kind === 'file') {
                const file = item.getAsFile();
                if (file) files.push(file);
            }
        }

        if (files.length > 0) {
            e.preventDefault();
            processFiles(files);
        }
    };

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        processFiles(files);
        e.target.value = '';
    };

    const processFiles = (files) => {
        const allowedTypes = [
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf',
            'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg',
            'video/mp4', 'video/quicktime'
        ];

        const validFiles = [];
        files.forEach(file => {
            if (file.size > 30 * 1024 * 1024) {
                alert(`File ${file.name} exceeds 30MB`);
                return;
            }
            if (allowedTypes.includes(file.type) || file.type.startsWith('image/')) {
                validFiles.push(file);
            } else {
                alert(`File ${file.name} has unsupported format`);
            }
        });

        const newFiles = validFiles.map(file => ({
            file: file,
            preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
            name: file.name,
            type: file.type,
            size: file.size,
            id: Date.now() + Math.random()
        }));

        setAttachedFiles(prev => [...prev, ...newFiles]);
    };

    const removeFile = (fileId) => {
        setAttachedFiles(prev => {
            const fileToRemove = prev.find(f => f.id === fileId);
            if (fileToRemove?.preview) {
                URL.revokeObjectURL(fileToRemove.preview);
            }
            return prev.filter(f => f.id !== fileId);
        });
    };

    const getFileIcon = (file) => {
        if (file.mime_type?.startsWith('image/')) {
            return <IoImage className={styles.fileIcon} />;
        } else if (file.mime_type?.includes('pdf')) {
            return <IoDocument className={styles.fileIcon} />;
        } else if (file.mime_type?.includes('audio')) {
            return <IoMusicalNote className={styles.fileIcon} />;
        } else if (file.mime_type?.includes('video')) {
            return <IoVideocam className={styles.fileIcon} />;
        }
        return <IoDocument className={styles.fileIcon} />;
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const decodeFileName = (fileName) => {
        if (!fileName) return 'File';
        try {
            return decodeURIComponent(escape(fileName));
        } catch (e) {
            return fileName;
        }
    };

    const deleteMessage = (msgId) => {
        if (window.confirm('Delete message?')) {
            api.delete(`/messages/${msgId}`).then(() => {
                getMessages();
                getTicketFiles();
            });
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const saveChanges = async () => {
        try {
            const response = await api.patch(`/tickets/${ticket.id}`, {
                orderId: editFormData.orderid,
                userId: editFormData.userid,
                amount: editFormData.amount,
                system_id: editFormData.system_id,
                trxid: editFormData.trxid,
                status: editFormData.status
            });

            if (onTicketUpdated) {
                onTicketUpdated(response.data);
            }

            setIsEditing(false);
        } catch (error) {
            console.error(error);
        }
    };

    const closeTicket = () => {
        if (window.confirm('Close ticket?')) {
            api.patch(`/tickets/${ticket.id}`, { status: 'Resolved' })
                .then(() => {
                    setOpenedTicket(null);
                });
        }
    };

    return (
        <div className={styles.wrapper}>
            <div className={styles.ticket}>
                <button className={styles.closeButton} onClick={() => setOpenedTicket(null)}>
                    <IoClose style={{ fontSize: '30px' }} />
                </button>

                <div className={styles.chatWithPS}>
                    <div className={styles.chat} ref={chatRef}>
                        {messages.map((msg) => (
                            <div
                                key={`msg-${msg.id}`}
                                className={styles.messageBlock}
                                style={msg.user === user.login ?
                                    { alignSelf: 'flex-end' } :
                                    { alignSelf: 'flex-start' }
                                }
                            >
                                <div className={styles.headerMsg}>
                                    <span style={msg.user === user.login ? { color: 'green' } : { color: 'red' }}>
                                        {msg.user}
                                    </span>
                                    {msg.user === user.login && (
                                        <button onClick={() => deleteMessage(msg.id)}>
                                            <IoTrash />
                                        </button>
                                    )}
                                </div>

                                {msg.message && <span className={styles.messageText}>{msg.message}</span>}

                                {msg.files && msg.files.length > 0 && (
                                    <div className={styles.messageFiles}>
                                        {msg.files.map((file) => {
                                            const fileName = decodeFileName(file.original_name || file.filename);
                                            const fileUrl = getFileUrl(file);
                                            const isImage = file.mime_type?.startsWith('image/');

                                            return (
                                                <button
                                                    key={`file-${file.id}-${msg.id}`}
                                                    className={styles.messageFileButton}
                                                    onClick={() => openFileInViewer(file, msg.files)}
                                                    title={fileName}
                                                >
                                                    {isImage ? (
                                                        <div className={styles.messageFileContainer}>
                                                            <img
                                                                className={styles.messageFile}
                                                                src={fileUrl}
                                                                alt={fileName}
                                                                onError={(e) => {
                                                                    e.target.onerror = null;
                                                                    e.target.style.display = 'none';
                                                                }}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className={styles.fileAttachment}>
                                                            {getFileIcon(file)}
                                                            <span>{fileName.length > 15 ? fileName.substring(0, 12) + '...' : fileName}</span>
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}

                                <span className={styles.messageTime}>{msg.time}</span>
                            </div>
                        ))}
                    </div>

                    <div className={styles.input}>
                        {attachedFiles.length > 0 && (
                            <div className={styles.filesPreview}>
                                {attachedFiles.map((file) => (
                                    <div key={file.id} className={styles.filePreviewItem}>
                                        {file.preview ? (
                                            <img src={file.preview} alt={file.name} className={styles.filePreviewImage} />
                                        ) : (
                                            <IoDocument className={styles.fileIcon} />
                                        )}
                                        <span className={styles.fileName}>{file.name}</span>
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
                            <button
                                className={styles.attachButton}
                                onClick={() => fileInputRef.current?.click()}
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
                            onChange={handleFileSelect}
                            style={{ display: 'none' }}
                        />
                    </div>
                </div>

                <div className={styles.ticketInfoWrapper}>
                    <div className={styles.ticketInfo}>
                        <h3>Ticket Details #{id}</h3>

                        {isEditing ? (
                            <div className={styles.editForm}>
                                <div className={styles.editField}>
                                    <label>Request ID:</label>
                                    <input
                                        type="text"
                                        name="orderid"
                                        value={editFormData.orderid}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className={styles.editField}>
                                    <label>User ID:</label>
                                    <input
                                        type="text"
                                        name="userid"
                                        value={editFormData.userid}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className={styles.editField}>
                                    <label>Amount:</label>
                                    <input
                                        type="text"
                                        name="amount"
                                        value={editFormData.amount}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className={styles.editField}>
                                    <label>TRX ID:</label>
                                    <input
                                        type="text"
                                        name="trxid"
                                        value={editFormData.trxid}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className={styles.editField}>
                                    <label>PS:</label>
                                    <select
                                        name="system_id"
                                        value={editFormData.system_id}
                                        onChange={handleInputChange}
                                    >
                                        {paymentSystems.map(ps => (
                                            <option key={ps.id} value={ps.id}>{ps.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className={styles.editField}>
                                    <label>Status:</label>
                                    <select
                                        name="status"
                                        value={editFormData.status}
                                        onChange={handleInputChange}
                                    >
                                        <option value="New">New</option>
                                        <option value="Pending">Pending</option>
                                        <option value="Resolved">Resolved</option>
                                    </select>
                                </div>
                                <div className={styles.editActions}>
                                    <button onClick={saveChanges} className={styles.saveButton}>Save</button>
                                    <button onClick={() => setIsEditing(false)} className={styles.cancelButton}>Cancel</button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className={styles.infoGrid}>
                                    <p><strong>Request ID:</strong> {orderid}</p>
                                    <p><strong>User ID:</strong> {userid}</p>
                                    <p><strong>Amount:</strong> {amount}</p>
                                    <p><strong>TRX ID:</strong> {trxid}</p>
                                    <p><strong>PS:</strong> {paymentSystems.find(ps => ps.id === system_id)?.name || system_id}</p>
                                    <p><strong>Status:</strong>
                                        <span style={{
                                            color: ticket.status === 'Resolved' ? 'green' :
                                                ticket.status === 'Pending' ? 'orange' : 'blue',
                                            fontWeight: 'bold',
                                            marginLeft: '8px'
                                        }}>
                                            {ticket.display_status || ticket.status}
                                        </span>
                                    </p>
                                </div>

                                {ticketFiles.length > 0 && (
                                    <div className={styles.ticketFiles}>
                                        <h4>Attached files ({ticketFiles.length})</h4>
                                        <div className={styles.filesGrid}>
                                            {ticketFiles.map((file) => {
                                                const fileName = decodeFileName(file.original_name || file.filename);
                                                return (
                                                    <div
                                                        key={`ticket-file-${file.id}`}
                                                        className={styles.ticketFileItem}
                                                        onClick={() => openFileInViewer(file, ticketFiles)}
                                                        title={fileName}
                                                    >
                                                        {file.mime_type?.startsWith('image/') ? (
                                                            <div className={styles.ticketFileImage}>
                                                                <img
                                                                    src={getFileUrl(file)}
                                                                    alt={fileName}
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className={styles.ticketFileIcon}>
                                                                {getFileIcon(file)}
                                                            </div>
                                                        )}
                                                        <div className={styles.ticketFileInfo}>
                                                            <span className={styles.ticketFileName}>
                                                                {fileName.length > 30
                                                                    ? fileName.substring(0, 27) + '...'
                                                                    : fileName
                                                                }
                                                            </span>
                                                            <span className={styles.ticketFileSize}>
                                                                {formatFileSize(file.file_size)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                <div className={styles.ticketActions}>
                                    <button onClick={() => setIsEditing(true)}>Edit</button>
                                    <button onClick={closeTicket}>Close ticket</button>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {fileViewerOpen && currentFile && (
                    <div className={styles.fileViewerOverlay} onClick={() => setFileViewerOpen(false)}>
                        <div className={styles.fileViewerModal} onClick={(e) => e.stopPropagation()}>
                            <button
                                className={styles.fileViewerClose}
                                onClick={() => setFileViewerOpen(false)}
                            >
                                <IoClose />
                            </button>

                            <div className={styles.fileViewerContent}>
                                {currentFile.mime_type?.startsWith('image/') ? (
                                    <img
                                        src={getFileUrl(currentFile)}
                                        alt={decodeFileName(currentFile.original_name || currentFile.filename)}
                                        className={styles.fileViewerImage}
                                    />
                                ) : currentFile.mime_type?.includes('video') ? (
                                    <video
                                        controls
                                        className={styles.fileViewerVideo}
                                        src={getFileUrl(currentFile)}
                                    />
                                ) : currentFile.mime_type?.includes('audio') ? (
                                    <audio
                                        controls
                                        className={styles.fileViewerAudio}
                                        src={getFileUrl(currentFile)}
                                    />
                                ) : (
                                    <div className={styles.fileViewerDocument}>
                                        {getFileIcon(currentFile)}
                                        <p>{decodeFileName(currentFile.original_name || currentFile.filename)}</p>
                                        <p className={styles.fileSize}>{formatFileSize(currentFile.file_size)}</p>
                                        <a
                                            href={getFileUrl(currentFile)}
                                            download={currentFile.original_name || currentFile.filename}
                                            className={styles.downloadButton}
                                        >
                                            Download file
                                        </a>
                                    </div>
                                )}
                            </div>

                            {allViewerFiles.length > 1 && (
                                <>
                                    <button
                                        className={`${styles.fileViewerNav} ${styles.fileViewerPrev}`}
                                        onClick={prevFile}
                                    >
                                        <IoArrowBack />
                                    </button>
                                    <button
                                        className={`${styles.fileViewerNav} ${styles.fileViewerNext}`}
                                        onClick={nextFile}
                                    >
                                        <IoArrowForward />
                                    </button>
                                </>
                            )}

                            <div className={styles.fileViewerInfo}>
                                <span>{decodeFileName(currentFile.original_name || currentFile.filename)}</span>
                                <span>{formatFileSize(currentFile.file_size)}</span>
                                {allViewerFiles.length > 1 && (
                                    <span>{currentFileIndex + 1} / {allViewerFiles.length}</span>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}