import React from 'react';

const pluginRegistry = {};

export const registerPlugin = (type, name, url) => {
  pluginRegistry[type] = {
    name,
    component: React.lazy(() => import(/* webpackIgnore: true */ url))
  };
};

export const getPlugin = (type) => {
  return pluginRegistry[type] || { 
    name: 'Unknown', 
    component: () => <div>Unsupported plugin type: {type}</div> 
  };
};

export default pluginRegistry;