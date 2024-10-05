import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';
import styles from '../App.module.css';
import { FaPlus, FaTrash } from 'react-icons/fa';
import { registerPlugin } from '../plugins/registry';

const PluginManagement = () => {
  const [plugins, setPlugins] = useState([]);
  const [error, setError] = useState(null);
  const [newPluginFile, setNewPluginFile] = useState(null);
  const [newPluginName, setNewPluginName] = useState('');
  const [newPluginType, setNewPluginType] = useState('');

  useEffect(() => {
    fetchPlugins();
  }, []);

  const fetchPlugins = async () => {
    try {
      const response = await fetch(`${API_URL}/api/plugins`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Fetched plugins:', data);
      setPlugins(data);
      if (data.length === 0) {
        console.warn('No plugins fetched from the server');
      }
      data.forEach(plugin => {
        console.log(`Registering plugin from API: ${plugin.name} (${plugin.type}) with URL: ${plugin.url}`);
        registerPlugin(plugin.type, plugin.name, plugin.url);
      });
    } catch (e) {
      console.error(`Failed to load plugins: ${e.message}`);
      setError(`Failed to load plugins: ${e.message}`);
    }
  };

  const handleAddPlugin = async (e) => {
    e.preventDefault();
    if (!newPluginFile || !newPluginName.trim() || !newPluginType.trim()) return;

    const formData = new FormData();
    formData.append('file', newPluginFile);
    formData.append('name', newPluginName);
    formData.append('type', newPluginType);

    try {
      const response = await fetch(`${API_URL}/api/plugins`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await fetchPlugins(); // Refresh the plugin list
      setNewPluginFile(null);
      setNewPluginName('');
      setNewPluginType('');
    } catch (error) {
      setError(`Failed to add new plugin: ${error.message}`);
    }
  };

  const handleRemovePlugin = async (pluginId) => {
    try {
      const response = await fetch(`${API_URL}/api/plugins/${pluginId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await fetchPlugins(); // Refresh the plugin list
    } catch (error) {
      setError(`Failed to remove plugin: ${error.message}`);
    }
  };

  if (error) {
    return <div className={styles.pluginError}>Error: {error}</div>;
  }

  return (
    <div className={styles.pluginManagement}>
      <h3>Context plugins</h3>
      {plugins.length === 0 ? (
        <p>No plugins available.</p>
      ) : (
        <ul className={styles.pluginList}>
          {plugins.map(plugin => (
            <li key={plugin.id} className={styles.pluginItem}>
              {plugin.name} ({plugin.type})
              <button 
                onClick={() => handleRemovePlugin(plugin.id)} 
                className={`${styles.button} ${styles.dangerButton}`}
                title="Remove Plugin"
              >
                <FaTrash />
              </button>
            </li>
          ))}
        </ul>
      )}

      <h4>Add New Plugin</h4>
      <form onSubmit={handleAddPlugin} className={styles.addPluginForm}>
        <input
          type="text"
          value={newPluginName}
          onChange={(e) => setNewPluginName(e.target.value)}
          placeholder="Plugin Name"
          className={styles.pluginInput}
        />
        <input
          type="text"
          value={newPluginType}
          onChange={(e) => setNewPluginType(e.target.value)}
          placeholder="Plugin Type"
          className={styles.pluginInput}
        />
        <input
          type="file"
          onChange={(e) => setNewPluginFile(e.target.files[0])}
          accept=".html"
          className={styles.pluginInput}
        />
        <button type="submit" className={`${styles.button} ${styles.primaryButton}`}>
          <FaPlus /> Add Plugin
        </button>
      </form>
    </div>
  );
};

export default PluginManagement;