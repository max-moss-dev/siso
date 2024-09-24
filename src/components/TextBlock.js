import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { FaWrench, FaCheck, FaTimes, FaExchangeAlt, FaTrash, FaChevronDown, FaEdit, FaArrowUp, FaArrowDown, FaMagic, FaCommentDots } from 'react-icons/fa';
import styles from '../App.module.css';

const TextBlock = ({ block, onUpdate, onDelete, onGenerateContent, onFixContent, onMoveUp, onMoveDown, isFirst, isLast, onMentionInChat }) => {
  const [content, setContent] = useState(block.content);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(block.isCollapsed !== false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [suggestedContent, setSuggestedContent] = useState(null);

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

  const handleContentChange = (e) => {
    const value = e.target.value;
    setContent(value);
    onUpdate({ ...block, content: value });
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
          onUpdate({ ...block, content: newContent });
        }
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

  const handleAccept = () => {
    if (suggestedContent) {
      onUpdate({ ...block, content: suggestedContent, pendingContent: null });
      setContent(suggestedContent);
      setSuggestedContent(null);
      setShowComparison(false);
    }
  };

  const handleReject = () => {
    onUpdate({ ...block, pendingContent: null });
    setSuggestedContent(null);
    setShowComparison(false);
  };

  const toggleCollapse = () => {
    const newIsCollapsed = !isCollapsed;
    setIsCollapsed(newIsCollapsed);
    onUpdate({ ...block, isCollapsed: newIsCollapsed });
  };

  const handleTitleEdit = (e) => {
    e.stopPropagation();
    setIsEditingTitle(true);
  };

  const handleTitleChange = (e) => {
    onUpdate({ ...block, title: e.target.value });
  };

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
  };

  return (
    <div className={`${styles.contextBlock} ${block.pendingContent ? styles.pendingChanges : ''}`}>
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
          <button onClick={(e) => { e.stopPropagation(); onMoveUp(); }} className={`${styles.moveButton} ${isFirst ? styles.disabled : ''}`} disabled={isFirst}>
            <FaArrowUp />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onMoveDown(); }} className={`${styles.moveButton} ${isLast ? styles.disabled : ''}`} disabled={isLast}>
            <FaArrowDown />
          </button>
          <FaChevronDown className={`${styles.collapseIcon} ${isCollapsed ? styles.collapsed : ''}`} />
        </div>
      </div>
      <div className={`${styles.contextBlockContent} ${isCollapsed ? styles.collapsed : ''}`}>
        {showComparison ? (
          <div className={styles.comparisonView}>
            <h4>Suggested Changes for "{block.title}"</h4>
            <pre className={styles.diffContent}>{suggestedContent}</pre>
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
          isEditing ? (
            <textarea
              value={content}
              onChange={handleContentChange}
              placeholder="Block content"
              className={styles.contentTextarea}
            />
          ) : (
            <div className={styles.markdownContent} onClick={() => setIsEditing(true)}>
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          )
        )}
        {!suggestedContent && (
          <div className={styles.blockButtons}>
            <button onClick={() => onMentionInChat(block.id, block.title)} className={`${styles.button} ${styles.secondaryButton}`}>
              <FaCommentDots /> Mention in Chat
            </button>
            <button onClick={() => onDelete(block.id)} className={`${styles.button} ${styles.dangerButton}`}>
              <FaTrash /> Delete
            </button>
            {content ? (
              <>
                <button onClick={handleFix} className={`${styles.button} ${styles.secondaryButton}`} disabled={isFixing}>
                  <FaWrench /> {isFixing ? 'Fixing...' : 'Fix'}
                </button>
                <button onClick={handleImprove} className={`${styles.button} ${styles.secondaryButton}`} disabled={isGenerating}>
                  <FaMagic /> {isGenerating ? 'Improving...' : 'Improve'}
                </button>
              </>
            ) : (
              <button onClick={handleGenerate} className={`${styles.button} ${styles.primaryButton}`} disabled={isGenerating}>
                <FaMagic /> {isGenerating ? 'Generating...' : 'Generate'}
              </button>
            )}
            <button onClick={() => setIsEditing(!isEditing)} className={`${styles.button} ${styles.secondaryButton}`}>
              <FaExchangeAlt /> {isEditing ? 'View' : 'Edit'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TextBlock;