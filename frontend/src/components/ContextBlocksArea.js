import React from 'react';
import styles from '../App.module.css';
import ContextBlock from './ContextBlock';

function ContextBlocksArea({ contextBlocks, isLoading, onUpdateBlock, onDeleteBlock, onGenerateContent, onFixContent }) {
  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className={styles.contextBlocksContainer}>
      {contextBlocks.map(block => (
        <ContextBlock 
          key={block.id} 
          block={block} 
          onUpdate={onUpdateBlock}
          onDelete={onDeleteBlock}
          onGenerateContent={onGenerateContent}
          onFixContent={onFixContent}  // Add this line
        />
      ))}
    </div>
  );
}

export default ContextBlocksArea;