import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Route, Routes, useParams } from 'react-router-dom';
import axios from 'axios';
import styles from './App.module.css';
import Sidebar from './components/Sidebar';
import MainArea from './components/MainArea';
import AddBlockModal from './components/AddBlockModal';
import AddProjectModal from './components/AddProjectModal';
import { ContextBlocksAPI } from './api/ContextBlocksAPI';

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isClearingChat, setIsClearingChat] = useState(false);

  const fetchContextBlocks = useCallback(async () => {
    if (!selectedProject) return;
    try {
      const response = await axios.get(`${API_URL}/projects/${selectedProject}/context_blocks`);
      setContextBlocks(response.data.map(block => ({
        ...block,
        pendingContent: block.pending_content || null
      })));
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

    const newUserMessage = { role: 'user', content: message };
    setChatHistory(prevHistory => [...prevHistory, newUserMessage]);

    try {
      const response = await axios.post(`${API_URL}/projects/${selectedProject}/chat`, { message });
      const botResponse = response.data.response;
      const newBotMessage = { role: 'assistant', content: botResponse };
      
      setChatHistory(prevHistory => [...prevHistory, newBotMessage]);
      setMessage('');
    } catch (error) {
      console.error("Error sending message:", error);
      setChatHistory(prevHistory => [...prevHistory, { role: 'system', content: 'Error: Failed to send message' }]);
    }
  };

  const handleUpdateProject = async (projectId, newName) => {
    // Implement project update logic
  };

  const handleDeleteProject = async (projectId) => {
    // Implement project delete logic
  };

  const handleClearChatHistory = async () => {
    setIsClearingChat(true);
    try {
      await axios.delete(`${API_URL}/projects/${selectedProject}/chat_history`);
      setChatHistory([]);
    } catch (error) {
      console.error("Error clearing chat history:", error);
    } finally {
      setIsClearingChat(false);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleUpdateBlock = async (blockId, updatedBlock) => {
    // Implement block update logic
  };

  const handleDeleteBlock = async (blockId) => {
    // Implement block delete logic
  };

  const handleGenerateContent = async (blockId) => {
    // Implement content generation logic
  };

  const handleFixContent = async (blockId, content) => {
    // Implement content fixing logic
  };

  const handleReorderBlocks = async (reorderedBlocks) => {
    // Implement block reordering logic
  };

  const handleAddBlock = async (title, type) => {
    if (!selectedProject) return;

    try {
      const newBlock = await ContextBlocksAPI.createBlock(selectedProject, { title, type });
      setContextBlocks(prevBlocks => [...prevBlocks, newBlock]);
      setShowAddBlockModal(false);
    } catch (error) {
      console.error("Error adding new block:", error);
    }
  };

  const handleAddProject = async (projectName) => {
    // Implement add project logic
  };

  return (
    <div className={styles.app}>
      <Sidebar 
        projects={projects} 
        selectedProject={selectedProject}
        onProjectSelect={setSelectedProject}
        onAddProject={() => setShowAddProjectModal(true)}
        isOpen={isSidebarOpen}
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
        onFixContent={handleFixContent}
        onReorderBlocks={handleReorderBlocks}
        chatHistory={chatHistory}
        message={message}
        setMessage={setMessage}
        onSendMessage={handleSend}
        onUpdateProject={handleUpdateProject}
        onDeleteProject={handleDeleteProject}
        onClearChatHistory={handleClearChatHistory}
        isClearingChat={isClearingChat}
        toggleSidebar={toggleSidebar}
        isSidebarOpen={isSidebarOpen}
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