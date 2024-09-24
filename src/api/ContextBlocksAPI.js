import axios from 'axios';
import { blockTypes } from '../blockTypes';

const API_URL = 'http://localhost:8000'; // Make sure this matches your backend URL

export const ContextBlocksAPI = {
  createBlock: async (projectId, { title, type }) => {
    const content = blockTypes[type]?.defaultContent ?? null;
    const response = await axios.post(`${API_URL}/projects/${projectId}/context_blocks`, {
      title,
      type,
      content,
    });
    return response.data;
  },
  // ... other methods
};