import React, { useState, useEffect } from 'react';
import { registerPlugin } from '../plugins/registry';
import { API_URL } from '../config';
import styles from '../App.module.css';

const PluginManagement = () => {
  const [plugins, setPlugins] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPlugins();
  }, []);

  const fetchPlugins = async (retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(`${API_URL}/api/plugins`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Fetched plugins:', data);
        setPlugins(data);
        data.forEach(plugin => {
          if (plugin.type === 'text') {
            registerPlugin(plugin.type, `TextPlugin.js`);
          }
        });
        return;
      } catch (e) {
        console.error(`Attempt ${i + 1} failed:`, e);
        if (i === retries - 1) {
          setError(`Failed to load plugins after ${retries} attempts: ${e.message}`);
        } else {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
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
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PluginManagement;