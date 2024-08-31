import React, { useState } from 'react';
import styles from '../App.module.css';
import { FaTimes } from 'react-icons/fa';

function AddProjectModal({ onAddProject, onClose }) {
  const [projectName, setProjectName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (projectName.trim()) {
      onAddProject(projectName.trim());
      setProjectName('');
    }
  };

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        <h2>Add New Project</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Enter project name"
            className={styles.input}
          />
          <div className={styles.modalButtons}>
            <button type="submit" className={`${styles.button} ${styles.primaryButton}`}>Add</button>
            <button type="button" onClick={onClose} className={`${styles.button} ${styles.secondaryButton}`}>Cancel</button>
          </div>
        </form>
        <button className={styles.closeButton} onClick={onClose}>
          <FaTimes />
        </button>
      </div>
    </div>
  );
}

export default AddProjectModal;