import React, { useState, useEffect, useRef } from 'react';

const TextPlugin = ({ content, onUpdate }) => {
  const iframeRef = React.useRef(null);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data.type === 'update') {
        onUpdate(event.data.content);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onUpdate]);

  const sendMessageToIframe = (message) => {
    if (iframeRef.current) {
      iframeRef.current.contentWindow.postMessage(message, '*');
    }
  };

  useEffect(() => {
    sendMessageToIframe({ type: 'setContent', content });
  }, [content]);

  return (
    <iframe
      ref={iframeRef}
      src="/plugins/text.html"
      style={{ width: '100%', height: '300px', border: 'none' }}
      title="Text Plugin"
    />
  );
};

export default TextPlugin;