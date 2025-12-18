import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { chatAPI } from '../../services/api';
import './Chat.css';

// VERSION 2 - Timer fix
console.log('🔵 ChatPage VERSION 2 loaded');

const ChatPage = () => {
    const { user, isParent, isDoctor } = useAuth();
    const { t, language } = useLanguage();
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sendingMessage, setSendingMessage] = useState(false);
    const [doctors, setDoctors] = useState([]);
    const [showNewChat, setShowNewChat] = useState(false);
    const messagesEndRef = useRef(null);

    // Voice recording state
    const [isRecording, setIsRecording] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const recordingIntervalRef = useRef(null);

    useEffect(() => {
        fetchConversations();
        if (isParent) {
            fetchDoctors();
        }
    }, [isParent]);

    useEffect(() => {
        if (selectedConversation) {
            fetchMessages(selectedConversation._id);
        }
    }, [selectedConversation]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Auto-refresh messages every 5 seconds
    useEffect(() => {
        let interval;
        if (selectedConversation) {
            interval = setInterval(() => {
                fetchMessages(selectedConversation._id, true);
            }, 5000);
        }
        return () => clearInterval(interval);
    }, [selectedConversation]);

    // Cleanup recording on unmount
    useEffect(() => {
        return () => {
            if (recordingIntervalRef.current) {
                clearInterval(recordingIntervalRef.current);
            }
            if (mediaRecorderRef.current && isRecording) {
                mediaRecorderRef.current.stop();
            }
        };
    }, [isRecording]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchConversations = async () => {
        try {
            const data = await chatAPI.getConversations();
            setConversations(data);
        } catch (error) {
            console.error('Error fetching conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDoctors = async () => {
        try {
            const data = await chatAPI.getDoctors();
            setDoctors(data);
        } catch (error) {
            console.error('Error fetching doctors:', error);
        }
    };

    const fetchMessages = async (conversationId, silent = false) => {
        try {
            const data = await chatAPI.getMessages(conversationId);
            setMessages(data);
            if (!silent) {
                fetchConversations();
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedConversation || sendingMessage) return;

        setSendingMessage(true);
        const messageToSend = newMessage.trim();
        setNewMessage('');

        try {
            await chatAPI.sendMessage(selectedConversation._id, { content: messageToSend });
            await fetchMessages(selectedConversation._id);
            fetchConversations();
        } catch (error) {
            console.error('Error sending message:', error);
            setNewMessage(messageToSend);
            alert(t('messages.error'));
        } finally {
            setSendingMessage(false);
        }
    };

    // Voice Recording Functions
    const isCancelledRef = useRef(false);
    const durationRef = useRef(0);

    const startRecording = async () => {
        try {
            console.log('🎤 Starting recording...');
            isCancelledRef.current = false;
            durationRef.current = 0;
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                console.log('📦 Data available:', event.data.size);
                if (event.data.size > 0 && !isCancelledRef.current) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const finalDuration = durationRef.current;
                console.log('⏹️ Recording stopped, cancelled:', isCancelledRef.current, 'duration:', finalDuration);
                stream.getTracks().forEach(track => track.stop());

                if (!isCancelledRef.current && audioChunksRef.current.length > 0) {
                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                    console.log('📤 Sending voice message, size:', audioBlob.size, 'duration:', finalDuration);
                    await sendVoiceMessageWithDuration(audioBlob, finalDuration);
                } else {
                    console.log('🚫 Recording was cancelled, not sending');
                }
            };

            // Start timer FIRST before recording
            setIsRecording(true);
            setRecordingDuration(0);
            durationRef.current = 0;

            console.log('🕐 Setting up interval...');

            const intervalId = window.setInterval(function () {
                durationRef.current = durationRef.current + 1;
                console.log('⏱️ TICK:', durationRef.current);
                setRecordingDuration(durationRef.current);
            }, 1000);

            recordingIntervalRef.current = intervalId;
            console.log('🕐 Interval set with ID:', intervalId);

            // Then start recording
            mediaRecorder.start(1000);

            console.log('✅ Recording started, interval ID:', recordingIntervalRef.current);
        } catch (error) {
            console.error('❌ Error starting recording:', error);
            alert(t('chat.microphoneError') || 'Microphone access denied');
        }
    };

    const stopRecording = () => {
        console.log('📤 Stop recording (send), duration:', durationRef.current);
        if (mediaRecorderRef.current && isRecording) {
            isCancelledRef.current = false;
            if (recordingIntervalRef.current) {
                clearInterval(recordingIntervalRef.current);
                recordingIntervalRef.current = null;
            }
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const cancelRecording = () => {
        console.log('❌ Cancel recording');
        if (mediaRecorderRef.current && isRecording) {
            isCancelledRef.current = true;
            audioChunksRef.current = [];
            durationRef.current = 0;
            if (recordingIntervalRef.current) {
                clearInterval(recordingIntervalRef.current);
                recordingIntervalRef.current = null;
            }
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            setRecordingDuration(0);
        }
    };

    const sendVoiceMessageWithDuration = async (audioBlob, duration) => {
        if (!selectedConversation) return;

        console.log('📨 sendVoiceMessageWithDuration, duration:', duration);
        setSendingMessage(true);

        try {
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = async () => {
                const base64Audio = reader.result;
                console.log('📤 Calling API with audioDuration:', duration);
                await chatAPI.sendMessage(selectedConversation._id, {
                    messageType: 'audio',
                    audioData: base64Audio,
                    audioDuration: duration
                });
                setRecordingDuration(0);
                durationRef.current = 0;
                await fetchMessages(selectedConversation._id);
                fetchConversations();
                setSendingMessage(false);
            };
        } catch (error) {
            console.error('Error sending voice message:', error);
            alert(t('messages.error'));
            setSendingMessage(false);
        }
    };

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleStartConversation = async (doctorId) => {
        try {
            const conversation = await chatAPI.startConversation(doctorId);
            setConversations([conversation, ...conversations.filter(c => c._id !== conversation._id)]);
            setSelectedConversation(conversation);
            setShowNewChat(false);
        } catch (error) {
            console.error('Error starting conversation:', error);
            alert(t('messages.error'));
        }
    };

    const getOtherParticipant = (conversation) => {
        return conversation.participants?.find(p => p._id !== user?._id);
    };

    const formatTime = (date) => {
        const now = new Date();
        const msgDate = new Date(date);
        const isToday = now.toDateString() === msgDate.toDateString();

        if (isToday) {
            return msgDate.toLocaleTimeString(language === 'ar' ? 'ar-SA' : 'fr-FR', {
                hour: '2-digit',
                minute: '2-digit'
            });
        }
        return msgDate.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'fr-FR', {
            day: 'numeric',
            month: 'short'
        });
    };

    // Audio Player Component
    const AudioMessage = ({ audioData, duration }) => {
        const audioRef = useRef(null);
        const [isPlaying, setIsPlaying] = useState(false);
        const [progress, setProgress] = useState(0);

        const togglePlay = () => {
            if (audioRef.current) {
                if (isPlaying) {
                    audioRef.current.pause();
                } else {
                    audioRef.current.play();
                }
                setIsPlaying(!isPlaying);
            }
        };

        return (
            <div className="audio-message">
                <audio
                    ref={audioRef}
                    src={audioData}
                    onEnded={() => { setIsPlaying(false); setProgress(0); }}
                    onTimeUpdate={(e) => {
                        const percent = (e.target.currentTime / e.target.duration) * 100;
                        setProgress(isFinite(percent) ? percent : 0);
                    }}
                />
                <button className="audio-play-btn" onClick={togglePlay}>
                    {isPlaying ? '⏸️' : '▶️'}
                </button>
                <div className="audio-waveform">
                    <div className="audio-progress-bar">
                        <div className="audio-progress" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>
                <span className="audio-duration">
                    🎤 {duration > 0 ? formatDuration(duration) : '0:00'}
                </span>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="loading-overlay">
                <div className="spinner"></div>
                <p>{t('loading')}</p>
            </div>
        );
    }

    return (
        <div className={`chat-page ${language === 'ar' ? 'rtl' : ''}`}>
            {/* Sidebar */}
            <div className="chat-sidebar">
                <div className="sidebar-header">
                    <h2>💬 {t('chat.title')}</h2>
                    {isParent && (
                        <button className="btn btn-primary btn-sm" onClick={() => setShowNewChat(true)}>
                            + {t('chat.new')}
                        </button>
                    )}
                </div>

                <div className="conversations-list">
                    {conversations.length === 0 ? (
                        <div className="no-conversations">
                            <span>💭</span>
                            <p>{t('chat.noConversations')}</p>
                        </div>
                    ) : (
                        conversations.map(conv => {
                            const other = getOtherParticipant(conv);
                            const unread = conv.unreadCount?.get?.(user?._id) || conv.unreadCount?.[user?._id] || 0;
                            return (
                                <div
                                    key={conv._id}
                                    className={`conversation-item ${selectedConversation?._id === conv._id ? 'active' : ''}`}
                                    onClick={() => setSelectedConversation(conv)}
                                >
                                    <div className="conv-avatar">
                                        {other?.role === 'doctor' ? '👨‍⚕️' : '👤'}
                                    </div>
                                    <div className="conv-info">
                                        <div className="conv-name">
                                            {other?.role === 'doctor' ? 'Dr. ' : ''}{other?.name}
                                        </div>
                                        <div className="conv-preview">
                                            {conv.lastMessage?.messageType === 'audio'
                                                ? '🎤 Voice message'
                                                : conv.lastMessage?.content || t('chat.noMessages')}
                                        </div>
                                    </div>
                                    <div className="conv-meta">
                                        {conv.lastMessageAt && (
                                            <span className="conv-time">{formatTime(conv.lastMessageAt)}</span>
                                        )}
                                        {unread > 0 && <span className="unread-badge">{unread}</span>}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="chat-main">
                {selectedConversation ? (
                    <>
                        <div className="chat-header">
                            <div className="chat-header-info">
                                <div className="chat-avatar">
                                    {getOtherParticipant(selectedConversation)?.role === 'doctor' ? '👨‍⚕️' : '👤'}
                                </div>
                                <div>
                                    <h3>
                                        {getOtherParticipant(selectedConversation)?.role === 'doctor' ? 'Dr. ' : ''}
                                        {getOtherParticipant(selectedConversation)?.name}
                                    </h3>
                                    <span className="chat-role">
                                        {getOtherParticipant(selectedConversation)?.role === 'doctor'
                                            ? t('auth.doctor')
                                            : t('auth.parent')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="chat-messages">
                            {messages.length === 0 ? (
                                <div className="no-messages">
                                    <span>💬</span>
                                    <p>{t('chat.startConversation')}</p>
                                </div>
                            ) : (
                                messages.map(msg => {
                                    const senderId = msg.sender?._id || msg.sender;
                                    const userId = user?._id;
                                    const isSent = String(senderId) === String(userId);
                                    return (
                                        <div
                                            key={msg._id}
                                            className={`message ${isSent ? 'sent' : 'received'}`}
                                        >
                                            <div className="message-content">
                                                {msg.messageType === 'audio' ? (
                                                    <AudioMessage
                                                        audioData={msg.audioData}
                                                        duration={msg.audioDuration}
                                                    />
                                                ) : (
                                                    msg.content
                                                )}
                                            </div>
                                            <div className="message-time">
                                                {formatTime(msg.createdAt)}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Message Input */}
                        <div className="chat-input">
                            {isRecording ? (
                                <div className="recording-controls">
                                    <button
                                        className="btn btn-danger btn-sm cancel-recording"
                                        onClick={cancelRecording}
                                    >
                                        ✕
                                    </button>
                                    <div className="recording-indicator">
                                        <span className="recording-dot"></span>
                                        <span className="recording-time">{formatDuration(recordingDuration)}</span>
                                    </div>
                                    <button
                                        className="btn btn-primary send-recording"
                                        onClick={stopRecording}
                                        disabled={sendingMessage}
                                    >
                                        {sendingMessage ? '...' : '📤'}
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleSendMessage} className="message-form">
                                    <button
                                        type="button"
                                        className="btn btn-secondary voice-btn"
                                        onClick={startRecording}
                                        disabled={sendingMessage}
                                    >
                                        🎤
                                    </button>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder={t('chat.typePlaceholder')}
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        disabled={sendingMessage}
                                    />
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={!newMessage.trim() || sendingMessage}
                                    >
                                        {sendingMessage ? '...' : '📤'}
                                    </button>
                                </form>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="no-chat-selected">
                        <span>💬</span>
                        <h3>{t('chat.selectConversation')}</h3>
                        <p>{t('chat.selectOrStart')}</p>
                    </div>
                )}
            </div>

            {/* New Chat Modal */}
            {showNewChat && (
                <div className="modal-overlay" onClick={() => setShowNewChat(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">👨‍⚕️ {t('chat.selectDoctor')}</h2>
                            <button className="modal-close" onClick={() => setShowNewChat(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            {doctors.length === 0 ? (
                                <div className="empty-state">
                                    <p>{t('chat.noDoctors')}</p>
                                </div>
                            ) : (
                                <div className="doctors-list-chat">
                                    {doctors.map(doctor => (
                                        <div
                                            key={doctor._id}
                                            className="doctor-item"
                                            onClick={() => handleStartConversation(doctor._id)}
                                        >
                                            <span className="doctor-icon">👨‍⚕️</span>
                                            <div className="doctor-details">
                                                <strong>Dr. {doctor.name}</strong>
                                                {doctor.specialty && <span>{doctor.specialty}</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatPage;
