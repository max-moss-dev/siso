import React from 'react';

const TextPlugin = ({ content, onUpdate, styles }) => (
  <textarea
    value={content}
    onChange={(e) => onUpdate(e.target.value)}
    className={styles.textArea}
  />
);

export default TextPlugin;