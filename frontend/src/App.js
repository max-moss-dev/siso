import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import styles from './App.module.css';
import { FaComment, FaCube, FaPaperPlane, FaUser, FaRobot, FaCode, FaLightbulb, FaTrash, FaMagic, FaBroom } from 'react-icons/fa';

const API_URL = 'http://localhost:8000';
const MAX_CHAT_HISTORY = 10;

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

function AppContent() {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [contextBlocks, setContextBlocks] = useState([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [contextBlocksLoaded, setContextBlocksLoaded] = useState(false);
  const blockNameRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await axios.get(`${API_URL}/projects`);
      setProjects(response.data);
      if (response.data.length > 0) {
        setCurrentProject(response.data[0]);
        fetchContextBlocks(response.data[0].id);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const fetchContextBlocks = async (projectId) => {
    try {
      const response = await axios.get(`${API_URL}/projects/${projectId}/context_blocks`);
      setContextBlocks(response.data);
      setContextBlocksLoaded(true);
    } catch (error) {
      console.error("Error fetching context blocks:", error);
      setContextBlocksLoaded(true);
    }
  };

  const loadChatHistory = () => {
    const savedHistory = localStorage.getItem('chatHistory');
    if (savedHistory) {
      setChatHistory(JSON.parse(savedHistory));
    }
  };

  const saveChatHistory = (history) => {
    localStorage.setItem('chatHistory', JSON.stringify(history));
  };

  const handleSend = async () => {
    if (message.trim() === '') return;
    const newHistory = [...chatHistory, [message, '']];
    setChatHistory(newHistory);
    saveChatHistory(newHistory);
    setMessage('');

    try {
      const response = await axios.post(`${API_URL}/projects/${currentProject.id}/chat`, {
        message,
        history: chatHistory.map(([userMessage, aiMessage]) => [userMessage, aiMessage]),
        selected_block: window.location.pathname.split('/').pop()
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

  const handleUpdateBlock = async (oldName) => {
    setIsUpdating(true);
    try {
      const blockIndex = contextBlocks.findIndex(b => b.name === oldName);
      const updatedBlock = {
        ...contextBlocks[blockIndex],
        name: blockNameRef.current.innerText,
      };
      await axios.put(`${API_URL}/projects/${currentProject.id}/context_blocks/${oldName}`, updatedBlock);
      
      setContextBlocks(prevBlocks => {
        const newBlocks = [...prevBlocks];
        newBlocks[blockIndex] = updatedBlock;
        return newBlocks;
      });
      
      if (oldName !== updatedBlock.name) {
        navigate(`/context/${updatedBlock.name}`, { replace: true });
      }
    } catch (error) {
      console.error("Error updating block:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveBlock = async (blockName) => {
    try {
      await axios.delete(`${API_URL}/projects/${currentProject.id}/context_blocks/${blockName}`);
      setContextBlocks(prevBlocks => prevBlocks.filter(block => block.name !== blockName));
      navigate('/chat');
    } catch (error) {
      console.error(`Error deleting block ${blockName}:`, error);
    }
  };

  const handleAddBlock = async (newBlock) => {
    try {
      await axios.post(`${API_URL}/projects/${currentProject.id}/context_blocks`, newBlock);
      setContextBlocks(prevBlocks => [...prevBlocks, newBlock]);
      navigate('/chat');
    } catch (error) {
      console.error("Error adding new block:", error);
    }
  };

  const handleImproveBlock = async () => {
    setIsUpdating(true);
    try {
      const blockName = window.location.pathname.split('/').pop();
      const response = await axios.post(`${API_URL}/projects/${currentProject.id}/improve_block`, { block_name: blockName });
      const improvedContent = response.data.improved_content;
      
      setContextBlocks(prevBlocks => 
        prevBlocks.map(block => 
          block.name === blockName 
            ? { ...block, content: improvedContent.content || JSON.stringify(improvedContent) } 
            : block
        )
      );
    } catch (error) {
      console.error("Error improving block:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const clearAllContextBlocks = async () => {
    if (window.confirm("Are you sure you want to delete all context blocks? This action cannot be undone.")) {
      try {
        await axios.delete(`${API_URL}/projects/${currentProject.id}/context_blocks`);
        setContextBlocks([]);
        navigate('/chat');
      } catch (error) {
        console.error("Error clearing context blocks:", error);
      }
    }
  };

  const handleAddProject = async (name) => {
    try {
      const response = await axios.post(`${API_URL}/projects`, { name });
      setProjects([...projects, response.data]);
      setCurrentProject(response.data);
      fetchContextBlocks(response.data.id);
    } catch (error) {
      console.error("Error adding new project:", error);
    }
  };

  const renderMainContent = () => {
    if (!contextBlocksLoaded) {
      return <div>Loading...</div>;
    }

    return (
      <Routes>
        <Route path="/" element={<Navigate to="/chat" />} />
        <Route path="/chat" element={<ChatView />} />
        <Route path="/context/:blockName" element={<ContextBlockView />} />
        <Route path="/add-block" element={<AddBlockView />} />
      </Routes>
    );
  };

  const ChatView = () => {
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
  };

  const ContextBlockView = () => {
    const { blockName } = useParams();
    const block = contextBlocks.find(b => b.name === blockName);

    if (!block) {
      return <Navigate to="/chat" />;
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
          onBlur={() => handleUpdateBlock(blockName)}
          dangerouslySetInnerHTML={{ __html: blockName }}
        />
        <label className={styles.textareaLabel}>
          <FaCode /> Block Content
        </label>
        {block.type === 'string' ? (
          <div
            className={`${styles.customTextarea} ${styles.contentTextarea}`}
            contentEditable
            onBlur={(e) => setContextBlocks(
              contextBlocks.map(b => {
                if (b.name === blockName) {
                  return {
                    ...b,
                    content: e.target.innerText
                  };
                }
                return b;
              })
            )}
            dangerouslySetInnerHTML={{ __html: content }}
          />
        ) : (
          <ul className={styles.listContent}>
            {content.map((item, index) => (
              <li key={index} contentEditable
                onBlur={(e) => {
                  const newItems = [...content];
                  newItems[index] = e.target.innerText;
                  setContextBlocks(
                    contextBlocks.map(b => {
                      if (b.name === blockName) {
                        return {
                          ...b,
                          content: JSON.stringify({ items: newItems })
                        };
                      }
                      return b;
                    })
                  );
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
          onBlur={(e) => setContextBlocks(
            contextBlocks.map(b => {
              if (b.name === blockName) {
                return {
                  ...b,
                  prompt: e.target.innerText
                };
              }
              return b;
            })
          )}
          dangerouslySetInnerHTML={{ __html: block.prompt || '' }}
        />
        <label className={styles.textareaLabel}>
          Block Type
        </label>
        <select
          value={block.type}
          onChange={(e) => setContextBlocks(
            contextBlocks.map(b => {
              if (b.name === blockName) {
                return {
                  ...b,
                  type: e.target.value
                };
              }
              return b;
            })
          )}
        >
          <option value="string">String</option>
          <option value="list">List</option>
        </select>
        <div className={styles.buttonGroup}>
          <button 
            className={`${styles.confirmButton} ${isUpdating ? styles.loading : ''}`} 
            onClick={() => handleUpdateBlock(blockName)}
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
          <button className={styles.outlineButton} onClick={() => handleRemoveBlock(blockName)}>
            Remove block
          </button>
        </div>
      </div>
    );
  };

  const AddBlockView = () => {
    const [newBlock, setNewBlock] = useState({ name: '', content: '', prompt: '', type: 'string' });

    const handleAddBlockSubmit = () => {
      handleAddBlock(newBlock);
    };

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
        <button className={styles.confirmButton} onClick={handleAddBlockSubmit}>
          Add context block
        </button>
      </div>
    );
  };

  return (
    <div className={styles.app}>
      <div className={styles.sidebar}>
        <h2 className={styles.sidebarHeader}>Project Manager</h2>
        <select
          value={currentProject?.id}
          onChange={(e) => {
            const project = projects.find(p => p.id === e.target.value);
            setCurrentProject(project);
            fetchContextBlocks(project.id);
          }}
        >
          {projects.map(project => (
            <option key={project.id} value={project.id}>{project.name}</option>
          ))}
        </select>
        <button onClick={() => {
          const name = prompt("Enter project name:");
          if (name) handleAddProject(name);
        }}>
          Add Project
        </button>
        <h2 className={styles.sidebarHeader}>Context Manager</h2>
        <nav className={styles.nav}>
          <button
            className={`${styles.navLink} ${location.pathname === '/chat' ? styles.active : ''}`}
            onClick={() => navigate('/chat')}
          >
            <FaComment /> Chat
          </button>
          {contextBlocks.map(block => (
            <button
              key={block.name}
              className={`${styles.navLink} ${location.pathname === `/context/${block.name}` ? styles.active : ''}`}
              onClick={() => navigate(`/context/${block.name}`)}
            >
              <FaCube /> {block.name}
            </button>
          ))}
        </nav>
        <div className={styles.sidebarFooter}>
          <button className={styles.addBlockButton} onClick={() => navigate('/add-block')}>Add Context</button>
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
      </div>
    </div>
  );
}

export default App;