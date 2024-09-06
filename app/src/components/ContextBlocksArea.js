import React from 'react';
import ContextBlock from './ContextBlock';
import styles from '../App.module.css';
import { FaPlus } from 'react-icons/fa';

function ContextBlocksArea({ contextBlocks, isLoading, onUpdateBlock, onDeleteBlock, onGenerateContent, onFixContent, onReorderBlocks, onAddBlock, onMentionInChat, contextBlockRefs }) {
  if (isLoading) {
    return <div>Loading...</div>;
  }

  const moveBlockUp = (blockId) => {
    const index = contextBlocks.findIndex(block => block.id === blockId);
    if (index > 0) {
      const newBlocks = [...contextBlocks];
      [newBlocks[index - 1], newBlocks[index]] = [newBlocks[index], newBlocks[index - 1]];
      onReorderBlocks(newBlocks);
    }
  };

  const moveBlockDown = (blockId) => {
    const index = contextBlocks.findIndex(block => block.id === blockId);
    if (index < contextBlocks.length - 1) {
      const newBlocks = [...contextBlocks];
      [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
      onReorderBlocks(newBlocks);
    }
  };

  return (
    <div className={styles.contextBlocksContainer}>
      {contextBlocks.map((block, index) => (
        <ContextBlock
          key={block.id}
          ref={(el) => contextBlockRefs.current[block.id] = el}
          block={block}
          onUpdate={onUpdateBlock}
          onDelete={onDeleteBlock}
          onGenerateContent={onGenerateContent}
          onFixContent={onFixContent}
          onMoveUp={() => moveBlockUp(block.id)}
          onMoveDown={() => moveBlockDown(block.id)}
          isFirst={index === 0}
          isLast={index === contextBlocks.length - 1}
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

export default ContextBlocksArea;