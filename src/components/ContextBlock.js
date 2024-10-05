import React, { Suspense } from 'react';
import styles from '../App.module.css';
import pluginRegistry from '../plugins/registry';

const ContextBlock = ({ block, onUpdate }) => {
  const handleUpdate = (newContent) => {
    onUpdate(block.id, { ...block, content: newContent });
  };

  const PluginComponent = pluginRegistry[block.plugin_type];

  if (!PluginComponent) {
    return <div className={styles.errorMessage}>Unsupported plugin type: {block.plugin_type}</div>;
  }

  return (
    <div className={styles.contextBlock}>
      <h3>{block.title}</h3>
      <Suspense fallback={<div>Loading plugin...</div>}>
        <PluginComponent content={block.content} onUpdate={handleUpdate} styles={styles} />
      </Suspense>
    </div>
  );
};

export default ContextBlock;