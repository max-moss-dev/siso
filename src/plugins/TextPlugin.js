import React, { useState } from 'react';
import MarkdownIt from 'markdown-it';
import MdEditor from 'react-markdown-editor-lite';
import 'react-markdown-editor-lite/lib/index.css';

const mdParser = new MarkdownIt();

const TextPlugin = ({ content, onUpdate }) => {
  const [text, setText] = useState(content);

  const handleEditorChange = ({ text }) => {
    setText(text);
    onUpdate(text);
  };

  const styles = {
    container: {
      marginBottom: '1rem',
    },
    editor: {
      height: '300px',
    },
  };

  return (
    <div style={styles.container}>
      <MdEditor
        style={styles.editor}
        value={text}
        renderHTML={(text) => mdParser.render(text)}
        onChange={handleEditorChange}
      />
    </div>
  );
};

export default TextPlugin;