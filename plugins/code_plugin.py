from .base import BasePlugin

class CodePlugin(BasePlugin):
    def render(self, content):
        return f"```\n{content}\n```"

    def process(self, content):
        return content.strip('`')

def register_plugin(registry):
    registry.register('code', CodePlugin)