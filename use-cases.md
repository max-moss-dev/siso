# Use Cases

## Text and TODO Types

### Use Case 1: Project Planning

- User wants to create a project plan using LLM. The user has a normal chat interface and also wants to create additional blocks to improve the chat-to-LLM experience.
    - User (planner agent) creates a block named "Project plan". Type "text". The user adds a short draft of the project plan into the textbox of the "Project plan" block. The user adds a prompt "improve this plan if required. Fill this block whenever you think the project plan needs to be adjusted based on all the info you have so far". The user sets the block type to "optional", which means the LLM can decide if the adjustments to this block are needed, and only update it if needed. The user sets the type of block to "input and output", which means the LLM can change the content of the block.
    - User (planner agent) creates a block named "TODO list". Type "todos". The user adds a prompt "Create a plan for the project. Split the plan into small sections. At the end of each section, there should be a 'Test section' task, so the user can run some tests to confirm the section is completed successfully. Provide instructions for test tasks. If you think the task is done, mark the task as complete. Feel free to adjust the todo list if needed. Feel free to split the todo list into smaller sections, add additional tasks, or remove tasks if needed". Type "required". Type "input and output".

### Use Case 2: Data Analysis Report

- User wants to create a data analysis report using LLM. The user has a normal chat interface and also wants to create additional blocks to improve the chat-to-LLM experience.
    - User (planner agent) creates a block named "Data Summary". Type "text". The user adds a short summary of the data into the textbox of the "Data Summary" block. The user adds a prompt "improve this summary if required. Fill this block whenever you think the data summary needs to be adjusted based on all the info you have so far". The user sets the block type to "optional", which means the LLM can decide if the adjustments to this block are needed, and only update it if needed. The user sets the type of block to "input and output", which means the LLM can change the content of the block.
    - User (planner agent) creates a block named "Analysis Steps". Type "todos". The user adds a prompt "Create a plan for the data analysis. Split the plan into small sections. At the end of each section, there should be a 'Review section' task, so the user can review the analysis steps completed successfully. Provide instructions for review tasks. If you think the task is done, mark the task as complete. Feel free to adjust the todo list if needed. Feel free to split the todo list into smaller sections, add additional tasks, or remove tasks if needed". Type "required". Type "input and output".

## Code, Canvas, and Table Types

### Use Case 3: Chrome Extension Development

- User wants to create a more complicated Chrome extension using LLM. The user has a normal chat interface and also wants to create additional blocks to improve the chat-to-LLM experience.
    - User (planner agent) creates a block named "Code". Type "code". The user adds a prompt "Create a Chrome extension. The extension should change the background color of the page to red and add a toolbar with buttons for different actions". The user sets the block type to "required", which means the LLM should update the content of the block each time it has an update. The user sets the type of block to "input and output", which means the LLM can change the content of the block.
    - User (planner agent) creates a block named "Toolbar Layout". Type "text". The user adds a prompt "Describe the layout for a toolbar for the Chrome extension. The toolbar should include buttons for refreshing the page, opening a new tab, and changing the text color on the page". The user sets the block type to "required", which means the LLM should update the content of the block each time it has an update. The user sets the type of block to "input and output", which means the LLM can change the content of the block.
    - User (planner agent) creates a block named "User Instructions". Type "text". The user adds a prompt "Provide instructions for users on how to use the Chrome extension, including how to use the toolbar buttons". The user sets the block type to "required", which means the LLM should update the content of the block each time it has an update. The user sets the type of block to "input and output", which means the LLM can change the content of the block.

### Use Case 4: HTML Page Generation Based on Canvas Drawing

- User wants to generate an HTML page based on a canvas drawing using LLM. The user has a normal chat interface and also wants to create additional blocks to improve the chat-to-LLM experience.
    - User (planner agent) creates a block named "Canvas Drawing". Type "canvas". The user adds a prompt "Create a simple drawing application. The application should allow users to draw on a canvas and save their drawings". The user sets the block type to "required", which means the LLM should update the content of the block each time it has an update. The user sets the type of block to "input and output", which means the LLM can change the content of the block.
    - User (planner agent) creates a block named "HTML Page". Type "html". The user adds a prompt "Create an HTML page based on the canvas drawing. The page should be structured and styled according to the user's specifications". The user sets the block type to "required", which means the LLM should update the content of the block each time it has an update. The user sets the type of block to "input and output", which means the LLM can change the content of the block.

### Use Case 6: Data Table

- User wants to create a data table using LLM. The user has a normal chat interface and also wants to create additional blocks to improve the chat-to-LLM experience.
    - User (planner agent) creates a block named "Data Table". Type "table". The user adds a prompt "Create a simple data table. The table should allow users to add, edit, and delete rows and columns". The user sets the block type to "required", which means the LLM should update the content of the block each time it has an update. The user sets the type of block to "input and output", which means the LLM can change the content of the block.