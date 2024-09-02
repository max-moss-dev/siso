import React, { useState, useEffect, useCallback } from 'react';
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isClearingChat, setIsClearingChat] = useState(false);

  const fetchContextBlocks = useCallback(async () => {
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

  const fetchChatHistory = useCallback(async () => {
    if (!selectedProject) return;
    try {
      const response = await axios.get(`${API_URL}/projects/${selectedProject}/chat_history`);
      const history = response.data.map(msg => {
        if (msg.role === 'assistant' && msg.context_update) {
          const { block_title } = msg.context_update;
          return {
            ...msg,
            content: `${msg.content}\n\nI've suggested an update to the "${block_title}" context block. Please review and accept or reject the changes.`
          };
        }
        return msg;
      });
      setChatHistory(history);
    } catch (error) {
      console.error("Error fetching chat history:", error);
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
      fetchChatHistory();
    }
  }, [selectedProject, fetchContextBlocks, fetchChatHistory]);

  const handleSend = async () => {
    if (message.trim() === '') return;
    const newMessage = { role: 'user', content: message };
    setChatHistory([...chatHistory, newMessage]);
    setMessage('');

    try {
      const response = await axios.post(`${API_URL}/projects/${selectedProject}/chat`, {
        message,
      });
      const { response: aiResponse, context_update } = response.data;
      console.log("AI response:", aiResponse);
      console.log("Context update:", context_update);

      let updatedAiResponse = aiResponse;
      if (context_update) {
        const { block_id, block_title, new_content } = context_update;
        const blockToUpdate = contextBlocks.find(block => block.id === block_id);
        if (blockToUpdate) {
          const updatedBlock = { ...blockToUpdate, pendingContent: new_content };
          setContextBlocks(contextBlocks.map(block => block.id === block_id ? updatedBlock : block));
          updatedAiResponse = `I've suggested an update to the "${block_title}" context block. Please review and accept or reject the changes.`;
        } else {
          console.error(`Context block with ID ${block_id} not found`);
          updatedAiResponse = `I tried to update a context block, but couldn't find it. Please check the block IDs.`;
        }
      }

      // Store both the original AI response and the context update information in the chat history
      const aiMessage = { 
        role: 'assistant', 
        content: updatedAiResponse,
        original_content: aiResponse,
        context_update: context_update 
      };
      setChatHistory([...chatHistory, newMessage, aiMessage]);

      if (!context_update) {
        fetchContextBlocks(); // Fetch updated context blocks if no proposed changes
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
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

  const handleGenerateContent = async (blockId, currentContent) => {
    try {
      const response = await axios.post(`${API_URL}/projects/${selectedProject}/generate_content`, { block_id: blockId, content: currentContent });
      return response.data.content;
    } catch (error) {
      console.error("Error generating content:", error);
      throw error;
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

  const handleFixContent = async (blockId, content) => {
    try {
      const response = await axios.post(`${API_URL}/projects/${selectedProject}/fix_content`, {
        block_id: blockId,
        content: content
      });
      return response.data.fixed_content;
    } catch (error) {
      console.error("Error fixing content:", error);
      throw error;
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleReorderBlocks = async (reorderedBlocks) => {
    setContextBlocks(reorderedBlocks);
    try {
      await axios.put(`${API_URL}/projects/${selectedProject}/reorder_blocks`, { blocks: reorderedBlocks.map(block => block.id) });
    } catch (error) {
      console.error("Error reordering blocks:", error);
      fetchContextBlocks();
    }
  };

  return (
    <div className={styles.app}>
      <Sidebar 
        projects={projects} 
        selectedProject={selectedProject}
        onProjectSelect={handleProjectSelect}
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
        onReorderBlocks={handleReorderBlocks}
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