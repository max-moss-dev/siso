import React, { useRef, useEffect, useState, useCallback } from 'react';
import styles from '../App.module.css';

function ContextBlock({ block, onUpdate, onDelete, onGenerateContent }) {
  const textareaRef = useRef(null);
  const [localContent, setLocalContent] = useState(block.content);

  const handleUpdate = useCallback((field, value) => {
    onUpdate(block.id, { ...block, [field]: value });
  }, [block, onUpdate]);  // Include 'block' in the dependency array

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

  return (
    <div className={styles.contextBlock}>
      <input
        value={block.title}
        onChange={(e) => handleUpdate('title', e.target.value)}
        placeholder="Block title"
      />
      {block.type === 'text' ? (
        <textarea
          ref={textareaRef}
          value={localContent}
          onChange={handleTextareaChange}
          placeholder="Block content"
        />
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
        <button onClick={() => onGenerateContent(block.id)} className={`${styles.button} ${styles.secondaryButton}`}>
          {block.content ? 'Regenerate' : 'Generate'}
        </button>
      </div>
    </div>
  );
}

export default ContextBlock;