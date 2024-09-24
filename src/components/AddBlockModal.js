import React, { useState } from 'react';
import styles from '../App.module.css';
import { blockTypes } from '../blockTypes';

function AddBlockModal({ onAddBlock, onClose }) {
  const [blockTitle, setBlockTitle] = useState('');
  const [blockType, setBlockType] = useState('text');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (blockTitle.trim()) {
      onAddBlock(blockTitle.trim(), blockType);
      setBlockTitle('');
    }
  };

  return (
    <div className={styles.modal}>
      <h2>Add New Block</h2>
      <input
        type="text"
        value={blockTitle}
        onChange={(e) => setBlockTitle(e.target.value)}
        placeholder="Enter block title"
      />
      <select value={blockType} onChange={(e) => setBlockType(e.target.value)}>
        {Object.entries(blockTypes).map(([type, config]) => (
          <option key={type} value={type}>{config.name}</option>
        ))}
      </select>
      <button onClick={handleSubmit}>Add Block</button>
      <button onClick={onClose}>Cancel</button>
    </div>
  );
}

export default AddBlockModal;