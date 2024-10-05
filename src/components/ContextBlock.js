import React, { useState } from 'react';
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

  const handleEditTitle = () => {
    setIsEditing(true);
  };

  const handleSaveTitle = () => {
    onUpdate(block.id, { ...block, title: editedTitle });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedTitle(block.title);
    setIsEditing(false);
  };

  const plugin = getPlugin(block.plugin_type);
  const PluginComponent = plugin.component;

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
      <PluginComponent content={block.content} onUpdate={handleUpdate} />
    </div>
  );
};

export default ContextBlock;