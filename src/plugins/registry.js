import React, { useEffect, useRef } from 'react';
import { API_URL } from '../config';

const pluginRegistry = {};

const PluginComponent = React.memo(function PluginComponent({ content, onUpdate, url, name }) {
  console.log(`Rendering PluginComponent for ${name} with URL: ${url}`);
  const iframeRef = useRef(null);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data.type === 'update') {
        onUpdate(event.data.content);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onUpdate]);

  useEffect(() => {
    if (iframeRef.current) {
      iframeRef.current.contentWindow.postMessage({ type: 'setContent', content }, '*');
    }
  }, [content]);

  return (
    <iframe
      ref={iframeRef}
      src={`${API_URL}${url}`}
      style={{ width: '100%', height: '300px', border: 'none' }}
      title={`${name} Plugin`}
      onLoad={(e) => {
        e.target.contentWindow.postMessage({ type: 'setContent', content }, '*');
      }}
    />
  );
});

export const registerPlugin = (type, name, url) => {
  console.log(`Registering plugin: ${name} (${type}) with URL: ${url}`);
  pluginRegistry[type] = {
    name,
    component: (props) => <PluginComponent {...props} url={url} name={name} />
  };
};

export const getPlugin = (type) => {
  const plugin = pluginRegistry[type];
  if (plugin) {
    console.log(`Retrieved plugin: ${plugin.name} (${type})`);
  } else {
    console.warn(`Plugin not found for type: ${type}`);
  }
  return plugin || { 
    name: 'Unknown', 
    component: () => <div>Unsupported plugin type: {type}</div> 
  };
};

export default pluginRegistry;