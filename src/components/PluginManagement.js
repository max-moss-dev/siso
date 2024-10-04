import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from '../App.module.css';
import { API_URL } from '../config';

function PluginManagement() {
  const [plugins, setPlugins] = useState([]);
  const [newPlugin, setNewPlugin] = useState({ name: '', type: '', config: '' });

  useEffect(() => {
    fetchPlugins();
  }, []);

  const fetchPlugins = async () => {
    try {
      const response = await axios.get(`${API_URL}/plugins`);
      setPlugins(response.data);
    } catch (error) {
      console.error("Error fetching plugins:", error);
    }
  };

  const handleAddPlugin = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/plugins`, {
        ...newPlugin,
        config: JSON.parse(newPlugin.config)
      });
      setNewPlugin({ name: '', type: '', config: '' });
      fetchPlugins();
    } catch (error) {
      console.error("Error adding plugin:", error);
    }
  };

  const handleRemovePlugin = async (pluginId) => {
    try {
      await axios.delete(`${API_URL}/plugins/${pluginId}`);
      fetchPlugins();
    } catch (error) {
      console.error("Error removing plugin:", error);
    }
  };

  return (
    <div className={styles.pluginManagement}>
      <h2>Plugin Management</h2>
      <form onSubmit={handleAddPlugin}>
        <input
          type="text"
          placeholder="Plugin Name"
          value={newPlugin.name}
          onChange={(e) => setNewPlugin({...newPlugin, name: e.target.value})}
        />
        <input
          type="text"
          placeholder="Plugin Type"
          value={newPlugin.type}
          onChange={(e) => setNewPlugin({...newPlugin, type: e.target.value})}
        />
        <textarea
          placeholder="Plugin Config (JSON)"
          value={newPlugin.config}
          onChange={(e) => setNewPlugin({...newPlugin, config: e.target.value})}
        />
        <button type="submit">Add Plugin</button>
      </form>
      <ul>
        {plugins.map(plugin => (
          <li key={plugin.id}>
            {plugin.name} ({plugin.type})
            {plugin.type !== 'text' && (
              <button onClick={() => handleRemovePlugin(plugin.id)}>Remove</button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default PluginManagement;