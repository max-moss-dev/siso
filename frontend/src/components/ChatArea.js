import React, { useRef, useEffect } from 'react';
import styles from '../App.module.css';
import { FaPaperPlane, FaUser, FaRobot } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

function ChatArea({ chatHistory, message, setMessage, onSendMessage }) {
  const chatHistoryRef = useRef(null);

  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSendMessage();
  };

  const renderers = {
    code: ({node, inline, className, children, ...props}) => {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <SyntaxHighlighter
          style={vscDarkPlus}
          language={match[1]}
          PreTag="div"
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      )
    }
  };

  return (
    <div className={styles.chatContainer}>
      <div className={styles.chatHistory} ref={chatHistoryRef}>
        {chatHistory.map((msg, index) => (
          <div
            key={index}
            className={`${styles.message} ${
              msg.role === 'user' ? styles.userMessage : styles.aiMessage
            }`}
          >
            <div className={styles.messageHeader}>
              {msg.role === 'user' ? (
                <>
                  <FaUser className={styles.messageIcon} />
                  <span className={styles.messageLabel}>You</span>
                </>
              ) : (
                <>
                  <FaRobot className={styles.messageIcon} />
                  <span className={styles.messageLabel}>AI</span>
                </>
              )}
            </div>
            <div className={styles.messageContent}>
              <ReactMarkdown components={renderers}>{msg.content}</ReactMarkdown>
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className={styles.inputSection}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          className={styles.input}
        />
        <button type="submit" className={styles.sendButton}>
          <FaPaperPlane />
        </button>
      </form>
    </div>
  );
}

export default ChatArea;