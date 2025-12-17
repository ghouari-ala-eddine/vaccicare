const express = require('express');
const router = express.Router();
const {
    getConversations,
    getMessages,
    sendMessage,
    startConversation,
    getAvailableDoctors,
    getUnreadCount
} = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// Get unread count
router.get('/unread', getUnreadCount);

// Get available doctors for chat
router.get('/doctors', getAvailableDoctors);

// Get all conversations
router.get('/conversations', getConversations);

// Start or get conversation with user
router.post('/conversations', startConversation);

// Get messages in a conversation
router.get('/conversations/:id/messages', getMessages);

// Send a message
router.post('/conversations/:id/messages', sendMessage);

module.exports = router;
