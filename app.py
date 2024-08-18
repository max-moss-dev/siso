from openai import OpenAI
from dotenv import load_dotenv
import os
import gradio as gr
from typing import List, Dict

# Load environment variables
load_dotenv()

# Function to get API key from various sources
def get_api_key():
    # Try to get the API key from environment variable
    api_key = os.getenv("OPENAI_API_KEY")
    
    # If not found, try to get it from .streamlit/secrets.toml
    if not api_key:
        try:
            import toml
            secrets_path = os.path.join(os.path.dirname(__file__), '.streamlit', 'secrets.toml')
            if os.path.exists(secrets_path):
                secrets = toml.load(secrets_path)
                api_key = secrets.get('openai', {}).get('api_key')
        except ImportError:
            pass
    
    # If still not found, raise an error
    if not api_key:
        raise ValueError("No OpenAI API key found. Please set the OPENAI_API_KEY environment variable or add it to .streamlit/secrets.toml")
    
    return api_key

# Get the API key
api_key = get_api_key()

# Initialize the OpenAI client
client = OpenAI(api_key=api_key)

# Print the first few characters of the API key (for debugging)
print(f"API Key: {api_key[:5]}...")

# Initialize context blocks
context_blocks = {
    "Block 1": {"content": "This is the first context block.", "prompt": "Use this information:"},
    "Block 2": {"content": "This is the second context block.", "prompt": "Consider this:"}
}

def chat(message: str, history: List[List[str]], selected_block: str) -> List[List[str]]:
    # Handle case when no block is selected
    if selected_block is None or selected_block not in context_blocks:
        context = "No context block selected. Proceeding with general conversation."
    else:
        context = f"{context_blocks[selected_block]['prompt']} {context_blocks[selected_block]['content']}"
    
    # Prepare messages for OpenAI
    messages = [
        {"role": "system", "content": context},
        *[{"role": "user" if i % 2 == 0 else "assistant", "content": m} for pair in history for i, m in enumerate(pair)],
        {"role": "user", "content": message}
    ]
    
    # Get response from OpenAI using GPT-4o-mini
    response = client.chat.completions.create(
        model="gpt-4o-mini",  # Make sure this is the correct model name
        messages=messages
    )
    
    bot_message = response.choices[0].message.content
    
    # Return the new message pair
    return history + [[message, bot_message]]

def add_context_block(name: str, content: str, prompt: str):
    if name and name not in context_blocks:
        context_blocks[name] = {"content": content, "prompt": prompt}
    return list(context_blocks.keys()), "", "", ""

def get_block_content(block_name: str):
    if block_name in context_blocks:
        block = context_blocks[block_name]
        return block["content"], block["prompt"]
    return "", ""

def update_block_content(block_name: str, content: str, prompt: str):
    if block_name in context_blocks:
        context_blocks[block_name] = {"content": content, "prompt": prompt}
    return list(context_blocks.keys())

def create_interface():
    with gr.Blocks() as interface:
        gr.Markdown("# Structured Input/Output App")
        
        with gr.Row():
            with gr.Column(scale=1):
                gr.Markdown("## Navigation")
                block_dropdown = gr.Dropdown(
                    choices=list(context_blocks.keys()),
                    label="Select Context Block",
                    value=list(context_blocks.keys())[0] if context_blocks else None,
                    allow_custom_value=True
                )
                
                block_content = gr.Textbox(label="Block Content")
                block_prompt = gr.Textbox(label="Block Prompt")
                update_block_btn = gr.Button("Update Block")
                
                with gr.Accordion("Add New Context Block"):
                    new_block_name = gr.Textbox(label="Block Name")
                    new_block_content = gr.Textbox(label="Block Content")
                    new_block_prompt = gr.Textbox(label="Block Prompt")
                    add_block_btn = gr.Button("Add Block")
            
            with gr.Column(scale=2):
                chatbot = gr.Chatbot()
                msg = gr.Textbox()
                send = gr.Button("Send")
        
        send.click(chat, inputs=[msg, chatbot, block_dropdown], outputs=chatbot)
        add_block_btn.click(add_context_block, 
                            inputs=[new_block_name, new_block_content, new_block_prompt], 
                            outputs=[block_dropdown, new_block_name, new_block_content, new_block_prompt])
        block_dropdown.change(get_block_content, inputs=[block_dropdown], outputs=[block_content, block_prompt])
        update_block_btn.click(update_block_content, 
                               inputs=[block_dropdown, block_content, block_prompt], 
                               outputs=[block_dropdown])

    return interface

if __name__ == "__main__":
    interface = create_interface()
    interface.launch()