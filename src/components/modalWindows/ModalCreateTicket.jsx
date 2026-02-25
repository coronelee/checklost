import React from 'react'
import styles from '../../styles/ModalCreateTicket.module.css';
import { IoClose, IoDocument, IoImage, IoMusicalNote, IoVideocam } from "react-icons/io5";
import { useState, useRef, useEffect } from 'react';
import axios from 'axios';

export default function ModalCreateTicket({ setIsCreateTicketPage, paymentSystems, onTicketCreated }) {
    const [attachedFiles, setAttachedFiles] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const fileInputRef = useRef(null);
    const dropZoneRef = useRef(null);

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

    const validateField = (name, value) => {
        switch (name) {
            case 'ps':
                return !value || value === '' ? 'Payment system is required' : '';
            case 'country':
                return !value || value === '' ? 'Country is required' : '';
            case 'orderid':
                if (!value || value.trim() === '') return 'Order ID is required';
                if (!/^\d+$/.test(value)) return 'Order ID must contain only numbers';
                return '';
            case 'userid':
                if (!value || value.trim() === '') return 'User ID is required';
                if (!/^\d+$/.test(value)) return 'User ID must contain only numbers';
                return '';
            case 'amount':
                return !value || value.trim() === '' ? 'Amount is required' : '';
            case 'trxid':
                return !value || value.trim() === '' ? 'Transaction ID is required' : '';
            default:
                return '';
        }
    };

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        const error = validateField(id, value);

        setErrors(prev => ({
            ...prev,
            [id]: error
        }));

        setTouched(prev => ({
            ...prev,
            [id]: true
        }));
    };

    const handleBlur = (e) => {
        const { id } = e.target;
        setTouched(prev => ({
            ...prev,
            [id]: true
        }));
    };

    const validateForm = () => {
        const fields = ['ps', 'country', 'orderid', 'userid', 'amount', 'trxid'];
        const newErrors = {};
        let isValid = true;

        fields.forEach(field => {
            const value = document.getElementById(field)?.value || '';
            const error = validateField(field, value);
            if (error) {
                newErrors[field] = error;
                isValid = false;
            }
        });

        setErrors(newErrors);

        const newTouched = {};
        fields.forEach(field => {
            newTouched[field] = true;
        });
        setTouched(newTouched);

        return isValid;
    };

    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        processFiles(files);
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
            'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'
        ];

        const allowedExtensions = [
            '.jpg', '.jpeg', '.png', '.gif', '.webp',
            '.pdf',
            '.mp3', '.wav', '.ogg',
            '.mp4', '.mov', '.avi', '.webm'
        ];

        const validFiles = [];
        const fileErrors = [];

        files.forEach(file => {
            if (file.size > 30 * 1024 * 1024) {
                fileErrors.push(`${file.name} - exceeds 30MB`);
                return;
            }

            const ext = '.' + file.name.split('.').pop().toLowerCase();
            if (allowedTypes.includes(file.type) || allowedExtensions.includes(ext)) {
                validFiles.push(file);
            } else {
                fileErrors.push(`${file.name} - unsupported format`);
            }
        });

        if (fileErrors.length > 0) {
            setErrors(prev => ({
                ...prev,
                files: fileErrors.join(', ')
            }));
        }

        if (validFiles.length > 0) {
            const newFiles = validFiles.map(file => ({
                file: file,
                preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
                name: file.name,
                type: file.type,
                size: file.size,
                id: Date.now() + Math.random()
            }));

            setAttachedFiles(prev => [...prev, ...newFiles]);
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.files;
                return newErrors;
            });
        }
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

    useEffect(() => {
        return () => {
            attachedFiles.forEach(file => {
                if (file.preview) {
                    URL.revokeObjectURL(file.preview);
                }
            });
        };
    }, []);

    const getFileIcon = (file) => {
        if (file.type?.startsWith('image/')) {
            return <img src={file.preview} alt={file.name} className={styles.filePreviewImage} />;
        } else if (file.type?.includes('pdf')) {
            return <IoDocument className={styles.fileIcon} />;
        } else if (file.type?.includes('audio')) {
            return <IoMusicalNote className={styles.fileIcon} />;
        } else if (file.type?.includes('video')) {
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

    const createTicket = () => {
        if (!validateForm()) {
            const firstErrorField = Object.keys(errors)[0];
            if (firstErrorField) {
                document.getElementById(firstErrorField)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        const ps = document.getElementById('ps').value;
        const type = document.getElementById('type').value;
        const orderid = document.getElementById('orderid').value;
        const userid = document.getElementById('userid').value;
        const amount = document.getElementById('amount').value;
        const trxid = document.getElementById('trxid').value;
        const country = document.getElementById('country').value;

        const ticketData = {
            orderId: orderid,
            userId: userid,
            amount: amount,
            trxid: trxid,
            system_id: ps,
            type: type,
            status: 'New',
            last_update: new Date().toLocaleString(),
            country: country
        };

        api.post('/tickets', ticketData)
            .then((response) => {
                document.getElementById('ps').value = '';
                document.getElementById('country').value = '';
                document.getElementById('orderid').value = '';
                document.getElementById('userid').value = '';
                document.getElementById('amount').value = '';
                document.getElementById('trxid').value = '';
                document.getElementById('type').value = 'D';

                setAttachedFiles([]);
                setErrors({});
                setTouched({});

                if (onTicketCreated) {
                    onTicketCreated(response.data);
                }

                setIsCreateTicketPage(false);
            })
            .catch((error) => {
                alert('Error creating ticket: ' + (error.response?.data?.error || error.message));
            });
    };

    return (
        <div className={styles.wrapper}>
            <div className={styles.formTicket}>
                <button className={styles.closeButton} onClick={() => setIsCreateTicketPage(false)}>
                    <IoClose />
                </button>
                <h2>Fill in the Information</h2>

                <div className={styles.formGroup}>
                    <select
                        name="ps"
                        id="ps"
                        className={`${styles.required} ${touched.ps && errors.ps ? styles.error : ''}`}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                    >
                        <option value="">Payment system</option>
                        {paymentSystems.map(ps => (
                            <option key={ps.id} value={ps.id}>{ps.name}</option>
                        ))}
                    </select>
                    {touched.ps && errors.ps && <span className={styles.errorMessage}>{errors.ps}</span>}
                </div>

                <div className={styles.formGroup}>
                    <select
                        name="country"
                        id="country"
                        className={`${styles.required} ${touched.country && errors.country ? styles.error : ''}`}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                    >
                        <option value="">Select country</option>
                        <option value="BD">Bangladesh</option>
                        <option value="PK">Pakistan</option>
                        <option value="IND">India</option>
                        <option value="MM">Myanmar</option>
                        <option value="LK">Sri-Lanka</option>
                        <option value="VTN">Vietnam</option>
                    </select>
                    {touched.country && errors.country && <span className={styles.errorMessage}>{errors.country}</span>}
                </div>

                <div className={styles.formGroup}>
                    <select
                        name="type"
                        id="type"
                        className={styles.required}
                    >
                        <option value="D">D</option>
                        <option value="W">W</option>
                    </select>
                </div>

                <div className={styles.formGroup}>
                    <input
                        type="text"
                        placeholder='Order ID *'
                        id='orderid'
                        className={`${styles.required} ${touched.orderid && errors.orderid ? styles.error : ''}`}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        onKeyPress={(e) => {
                            if (!/[0-9]/.test(e.key)) {
                                e.preventDefault();
                            }
                        }}
                        onPaste={(e) => {
                            e.preventDefault();
                            const pastedText = e.clipboardData.getData('text');
                            const numbersOnly = pastedText.replace(/[^0-9]/g, '');
                            document.getElementById('orderid').value = numbersOnly;
                            handleInputChange(e);
                        }}
                    />
                    {touched.orderid && errors.orderid && <span className={styles.errorMessage}>{errors.orderid}</span>}
                </div>

                <div className={styles.formGroup}>
                    <input
                        type="text"
                        placeholder='User ID *'
                        id='userid'
                        className={`${styles.required} ${touched.userid && errors.userid ? styles.error : ''}`}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        onKeyPress={(e) => {
                            if (!/[0-9]/.test(e.key)) {
                                e.preventDefault();
                            }
                        }}
                        onPaste={(e) => {
                            e.preventDefault();
                            const pastedText = e.clipboardData.getData('text');
                            const numbersOnly = pastedText.replace(/[^0-9]/g, '');
                            document.getElementById('userid').value = numbersOnly;
                            handleInputChange(e);
                        }}
                    />
                    {touched.userid && errors.userid && <span className={styles.errorMessage}>{errors.userid}</span>}
                </div>

                <div className={styles.formGroup}>
                    <input
                        type="text"
                        placeholder='Amount *'
                        id='amount'
                        className={`${styles.required} ${touched.amount && errors.amount ? styles.error : ''}`}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                    />
                    {touched.amount && errors.amount && <span className={styles.errorMessage}>{errors.amount}</span>}
                </div>

                <div className={styles.formGroup}>
                    <input
                        type="text"
                        placeholder='Transaction ID *'
                        id='trxid'
                        className={`${styles.required} ${touched.trxid && errors.trxid ? styles.error : ''}`}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                    />
                    {touched.trxid && errors.trxid && <span className={styles.errorMessage}>{errors.trxid}</span>}
                </div>

                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                    accept="image/*,.pdf,audio/*,video/*"
                />

                <div
                    ref={dropZoneRef}
                    className={`${styles.dropZone} ${isDragging ? styles.dragging : ''} ${errors.files ? styles.error : ''}`}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onPaste={handlePaste}
                    onClick={() => fileInputRef.current?.click()}
                    tabIndex={0}
                >
                    {attachedFiles.length === 0 ? (
                        <div className={styles.dropZoneContent}>
                            <p>📁 Drag & drop files here</p>
                            <p>or click to select</p>
                            <p className={styles.pasteHint}>or press Ctrl+V to paste</p>
                            <p className={styles.fileTypes}>
                                Supported: Images, PDF, Audio, Video (max 30MB)
                            </p>
                        </div>
                    ) : (
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
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeFile(file.id);
                                        }}
                                    >
                                        <IoClose />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                {errors.files && <span className={styles.errorMessage}>{errors.files}</span>}

                <button className={styles.createButton} onClick={createTicket}>Create</button>
            </div>
        </div>
    );
}