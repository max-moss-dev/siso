import React, { useRef, useEffect, useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { FaWrench, FaCheck, FaTimes, FaExchangeAlt, FaTrash } from 'react-icons/fa';
import styles from '../App.module.css';

function ContextBlock({ block, onUpdate, onDelete, onGenerateContent, onFixContent }) {
  const textareaRef = useRef(null);
  const [localContent, setLocalContent] = useState(block.content);
  const [fixedContent, setFixedContent] = useState(null);
  const [isFixing, setIsFixing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

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
      if (localContent !== block.content && !showComparison) {
        handleUpdate('content', localContent);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [localContent, block.content, handleUpdate, showComparison]);

  const handleFix = async () => {
    setIsFixing(true);
    try {
      const newFixedContent = await onFixContent(block.id, localContent);
      setFixedContent(newFixedContent);
      setShowComparison(true);
    } catch (error) {
      console.error("Error fixing content:", error);
      // You might want to show an error message to the user here
    } finally {
      setIsFixing(false);
    }
  };

  const handleAccept = () => {
    handleUpdate('content', fixedContent);
    setLocalContent(fixedContent);
    setFixedContent(null);
    setShowComparison(false);
  };

  const handleReject = () => {
    setFixedContent(null);
    setShowComparison(false);
    // Ensure local content is set back to the original content
    setLocalContent(block.content);
  };

  return (
    <div className={styles.contextBlock}>
      <input
        value={block.title}
        onChange={(e) => handleUpdate('title', e.target.value)}
        placeholder="Block title"
      />
      {block.type === 'text' && showComparison ? (
        <div className={styles.comparisonView}>
          <div className={styles.comparisonColumn}>
            <h4>Original</h4>
            <ReactMarkdown>{localContent}</ReactMarkdown>
          </div>
          <div className={styles.comparisonColumn}>
            <h4>Fixed</h4>
            <ReactMarkdown>{fixedContent}</ReactMarkdown>
          </div>
        </div>
      ) : block.type === 'text' ? (
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
        {showComparison ? (
          <>
            <button onClick={handleAccept} className={`${styles.button} ${styles.primaryButton}`}>
              <FaCheck /> Accept
            </button>
            <button onClick={handleReject} className={`${styles.button} ${styles.secondaryButton}`}>
              <FaTimes /> Reject
            </button>
          </>
        ) : (
          <>
            <button onClick={() => onDelete(block.id)} className={`${styles.button} ${styles.dangerButton}`}>
              <FaTrash /> Delete
            </button>
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
                <FaExchangeAlt /> {isEditing ? 'View' : 'Edit'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default ContextBlock;