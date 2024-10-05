import React from 'react';

const pluginRegistry = {};

export const registerPlugin = (type, component) => {
  pluginRegistry[type] = React.lazy(() => import(`./${component}`));
};

export default pluginRegistry;