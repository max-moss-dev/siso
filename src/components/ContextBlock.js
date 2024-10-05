import React, { useState, useEffect, useCallback } from 'react';
import styles from '../App.module.css';
import { getPlugin } from '../plugins/registry';
import { FaTrash, FaArrowUp, FaArrowDown, FaEdit, FaSave, FaTimes } from 'react-icons/fa';

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
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(block.title);
  const [localContent, setLocalContent] = useState(block.content);

  useEffect(() => {
    setLocalContent(block.content);
  }, [block.content]);

  const handleUpdate = useCallback((newContent) => {
    console.log('ContextBlock received update:', newContent);
    setLocalContent(newContent);
    onUpdate({ ...block, content: newContent });
  }, [block, onUpdate]);

  const handleEditTitle = () => {
    setIsEditing(true);
  };

  const handleSaveTitle = () => {
    onUpdate({ ...block, title: editedTitle });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedTitle(block.title);
    setIsEditing(false);
  };

  const plugin = getPlugin(block.plugin_type);
  const PluginComponent = plugin ? plugin.component : () => <div>Unsupported plugin type: {block.plugin_type}</div>;

  return (
    <div className={styles.contextBlock}>
      <div className={styles.contextBlockHeader}>
        {isEditing ? (
          <>
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className={styles.editTitleInput}
            />
            <button onClick={handleSaveTitle} className={styles.editTitleButton} title="Save Title">
              <FaSave />
            </button>
            <button onClick={handleCancelEdit} className={styles.editTitleButton} title="Cancel Edit">
              <FaTimes />
            </button>
          </>
        ) : (
          <>
            <h3>{block.title}</h3>
            <button onClick={handleEditTitle} className={styles.editTitleButton} title="Edit Title">
              <FaEdit />
            </button>
          </>
        )}
        <div className={styles.contextBlockActions}>
          <button onClick={() => onMentionInChat(block.id, block.title)} className={styles.actionButton} title="Mention in Chat">
            @
          </button>
          <button onClick={onGenerateContent} className={styles.actionButton} title="Generate Content">
            Gen
          </button>
          <button onClick={onFixContent} className={styles.actionButton} title="Fix Content">
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
          <button onClick={onDelete} className={styles.removeButton} title="Delete">
            <FaTrash />
          </button>
        </div>
      </div>
      <PluginComponent 
        content={localContent} 
        onUpdate={handleUpdate} 
        blockId={block.id}
      />
    </div>
  );
};

export default React.memo(ContextBlock);