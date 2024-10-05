import React from 'react';
import { FaCube, FaPlus } from 'react-icons/fa';
import styles from '../App.module.css';

function Projects({ projects, selectedProject, onProjectSelect, onAddProject }) {
  return (
    <div className={styles.projectsContainer}>
      <h2>Projects</h2>
      {projects.map(project => (
        <div 
          key={project.id} 
          className={`${styles.projectItem} ${project.id === selectedProject ? styles.selected : ''}`}
          onClick={() => onProjectSelect(project.id)}
        >
          <FaCube /> 
          <span className={styles.projectItemName}>{project.name}</span>
        </div>
      ))}
      <button className={`${styles.button} ${styles.secondaryButton} ${styles.addProjectButton}`} onClick={onAddProject}>
        <FaPlus /> Add Project
      </button>
    </div>
  );
}

export default Projects;