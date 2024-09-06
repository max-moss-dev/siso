import React from 'react';
import { MdUpdate } from 'react-icons/md';
import styles from './ChatContextMention.module.css';

const ChatContextMention = ({ contextUpdates, toggleContextSidebar, setIsContextSidebarOpen, expandContextBlock }) => {
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
            expandContextBlock(update.block_id);
          }}
        >
          <MdUpdate className={styles.contextUpdateIcon} />
          <div className={styles.contextUpdateText}>
            <p className={styles.contextUpdateTitle}>Updated: {update.block_title || 'Untitled Block'}</p>
            <p className={styles.contextUpdateDescription}>Click to view changes</p>
          </div>
        </button>
      ))}
    </div>
  );
};

export default ChatContextMention;