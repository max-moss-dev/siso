import React, { useState, useEffect } from 'react';
import { registerPlugin } from '../plugins/registry';
import { API_URL } from '../config';

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
          // Assuming the component name is the same as the plugin type
          registerPlugin(plugin.type, `${plugin.type.charAt(0).toUpperCase() + plugin.type.slice(1)}Plugin.js`);
        });
        return; // Success, exit the function
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
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h2>Plugin Management</h2>
      {plugins.length === 0 ? (
        <p>No plugins available.</p>
      ) : (
        <ul>
          {plugins.map(plugin => (
            <li key={plugin.id}>{plugin.name} ({plugin.type})</li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PluginManagement;