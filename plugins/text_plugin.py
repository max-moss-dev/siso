from .base_plugin import BasePlugin

class TextPlugin(BasePlugin):
    def process(self, content):
        return content

    def render(self, content):
        return f"<div>{content}</div>"

    def get_component_code(self):
        return """
import React from 'react';

const TextPlugin = ({ content, onUpdate, styles }) => (
  <textarea
    value={content}
    onChange={(e) => onUpdate(e.target.value)}
    className={styles.textArea}
  />
);

export default TextPlugin;
"""

def register_plugin(registry):
    registry.register('text', TextPlugin)