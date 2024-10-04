import React, { useState, useEffect } from 'react';
import styles from '../App.module.css';
import axios from 'axios';
import { API_URL } from '../config';

function AddBlockModal({ onAddBlock, onClose }) {
  const [blockTitle, setBlockTitle] = useState('');
  const [plugins, setPlugins] = useState([]);
  const [selectedPlugin, setSelectedPlugin] = useState('');

  useEffect(() => {
    fetchPlugins();
  }, []);

  const fetchPlugins = async () => {
    try {
      const response = await axios.get(`${API_URL}/plugins`);
      console.log("Fetched plugins:", response.data);
      setPlugins(response.data);
      // Set the default selected plugin to 'text' if available
      const textPlugin = response.data.find(p => p.type === 'text');
      if (textPlugin) {
        setSelectedPlugin(textPlugin.type);
      } else if (response.data.length > 0) {
        setSelectedPlugin(response.data[0].type);
      }
    } catch (error) {
      console.error("Error fetching plugins:", error);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (blockTitle.trim() && selectedPlugin) {
      onAddBlock(blockTitle.trim(), selectedPlugin);
      setBlockTitle('');
      onClose();
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
            value={selectedPlugin}
            onChange={(e) => setSelectedPlugin(e.target.value)}
            className={styles.select}
            required
          >
            <option value="">Select a plugin</option>
            {plugins.map(plugin => (
              <option key={plugin.id} value={plugin.type}>{plugin.name}</option>
            ))}
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