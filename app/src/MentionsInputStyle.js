export const mentionsInputStyle = {
  control: {
    backgroundColor: 'var(--background-color)',
    fontSize: 'var(--font-size-normal)',
    fontWeight: 'normal',
  },
  input: {
    margin: 0,
    padding: 'var(--padding-medium)',
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    color: 'var(--text-color)',
  },
  suggestions: {
    width: '200px',
    list: {
      backgroundColor: 'var(--surface-color)',
      border: '1px solid var(--border-color)',
      fontSize: 'var(--font-size-normal)',
      borderRadius: 'var(--border-radius-small)',
      boxShadow: 'var(--box-shadow)',
      position: 'absolute',
      bottom: 'calc(100% + 30px)', 
      left: 0,
      right: 0,
      maxHeight: '200px',
      overflowY: 'auto', 
    },
    item: {
      padding: 'var(--padding-small) var(--padding-medium)',
      borderBottom: '1px solid var(--border-color)',
      whiteSpace: 'nowrap', // Ensure the item is on one line
      overflow: 'hidden', // Hide any overflow
      textOverflow: 'ellipsis', // Add ellipsis for long text
      '&focused': {
        backgroundColor: 'var(--accent-color)',
        color: 'white',
      },
    },
  },
};

export const mentionStyle = {
  backgroundColor: 'var(--accent-color)',
  padding: 'var(--padding-small) var(--padding-medium)',
  borderRadius: 'var(--border-radius-small)',
  fontWeight: 'bold',
  color: 'var(--text-color)',
};