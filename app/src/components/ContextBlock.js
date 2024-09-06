import React, { useRef, useEffect, useState, useCallback, forwardRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { diffLines } from 'diff';
import { FaWrench, FaCheck, FaTimes, FaExchangeAlt, FaTrash, FaChevronDown, FaEdit, FaArrowUp, FaArrowDown, FaMagic, FaCommentDots } from 'react-icons/fa';
import styles from '../App.module.css';

const ContextBlock = forwardRef(({ block, onUpdate, onDelete, onGenerateContent, onFixContent, onMoveUp, onMoveDown, isFirst, isLast, onMentionInChat }, ref) => {
  const textareaRef = useRef(null);
  const [content, setContent] = useState(block.content);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(block.isCollapsed !== false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [suggestedContent, setSuggestedContent] = useState(null);

  const handleUpdate = useCallback((field, value) => {
    onUpdate(block.id, { ...block, [field]: value });
  }, [block, onUpdate]);

  useEffect(() => {
    setContent(block.content);
  }, [block.content]);

  useEffect(() => {
    if (block.pendingContent) {
      setSuggestedContent(block.pendingContent);
      setShowComparison(true);
    } else {
      setShowComparison(false);
    }
  }, [block.pendingContent]);

  useEffect(() => {
    setIsCollapsed(block.isCollapsed !== false);
  }, [block.isCollapsed]);

  const handleContentChange = (e) => {
    const value = e.target.value;
    setContent(value);
    handleUpdate('content', value);
  };

  const handleNewContent = async (getContent, setLoadingState, showComparison = false) => {
    setLoadingState(true);
    try {
      const newContent = await getContent();
      if (newContent && typeof newContent === 'string') {
        if (showComparison) {
          setSuggestedContent(newContent);
          setShowComparison(true);
          setIsCollapsed(false);
        } else {
          setContent(newContent);
          handleUpdate('content', newContent);
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

  const handleFix = () => handleNewContent(() => onFixContent(block.id, content), setIsFixing, true);

  const handleGenerate = () => handleNewContent(() => onGenerateContent(block.id, ''), setIsGenerating);

  const handleImprove = () => handleNewContent(() => onGenerateContent(block.id, content), setIsGenerating, true);

  const handleAccept = async () => {
    if (suggestedContent) {
      try {
        // Update the backend
        await onUpdate(block.id, { 
          ...block, 
          content: suggestedContent, 
          pendingContent: null 
        });
        
        // Update local state
        setContent(suggestedContent);
        setSuggestedContent(null);
        setShowComparison(false);
      } catch (error) {
        console.error("Error accepting changes:", error);
        // Optionally, show an error message to the user
      }
    }
  };

  const handleReject = () => {
    handleUpdate('pendingContent', null);
    setSuggestedContent(null);
    setShowComparison(false);
  };

  const renderDiff = (oldContent, newContent) => {
    oldContent = oldContent || '';
    
    if (typeof newContent !== 'string') {
      return <span>Unable to display diff. Invalid new content.</span>;
    }

    const diffs = diffLines(oldContent, newContent);
    return diffs.map((part, index) => {
      const color = part.added ? 'green' : part.removed ? 'red' : 'grey';
      const backgroundColor = part.added ? '#e6ffec' : part.removed ? '#ffebe9' : 'transparent';
      return (
        <span key={index} style={{ color, backgroundColor }}>
          {part.value}
        </span>
      );
    });
  };

  const toggleCollapse = () => {
    const newIsCollapsed = !isCollapsed;
    setIsCollapsed(newIsCollapsed);
    onUpdate(block.id, { isCollapsed: newIsCollapsed });
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

  const handleMentionInChat = () => {
    onMentionInChat(block.id, block.title);
  };

  return (
    <div ref={ref} className={`${styles.contextBlock} ${block.pendingContent ? styles.pendingChanges : ''}`}>
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
        {showComparison ? (
          <div className={styles.comparisonView}>
            <h4>Suggested Changes for "{block.title}"</h4>
            <pre className={styles.diffContent}>{renderDiff(content, suggestedContent)}</pre>
            <div className={styles.blockButtons}>
              <button onClick={handleAccept} className={`${styles.button} ${styles.primaryButton}`}>
                <FaCheck /> Accept
              </button>
              <button onClick={handleReject} className={`${styles.button} ${styles.secondaryButton}`}>
                <FaTimes /> Reject
              </button>
            </div>
          </div>
        ) : (
          block.type === 'text' ? (
            isEditing ? (
              <textarea
                ref={textareaRef}
                value={content}
                onChange={handleContentChange}
                placeholder="Block content"
                className={styles.contentTextarea}
              />
            ) : (
              <div 
                className={styles.markdownContent} 
                onClick={() => setIsEditing(true)}
              >
                <ReactMarkdown>{content}</ReactMarkdown>
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
          )
        )}
        {!suggestedContent && (
          <div className={styles.blockButtons}>
            <button onClick={handleMentionInChat} className={`${styles.button} ${styles.secondaryButton}`}>
              <FaCommentDots /> Mention in Chat
            </button>
            <button onClick={() => onDelete(block.id)} className={`${styles.button} ${styles.dangerButton}`}>
              <FaTrash /> Delete
            </button>
            {content ? (
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
});

export default ContextBlock;