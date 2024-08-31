import React from 'react';
import styles from '../App.module.css';
import ContextBlock from './ContextBlock';

function ContextBlocksArea({ contextBlocks, isLoading, onUpdateBlock, onDeleteBlock, onGenerateContent, onFixContent, onReorderBlocks }) {
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
      {contextBlocks.length > 0 ? (
        contextBlocks.map((block, index) => (
          <ContextBlock
            key={block.id}
            block={block}
            onUpdate={onUpdateBlock}
            onDelete={onDeleteBlock}
            onGenerateContent={onGenerateContent}
            onFixContent={onFixContent}
            onMoveUp={moveBlockUp}
            onMoveDown={moveBlockDown}
            isFirst={index === 0}
            isLast={index === contextBlocks.length - 1}
          />
        ))
      ) : (
        <div className={styles.noBlocksMessage}>No context blocks available. Add a new block to get started.</div>
      )}
    </div>
  );
}

export default ContextBlocksArea;