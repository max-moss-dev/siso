import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './App.module.css';
import { FaComment, FaCube, FaTrash, FaPaperPlane, FaUser, FaRobot, FaCode, FaLightbulb } from 'react-icons/fa';

const API_URL = 'http://localhost:8000';

function App() {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [contextBlocks, setContextBlocks] = useState({});
  const [selectedBlock, setSelectedBlock] = useState('');
  const [newBlock, setNewBlock] = useState({ name: '', content: '', prompt: '' });
  const [view, setView] = useState('chat');

  useEffect(() => {
    fetchContextBlocks();
  }, []);

  const fetchContextBlocks = async () => {
    try {
      const response = await axios.get(`${API_URL}/context_blocks`);
      setContextBlocks(response.data);
      console.log("Fetched context blocks:", response.data);
    } catch (error) {
      console.error("Error fetching context blocks:", error);
    }
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

  const handleAddBlock = async () => {
    await axios.post(`${API_URL}/context_blocks`, newBlock);
    setNewBlock({ name: '', content: '', prompt: '' });
    fetchContextBlocks();
    setView('chat');
  };

  const handleUpdateBlock = async () => {
    await axios.put(`${API_URL}/context_blocks/${selectedBlock}`, {
      name: selectedBlock,
      content: contextBlocks[selectedBlock].content,
      prompt: contextBlocks[selectedBlock].prompt
    });
    fetchContextBlocks();
  };

  const handleRemoveBlock = async (blockName) => {
    console.log(`Attempting to delete block: ${blockName}`);
    try {
      await axios.delete(`${API_URL}/context_blocks/${blockName}`);
      console.log(`Block ${blockName} deleted successfully`);
      fetchContextBlocks();
      if (selectedBlock === blockName) {
        setSelectedBlock('');
        setView('chat');
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.error(`Block ${blockName} not found on the server`);
        setContextBlocks(prevBlocks => {
          const newBlocks = {...prevBlocks};
          delete newBlocks[blockName];
          return newBlocks;
        });
        if (selectedBlock === blockName) {
          setSelectedBlock('');
          setView('chat');
        }
      } else {
        console.error(`Error deleting block ${blockName}:`, error);
      }
    }
  };

  const renderMainContent = () => {
    if (view === 'chat') {
      return (
        <>
          <div className={styles.chatHistory}>
            {chatHistory.map((chat, index) => (
              <div key={index}>
                <div className={`${styles.message} ${styles.userMessage}`}>
                  <FaUser className={styles.messageIcon} /> {chat[0]}
                </div>
                <div className={`${styles.message} ${styles.aiMessage}`}>
                  <FaRobot className={styles.messageIcon} /> {chat[1]}
                </div>
              </div>
            ))}
          </div>
          <div className={styles.inputSection}>
            <input
              className={styles.input}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your message..."
            />
            <button className={styles.sendButton} onClick={handleSend}>
              <FaPaperPlane />
            </button>
          </div>
        </>
      );
    } else if (view === 'context' && selectedBlock) {
      return (
        <div className={styles.contextBlockContent}>
          <h2>{selectedBlock}</h2>
          <div className={styles.textareaWrapper}>
            <label className={styles.textareaLabel}>
              <FaCode className={styles.textareaIcon} /> Block Content
            </label>
            <textarea
              className={styles.textarea}
              value={contextBlocks[selectedBlock].content}
              onChange={(e) => setContextBlocks({
                ...contextBlocks,
                [selectedBlock]: { ...contextBlocks[selectedBlock], content: e.target.value }
              })}
              placeholder="Block content"
            />
          </div>
          <div className={styles.textareaWrapper}>
            <label className={styles.textareaLabel}>
              <FaLightbulb className={styles.textareaIcon} /> Block Prompt
            </label>
            <textarea
              className={styles.textarea}
              value={contextBlocks[selectedBlock].prompt}
              onChange={(e) => setContextBlocks({
                ...contextBlocks,
                [selectedBlock]: { ...contextBlocks[selectedBlock], prompt: e.target.value }
              })}
              placeholder="Block prompt"
            />
          </div>
          <div className={styles.buttonGroup}>
            <button className={styles.button} onClick={handleUpdateBlock}>Update Block</button>
            <button className={`${styles.button} ${styles.removeButton}`} onClick={() => handleRemoveBlock(selectedBlock)}>
              <FaTrash /> Remove Block
            </button>
          </div>
        </div>
      );
    } else if (view === 'addBlock') {
      return (
        <div className={styles.addBlockForm}>
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
      );
    }
  };

  return (
    <div className={styles.app}>
      <div className={styles.sidebar}>
        <h2 className={styles.sidebarHeader}>Context Manager</h2>
        <nav className={styles.nav}>
          <button
            className={`${styles.navLink} ${view === 'chat' ? styles.active : ''}`}
            onClick={() => setView('chat')}
          >
            <FaComment /> Chat
          </button>
          {Object.keys(contextBlocks).map(blockName => (
            <button
              key={blockName}
              className={`${styles.navLink} ${selectedBlock === blockName && view === 'context' ? styles.active : ''}`}
              onClick={() => {
                setSelectedBlock(blockName);
                setView('context');
              }}
            >
              <FaCube /> {blockName}
            </button>
          ))}
        </nav>
        <button className={styles.addBlockButton} onClick={() => setView('addBlock')}>Add Context</button>
      </div>
      
      <div className={styles.mainContent}>
        <h1 className={styles.header}>Structured GPT</h1>
        {renderMainContent()}
      </div>
    </div>
  );
}

export default App;