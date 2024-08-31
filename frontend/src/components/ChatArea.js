import React from 'react';
import ReactMarkdown from 'react-markdown';
import { FaUser, FaRobot, FaPaperPlane } from 'react-icons/fa';
import styles from '../App.module.css';

function ChatArea({ chatHistory, message, setMessage, onSendMessage }) {
  return (
    <div className={styles.chatContainer}>
      <div className={styles.chatHistory}>
        {chatHistory.map((chat, index) => (
          <div key={index} className={`${styles.message} ${chat.role === 'user' ? styles.userMessage : styles.aiMessage}`}>
            {chat.role === 'user' ? <FaUser /> : <FaRobot />}
            <ReactMarkdown>{chat.content}</ReactMarkdown>
          </div>
        ))}
      </div>
      <div className={styles.inputSection}>
        <input
          className={styles.input}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && onSendMessage()}
          placeholder="Type your message..."
        />
        <button className={`${styles.button} ${styles.primaryButton} ${styles.sendButton}`} onClick={onSendMessage}>
          <FaPaperPlane />
        </button>
      </div>
    </div>
  );
}

export default ChatArea;