import React, { useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { FaUser, FaRobot, FaPaperPlane } from 'react-icons/fa';
import { MentionsInput, Mention } from 'react-mentions';
import styles from '../App.module.css';
import { mentionsInputStyle, mentionStyle } from '../MentionsInputStyle';

function ChatArea({ chatHistory, message, setMessage, onSendMessage, contextBlocks, onMentionInChat }) {
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

  const renderContextUpdateSummary = (contextUpdates) => {
    if (!contextUpdates || contextUpdates.length === 0) return null;
  
    return (
      <div className={styles.contextUpdateSummary}>
        <h4>Context Updates:</h4>
        <ul>
          {contextUpdates.map((update, index) => (
            <li key={index}>
              {update.block_title}: Updated
            </li>
          ))}
        </ul>
      </div>
    );
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
            {msg.role === 'assistant' && msg.context_updates && renderContextUpdateSummary(msg.context_updates)}
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