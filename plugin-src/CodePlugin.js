import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

const CodePlugin = ({ content, onUpdate, styles }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const [language, setLanguage] = useState('javascript'); // Default language

  const handleSave = () => {
    onUpdate(editedContent);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedContent(content);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className={styles.codePluginEdit}>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className={styles.languageSelect}
        >
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
          <option value="cpp">C++</option>
          {/* Add more language options as needed */}
        </select>
        <textarea
          value={editedContent}
          onChange={(e) => setEditedContent(e.target.value)}
          className={styles.codePluginTextarea}
        />
        <div className={styles.codePluginEditButtons}>
          <button onClick={handleSave} className={styles.saveButton}>
            Save
          </button>
          <button onClick={handleCancel} className={styles.cancelButton}>
            Cancel
          </button>
        </div>
      </div>
    );
  } else {
    return (
      <div className={styles.codePluginView}>
        <SyntaxHighlighter language={language} style={atomDark}>
          {content}
        </SyntaxHighlighter>
        <button onClick={() => setIsEditing(true)} className={styles.editButton}>
          Edit
        </button>
      </div>
    );
  }
};

export default CodePlugin;