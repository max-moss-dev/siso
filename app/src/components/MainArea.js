import React, { useState, useEffect, useRef } from 'react';
import styles from '../App.module.css';
import ContextBlocksArea from './ContextBlocksArea';
import ChatArea from './ChatArea';
import { FaEdit, FaTrash, FaEraser } from 'react-icons/fa';
import ContextSidebarIcon from './ContextSidebarIcon';

function MainArea({ 
  projectName, 
  projectId, 
  contextBlocks, 
  isLoading, 
  onAddBlock, 
  onUpdateBlock, 
  onDeleteBlock, 
  onGenerateContent, 
  onFixContent, 
  chatHistory, 
  message, 
  setMessage, 
  onSendMessage, 
  onUpdateProject, 
  onDeleteProject, 
  toggleSidebar, 
  isSidebarOpen, 
  toggleContextSidebar, 
  isContextSidebarOpen, 
  setIsContextSidebarOpen,
  onReorderBlocks, 
  onClearChatHistory, 
  isClearingChat, 
  onUndo, 
  onRedo, 
  canUndo, 
  canRedo, 
  onAcceptAllChanges, 
  onRejectAllChanges 
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(projectName);
  const [canEdit, setCanEdit] = useState(true);
  const [contextSidebarWidth, setContextSidebarWidth] = useState(() => {
    const savedWidth = localStorage.getItem('contextSidebarWidth');
    return savedWidth ? parseInt(savedWidth, 10) : 400;
  });
  const [isDragging, setIsDragging] = useState(false);
  const contextBlocksColumnRef = useRef(null);

  useEffect(() => {
    setEditedName(projectName);
  }, [projectName]);

  useEffect(() => {
    localStorage.setItem('contextSidebarWidth', contextSidebarWidth.toString());
  }, [contextSidebarWidth]);

  const pendingUpdatesCount = contextBlocks.filter(block => block.pendingContent).length;

  // Add this useEffect to open the sidebar when there are pending updates
  useEffect(() => {
    if (pendingUpdatesCount > 0 && !isContextSidebarOpen) {
      setIsContextSidebarOpen(true);
    }
  }, [pendingUpdatesCount, isContextSidebarOpen, setIsContextSidebarOpen]);

  const handleEditSave = () => {
    onUpdateProject(projectId, editedName);
    setIsEditing(false);
    setCanEdit(false);
    setTimeout(() => setCanEdit(true), 300);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      onDeleteProject(projectId);
    }
  };

  const handleMentionInChat = (blockId, blockTitle) => {
    setMessage(prevMessage => `${prevMessage} '${blockTitle}' `);
  };

  const handleResize = (mouseDownEvent) => {
    mouseDownEvent.preventDefault();
    const startX = mouseDownEvent.clientX;
    const startWidth = contextSidebarWidth;

    setIsDragging(true);
    if (contextBlocksColumnRef.current) {
      contextBlocksColumnRef.current.classList.add(styles.dragging);
    }

    const doDrag = (mouseMoveEvent) => {
      requestAnimationFrame(() => {
        const newWidth = startWidth - (mouseMoveEvent.clientX - startX);
        setContextSidebarWidth(Math.max(400, Math.min(newWidth, 1000)));
      });
    };

    const stopDrag = () => {
      document.removeEventListener('mousemove', doDrag);
      document.removeEventListener('mouseup', stopDrag);
      setIsDragging(false);
      if (contextBlocksColumnRef.current) {
        contextBlocksColumnRef.current.classList.remove(styles.dragging);
      }
    };

    document.addEventListener('mousemove', doDrag);
    document.addEventListener('mouseup', stopDrag);
  };

  return (
    <div className={styles.mainContent}>
      <div className={styles.projectHeader}>
        <button 
          onClick={toggleSidebar} 
          className={`${styles.button} ${styles.secondaryButton} ${styles.toggleSidebarButton}`}
          title="Toggle Main Sidebar"
        >
          <ContextSidebarIcon className={styles.contextSidebarIcon} />
        </button>
        {isEditing ? (
          <div className={styles.editProjectName}>
            <input
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onBlur={handleEditSave}
              autoFocus
              className={styles.editProjectNameInput}
            />
            <button onClick={handleEditSave} className={`${styles.button} ${styles.primaryButton}`}>Save Project Name</button>
          </div>
        ) : (
          <>
            <h1>{projectName}</h1>
            <div className={styles.projectActions}>
              <button 
                onClick={() => canEdit && setIsEditing(true)} 
                className={`${styles.button} ${styles.secondaryButton}`}
                disabled={!canEdit}
                title="Edit Project Name"
              >
                <FaEdit /> Edit Name
              </button>
              <button 
                onClick={handleDelete} 
                className={`${styles.button} ${styles.dangerButton}`}
                title="Delete Project"
              >
                <FaTrash /> Delete Project
              </button>
            </div>
          </>
        )}
      </div>
      <div className={styles.contentContainer}>
        <div className={styles.chatColumn} style={{ flex: 1 }}>
          <div className={styles.chatHeader}>
            <h2>Chat</h2>
            <div className={styles.chatHeaderButtons}>
              <button
                onClick={onClearChatHistory}
                className={`${styles.button} ${styles.secondaryButton}`}
                disabled={isClearingChat}
                title="Clear Chat History"
              >
                <FaEraser /> {isClearingChat ? 'Clearing...' : 'Clear Chat'}
              </button>
              <button
                onClick={toggleContextSidebar}
                className={`${styles.button} ${styles.secondaryButton} ${styles.toggleContextSidebarButton}`}
                title={isContextSidebarOpen ? "Hide Context Sidebar" : "Show Context Sidebar"}
              >
                <ContextSidebarIcon className={styles.contextSidebarIcon} />
              </button>
            </div>
          </div>
          <ChatArea 
            chatHistory={chatHistory}
            message={message}
            setMessage={setMessage}
            onSendMessage={onSendMessage}
            contextBlocks={contextBlocks}
            onMentionInChat={handleMentionInChat}
          />
        </div>
        {isContextSidebarOpen && (
          <div 
            className={styles.resizer} 
            onMouseDown={handleResize}
          ></div>
        )}
        <div 
          ref={contextBlocksColumnRef}
          className={`${styles.contextBlocksColumn} ${isContextSidebarOpen ? '' : styles.contextSidebarClosed} ${isDragging ? styles.dragging : ''}`}
          style={{ width: isContextSidebarOpen ? `${contextSidebarWidth}px` : '0' }}
        >
          <h2 className={styles.contextBlocksTitle}>Context Blocks</h2>
          {pendingUpdatesCount > 0 && (
            <>
              <div className={styles.batchUpdateButtons}>
                <button onClick={onAcceptAllChanges} className={`${styles.button} ${styles.primaryButton}`}>
                  Accept All Changes
                </button>
                <button onClick={onRejectAllChanges} className={`${styles.button} ${styles.secondaryButton}`}>
                  Reject All Changes
                </button>
              </div>
              <div className={styles.pendingUpdatesNotification}>
                {pendingUpdatesCount} block{pendingUpdatesCount !== 1 ? 's' : ''} with pending updates
              </div>
            </>
          )}
          <ContextBlocksArea 
            contextBlocks={contextBlocks}
            isLoading={isLoading}
            onUpdateBlock={onUpdateBlock}
            onDeleteBlock={onDeleteBlock}
            onGenerateContent={onGenerateContent}
            onFixContent={onFixContent}
            onReorderBlocks={onReorderBlocks}
            onAddBlock={onAddBlock}
            onMentionInChat={handleMentionInChat}
          />
        </div>
      </div>
      {canUndo && canRedo && (
        <div className={styles.undoRedoButtons}>
          <button onClick={onUndo} disabled={!canUndo} className={`${styles.button} ${styles.secondaryButton}`}>
            Undo
          </button>
          <button onClick={onRedo} disabled={!canRedo} className={`${styles.button} ${styles.secondaryButton}`}>
            Redo
          </button>
        </div>
      )}
    </div>
  );
}

export default MainArea;