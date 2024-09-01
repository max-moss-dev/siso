import React, { useRef, useEffect, useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { diffWords } from 'diff';
import { FaWrench, FaCheck, FaTimes, FaExchangeAlt, FaTrash, FaChevronDown, FaEdit, FaArrowUp, FaArrowDown, FaMagic } from 'react-icons/fa';
import styles from '../App.module.css';

function ContextBlock({ block, onUpdate, onDelete, onGenerateContent, onFixContent, onMoveUp, onMoveDown, isFirst, isLast }) {
  const textareaRef = useRef(null);
  const [localContent, setLocalContent] = useState(block.content);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [pendingContent, setPendingContent] = useState(block.pendingContent);

  const handleUpdate = useCallback((field, value) => {
    onUpdate(block.id, { ...block, [field]: value });
  }, [block, onUpdate]);

  useEffect(() => {
    setLocalContent(block.content);
  }, [block.content]);

  useEffect(() => {
    setPendingContent(block.pendingContent);
    if (block.pendingContent) {
      setIsCollapsed(false); // Open the block when there are pending changes
    }
  }, [block.pendingContent]);

  const handleTextareaChange = (e) => {
    const value = e.target.value;
    setLocalContent(value);
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (localContent !== block.content && !showComparison) {
        handleUpdate('content', localContent);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [localContent, block.content, handleUpdate, showComparison]);

  const handleNewContent = async (getContent, setLoadingState, showComparison = false) => {
    setLoadingState(true);
    try {
      const newContent = await getContent();
      if (newContent && typeof newContent === 'string') {
        if (showComparison) {
          setPendingContent(newContent);
          setShowComparison(true);
          setIsCollapsed(false); // Open the block when there are suggested changes
        } else {
          handleUpdate('content', newContent);
          setLocalContent(newContent);
        }
      } else {
        console.error("Invalid content received:", newContent);
      }
    } catch (error) {
      console.error("Error handling content:", error);
    } finally {
      setLoadingState(false);
    }
  };

  const handleFix = () => handleNewContent(() => onFixContent(block.id, localContent), setIsFixing, true);

  const handleGenerate = () => handleNewContent(() => onGenerateContent(block.id, ''), setIsGenerating);

  const handleImprove = () => handleNewContent(() => onGenerateContent(block.id, localContent), setIsGenerating, true);

  const handleAccept = () => {
    if (pendingContent) {
      handleUpdate('content', pendingContent);
      setLocalContent(pendingContent);
    }
    setPendingContent(null);
    setShowComparison(false);
  };

  const handleReject = () => {
    setPendingContent(null);
    setShowComparison(false);
  };

  const renderDiff = (oldContent, newContent) => {
    oldContent = oldContent || '';
    
    if (typeof newContent !== 'string') {
      return <span>Unable to display diff. Invalid new content.</span>;
    }

    const diff = diffWords(oldContent, newContent);
    return diff.map((part, index) => {
      if (part.added) {
        return <span key={index} className={styles.added}>{part.value}</span>;
      }
      if (part.removed) {
        return <span key={index} className={styles.removed}>{part.value}</span>;
      }
      return <span key={index}>{part.value}</span>;
    });
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleTitleEdit = (e) => {
    e.stopPropagation();
    setIsEditingTitle(true);
  };

  const handleTitleChange = (e) => {
    handleUpdate('title', e.target.value);
  };

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
  };

  return (
    <div className={`${styles.contextBlock} ${pendingContent ? styles.pendingChanges : ''}`}>
      <div className={styles.contextBlockHeader} onClick={toggleCollapse}>
        <button onClick={handleTitleEdit} className={styles.editTitleButton}>
          <FaEdit />
        </button>
        {isEditingTitle ? (
          <input
            value={block.title}
            onChange={handleTitleChange}
            onBlur={handleTitleBlur}
            onClick={(e) => e.stopPropagation()}
            autoFocus
            className={styles.editTitleInput}
          />
        ) : (
          <span>{block.title}</span>
        )}
        <div className={styles.blockActions}>
          <button 
            onClick={(e) => { e.stopPropagation(); onMoveUp(block.id); }} 
            className={`${styles.moveButton} ${isFirst ? styles.disabled : ''}`}
            disabled={isFirst}
          >
            <FaArrowUp />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onMoveDown(block.id); }} 
            className={`${styles.moveButton} ${isLast ? styles.disabled : ''}`}
            disabled={isLast}
          >
            <FaArrowDown />
          </button>
          <FaChevronDown className={`${styles.collapseIcon} ${isCollapsed ? styles.collapsed : ''}`} />
        </div>
      </div>
      <div className={`${styles.contextBlockContent} ${isCollapsed ? styles.collapsed : ''}`}>
        {pendingContent ? (
          <div className={styles.comparisonView}>
            <h4>Suggested Changes for "{block.title}"</h4>
            <pre className={styles.diffContent}>{renderDiff(localContent, pendingContent)}</pre>
            <div className={styles.blockButtons}>
              <button onClick={handleAccept} className={`${styles.button} ${styles.primaryButton}`}>
                <FaCheck /> Accept
              </button>
              <button onClick={handleReject} className={`${styles.button} ${styles.secondaryButton}`}>
                <FaTimes /> Reject
              </button>
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
        {!pendingContent && (
          <div className={styles.blockButtons}>
            <button onClick={() => onDelete(block.id)} className={`${styles.button} ${styles.dangerButton}`}>
              <FaTrash /> Delete
            </button>
            {localContent ? (
              <>
                <button 
                  onClick={handleFix} 
                  className={`${styles.button} ${styles.secondaryButton}`}
                  disabled={isFixing}
                >
                  <FaWrench /> {isFixing ? 'Fixing...' : 'Fix'}
                </button>
                <button 
                  onClick={handleImprove} 
                  className={`${styles.button} ${styles.secondaryButton}`}
                  disabled={isGenerating}
                >
                  <FaMagic /> {isGenerating ? 'Improving...' : 'Improve'}
                </button>
              </>
            ) : (
              <button 
                onClick={handleGenerate} 
                className={`${styles.button} ${styles.primaryButton}`}
                disabled={isGenerating}
              >
                <FaMagic /> {isGenerating ? 'Generating...' : 'Generate'}
              </button>
            )}
            {block.type === 'text' && (
              <button 
                onClick={() => setIsEditing(!isEditing)} 
                className={`${styles.button} ${styles.secondaryButton}`}
              >
                <FaExchangeAlt /> {isEditing ? 'View' : 'Edit'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ContextBlock;