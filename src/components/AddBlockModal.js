import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import styles from '../App.module.css';

function AddBlockModal({ onAddBlock, onClose }) {
  const [blockTitle, setBlockTitle] = useState('');
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
    if (blockTitle && selectedPlugin) {
      onAddBlock(blockTitle, selectedPlugin);
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
            required
          />
          <select
            value={selectedPlugin}
            onChange={(e) => setSelectedPlugin(e.target.value)}
            required
          >
            {plugins.map(plugin => (
              <option key={plugin.id} value={plugin.type}>{plugin.name}</option>
            ))}
          </select>
          <button type="submit">Add Block</button>
          <button type="button" onClick={onClose}>Cancel</button>
        </form>
      </div>
    </div>
  );
}

export default AddBlockModal;