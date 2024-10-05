import React, { useState } from 'react';
import styles from '../App.module.css';
import Projects from './Projects';
import PluginManagement from './PluginManagement';
import { FaProjectDiagram, FaPuzzlePiece } from 'react-icons/fa';

function Sidebar({ projects, selectedProject, onProjectSelect, onAddProject, isOpen }) {
  const [activeView, setActiveView] = useState('projects');

  if (!isOpen) {
    return null; // Don't render anything if sidebar is closed
  }

  return (
    <div className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : styles.sidebarClosed}`}>
      <div className={styles.sidebarContent}>
        {activeView === 'projects' ? (
          <Projects 
            projects={projects}
            selectedProject={selectedProject}
            onProjectSelect={onProjectSelect}
            onAddProject={onAddProject}
          />
        ) : (
          <PluginManagement />
        )}
      </div>
      
      <div className={styles.sidebarNavigation}>
        <button 
          className={`${styles.navButton} ${activeView === 'projects' ? styles.active : ''}`}
          onClick={() => setActiveView('projects')}
          title="Projects"
        >
          <FaProjectDiagram />
        </button>
        <button 
          className={`${styles.navButton} ${activeView === 'plugins' ? styles.active : ''}`}
          onClick={() => setActiveView('plugins')}
          title="Context Plugins"
        >
          <FaPuzzlePiece />
        </button>
      </div>
    </div>
  );
}

export default Sidebar;
