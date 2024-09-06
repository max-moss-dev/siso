import React from 'react';
import { FaInfoCircle } from 'react-icons/fa';
import styles from '../App.module.css';

const ChatContextMention = ({ contextUpdates, toggleContextSidebar, setIsContextSidebarOpen, scrollToContextBlock }) => {
  if (!contextUpdates || contextUpdates.length === 0) return null;

  return (
    <div className={styles.contextUpdateSummary}>
      {contextUpdates.map((update, index) => (
        <button
          key={index}
          className={styles.contextUpdateButton}
          onClick={() => {
            toggleContextSidebar();
            setIsContextSidebarOpen(true);
            scrollToContextBlock(update.block_id);
          }}
        >
          <FaInfoCircle className={styles.contextUpdateIcon} />
          <span>Context update: {update.block_title || 'Untitled Block'}</span>
        </button>
      ))}
    </div>
  );
};

export default ChatContextMention;