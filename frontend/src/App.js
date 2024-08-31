import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './App.module.css';
import Sidebar from './components/Sidebar';
import MainArea from './components/MainArea';
import AddBlockModal from './components/AddBlockModal';
import AddProjectModal from './components/AddProjectModal';

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