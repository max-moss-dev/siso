from .base import BasePlugin

class TextPlugin(BasePlugin):
    def render(self, content):
        return content

    def process(self, content):
        return content

    def get_component_code(self):
        return """
        return function TextPlugin({ content, onUpdate, styles }) {
          const [isEditing, setIsEditing] = React.useState(false);
          const [editedContent, setEditedContent] = React.useState(content);

          const handleSave = () => {
            onUpdate(editedContent);
            setIsEditing(false);
          };

          if (isEditing) {
            return React.createElement('div', { className: styles.textPluginEdit },
              React.createElement('textarea', {
                value: editedContent,
                onChange: (e) => setEditedContent(e.target.value),
                className: styles.textPluginTextarea
              }),
              React.createElement('button', { onClick: handleSave, className: styles.saveButton }, 'Save')
            );
          }

          return React.createElement('div', { className: styles.textPluginView },
            React.createElement('p', null, content),
            React.createElement('button', { 
              onClick: () => setIsEditing(true), 
              className: styles.editButton 
            }, 'Edit')
          );
        };
        """

def register_plugin(registry):
    registry.register('text', TextPlugin)