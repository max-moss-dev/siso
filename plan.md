# Current Frontend Structure and Behavior Plan

## Components Structure
1. App (main container)
   - Sidebar
   - MainArea
     - ProjectHeader
     - ContextBlocksArea
     - ChatArea
   - AddBlockModal
   - AddProjectModal

2. Sidebar Component
   - List of projects
   - "Add Project" button

3. MainArea Component
   - ProjectHeader
     - Project name (editable)
     - Edit project name button
     - Delete project button
     - Add block button
   - ContextBlocksArea Component
     - List of context blocks
   - ChatArea Component
     - Chat history
     - Chat input
     - Send button

4. ContextBlock Component
   - Block title (editable)
   - Block content (editable, text or list)
   - Delete block button
   - Generate/Regenerate content button

5. AddBlockModal Component
   - Block title input
   - Block type selection (text or list)
   - Add button
   - Cancel button

6. AddProjectModal Component
   - Project name input
   - Add button
   - Cancel button

## State Management

1. Global State (using React hooks in App.js)
   - List of all projects
   - Current selected project
   - Context blocks for the current project
   - Chat history

2. Persistent Storage
   - All data is stored in the backend database (SQLite)
   - Projects, context blocks, and their content are persisted

3. URL Routing
   - Current selected project is part of the URL (/project/:projectId)

4. Local State (within components)
   - UI states (e.g., isEditing for project name, showAddBlockModal, showAddProjectModal)
   - Temporary form data (e.g., editedName for project, message for chat input)

## Data Flow
1. Project Selection
   - User clicks a project in the Sidebar
   - App updates the current selected project and navigates to the project URL
   - MainArea fetches and displays context blocks for the selected project

2. Project Management
   - Adding a project:
     - User clicks "Add Project" in Sidebar
     - AddProjectModal is displayed
     - New project is created and added to the projects list
   - Editing a project:
     - User clicks "Edit Name" in ProjectHeader
     - Project name becomes editable
     - Changes are saved to the backend
   - Deleting a project:
     - User clicks "Delete Project" in ProjectHeader
     - Confirmation is requested
     - Project is removed from the backend and the projects list

3. Block Management
   - Adding a block:
     - User clicks "Add Block" in ProjectHeader
     - AddBlockModal is displayed
     - New block is created and associated with the current project
   - Editing a block:
     - User edits block title or content directly in the ContextBlock
     - Changes are saved to the backend
   - Deleting a block:
     - User clicks delete on a block
     - Block is removed from the backend and the context blocks list
   - Generating content:
     - User clicks "Generate" or "Regenerate" on a block
     - Backend generates content for the block
     - Block content is updated

4. Chat Interaction
   - User sends a message through the chat interface
   - Backend processes the message, considering all context blocks in the current project
   - Backend responds, and the response is added to the chat history

## API Endpoints (implemented in the backend)
1. GET /projects - Fetch all projects
2. POST /projects - Create a new project
3. PUT /projects/:projectId - Update a project
4. DELETE /projects/:projectId - Delete a project
5. GET /projects/:projectId/context_blocks - Fetch all blocks for a project
6. POST /projects/:projectId/context_blocks - Create a new block for a project
7. PUT /projects/:projectId/context_blocks/:blockId - Update a block
8. DELETE /projects/:projectId/context_blocks/:blockId - Delete a block
9. POST /projects/:projectId/chat - Send a chat message and get a response
10. POST /projects/:projectId/generate_content - Generate content for a block

## User Interface Considerations
1. Sidebar has a clear visual indication of the currently selected project
2. MainArea shows a loading state when fetching blocks after project selection
3. ContextBlocksArea supports different block types (text, list) with appropriate editing interfaces
4. ChatArea auto-scrolls to the latest message
5. Modals (AddBlockModal, AddProjectModal) are centered and have a semi-transparent backdrop

## Styling
1. Using CSS Modules for component-specific styles
2. Consistent color scheme and styling across all components
3. Responsive design for various screen sizes

## Error Handling
1. Show user-friendly error messages for failed API calls
2. Implement retry mechanisms for failed network requests

## Future Improvements
1. Implement error boundaries to catch and display errors gracefully
2. Add pagination or virtual scrolling if the number of projects or blocks becomes large
3. Implement caching strategies to reduce API calls
4. Add more block types (e.g., code, image)
5. Enhance chat functionality with features like code highlighting and file attachments