import React, { useRef, useEffect } from 'react';
import styles from '../App.module.css';
import { FaPaperPlane, FaUser, FaRobot } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { MentionsInput, Mention } from 'react-mentions';
import { mentionsInputStyle, mentionStyle } from '../MentionsInputStyle';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ChatContextMention from './ChatContextMention';

function ChatArea({ 
  chatHistory, 
  message, 
  setMessage, 
  onSendMessage, 
  contextBlocks, 
  toggleContextSidebar, 
  setIsContextSidebarOpen,
  scrollToContextBlock
}) {
  const chatHistoryRef = useRef(null);
  const suggestionsPortalRef = useRef(null);

  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSendMessage();
  };

  const handleInputChange = (event, newValue, newPlainTextValue) => {
    setMessage(newPlainTextValue);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const renderers = {
    code: ({node, inline, className, children, ...props}) => {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <SyntaxHighlighter
          style={atomDark}
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
              <span className={styles.messageIcon}>
                {msg.role === 'user' ? <FaUser /> : <FaRobot />}
              </span>
              <span className={styles.messageLabel}>
                {msg.role === 'user' ? 'You' : 'AI'}
              </span>
            </div>
            <div className={styles.messageContent}>
              <ReactMarkdown
                components={renderers}
              >
                {msg.content}
              </ReactMarkdown>
            </div>
            {msg.context_updates && msg.context_updates.length > 0 && (
              <ChatContextMention
                contextUpdates={msg.context_updates}
                toggleContextSidebar={toggleContextSidebar}
                setIsContextSidebarOpen={setIsContextSidebarOpen}
                scrollToContextBlock={scrollToContextBlock}
              />
            )}
          </div>
        ))}
      </div>
      <div className={styles.suggestionsPortal} ref={suggestionsPortalRef}></div>
      <form onSubmit={handleSubmit} className={styles.inputSection}>
        <MentionsInput
          value={message}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          style={mentionsInputStyle}
          className={styles.mentionsInput}
          a11ySuggestionsListLabel={"Suggested mentions"}
          suggestionsPortalHost={suggestionsPortalRef.current}
          allowSuggestionsAboveCursor={true}
        >
          <Mention
            trigger="@"
            data={contextBlocks.map(block => ({ id: block.id, display: block.title }))}
            style={mentionStyle}
            appendSpaceOnAdd={true}
            displayTransform={(id, display) => `'${display}'`}
          />
        </MentionsInput>
        <button type="submit" className={styles.sendButton}>
          <FaPaperPlane />
        </button>
      </form>
    </div>
  );
}

export default ChatArea;