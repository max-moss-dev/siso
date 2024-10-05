import React, { useCallback } from 'react';
import ContextBlock from './ContextBlock';
import styles from '../App.module.css';
import { FaPlus } from 'react-icons/fa';

function ContextBlocksArea({ contextBlocks, isLoading, onUpdateBlock, onDeleteBlock, onGenerateContent, onFixContent, onReorderBlocks, onAddBlock, onMentionInChat }) {
  // Move useCallback hooks above any conditional returns
  const moveBlockUp = useCallback((blockId) => {
    const index = contextBlocks.findIndex(block => block.id === blockId);
    if (index > 0) {
      const newBlocks = [...contextBlocks];
      [newBlocks[index - 1], newBlocks[index]] = [newBlocks[index], newBlocks[index - 1]];
      onReorderBlocks(newBlocks);
    }
  }, [contextBlocks, onReorderBlocks]);

  const moveBlockDown = useCallback((blockId) => {
    const index = contextBlocks.findIndex(block => block.id === blockId);
    if (index < contextBlocks.length - 1) {
      const newBlocks = [...contextBlocks];
      [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
      onReorderBlocks(newBlocks);
    }
  }, [contextBlocks, onReorderBlocks]);

  // Remove handleUpdateBlock since setContextBlocks is undefined
  // If update logic is needed, ensure it's handled via onUpdateBlock prop

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className={styles.contextBlocksContainer}>
      {contextBlocks.map((block, index) => (
        <ContextBlock
          key={block.id} // Ensure key is unique
          block={block}
          onUpdate={onUpdateBlock}
          onDelete={() => onDeleteBlock(block.id)}  // Make sure this line is correct
          onGenerateContent={() => onGenerateContent(block.id)}
          onFixContent={() => onFixContent(block.id)}
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

export default React.memo(ContextBlocksArea);