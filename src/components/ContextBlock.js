import React, { Suspense } from 'react';
import styles from '../App.module.css';
import { getPlugin } from '../plugins/registry';
import { FaTrash, FaArrowUp, FaArrowDown } from 'react-icons/fa';

const ContextBlock = ({ 
  block, 
  onUpdate, 
  onDelete, 
  onGenerateContent, 
  onFixContent, 
  onMoveUp, 
  onMoveDown, 
  isFirst, 
  isLast,
  onMentionInChat 
}) => {
  const handleUpdate = (newContent) => {
    onUpdate(block.id, { ...block, content: newContent });
  };

  const handleDelete = () => {
    onDelete(block.id);
  };

  const handleGenerateContent = async () => {
    const generatedContent = await onGenerateContent(block.id, block.content);
    onUpdate(block.id, { ...block, content: generatedContent });
  };

  const handleFixContent = async () => {
    const fixedContent = await onFixContent(block.id, block.content);
    onUpdate(block.id, { ...block, content: fixedContent });
  };

  const handleMentionInChat = () => {
    onMentionInChat(block.id, block.title);
  };

  const plugin = getPlugin(block.plugin_type);
  const PluginComponent = plugin ? plugin.component : () => <div>Unsupported plugin type: {block.plugin_type}</div>;

  return (
    <div className={styles.contextBlock}>
      <div className={styles.contextBlockHeader}>
        <h3>{block.title}</h3>
        <div className={styles.contextBlockActions}>
          <button onClick={handleMentionInChat} className={styles.actionButton} title="Mention in Chat">
            @
          </button>
          <button onClick={handleGenerateContent} className={styles.actionButton} title="Generate Content">
            Gen
          </button>
          <button onClick={handleFixContent} className={styles.actionButton} title="Fix Content">
            Fix
          </button>
          {!isFirst && (
            <button onClick={onMoveUp} className={styles.actionButton} title="Move Up">
              <FaArrowUp />
            </button>
          )}
          {!isLast && (
            <button onClick={onMoveDown} className={styles.actionButton} title="Move Down">
              <FaArrowDown />
            </button>
          )}
          <button onClick={handleDelete} className={styles.removeButton} title="Delete">
            <FaTrash />
          </button>
        </div>
      </div>
      <Suspense fallback={<div>Loading plugin...</div>}>
        <PluginComponent content={block.content} onUpdate={handleUpdate} />
      </Suspense>
    </div>
  );
};

export default ContextBlock;