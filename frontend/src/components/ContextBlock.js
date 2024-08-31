import React from 'react';
import styles from '../App.module.css';

function ContextBlock({ block, onUpdate, onDelete, onGenerateContent }) {
  const handleUpdate = (field, value) => {
    onUpdate(block.id, { ...block, [field]: value });
  };

  return (
    <div className={styles.contextBlock}>
      <input
        value={block.title}
        onChange={(e) => handleUpdate('title', e.target.value)}
        placeholder="Block title"
      />
      {block.type === 'text' ? (
        <textarea
          value={block.content}
          onChange={(e) => handleUpdate('content', e.target.value)}
          placeholder="Block content"
        />
      ) : (
        <ul>
          {Array.isArray(block.content) ? block.content.map((item, index) => (
            <li key={index}>
              <input
                value={item}
                onChange={(e) => {
                  const newContent = [...block.content];
                  newContent[index] = e.target.value;
                  handleUpdate('content', newContent);
                }}
              />
            </li>
          )) : null}
          <button onClick={() => handleUpdate('content', [...(Array.isArray(block.content) ? block.content : []), ''])}>
            Add item
          </button>
        </ul>
      )}
      <div className={styles.blockButtons}>
        <button onClick={() => onDelete(block.id)} className={`${styles.button} ${styles.dangerButton}`}>Delete</button>
        <button onClick={() => onGenerateContent(block.id)} className={`${styles.button} ${styles.secondaryButton}`}>
          {block.content ? 'Regenerate' : 'Generate'}
        </button>
      </div>
    </div>
  );
}

export default ContextBlock;