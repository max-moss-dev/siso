import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import styles from './App.module.css';
import { FaCube, FaPaperPlane, FaUser, FaRobot, FaPlus, FaTimes } from 'react-icons/fa';

const API_URL = 'http://localhost:8000';

function AppContent() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [contextBlocks, setContextBlocks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddBlockModal, setShowAddBlockModal] = useState(false);
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const { projectId } = useParams();
  const navigate = useNavigate();

  const fetchContextBlocks = React.useCallback(async () => {
    if (!selectedProject) return;
    try {
      const response = await axios.get(`${API_URL}/projects/${selectedProject}/context_blocks`);
      setContextBlocks(response.data);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching context blocks:", error);
      setIsLoading(false);
    }
  }, [selectedProject]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get(`${API_URL}/projects`);
        setProjects(response.data);
      } catch (error) {
        console.error("Error fetching projects:", error);
      }
    };

    fetchProjects();
  }, []);

  useEffect(() => {
    if (projectId) {
      setSelectedProject(projectId);
    }
  }, [projectId]);

  useEffect(() => {
    if (selectedProject) {
      fetchContextBlocks();
    }
  }, [selectedProject, fetchContextBlocks]);

  const handleSend = async () => {
    if (message.trim() === '') return;
    const newHistory = [...chatHistory, { role: 'user', content: message }];
    setChatHistory(newHistory);
    setMessage('');

    try {
      const response = await axios.post(`${API_URL}/projects/${selectedProject}/chat`, {
        message,
        history: newHistory,
      });
      setChatHistory([...newHistory, { role: 'assistant', content: response.data.response }]);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleAddBlock = async (blockTitle, blockType) => {
    const newBlock = {
      title: blockTitle,
      content: blockType === 'list' ? [] : '',
      type: blockType,
    };

    try {
      const response = await axios.post(`${API_URL}/projects/${selectedProject}/context_blocks`, newBlock);
      setContextBlocks([...contextBlocks, response.data]);
      setShowAddBlockModal(false);
    } catch (error) {
      console.error("Error adding new block:", error);
    }
  };

  const handleDeleteBlock = async (blockId) => {
    try {
      await axios.delete(`${API_URL}/projects/${selectedProject}/context_blocks/${blockId}`);
      setContextBlocks(contextBlocks.filter(block => block.id !== blockId));
    } catch (error) {
      console.error("Error deleting block:", error);
    }
  };

  const handleUpdateBlock = async (blockId, updatedBlock) => {
    try {
      await axios.put(`${API_URL}/projects/${selectedProject}/context_blocks/${blockId}`, updatedBlock);
      setContextBlocks(contextBlocks.map(block => block.id === blockId ? updatedBlock : block));
    } catch (error) {
      console.error("Error updating block:", error);
    }
  };

  const handleGenerateContent = async (blockId) => {
    try {
      const response = await axios.post(`${API_URL}/projects/${selectedProject}/generate_content`, { block_id: blockId });
      const updatedBlock = contextBlocks.find(block => block.id === blockId);
      if (updatedBlock) {
        updatedBlock.content = response.data.content;
        handleUpdateBlock(blockId, updatedBlock);
      }
    } catch (error) {
      console.error("Error generating content:", error);
    }
  };

  const handleProjectSelect = (projectId) => {
    setSelectedProject(projectId);
    navigate(`/project/${projectId}`);
  };

  const handleAddProject = async (projectName) => {
    try {
      const response = await axios.post(`${API_URL}/projects`, { name: projectName });
      setProjects([...projects, response.data]);
      setShowAddProjectModal(false);
      // Optionally, you can automatically select the new project:
      handleProjectSelect(response.data.id);
    } catch (error) {
      console.error("Error adding new project:", error);
    }
  };

  const handleUpdateProject = async (projectId, newName) => {
    try {
      const response = await axios.put(`${API_URL}/projects/${projectId}`, { name: newName });
      setProjects(projects.map(p => p.id === projectId ? response.data : p));
    } catch (error) {
      console.error("Error updating project:", error);
    }
  };

  const handleDeleteProject = async (projectId) => {
    try {
      await axios.delete(`${API_URL}/projects/${projectId}`);
      setProjects(projects.filter(p => p.id !== projectId));
      if (selectedProject === projectId) {
        setSelectedProject(null);
        navigate('/');
      }
    } catch (error) {
      console.error("Error deleting project:", error);
    }
  };

  const AddBlockModal = () => {
    const [selectedType, setSelectedType] = useState('text');
    const [blockTitle, setBlockTitle] = useState('');

    const handleSubmit = (e) => {
      e.preventDefault();
      if (blockTitle.trim()) {
        handleAddBlock(blockTitle.trim(), selectedType);
        setBlockTitle('');
      }
    };

    return (
      <div className={styles.modal}>
        <div className={styles.modalContent}>
          <h2>Add New Block</h2>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              value={blockTitle}
              onChange={(e) => setBlockTitle(e.target.value)}
              placeholder="Enter block title"
              className={styles.input}
              required
            />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className={styles.select}
            >
              <option value="text">Text</option>
              <option value="list">List</option>
            </select>
            <div className={styles.modalButtons}>
              <button type="submit">Add</button>
              <button type="button" onClick={() => setShowAddBlockModal(false)}>Cancel</button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const AddProjectModal = ({ onAddProject, onClose }) => {
    const [projectName, setProjectName] = useState('');

    const handleSubmit = (e) => {
      e.preventDefault();
      if (projectName.trim()) {
        onAddProject(projectName.trim());
        setProjectName('');
      }
    };

    return (
      <div className={styles.modal}>
        <div className={styles.modalContent}>
          <h2>Add New Project</h2>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Enter project name"
              className={styles.input}
            />
            <div className={styles.modalButtons}>
              <button type="submit">Add</button>
              <button type="button" onClick={onClose}>Cancel</button>
            </div>
          </form>
          <button className={styles.closeButton} onClick={onClose}>
            <FaTimes />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.app}>
      <Sidebar 
        projects={projects} 
        selectedProject={selectedProject}
        onProjectSelect={handleProjectSelect}
        onAddProject={() => setShowAddProjectModal(true)}
      />
      <MainArea
        projectName={projects.find(p => p.id === selectedProject)?.name || 'No Project Selected'}
        projectId={selectedProject}
        contextBlocks={contextBlocks}
        isLoading={isLoading}
        onAddBlock={() => setShowAddBlockModal(true)}
        onUpdateBlock={handleUpdateBlock}
        onDeleteBlock={handleDeleteBlock}
        onGenerateContent={handleGenerateContent}
        chatHistory={chatHistory}
        message={message}
        setMessage={setMessage}
        onSendMessage={handleSend}
        onUpdateProject={handleUpdateProject}
        onDeleteProject={handleDeleteProject}
      />
      {showAddBlockModal && <AddBlockModal onAddBlock={handleAddBlock} onClose={() => setShowAddBlockModal(false)} />}
      {showAddProjectModal && <AddProjectModal onAddProject={handleAddProject} onClose={() => setShowAddProjectModal(false)} />}
    </div>
  );
}

function Sidebar({ projects, selectedProject, onProjectSelect, onAddProject }) {
  return (
    <div className={styles.sidebar}>
      <h2>Projects</h2>
      {projects.map(project => (
        <div 
          key={project.id} 
          className={`${styles.projectItem} ${project.id === selectedProject ? styles.selected : ''}`}
          onClick={() => onProjectSelect(project.id)}
        >
          <FaCube /> {project.name}
        </div>
      ))}
      <button className={styles.addProjectButton} onClick={onAddProject}>
        <FaPlus /> Add Project
      </button>
    </div>
  );
}

function MainArea({ projectName, projectId, contextBlocks, isLoading, onAddBlock, onUpdateBlock, onDeleteBlock, onGenerateContent, chatHistory, message, setMessage, onSendMessage, onUpdateProject, onDeleteProject }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(projectName);

  useEffect(() => {
    setEditedName(projectName);
  }, [projectName]);

  const handleEditSave = () => {
    onUpdateProject(projectId, editedName);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      onDeleteProject(projectId);
    }
  };

  return (
    <div className={styles.mainContent}>
      <div className={styles.projectHeader}>
        {isEditing ? (
          <>
            <input
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onBlur={handleEditSave}
              autoFocus
            />
            <button onClick={handleEditSave}>Save</button>
          </>
        ) : (
          <>
            <h1>{projectName}</h1>
            <button onClick={() => setIsEditing(true)}>Edit</button>
            <button onClick={handleDelete}>Delete</button>
          </>
        )}
      </div>
      <ContextBlocksArea 
        contextBlocks={contextBlocks}
        isLoading={isLoading}
        onAddBlock={onAddBlock}
        onUpdateBlock={onUpdateBlock}
        onDeleteBlock={onDeleteBlock}
        onGenerateContent={onGenerateContent}
      />
      <ChatArea 
        chatHistory={chatHistory}
        message={message}
        setMessage={setMessage}
        onSendMessage={onSendMessage}
      />
    </div>
  );
}

function ContextBlocksArea({ contextBlocks, isLoading, onAddBlock, onUpdateBlock, onDeleteBlock, onGenerateContent }) {
  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className={styles.contextBlocks}>
      {contextBlocks.map(block => (
        <ContextBlock 
          key={block.id} 
          block={block} 
          onUpdate={onUpdateBlock}
          onDelete={onDeleteBlock}
          onGenerateContent={onGenerateContent}
        />
      ))}
      <div className={styles.addBlockContainer}>
        <button onClick={onAddBlock} className={styles.addBlockButton}>
          <FaPlus /> Add Block
        </button>
      </div>
    </div>
  );
}

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
        <button onClick={() => onDelete(block.id)}>Delete</button>
        <button onClick={() => onGenerateContent(block.id)}>
          {block.content ? 'Regenerate' : 'Generate'}
        </button>
      </div>
    </div>
  );
}

function ChatArea({ chatHistory, message, setMessage, onSendMessage }) {
  return (
    <div className={styles.chatContainer}>
      <div className={styles.chatHistory}>
        {chatHistory.map((chat, index) => (
          <div key={index} className={`${styles.message} ${chat.role === 'user' ? styles.userMessage : styles.aiMessage}`}>
            {chat.role === 'user' ? <FaUser /> : <FaRobot />}
            <ReactMarkdown>{chat.content}</ReactMarkdown>
          </div>
        ))}
      </div>
      <div className={styles.inputSection}>
        <input
          className={styles.input}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && onSendMessage()}
          placeholder="Type your message..."
        />
        <button className={styles.sendButton} onClick={onSendMessage}>
          <FaPaperPlane />
        </button>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AppContent />} />
        <Route path="/project/:projectId" element={<AppContent />} />
      </Routes>
    </Router>
  );
}

export default App;