import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import styles from './App.module.css';
import { FaComment, FaCube, FaPaperPlane, FaUser, FaRobot, FaCode, FaLightbulb, FaTrash, FaMagic, FaBroom } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';

const API_URL = 'http://localhost:8000';
const MAX_CHAT_HISTORY = 50; // Maximum number of messages to keep

function App() {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [contextBlocks, setContextBlocks] = useState({});
  const [selectedBlock, setSelectedBlock] = useState('');
  const [newBlock, setNewBlock] = useState({ name: '', content: '', prompt: '', type: 'string' });
  const [view, setView] = useState('chat');
  const [isUpdating, setIsUpdating] = useState(false);
  const blockNameRef = useRef(null);

  useEffect(() => {
    fetchContextBlocks();
    loadChatHistory();
  }, []);

  const loadChatHistory = () => {
    const savedHistory = localStorage.getItem('chatHistory');
    if (savedHistory) {
      setChatHistory(JSON.parse(savedHistory));
    }
  };

  const saveChatHistory = (history) => {
    localStorage.setItem('chatHistory', JSON.stringify(history));
  };

  const fetchContextBlocks = async () => {
    try {
      const response = await axios.get(`${API_URL}/context_blocks`);
      setContextBlocks(response.data);
    } catch (error) {
      console.error("Error fetching context blocks:", error);
    }
  };

  const handleSend = async () => {
    if (message.trim() === '') return;
    const newHistory = [...chatHistory, [message, '']];
    setChatHistory(newHistory);
    saveChatHistory(newHistory);
    setMessage('');

    try {
      const response = await axios.post(`${API_URL}/chat`, {
        message,
        history: chatHistory.map(([userMessage, aiMessage]) => [userMessage, aiMessage]),
        selected_block: selectedBlock
      });
      const updatedHistory = [...newHistory.slice(-MAX_CHAT_HISTORY + 1), [message, response.data.response]];
      setChatHistory(updatedHistory);
      saveChatHistory(updatedHistory);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const clearChatHistory = () => {
    setChatHistory([]);
    localStorage.removeItem('chatHistory');
  };

  const handleAddBlock = async () => {
    await axios.post(`${API_URL}/context_blocks`, newBlock);
    setNewBlock({ name: '', content: '', prompt: '', type: 'string' });
    fetchContextBlocks();
    setView('chat');
  };

  const handleUpdateBlock = async () => {
    setIsUpdating(true);
    try {
      const updatedBlock = {
        name: blockNameRef.current.innerText,
        content: contextBlocks[selectedBlock].content,
        prompt: contextBlocks[selectedBlock].prompt,
        type: contextBlocks[selectedBlock].type
      };
      await axios.put(`${API_URL}/context_blocks/${selectedBlock}`, updatedBlock);
      await fetchContextBlocks();
      setSelectedBlock(blockNameRef.current.innerText);
    } catch (error) {
      console.error("Error updating block:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleImproveBlock = async () => {
    setIsUpdating(true);
    try {
      const response = await axios.post(`${API_URL}/improve_block`, {
        block_name: selectedBlock
      });
      const improvedContent = response.data.improved_content;
      setContextBlocks({
        ...contextBlocks,
        [selectedBlock]: {
          ...contextBlocks[selectedBlock],
          content: JSON.stringify(improvedContent, null, 2)
        }
      });
    } catch (error) {
      console.error("Error improving block:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveBlock = async (blockName) => {
    try {
      await axios.delete(`${API_URL}/context_blocks/${blockName}`);
      fetchContextBlocks();
      if (selectedBlock === blockName) {
        setSelectedBlock('');
        setView('chat');
      }
    } catch (error) {
      console.error(`Error deleting block ${blockName}:`, error);
    }
  };

  const clearAllContextBlocks = async () => {
    if (window.confirm("Are you sure you want to delete all context blocks? This action cannot be undone.")) {
      try {
        await axios.delete(`${API_URL}/context_blocks`);
        setContextBlocks({});
        setSelectedBlock('');
        setView('chat');
      } catch (error) {
        console.error("Error clearing context blocks:", error);
      }
    }
  };

  const renderMainContent = () => {
    if (view === 'chat') {
      return (
        <div className={styles.chatContainer}>
          <div className={styles.chatHistory}>
            {chatHistory.map((chat, index) => (
              <div key={index}>
                <div className={`${styles.message} ${styles.userMessage}`}>
                  <FaUser className={styles.messageIcon} /> 
                  <ReactMarkdown>{chat[0]}</ReactMarkdown>
                </div>
                <div className={`${styles.message} ${styles.aiMessage}`}>
                  <FaRobot className={styles.messageIcon} /> 
                  <ReactMarkdown>{chat[1]}</ReactMarkdown>
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
        </div>
      );
    } else if (view === 'context' && selectedBlock) {
      const block = contextBlocks[selectedBlock];
      if (!block) {
        return <div>Selected block not found</div>;
      }

      let content;
      if (block.type === 'list') {
        try {
          const parsedContent = JSON.parse(block.content);
          content = Array.isArray(parsedContent.items) ? parsedContent.items : [];
        } catch (error) {
          console.error("Error parsing list content:", error);
          content = [];
        }
      } else {
        content = block.content || '';
      }

      return (
        <div className={styles.contextBlockContent}>
          <div
            ref={blockNameRef}
            className={`${styles.customTextarea} ${styles.blockNameTextarea}`}
            contentEditable
            onBlur={handleUpdateBlock}
            dangerouslySetInnerHTML={{ __html: selectedBlock }}
          />
          <label className={styles.textareaLabel}>
            <FaCode /> Block Content
          </label>
          {block.type === 'string' ? (
            <div
              className={`${styles.customTextarea} ${styles.contentTextarea}`}
              contentEditable
              onBlur={(e) => setContextBlocks({
                ...contextBlocks,
                [selectedBlock]: { ...block, content: e.target.innerText }
              })}
              dangerouslySetInnerHTML={{ __html: content }}
            />
          ) : (
            <ul className={styles.listContent}>
              {content.map((item, index) => (
                <li key={index} contentEditable
                  onBlur={(e) => {
                    const newItems = [...content];
                    newItems[index] = e.target.innerText;
                    setContextBlocks({
                      ...contextBlocks,
                      [selectedBlock]: { 
                        ...block, 
                        content: JSON.stringify({ items: newItems })
                      }
                    });
                  }}
                >
                  {item}
                </li>
              ))}
            </ul>
          )}
          <label className={styles.textareaLabel}>
            <FaLightbulb /> Block Prompt
          </label>
          <div
            className={`${styles.customTextarea} ${styles.promptTextarea}`}
            contentEditable
            onBlur={(e) => setContextBlocks({
              ...contextBlocks,
              [selectedBlock]: { ...block, prompt: e.target.innerText }
            })}
            dangerouslySetInnerHTML={{ __html: block.prompt || '' }}
          />
          <label className={styles.textareaLabel}>
            Block Type
          </label>
          <select
            value={block.type}
            onChange={(e) => setContextBlocks({
              ...contextBlocks,
              [selectedBlock]: { ...block, type: e.target.value }
            })}
          >
            <option value="string">String</option>
            <option value="list">List</option>
          </select>
          <div className={styles.buttonGroup}>
            <button 
              className={`${styles.confirmButton} ${isUpdating ? styles.loading : ''}`} 
              onClick={handleUpdateBlock}
              disabled={isUpdating}
            >
              {isUpdating ? 'Updating...' : 'Update block'}
            </button>
            <button 
              className={`${styles.improveButton} ${isUpdating ? styles.loading : ''}`} 
              onClick={handleImproveBlock}
              disabled={isUpdating}
            >
              <FaMagic /> {block.content ? 'Improve' : 'Autofill'}
            </button>
            <button className={styles.outlineButton} onClick={() => handleRemoveBlock(selectedBlock)}>
              Remove block
            </button>
          </div>
        </div>
      );
    } else if (view === 'addBlock') {
      return (
        <div className={styles.addBlockForm}>
          <label className={styles.textareaLabel}>Block Name</label>
          <input
            className={styles.input}
            value={newBlock.name}
            onChange={(e) => setNewBlock({ ...newBlock, name: e.target.value })}
            placeholder=""
          />
          <label className={styles.textareaLabel}>
            <FaLightbulb /> Block Prompt
          </label>
          <div
            className={`${styles.customTextarea} ${styles.promptTextarea}`}
            contentEditable
            onBlur={(e) => setNewBlock({ ...newBlock, prompt: e.target.innerText })}
            dangerouslySetInnerHTML={{ __html: newBlock.prompt }}
          />
          <label className={styles.textareaLabel}>
            <FaCode /> Block Content
          </label>
          <div
            className={`${styles.customTextarea} ${styles.contentTextarea}`}
            contentEditable
            onBlur={(e) => setNewBlock({ ...newBlock, content: e.target.innerText })}
            dangerouslySetInnerHTML={{ __html: newBlock.content }}
          />
          <label className={styles.textareaLabel}>
            Block Type
          </label>
          <select
            value={newBlock.type}
            onChange={(e) => setNewBlock({ ...newBlock, type: e.target.value })}
          >
            <option value="string">String</option>
            <option value="list">List</option>
          </select>
          <button className={styles.confirmButton} onClick={handleAddBlock}>
            Add context block
          </button>
        </div>
      );
    }
  };

  const renderStructuredContent = (content) => {
    try {
      const parsedContent = JSON.parse(content);
      return (
        <div>
          <div className={styles.mainContent}>
            {parsedContent.main_content}
          </div>
          {parsedContent.additional_info && parsedContent.additional_info.length > 0 && (
            <div className={styles.additionalInfo}>
              <h3>Additional Information</h3>
              <ul>
                {parsedContent.additional_info.map((info, index) => (
                  <li key={index}>{info}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    } catch (error) {
      return <p>{content}</p>;
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
        <div className={styles.sidebarFooter}>
          <button className={styles.addBlockButton} onClick={() => setView('addBlock')}>Add Context</button>
          <button className={styles.clearHistoryButton} onClick={clearChatHistory}>
            <FaTrash /> Clear Chat History
          </button>
          <button className={styles.clearBlocksButton} onClick={clearAllContextBlocks}>
            <FaBroom /> Clear All Blocks
          </button>
        </div>
      </div>
      
      <div className={styles.mainContent}>
        <h1 className={styles.header}>Structured GPT</h1>
        {renderMainContent()}
        {view === 'context' && selectedBlock && renderStructuredContent(contextBlocks[selectedBlock].content)}
      </div>
    </div>
  );
}

export default App;