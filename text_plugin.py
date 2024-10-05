from .base_plugin import BasePlugin

class TextPlugin(BasePlugin):
    def process(self, content):
        return content

    def render(self, content):
        return f"<div>{content}</div>"

def register_plugin(registry):
    registry.register('text', TextPlugin)