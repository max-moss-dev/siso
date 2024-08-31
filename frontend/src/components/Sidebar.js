import React from 'react';
import { FaCube, FaPlus } from 'react-icons/fa';
import styles from '../App.module.css';

function Sidebar({ projects, selectedProject, onProjectSelect, onAddProject, isOpen }) {
  return (
    <div className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : styles.sidebarClosed}`}>
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
      <button className={`${styles.button} ${styles.secondaryButton} ${styles.addProjectButton}`} onClick={onAddProject}>
        <FaPlus /> Add Project
      </button>
    </div>
  );
}

export default Sidebar;
