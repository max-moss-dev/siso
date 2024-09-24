import TextBlock from './components/TextBlock';
import CodeBlock from './components/CodeBlock';

export const blockTypes = {
  text: {
    name: 'Text',
    component: TextBlock,
    defaultContent: '',
  },
  code: {
    name: 'Code',
    component: CodeBlock,
    defaultContent: '',
  },
};

export const addBlockType = (type, config) => {
  blockTypes[type] = config;
};