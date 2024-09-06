import React, { useState } from 'react';
import styles from '../App.module.css';

function AddBlockModal({ onAddBlock, onClose }) {
  const [selectedType, setSelectedType] = useState('text');
  const [blockTitle, setBlockTitle] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (blockTitle.trim()) {
      onAddBlock(blockTitle.trim(), selectedType);
      setBlockTitle('');
    }
  };

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        <h2>Add New Block</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={blockTitle}
            onChange={(e) => setBlockTitle(e.target.value)}
            placeholder="Enter block title"
            className={styles.input}
            required
          />
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className={styles.select}
          >
            <option value="text">Text</option>
            <option value="list">List</option>
          </select>
          <div className={styles.modalButtons}>
            <button type="submit" className={`${styles.button} ${styles.primaryButton}`}>Add</button>
            <button type="button" onClick={onClose} className={`${styles.button} ${styles.secondaryButton}`}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddBlockModal;