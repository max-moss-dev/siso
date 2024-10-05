const PluginComponent = ({ content, onUpdate, blockId }) => (
    <iframe 
        src={`plugins/text.html?blockId=${blockId}`} // Pass blockId as a query parameter
        style={{ border: 'none', width: '100%', height: '100%' }}
        title={`Text Plugin ${blockId}`}
    />
);

export default PluginComponent;