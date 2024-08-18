import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './App.module.css';

const API_URL = 'http://localhost:8000';

function App() {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [contextBlocks, setContextBlocks] = useState({});
  const [selectedBlock, setSelectedBlock] = useState('');
  const [newBlock, setNewBlock] = useState({ name: '', content: '', prompt: '' });

  useEffect(() => {
    fetchContextBlocks();
  }, []);

  const fetchContextBlocks = async () => {
    const response = await axios.get(`${API_URL}/context_blocks`);
    setContextBlocks(response.data);
  };

  const handleSend = async () => {
    if (message.trim() === '') return;
    const response = await axios.post(`${API_URL}/chat`, {
      message,
      history: chatHistory,
      selected_block: selectedBlock
    });
    setChatHistory([...chatHistory, [message, response.data.response]]);
    setMessage('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAddBlock = async () => {
    await axios.post(`${API_URL}/context_blocks`, newBlock);
    setNewBlock({ name: '', content: '', prompt: '' });
    fetchContextBlocks();
  };

  const handleUpdateBlock = async () => {
    await axios.put(`${API_URL}/context_blocks/${selectedBlock}`, {
      name: selectedBlock,
      content: contextBlocks[selectedBlock].content,
      prompt: contextBlocks[selectedBlock].prompt
    });
    fetchContextBlocks();
  };

  return (
    <div className={styles.app}>
      <div className={styles.sidebar}>
        <h2 className={styles.sidebarHeader}>Context Blocks</h2>
        <select 
          className={styles.select}
          value={selectedBlock} 
          onChange={(e) => setSelectedBlock(e.target.value)}
        >
          <option value="">Select a context block</option>
          {Object.keys(contextBlocks).map(blockName => (
            <option key={blockName} value={blockName}>{blockName}</option>
          ))}
        </select>
        
        {selectedBlock && (
          <>
            <textarea
              className={styles.textarea}
              value={contextBlocks[selectedBlock].content}
              onChange={(e) => setContextBlocks({
                ...contextBlocks,
                [selectedBlock]: { ...contextBlocks[selectedBlock], content: e.target.value }
              })}
              placeholder="Block content"
            />
            <textarea
              className={styles.textarea}
              value={contextBlocks[selectedBlock].prompt}
              onChange={(e) => setContextBlocks({
                ...contextBlocks,
                [selectedBlock]: { ...contextBlocks[selectedBlock], prompt: e.target.value }
              })}
              placeholder="Block prompt"
            />
            <button className={styles.button} onClick={handleUpdateBlock}>Update Block</button>
          </>
        )}
        
        <h3 className={styles.sidebarSubHeader}>Add New Block</h3>
        <input
          className={styles.input}
          value={newBlock.name}
          onChange={(e) => setNewBlock({ ...newBlock, name: e.target.value })}
          placeholder="New block name"
        />
        <textarea
          className={styles.textarea}
          value={newBlock.content}
          onChange={(e) => setNewBlock({ ...newBlock, content: e.target.value })}
          placeholder="New block content"
        />
        <textarea
          className={styles.textarea}
          value={newBlock.prompt}
          onChange={(e) => setNewBlock({ ...newBlock, prompt: e.target.value })}
          placeholder="New block prompt"
        />
        <button className={styles.button} onClick={handleAddBlock}>Add Block</button>
      </div>
      
      <div className={styles.mainContent}>
        <h1 className={styles.header}>Structured Chat App</h1>
        
        <div className={styles.chatHistory}>
          {chatHistory.map((chat, index) => (
            <div key={index}>
              <div className={`${styles.message} ${styles.userMessage}`}>User: {chat[0]}</div>
              <div className={`${styles.message} ${styles.aiMessage}`}>AI: {chat[1]}</div>
            </div>
          ))}
        </div>
        
        <div className={styles.inputSection}>
          <textarea
            className={styles.input}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message (Press Enter to send)"
          />
          <button className={styles.sendButton} onClick={handleSend}>Send</button>
        </div>
      </div>
    </div>
  );
}

export default App;