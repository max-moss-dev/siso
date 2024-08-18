# Structured

Structured input, structured output

UI interface web app aiming to provide a fast and intuitive way to provide LLM different blocks and types of inputs, define the output blocks and types of outputs. Mainly for project scaffolding, potentially some other use cases.

# Model
GPT-4o-mini

## Documentation

- [Project Timeline](timeline.md)
- [Use Cases](use-cases.md)

## Draft

The UI of the app is based on one of the existing frameworks/libraries for prototyping LLM interfaces (Openweb UI, others...). The main focus is on creating an intuitive, easy-to-use interface, which at the same time gives the ability to split the input and output into different blocks, for different purposes and types of views. The chat history interface can be skipped or transformed into more of a project list.

## Context blocks

- Different types (text, table, canvas, image, more...)
- Types of context:
    - "Input only": content of the block is provided to every user interaction (message). LLM can't change the content of the block.
    - "Input and output": content of the block is provided to every user interaction (message). LLM can change the content of the block.
        - For future: Different types including:
            - "Required": LLM should update the content of the block each time it has an update.
            - "Optional": LLM can decide if adjustments to this block are needed, and only update it if needed.
        - For future: LLM adds changes to the block content, which are displayed in a way similar to git changes, where the user can see what's removed and what's added. The user approves or declines changes.
- Has name, prompt, and content:
    - Name: name of the block.
    - Prompt: prompt of the block is used to provide LLM with instructions for the block's purpose and how to handle the block content.
    - Content: content of the block (types of content depend on the type of the block).
- Users can tell LLM to work on all context blocks, or iterate on a specific block's content.
- While working on a specific block, the LLM should take notes on how other blocks should be updated later, because of changes done to the current block content.

### Default context blocks

- Chat
- Permanent LLM notes
    - Used to store user preferences. Described by prompt. Type "text", "input and output".
- Temporary LLM notes
    - Used to store info like blocks that need to be updated after the specific block content was updated. Once all the blocks are updated, the notes are cleared. Described by prompt. Type "text", "input and output".

## Planner agent

- The planner agent is a special agent that is used to plan the project. It reasons on the user's goals, plans the context blocks needed to perform the project task in the best way. It creates the context blocks if needed and provides LLM with all the context blocks needed and output schema (structured output API) to split the output into different blocks.

## MVP Approach

The MVP approach focuses on building the simpler parts of features and functionalities first, and then adding more complex features later. Each day should be logically finished, ensuring that the app is functional and usable at the end of each day.