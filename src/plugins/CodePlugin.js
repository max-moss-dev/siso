import React from 'react';

const CodePlugin = ({ content, onUpdate, styles }) => (
  <textarea
    value={content}
    onChange={(e) => onUpdate(e.target.value)}
    className={styles.codeArea}
  />
);

export default CodePlugin;