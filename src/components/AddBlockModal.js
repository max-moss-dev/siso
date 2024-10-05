import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import styles from '../App.module.css';

function AddBlockModal({ onAddBlock, onClose }) {
  const [plugins, setPlugins] = useState([]);
  const [selectedPlugin, setSelectedPlugin] = useState('');

  useEffect(() => {
    fetchPlugins();
  }, []);

  const fetchPlugins = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/plugins`);
      setPlugins(response.data);
      if (response.data.length > 0) {
        setSelectedPlugin(response.data[0].type);
      }
    } catch (error) {
      console.error("Error fetching plugins:", error);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedPlugin) {
      const blockTitle = `New ${selectedPlugin.charAt(0).toUpperCase() + selectedPlugin.slice(1)} Block`;
      onAddBlock(blockTitle, selectedPlugin);
      onClose();
    }
  };

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        <h2>Add New Block</h2>
        <form onSubmit={handleSubmit} className={styles.addBlockForm}>
          <select
            value={selectedPlugin}
            onChange={(e) => setSelectedPlugin(e.target.value)}
            required
            className={styles.select}
          >
            {plugins.map(plugin => (
              <option key={plugin.id} value={plugin.type}>{plugin.name}</option>
            ))}
          </select>
          <div className={styles.modalButtons}>
            <button type="submit" className={`${styles.button} ${styles.primaryButton}`}>Add Block</button>
            <button type="button" onClick={onClose} className={`${styles.button} ${styles.secondaryButton}`}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddBlockModal;