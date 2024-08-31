import React, { useRef, useEffect, useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import styles from '../App.module.css';
import { FaWrench } from 'react-icons/fa';

function ContextBlock({ block, onUpdate, onDelete, onGenerateContent, onFixContent }) {
  const textareaRef = useRef(null);
  const [localContent, setLocalContent] = useState(block.content);
  const [isFixing, setIsFixing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleUpdate = useCallback((field, value) => {
    onUpdate(block.id, { ...block, [field]: value });
  }, [block, onUpdate]);

  useEffect(() => {
    setLocalContent(block.content);
  }, [block.content]);

  const handleTextareaChange = (e) => {
    const textarea = e.target;
    const value = textarea.value;
    const selectionStart = textarea.selectionStart;
    const selectionEnd = textarea.selectionEnd;

    setLocalContent(value);

    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = selectionStart;
        textareaRef.current.selectionEnd = selectionEnd;
      }
    });
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (localContent !== block.content) {
        handleUpdate('content', localContent);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [localContent, block.content, handleUpdate]);

  const handleFix = async () => {
    setIsFixing(true);
    try {
      const fixedContent = await onFixContent(block.id, localContent);
      setLocalContent(fixedContent);
      handleUpdate('content', fixedContent);
    } catch (error) {
      console.error("Error fixing content:", error);
      // You might want to show an error message to the user here
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <div className={styles.contextBlock}>
      <input
        value={block.title}
        onChange={(e) => handleUpdate('title', e.target.value)}
        placeholder="Block title"
      />
      {block.type === 'text' ? (
        isEditing ? (
          <textarea
            ref={textareaRef}
            value={localContent}
            onChange={handleTextareaChange}
            placeholder="Block content"
            className={styles.contentTextarea}
          />
        ) : (
          <div 
            className={styles.markdownContent} 
            onClick={() => setIsEditing(true)}
          >
            <ReactMarkdown>{localContent}</ReactMarkdown>
          </div>
        )
      ) : (
        <ul>
          {Array.isArray(block.content) ? block.content.map((item, index) => (
            <li key={index}>
              <input
                value={item}
                onChange={(e) => {
                  const newContent = [...block.content];
                  newContent[index] = e.target.value;
                  handleUpdate('content', newContent);
                }}
              />
            </li>
          )) : null}
          <button onClick={() => handleUpdate('content', [...(Array.isArray(block.content) ? block.content : []), ''])}>
            Add item
          </button>
        </ul>
      )}
      <div className={styles.blockButtons}>
        <button onClick={() => onDelete(block.id)} className={`${styles.button} ${styles.dangerButton}`}>Delete</button>
        <button 
          onClick={handleFix} 
          className={`${styles.button} ${styles.secondaryButton}`}
          disabled={isFixing}
        >
          <FaWrench /> {isFixing ? 'Fixing...' : 'Fix'}
        </button>
        <button 
          onClick={() => onGenerateContent(block.id)} 
          className={`${styles.button} ${styles.secondaryButton}`}
        >
          {block.content ? 'Regenerate' : 'Generate'}
        </button>
        {block.type === 'text' && (
          <button 
            onClick={() => setIsEditing(!isEditing)} 
            className={`${styles.button} ${styles.secondaryButton}`}
          >
            {isEditing ? 'View' : 'Edit'}
          </button>
        )}
      </div>
    </div>
  );
}

export default ContextBlock;