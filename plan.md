# Expanded Frontend Structure and Behavior Plan

## Components Structure
1. App (main container)
   - Sidebar
   - MainArea
     - ContextBlocksArea
     - ChatArea

2. Sidebar Component
   - List of instances (projects)
   - "Add Instance" button

3. MainArea Component
   - ContextBlocksArea Component
     - List of context blocks
     - "Add Block" button
   - ChatArea Component
     - Chat input
     - Send button

## State Management

1. Global State (using React Context or Redux)
   - List of all instances
   - Current selected instance
   - Context blocks for the current instance

2. Persistent Storage
   - List of all instances should be stored in the backend database
     - This ensures data persistence across server restarts
   - Consider using a database like PostgreSQL or MongoDB for robust data storage

3. Session Storage
   - Current selected instance should be saved for the current browser session
     - Options:
       a. Use browser's sessionStorage
       b. Implement as part of the URL routing (e.g., /instance/:instanceId)
       c. Use a combination of both for fallback and direct link sharing

4. Local State (within components)
   - UI states (e.g., loading states, modal visibility)
   - Temporary form data (e.g., unsaved changes in blocks)

## Data Flow
1. Instance Selection
   - User clicks an instance in the Sidebar
   - App updates the current selected instance in the global state
   - MainArea fetches and displays context blocks for the selected instance

2. Block Management
   - Adding a block: 
     - User clicks "Add Block" in ContextBlocksArea
     - New block is created and associated with the current instance
     - Block list in ContextBlocksArea is updated
   - Editing a block:
     - User edits block content
     - Changes are saved to the backend
     - Block list is updated
   - Deleting a block:
     - User clicks delete on a block
     - Block is removed from the backend and the local state

3. Chat Interaction
   - User sends a message through the chat interface
   - Backend processes the message, considering all context blocks in the current instance
   - Backend responds with a set of operations to perform on the context blocks (e.g., update content, create new block, delete block)
   - Frontend applies these operations to update the main area

## Chat Functionality

1. Purpose
   - The chat interface is not for maintaining a conversation history
   - It serves as a tool to update and modify the context blocks in the main area

2. Implementation
   - User input in the chat area is treated as a command or query
   - The backend processes this input and determines how to update the context blocks
   - The response from the backend includes instructions on how to modify existing blocks or create new ones

3. Data Flow
   - User sends a message through the chat interface
   - Backend processes the message, considering all context blocks in the current instance
   - Backend responds with a set of operations to perform on the context blocks (e.g., update content, create new block, delete block)
   - Frontend applies these operations to update the main area

4. UI Considerations
   - The chat input could be presented as a "command bar" or "query input"
   - Consider adding shortcuts or suggestions for common operations (e.g., "Create new block", "Summarize all blocks")

5. State Management for Chat
   - No need to store chat history in the global state
   - Temporary storage of the current input and processing state in local component state

This refined plan addresses the concerns about state management and clarifies the role of the chat functionality. It ensures that instance data persists across server restarts, provides options for managing the current selected instance, and redefines the chat as a tool for modifying context blocks rather than maintaining a conversation history.

## API Endpoints (to be implemented in the backend)
1. GET /instances - Fetch all instances
2. POST /instances - Create a new instance
3. GET /instances/:instanceId/blocks - Fetch all blocks for an instance
4. POST /instances/:instanceId/blocks - Create a new block for an instance
5. PUT /instances/:instanceId/blocks/:blockId - Update a block
6. DELETE /instances/:instanceId/blocks/:blockId - Delete a block
7. POST /instances/:instanceId/chat - Send a chat message and get a response

## User Interface Considerations
1. Sidebar should have a clear visual indication of the currently selected instance
2. MainArea should show a loading state when fetching blocks after instance selection
3. ContextBlocksArea should support different block types (text, list) with appropriate editing interfaces
4. ChatArea should auto-scroll to the latest message

## Error Handling
1. Implement error boundaries to catch and display errors gracefully
2. Show user-friendly error messages for failed API calls
3. Implement retry mechanisms for failed network requests

## Performance Considerations
1. Implement pagination or virtual scrolling if the number of instances or blocks becomes large
2. Consider caching instance and block data to reduce API calls
3. Debounce rapid user inputs (e.g., typing in block content) to reduce API calls