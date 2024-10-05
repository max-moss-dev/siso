import React, { useState } from 'react';

const TextPlugin = ({ content, onUpdate, styles }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);

  const handleSave = () => {
    onUpdate(editedContent);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className={styles.textPluginEdit}>
        <textarea
          value={editedContent}
          onChange={(e) => setEditedContent(e.target.value)}
          className={styles.textPluginTextarea}
        />
        <button onClick={handleSave} className={styles.saveButton}>Save</button>
      </div>
    );
  }

  return (
    <div className={styles.textPluginView}>
      <p>{content}</p>
      <button onClick={() => setIsEditing(true)} className={styles.editButton}>Edit</button>
    </div>
  );
};

export default TextPlugin;