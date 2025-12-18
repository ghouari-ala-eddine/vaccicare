const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');

// @desc    Get all conversations for current user
// @route   GET /api/chat/conversations
// @access  Private
const getConversations = async (req, res) => {
    try {
        const conversations = await Conversation.find({
            participants: req.user._id
        })
            .populate('participants', 'name role')
            .populate('lastMessage')
            .sort({ lastMessageAt: -1 });

        // Add unread count for current user
        const conversationsWithUnread = conversations.map(conv => {
            const unread = conv.unreadCount?.get(req.user._id.toString()) || 0;
            return {
                ...conv.toObject(),
                unreadCount: unread
            };
        });

        res.json(conversationsWithUnread);
    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// @desc    Get messages in a conversation
// @route   GET /api/chat/conversations/:id/messages
// @access  Private
const getMessages = async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 50 } = req.query;

        // Check if user is participant (use string comparison for ObjectIds)
        const conversation = await Conversation.findById(id);
        if (!conversation) {
            return res.status(404).json({ message: 'Conversation non trouvée' });
        }

        const isParticipant = conversation.participants.some(
            p => p.toString() === req.user._id.toString()
        );

        if (!isParticipant) {
            return res.status(403).json({ message: 'Accès non autorisé' });
        }

        const messages = await Message.find({ conversation: id })
            .populate('sender', 'name role')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        // Mark messages as read by current user
        await Message.updateMany(
            {
                conversation: id,
                sender: { $ne: req.user._id },
                readBy: { $ne: req.user._id }
            },
            { $addToSet: { readBy: req.user._id } }
        );

        // Reset unread count for this user
        conversation.unreadCount.set(req.user._id.toString(), 0);
        await conversation.save();

        res.json(messages.reverse());
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// @desc    Send a message (text or voice)
// @route   POST /api/chat/conversations/:id/messages
// @access  Private
const sendMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const { content, messageType = 'text', audioData, audioDuration } = req.body;

        // Validate based on message type
        if (messageType === 'text' && (!content || !content.trim())) {
            return res.status(400).json({ message: 'Le message ne peut pas être vide' });
        }
        if (messageType === 'audio' && !audioData) {
            return res.status(400).json({ message: 'Audio data is required for voice messages' });
        }

        // Check if user is participant (use string comparison for ObjectIds)
        const conversation = await Conversation.findById(id);
        if (!conversation) {
            return res.status(404).json({ message: 'Conversation non trouvée' });
        }

        const isParticipant = conversation.participants.some(
            p => p.toString() === req.user._id.toString()
        );

        if (!isParticipant) {
            return res.status(403).json({ message: 'Accès non autorisé' });
        }

        // Create message based on type
        const messageData = {
            conversation: id,
            sender: req.user._id,
            messageType,
            readBy: [req.user._id]
        };

        if (messageType === 'text') {
            messageData.content = content.trim();
        } else if (messageType === 'audio') {
            messageData.audioData = audioData;
            messageData.audioDuration = audioDuration || 0;
            messageData.content = '🎤 Voice message'; // Fallback text for notifications
        }

        const message = await Message.create(messageData);

        // Update conversation
        conversation.lastMessage = message._id;
        conversation.lastMessageAt = new Date();

        // Increment unread count for other participants
        conversation.participants.forEach(participantId => {
            if (participantId.toString() !== req.user._id.toString()) {
                const currentCount = conversation.unreadCount.get(participantId.toString()) || 0;
                conversation.unreadCount.set(participantId.toString(), currentCount + 1);
            }
        });

        await conversation.save();

        const populatedMessage = await Message.findById(message._id)
            .populate('sender', 'name role');

        res.status(201).json(populatedMessage);
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ message: error.message || 'Erreur serveur' });
    }
};

// @desc    Start or get existing conversation with a user
// @route   POST /api/chat/conversations
// @access  Private
const startConversation = async (req, res) => {
    try {
        const { recipientId } = req.body;

        if (!recipientId) {
            return res.status(400).json({ message: 'Destinataire requis' });
        }

        if (recipientId === req.user._id.toString()) {
            return res.status(400).json({ message: 'Vous ne pouvez pas démarrer une conversation avec vous-même' });
        }

        // Check if recipient exists
        const recipient = await User.findById(recipientId);
        if (!recipient) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        // Check if conversation already exists
        let conversation = await Conversation.findBetweenUsers(req.user._id, recipientId);

        if (!conversation) {
            // Create new conversation
            conversation = await Conversation.create({
                participants: [req.user._id, recipientId],
                unreadCount: new Map()
            });
        }

        const populatedConversation = await Conversation.findById(conversation._id)
            .populate('participants', 'name role')
            .populate('lastMessage');

        res.status(201).json(populatedConversation);
    } catch (error) {
        console.error('Error starting conversation:', error);
        res.status(500).json({ message: error.message || 'Erreur serveur' });
    }
};

// @desc    Get available doctors for chat (for parents)
// @route   GET /api/chat/doctors
// @access  Private (Parents)
const getAvailableDoctors = async (req, res) => {
    try {
        const doctors = await User.find({
            role: 'doctor',
            isActive: true
        }).select('name phone specialty');

        res.json(doctors);
    } catch (error) {
        console.error('Error fetching doctors:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// @desc    Get total unread count for current user
// @route   GET /api/chat/unread
// @access  Private
const getUnreadCount = async (req, res) => {
    try {
        const conversations = await Conversation.find({
            participants: req.user._id
        });

        let totalUnread = 0;
        conversations.forEach(conv => {
            totalUnread += conv.unreadCount?.get(req.user._id.toString()) || 0;
        });

        res.json({ unreadCount: totalUnread });
    } catch (error) {
        console.error('Error fetching unread count:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

module.exports = {
    getConversations,
    getMessages,
    sendMessage,
    startConversation,
    getAvailableDoctors,
    getUnreadCount
};
