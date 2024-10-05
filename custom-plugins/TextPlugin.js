import React, { useState } from 'react';

const TextPlugin = ({ content, onUpdate }) => {
  const [text, setText] = useState(content);

  const handleChange = (e) => {
    const newText = e.target.value;
    setText(newText);
    onUpdate(newText);
  };

  return (
    <textarea
      value={text}
      onChange={handleChange}
      style={{
        width: '100%',
        minHeight: '100px',
        padding: '8px',
        fontSize: '14px',
        lineHeight: '1.5',
        border: '1px solid #ccc',
        borderRadius: '4px',
      }}
    />
  );
};

export default TextPlugin;