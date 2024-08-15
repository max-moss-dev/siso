import openai
import streamlit as st
from sqlalchemy import create_engine, Column, Integer, String, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from typing import List, Dict, Any

# Set up the app
st.set_page_config(page_title="Structured Input/Output App", layout="wide")
st.title("Structured Input/Output App")

# Set up OpenAI API key from Streamlit secrets
client = openai.OpenAI(api_key=st.secrets["OPENAI_API_KEY"])

# Database setup
engine = create_engine('sqlite:///app_data.db', echo=True)
Base = declarative_base()
Session = sessionmaker(bind=engine)

class ContextBlockDB(Base):
    __tablename__ = 'context_blocks'

    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True)
    block_type = Column(String)
    content = Column(Text)
    prompt = Column(Text)
    io_type = Column(String)

class ChatMessage(Base):
    __tablename__ = 'chat_history'

    id = Column(Integer, primary_key=True)
    role = Column(String)
    content = Column(Text)

Base.metadata.create_all(engine)

# Initialize session state
if "openai_model" not in st.session_state:
    st.session_state["openai_model"] = "gpt-4-1106-preview"
if "clear_inputs" not in st.session_state:
    st.session_state.clear_inputs = False

# Define context block class for application logic
class ContextBlock:
    def __init__(self, name: str, block_type: str, content: str, prompt: str, io_type: str):
        self.name = name
        self.block_type = block_type
        self.content = content
        self.prompt = prompt
        self.io_type = io_type

# Database functions
def get_context_blocks():
    session = Session()
    blocks = session.query(ContextBlockDB).all()
    session.close()
    return [ContextBlock(b.name, b.block_type, b.content, b.prompt, b.io_type) for b in blocks]

def add_context_block_to_db(block: ContextBlock):
    session = Session()
    db_block = ContextBlockDB(name=block.name, block_type=block.block_type, 
                              content=block.content, prompt=block.prompt, io_type=block.io_type)
    session.add(db_block)
    session.commit()
    session.close()

def update_context_block_in_db(block: ContextBlock):
    session = Session()
    db_block = session.query(ContextBlockDB).filter_by(name=block.name).first()
    db_block.content = block.content
    db_block.prompt = block.prompt
    session.commit()
    session.close()

def delete_context_block_from_db(block_name: str):
    session = Session()
    block = session.query(ContextBlockDB).filter_by(name=block_name).first()
    session.delete(block)
    session.commit()
    session.close()

def get_chat_history():
    session = Session()
    messages = session.query(ChatMessage).all()
    session.close()
    return [{"role": msg.role, "content": msg.content} for msg in messages]

def add_message_to_db(role: str, content: str):
    session = Session()
    message = ChatMessage(role=role, content=content)
    session.add(message)
    session.commit()
    session.close()

def clear_chat_history():
    session = Session()
    session.query(ChatMessage).delete()
    session.commit()
    session.close()

# Function to get response from OpenAI
def get_openai_response(messages: List[Dict[str, str]], context_blocks: List[ContextBlock]) -> str:
    # Prepare context from blocks
    context = "\n\n".join([f"{block.name}:\n{block.content}\n\nPrompt: {block.prompt}" for block in context_blocks])
    
    # Add context to the messages
    messages = [{"role": "system", "content": f"Context:\n{context}"}] + messages
    
    response = client.chat.completions.create(
        model=st.session_state["openai_model"],
        messages=messages
    )
    return response.choices[0].message.content.strip()

# Function to handle user input
def handle_user_input():
    user_input = st.session_state.user_input
    if user_input:
        add_message_to_db("user", user_input)
        with st.chat_message("user"):
            st.markdown(f"**You:** {user_input}")
        
        context_blocks = get_context_blocks()
        messages = get_chat_history()
        with st.chat_message("assistant"):
            response = get_openai_response(messages, context_blocks)
            st.markdown(f"**Assistant:** {response}")
        
        add_message_to_db("assistant", response)
        st.session_state.user_input = ""

# Function to add a new context block
def add_context_block():
    name = st.session_state.new_block_name
    block_type = st.session_state.new_block_type
    content = st.session_state.new_block_content
    prompt = st.session_state.new_block_prompt
    io_type = st.session_state.new_block_io_type
    
    if name and block_type and content and prompt and io_type:
        new_block = ContextBlock(name, block_type, content, prompt, io_type)
        add_context_block_to_db(new_block)
        st.session_state.clear_inputs = True
        st.rerun()

# Function to clear input fields
def clear_inputs():
    if st.session_state.clear_inputs:
        st.session_state.new_block_name = ""
        st.session_state.new_block_content = ""
        st.session_state.new_block_prompt = ""
        st.session_state.clear_inputs = False

# Sidebar for navigation
st.sidebar.title("Navigation")
navigation_options = ["Chat", "Add New Block"] + [block.name for block in get_context_blocks()]
section = st.sidebar.radio("Go to", navigation_options)

# Main content
if section == "Chat":
    st.header("Chat with OpenAI")
    
    # Display chat history
    for message in get_chat_history():
        with st.chat_message(message["role"]):
            st.markdown(f"**{message['role'].capitalize()}:** {message['content']}")
    
    # Chat input
    st.text_input("You:", key="user_input", on_change=handle_user_input)
    
    if st.button("Clear Chat"):
        clear_chat_history()
        st.rerun()

elif section == "Add New Block":
    st.header("Add New Context Block")
    clear_inputs()  # Call this function to clear inputs when necessary
    st.text_input("Block Name:", key="new_block_name")
    st.selectbox("Block Type:", ["text", "code", "table", "canvas"], key="new_block_type")
    st.text_area("Block Content:", key="new_block_content")
    st.text_area("Block Prompt:", key="new_block_prompt")
    st.selectbox("I/O Type:", ["input only", "input and output"], key="new_block_io_type")
    if st.button("Add Context Block"):
        add_context_block()

else:  # Display selected context block
    block = next((block for block in get_context_blocks() if block.name == section), None)
    if block:
        st.header(f"Context Block: {block.name}")
        content = st.text_area(f"Content", value=block.content, key=f"block_content_{block.name}")
        prompt = st.text_area(f"Prompt", value=block.prompt, key=f"block_prompt_{block.name}")
        st.text(f"Block Type: {block.block_type}")
        st.text(f"I/O Type: {block.io_type}")
        col1, col2 = st.columns(2)
        with col1:
            if st.button(f"Delete Block"):
                delete_context_block_from_db(block.name)
                st.rerun()
        with col2:
            if st.button(f"Update Block"):
                block.content = content
                block.prompt = prompt
                update_context_block_in_db(block)
                st.rerun()