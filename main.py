from fastapi import FastAPI, HTTPException, Depends, Path
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional, Union
from openai import OpenAI
import os
from dotenv import load_dotenv
import logging
from sqlalchemy import create_engine, Column, String, JSON, ForeignKey, inspect
from sqlalchemy.orm import sessionmaker, Session, relationship, declarative_base
from uuid import uuid4

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./context_blocks.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class InstanceModel(Base):
    __tablename__ = "instances"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, index=True)

class ContextBlockModel(Base):
    __tablename__ = "context_blocks"

    id = Column(String, primary_key=True, index=True)
    instance_id = Column(String, ForeignKey("instances.id"))
    title = Column(String, index=True)
    content = Column(JSON)
    type = Column(String)

    instance = relationship("InstanceModel", back_populates="context_blocks")

InstanceModel.context_blocks = relationship("ContextBlockModel", back_populates="instance")

def recreate_database():
    inspector = inspect(engine)
    if 'context_blocks' in inspector.get_table_names():
        ContextBlockModel.__table__.drop(engine)
    Base.metadata.create_all(bind=engine)

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class ContextBlock(BaseModel):
    title: str
    content: Union[str, List[str]]
    type: str

class ChatRequest(BaseModel):
    message: str
    history: List[Dict[str, str]]

class GenerateContentRequest(BaseModel):
    block_id: str

@app.post("/projects/{project_id}/context_blocks")
async def add_context_block(project_id: str, block: ContextBlock, db: Session = Depends(get_db)):
    db_block = ContextBlockModel(
        id=str(uuid4()),
        title=block.title,
        content=block.content,
        type=block.type
    )
    db.add(db_block)
    db.commit()
    db.refresh(db_block)
    return db_block

@app.get("/projects/{project_id}/context_blocks")
async def get_context_blocks(project_id: str, db: Session = Depends(get_db)):
    blocks = db.query(ContextBlockModel).all()
    return blocks

@app.put("/projects/{project_id}/context_blocks/{block_id}")
async def update_context_block(project_id: str, block_id: str, block: ContextBlock, db: Session = Depends(get_db)):
    db_block = db.query(ContextBlockModel).filter(ContextBlockModel.id == block_id).first()
    if db_block is None:
        raise HTTPException(status_code=404, detail="Context block not found")
    db_block.title = block.title
    db_block.content = block.content
    db_block.type = block.type
    db.commit()
    db.refresh(db_block)
    return db_block

@app.delete("/projects/{project_id}/context_blocks/{block_id}")
async def delete_context_block(project_id: str, block_id: str, db: Session = Depends(get_db)):
    db_block = db.query(ContextBlockModel).filter(ContextBlockModel.id == block_id).first()
    if db_block is None:
        raise HTTPException(status_code=404, detail="Context block not found")
    db.delete(db_block)
    db.commit()
    return {"message": "Context block deleted successfully"}

@app.post("/projects/{project_id}/chat")
async def chat(project_id: str, request: ChatRequest, db: Session = Depends(get_db)):
    blocks = db.query(ContextBlockModel).all()
    context = "\n".join([f"{block.title}: {block.content}" for block in blocks])
    
    messages = [
        {"role": "system", "content": f"Context:\n{context}\n\nUse the above context to answer the user's questions."},
        *request.history,
        {"role": "user", "content": request.message}
    ]
    
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages
    )
    
    bot_message = response.choices[0].message.content
    return {"response": bot_message}

@app.post("/projects/{project_id}/generate_content")
async def generate_content(project_id: str, request: GenerateContentRequest, db: Session = Depends(get_db)):
    db_block = db.query(ContextBlockModel).filter(ContextBlockModel.id == request.block_id).first()
    if db_block is None:
        raise HTTPException(status_code=404, detail="Context block not found")

    prompt = f"Generate content for a context block with the title '{db_block.title}'. The content should be in {db_block.type} format."
    
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are a helpful assistant that generates content for context blocks."},
            {"role": "user", "content": prompt}
        ]
    )
    
    generated_content = response.choices[0].message.content
    
    if db_block.type == 'list':
        generated_content = generated_content.split('\n')
    
    db_block.content = generated_content
    db.commit()
    db.refresh(db_block)
    
    return {"content": generated_content}

@app.post("/instances")
async def create_instance(db: Session = Depends(get_db)):
    new_instance = InstanceModel(id=str(uuid4()), name=f"Instance {uuid4().hex[:8]}")
    db.add(new_instance)
    db.commit()
    db.refresh(new_instance)
    return new_instance

@app.get("/instances")
async def get_instances(db: Session = Depends(get_db)):
    instances = db.query(InstanceModel).all()
    return instances

@app.get("/instances/{instance_id}/context_blocks")
async def get_context_blocks(instance_id: str, db: Session = Depends(get_db)):
    blocks = db.query(ContextBlockModel).filter(ContextBlockModel.instance_id == instance_id).all()
    return blocks

@app.post("/instances/{instance_id}/context_blocks")
async def add_context_block(instance_id: str, block: ContextBlock, db: Session = Depends(get_db)):
    db_block = ContextBlockModel(
        id=str(uuid4()),
        instance_id=instance_id,
        title=block.title,
        content=block.content,
        type=block.type
    )
    db.add(db_block)
    db.commit()
    db.refresh(db_block)
    return db_block

@app.post("/instances/{instance_id}/chat")
async def chat(instance_id: str, request: ChatRequest, db: Session = Depends(get_db)):
    blocks = db.query(ContextBlockModel).filter(ContextBlockModel.instance_id == instance_id).all()
    context = "\n".join([f"{block.title}: {block.content}" for block in blocks])
    
    messages = [
        {"role": "system", "content": f"Context:\n{context}\n\nUse the above context to answer the user's questions."},
        *request.history,
        {"role": "user", "content": request.message}
    ]
    
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages
    )
    
    bot_message = response.choices[0].message.content
    return {"response": bot_message}

@app.post("/instances/{instance_id}/generate_content")
async def generate_content(instance_id: str, request: GenerateContentRequest, db: Session = Depends(get_db)):
    db_block = db.query(ContextBlockModel).filter(ContextBlockModel.id == request.block_id, ContextBlockModel.instance_id == instance_id).first()
    if db_block is None:
        raise HTTPException(status_code=404, detail="Context block not found")

    prompt = f"Generate content for a context block with the title '{db_block.title}'. The content should be in {db_block.type} format."
    
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are a helpful assistant that generates content for context blocks."},
            {"role": "user", "content": prompt}
        ]
    )
    
    generated_content = response.choices[0].message.content
    
    if db_block.type == 'list':
        generated_content = generated_content.split('\n')
    
    db_block.content = generated_content
    db.commit()
    db.refresh(db_block)
    
    return {"content": generated_content}

@app.put("/instances/{instance_id}/context_blocks/{block_id}")
async def update_context_block(instance_id: str, block_id: str, block: ContextBlock, db: Session = Depends(get_db)):
    db_block = db.query(ContextBlockModel).filter(ContextBlockModel.id == block_id, ContextBlockModel.instance_id == instance_id).first()
    if db_block is None:
        raise HTTPException(status_code=404, detail="Context block not found")
    
    db_block.title = block.title
    db_block.content = block.content
    db_block.type = block.type
    
    db.commit()
    db.refresh(db_block)
    return db_block

if __name__ == "__main__":
    recreate_database()
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)