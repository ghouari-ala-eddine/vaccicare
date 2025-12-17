import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { chatAPI } from '../../services/api';
import './Chat.css';

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
            console.log('Fetching messages for conversation:', conversationId);
            const data = await chatAPI.getMessages(conversationId);
            console.log('Messages received:', data);
            setMessages(data);
            // Refresh conversations to update unread counts
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
        setNewMessage(''); // Clear input immediately for better UX

        try {
            await chatAPI.sendMessage(selectedConversation._id, messageToSend);
            // Refresh messages from server to get the correct format
            await fetchMessages(selectedConversation._id);
            fetchConversations(); // Update last message in list
        } catch (error) {
            console.error('Error sending message:', error);
            setNewMessage(messageToSend); // Restore message on error
            alert(t('messages.error'));
        } finally {
            setSendingMessage(false);
        }
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

    if (loading) {
        return (
            <div className="loading-overlay">
                <div className="spinner"></div>
                <p>{t('loading')}</p>
            </div>
        );
    }

    return (
        <div className="chat-page">
            {/* Conversations Sidebar */}
            <div className="chat-sidebar">
                <div className="sidebar-header">
                    <h2>💬 {t('chat.title')}</h2>
                    {isParent && (
                        <button
                            className="btn btn-primary btn-sm"
                            onClick={() => setShowNewChat(true)}
                        >
                            + {t('chat.new')}
                        </button>
                    )}
                </div>

                <div className="conversations-list">
                    {conversations.length === 0 ? (
                        <div className="no-conversations">
                            <span>💬</span>
                            <p>{t('chat.noConversations')}</p>
                            {isParent && (
                                <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => setShowNewChat(true)}
                                >
                                    {t('chat.startFirst')}
                                </button>
                            )}
                        </div>
                    ) : (
                        conversations.map(conv => {
                            const other = getOtherParticipant(conv);
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
                                            {conv.lastMessage?.content?.substring(0, 30) || t('chat.noMessages')}
                                            {conv.lastMessage?.content?.length > 30 ? '...' : ''}
                                        </div>
                                    </div>
                                    <div className="conv-meta">
                                        <span className="conv-time">
                                            {conv.lastMessageAt && formatTime(conv.lastMessageAt)}
                                        </span>
                                        {conv.unreadCount > 0 && (
                                            <span className="unread-badge">{conv.unreadCount}</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="chat-main">
                {selectedConversation ? (
                    <>
                        {/* Chat Header */}
                        <div className="chat-header">
                            <div className="chat-header-info">
                                <span className="chat-avatar">
                                    {getOtherParticipant(selectedConversation)?.role === 'doctor' ? '👨‍⚕️' : '👤'}
                                </span>
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
                                    console.log('Rendering message:', msg._id, 'sender:', senderId, 'user:', userId, 'isSent:', isSent);
                                    return (
                                        <div
                                            key={msg._id}
                                            className={`message ${isSent ? 'sent' : 'received'}`}
                                        >
                                            <div className="message-content">
                                                {msg.content}
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
                        <form className="chat-input" onSubmit={handleSendMessage}>
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
