import React, { useState, useEffect } from 'react';
import styles from '../App.module.css';
import ContextBlocksArea from './ContextBlocksArea';
import ChatArea from './ChatArea';
import { FaEdit, FaTrash, FaBars } from 'react-icons/fa';

function MainArea({ projectName, projectId, contextBlocks, isLoading, onAddBlock, onUpdateBlock, onDeleteBlock, onGenerateContent, onFixContent, chatHistory, message, setMessage, onSendMessage, onUpdateProject, onDeleteProject, toggleSidebar, isSidebarOpen, onReorderBlocks }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(projectName);
  const [canEdit, setCanEdit] = useState(true);

  useEffect(() => {
    setEditedName(projectName);
  }, [projectName]);

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

  return (
    <div className={styles.mainContent}>
      <div className={styles.projectHeader}>
        <button 
          onClick={toggleSidebar} 
          className={`${styles.button} ${styles.secondaryButton} ${styles.toggleSidebarButton}`}
        >
          <FaBars />
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
              {/* Remove the Add Block button from here */}
            </div>
          </>
        )}
      </div>
      <div className={styles.contentContainer}>
        <div className={styles.chatColumn}>
          <ChatArea 
            chatHistory={chatHistory}
            message={message}
            setMessage={setMessage}
            onSendMessage={onSendMessage}
          />
        </div>
        <div className={styles.contextBlocksColumn}>
          <h2 className={styles.contextBlocksTitle}>Context Blocks</h2>
          <ContextBlocksArea 
            contextBlocks={contextBlocks}
            isLoading={isLoading}
            onUpdateBlock={onUpdateBlock}
            onDeleteBlock={onDeleteBlock}
            onGenerateContent={onGenerateContent}
            onFixContent={onFixContent}
            onReorderBlocks={onReorderBlocks}
            onAddBlock={onAddBlock}
          />
        </div>
      </div>
    </div>
  );
}

export default MainArea;