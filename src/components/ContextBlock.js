import React, { useState, useCallback, useEffect } from 'react';
import styles from '../App.module.css';
import { getPlugin } from '../plugins/registry';
import { FaTrash, FaEdit, FaSave, FaTimes, FaExpand, FaCompress } from 'react-icons/fa';

const ContextBlock = ({ 
  block, 
  onUpdate, 
  onDelete, 
  onGenerateContent, 
  onFixContent, 
  onMentionInChat 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(block.title);
  const [localContent, setLocalContent] = useState(block.content);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    setLocalContent(block.content);
  }, [block.content]);

  const handleUpdate = useCallback((newContent) => {
    console.log('ContextBlock received update:', newContent);
    setLocalContent(newContent);
    onUpdate({ ...block, content: newContent });
  }, [block, onUpdate]);

  const handleEditTitle = (e) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleSaveTitle = (e) => {
    e.stopPropagation();
    onUpdate({ ...block, title: editedTitle });
    setIsEditing(false);
  };

  const handleCancelEdit = (e) => {
    e.stopPropagation();
    setEditedTitle(block.title);
    setIsEditing(false);
  };

  const toggleExpand = (e) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const plugin = getPlugin(block.plugin_type);
  const PluginComponent = plugin ? plugin.component : () => <div>Unsupported plugin type: {block.plugin_type}</div>;

  return (
    <div 
      className={`${styles.contextBlock} ${isExpanded ? styles.expanded : ''}`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className={styles.contextBlockHeader}>
        {isEditing ? (
          <>
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className={styles.editTitleInput}
              onClick={(e) => e.stopPropagation()}
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
          <button onClick={(e) => { e.stopPropagation(); onMentionInChat(block.id, block.title); }} className={styles.actionButton} title="Mention in Chat">
            @
          </button>
          <button onClick={(e) => { e.stopPropagation(); onGenerateContent(); }} className={styles.actionButton} title="Generate Content">
            Gen
          </button>
          <button onClick={(e) => { e.stopPropagation(); onFixContent(); }} className={styles.actionButton} title="Fix Content">
            Fix
          </button>
          <button onClick={toggleExpand} className={styles.actionButton} title={isExpanded ? "Collapse" : "Expand"}>
            {isExpanded ? <FaCompress /> : <FaExpand />}
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className={styles.removeButton} title="Delete">
            <FaTrash />
          </button>
        </div>
      </div>
      {isExpanded && (
        <div className={styles.contextBlockContent} onClick={(e) => e.stopPropagation()}>
          <PluginComponent 
            content={localContent} 
            onUpdate={handleUpdate} 
            blockId={block.id}
          />
        </div>
      )}
    </div>
  );
};

export default React.memo(ContextBlock);