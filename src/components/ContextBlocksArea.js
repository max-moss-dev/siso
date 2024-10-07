import React from 'react';
import ContextBlock from './ContextBlock';
import styles from '../App.module.css';
import { FaPlus } from 'react-icons/fa';

function ContextBlocksArea({ contextBlocks, isLoading, onUpdateBlock, onDeleteBlock, onGenerateContent, onFixContent, onReorderBlocks, onAddBlock, onMentionInChat }) {
  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className={styles.contextBlocksContainer}>
      {contextBlocks.map((block, index) => (
        <ContextBlock
          key={block.id}
          block={block}
          onUpdate={onUpdateBlock}
          onDelete={() => onDeleteBlock(block.id)}
          onGenerateContent={() => onGenerateContent(block.id)}
          onFixContent={() => onFixContent(block.id)}
          onMentionInChat={onMentionInChat}
        />
      ))}
      <button 
        onClick={onAddBlock} 
        className={`${styles.button} ${styles.secondaryButton} ${styles.addBlockButton}`}
      >
        <FaPlus /> Add Context
      </button>
    </div>
  );
}

export default React.memo(ContextBlocksArea);