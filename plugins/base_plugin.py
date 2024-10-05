from abc import ABC, abstractmethod

class BasePlugin(ABC):
    @abstractmethod
    def process(self, content):
        pass

    @abstractmethod
    def render(self, content):
        pass

    @abstractmethod
    def get_component_code(self):
        pass