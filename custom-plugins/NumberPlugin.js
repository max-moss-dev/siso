import React, { useState, useEffect } from 'react';

const NumberPlugin = ({ content, onUpdate }) => {
  const [value, setValue] = useState(parseFloat(content) || 0);
  const [format, setFormat] = useState('decimal');

  useEffect(() => {
    setValue(parseFloat(content) || 0);
  }, [content]);

  const handleValueChange = (e) => {
    const newValue = parseFloat(e.target.value);
    setValue(newValue);
    onUpdate(newValue.toString());
  };

  const handleFormatChange = (e) => {
    setFormat(e.target.value);
  };

  const formatNumber = (num) => {
    switch (format) {
      case 'percentage':
        return `${(num * 100).toFixed(2)}%`;
      case 'currency':
        return `$${num.toFixed(2)}`;
      default:
        return num.toFixed(2);
    }
  };

  return (
    <div>
      <input
        type="number"
        value={value}
        onChange={handleValueChange}
        style={{ marginRight: '10px' }}
      />
      <select value={format} onChange={handleFormatChange}>
        <option value="decimal">Decimal</option>
        <option value="percentage">Percentage</option>
        <option value="currency">Currency (USD)</option>
      </select>
      <div>Formatted: {formatNumber(value)}</div>
    </div>
  );
};

export default NumberPlugin;