import React from 'react';
import styles from '../App.module.css';
import { FaPlus } from 'react-icons/fa';
import { blockTypes } from '../blockTypes';

function ContextBlocksArea({ 
  contextBlocks, 
  isLoading, 
  onUpdateBlock, 
  onDeleteBlock, 
  onGenerateContent, 
  onFixContent, 
  onReorderBlocks, 
  onAddBlock, 
  onMentionInChat, 
  contextBlockRefs 
}) {
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
      {contextBlocks.map((block, index) => {
        const BlockComponent = blockTypes[block.type]?.component;
        return BlockComponent ? (
          <BlockComponent
            key={block.id}
            block={block}
            onUpdate={(updatedBlock) => onUpdateBlock(block.id, updatedBlock)}
            onDelete={() => onDeleteBlock(block.id)}
            onGenerateContent={() => onGenerateContent(block.id)}
            onFixContent={(content) => onFixContent(block.id, content)}
            onMoveUp={() => moveBlockUp(block.id)}
            onMoveDown={() => moveBlockDown(block.id)}
            isFirst={index === 0}
            isLast={index === contextBlocks.length - 1}
            onMentionInChat={() => onMentionInChat(block.id, block.title)}
            ref={el => contextBlockRefs.current[block.id] = el}
          />
        ) : null;
      })}
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