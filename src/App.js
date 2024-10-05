import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BrowserRouter as Router, Route, Routes, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './App.module.css';
import Sidebar from './components/Sidebar';
import MainArea from './components/MainArea';
import AddBlockModal from './components/AddBlockModal';
import AddProjectModal from './components/AddProjectModal';
import { API_URL } from './config';

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('isSidebarOpen');
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [isContextSidebarOpen, setIsContextSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('isContextSidebarOpen');
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [isClearingChat, setIsClearingChat] = useState(false);
  const [blockHistory, setBlockHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const contextBlocksRef = useRef({});

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

  const fetchChatHistory = useCallback(async () => {
    if (!selectedProject) return;
    try {
      const response = await axios.get(`${API_URL}/projects/${selectedProject}/chat_history`);
      setChatHistory(response.data);
    } catch (error) {
      console.error("Error fetching chat history:", error);
    }
  }, [selectedProject]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get(`${API_URL}/projects`);
        setProjects(response.data);
        
        // Find the "New" project (assuming it's always the first one created)
        const newProject = response.data.find(p => p.name === "New Project") || response.data[0];
        
        if (projectId) {
          // Check if the projectId exists in the fetched projects
          const projectExists = response.data.some(p => p.id === projectId);
          if (projectExists) {
            setSelectedProject(projectId);
          } else {
            // If the project doesn't exist, fallback to the "New" project
            setSelectedProject(newProject.id);
            navigate(`/project/${newProject.id}`);
          }
        } else if (!selectedProject && newProject) {
          // If no project is selected, select the "New" project
          setSelectedProject(newProject.id);
          navigate(`/project/${newProject.id}`);
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
      }
    };

    fetchProjects();
  }, [projectId, selectedProject, navigate]);

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
      const { response: aiResponse, context_updates } = response.data;

      if (context_updates && context_updates.length > 0) {
        const updatedBlocks = contextBlocks.map(block => {
          const update = context_updates.find(update => update.block_id === block.id);
          if (update) {
            return { ...block, pendingContent: update.new_content };
          }
          return block;
        });
        setContextBlocks(updatedBlocks);
      }

      const aiMessage = { 
        role: 'assistant', 
        content: aiResponse,
        context_updates: context_updates 
      };
      setChatHistory([...chatHistory, newMessage, aiMessage]);

      if (!context_updates || context_updates.length === 0) {
        fetchContextBlocks();
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

  const handleAddBlock = async (blockTitle, pluginType) => {
    const newBlock = {
      title: blockTitle,
      content: '',
      type: pluginType,
      plugin_type: pluginType,
    };

    try {
      const response = await axios.post(`${API_URL}/projects/${selectedProject}/context_blocks`, newBlock);
      setContextBlocks([...contextBlocks, response.data]);
      setShowAddBlockModal(false);
    } catch (error) {
      console.error("Error adding new block:", error);
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
        console.error("Response headers:", error.response.headers);
      }
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
      const dataToSend = {
        title: updatedBlock.title,
        content: updatedBlock.content,
        type: updatedBlock.type,
        plugin_type: updatedBlock.plugin_type,
        isCollapsed: updatedBlock.isCollapsed
      };

      // Only send fields that are actually defined and different from the current block
      const currentBlock = contextBlocks.find(block => block.id === blockId);
      const filteredData = Object.fromEntries(
        Object.entries(dataToSend).filter(([key, value]) => 
          value !== undefined && value !== currentBlock[key]
        )
      );

      console.log("Sending update request with data:", filteredData);

      if (Object.keys(filteredData).length === 0) {
        console.log("No changes to update");
        return;
      }

      const response = await axios.put(`${API_URL}/projects/${selectedProject}/context_blocks/${blockId}`, filteredData);
      
      console.log("Update response:", response.data);

      setContextBlocks(prevBlocks => {
        const newBlocks = prevBlocks.map(block => 
          block.id === blockId ? { ...block, ...updatedBlock } : block
        );
        setBlockHistory(prev => [...prev.slice(0, historyIndex + 1), newBlocks]);
        setHistoryIndex(prev => prev + 1);
        return newBlocks;
      });
    } catch (error) {
      console.error("Error updating block:", error);
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
        console.error("Response headers:", error.response.headers);
      }
      // Optionally, show an error message to the user
    }
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      setContextBlocks(blockHistory[historyIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < blockHistory.length - 1) {
      setHistoryIndex(prev => prev + 1);
      setContextBlocks(blockHistory[historyIndex + 1]);
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
    setIsSidebarOpen(prev => {
      const newState = !prev;
      localStorage.setItem('isSidebarOpen', JSON.stringify(newState));
      return newState;
    });
  };

  const toggleContextSidebar = () => {
    setIsContextSidebarOpen(prev => {
      const newState = !prev;
      localStorage.setItem('isContextSidebarOpen', JSON.stringify(newState));
      return newState;
    });
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

  const handleAcceptAllChanges = async () => {
    try {
      const updatedBlocks = [];
      
      // Update each changed block in the backend
      for (const block of contextBlocks) {
        if (block.pendingContent) {
          const updatedBlock = { 
            ...block, 
            content: block.pendingContent, 
            pendingContent: null  // Clear pendingContent
          };
          
          // Update in the backend
          await axios.put(`${API_URL}/projects/${selectedProject}/context_blocks/${block.id}`, {
            title: updatedBlock.title,
            content: updatedBlock.content,
            type: updatedBlock.type
          });
          
          updatedBlocks.push(updatedBlock);
        } else {
          updatedBlocks.push(block);
        }
      }

      // If all backend updates are successful, update the local state
      setContextBlocks(updatedBlocks);
      setBlockHistory(prev => [...prev.slice(0, historyIndex + 1), updatedBlocks]);
      setHistoryIndex(prev => prev + 1);
    } catch (error) {
      console.error("Error accepting all changes:", error);
      // Optionally, show an error message to the user
    }
  };

  const handleRejectAllChanges = () => {
    const updatedBlocks = contextBlocks.map(block => {
      if (block.pendingContent) {
        return { ...block, pendingContent: null };
      }
      return block;
    });
    setContextBlocks(updatedBlocks);
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
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < blockHistory.length - 1}
        onAcceptAllChanges={handleAcceptAllChanges}
        onRejectAllChanges={handleRejectAllChanges}
        toggleContextSidebar={toggleContextSidebar}
        isContextSidebarOpen={isContextSidebarOpen}
        setIsContextSidebarOpen={setIsContextSidebarOpen}
        contextBlocksRef={contextBlocksRef}
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