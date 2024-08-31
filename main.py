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
from sqlalchemy.exc import SQLAlchemyError

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
SQLALCHEMY_DATABASE_URL = "sqlite:///./persistent_db.sqlite"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class ProjectModel(Base):
    __tablename__ = "projects"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, index=True)

class ContextBlockModel(Base):
    __tablename__ = "context_blocks"

    id = Column(String, primary_key=True, index=True)
    project_id = Column(String, ForeignKey("projects.id"))
    title = Column(String, index=True)
    content = Column(JSON)
    type = Column(String)

    project = relationship("ProjectModel", back_populates="context_blocks")

ProjectModel.context_blocks = relationship("ContextBlockModel", back_populates="project")

def recreate_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        create_default_project(db)
    finally:
        db.close()

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

class ProjectCreate(BaseModel):
    name: str

class ProjectUpdate(BaseModel):
    name: str

@app.post("/projects/{project_id}/context_blocks")
async def add_context_block(project_id: str, block: ContextBlock, db: Session = Depends(get_db)):
    db_block = ContextBlockModel(
        id=str(uuid4()),
        project_id=project_id,
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
    blocks = db.query(ContextBlockModel).filter(ContextBlockModel.project_id == project_id).all()
    return blocks

@app.put("/projects/{project_id}/context_blocks/{block_id}")
async def update_context_block(project_id: str, block_id: str, block: ContextBlock, db: Session = Depends(get_db)):
    db_block = db.query(ContextBlockModel).filter(ContextBlockModel.id == block_id, ContextBlockModel.project_id == project_id).first()
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
    db_block = db.query(ContextBlockModel).filter(ContextBlockModel.id == block_id, ContextBlockModel.project_id == project_id).first()
    if db_block is None:
        raise HTTPException(status_code=404, detail="Context block not found")
    db.delete(db_block)
    db.commit()
    return {"message": "Context block deleted successfully"}

@app.post("/projects/{project_id}/chat")
async def chat(project_id: str, request: ChatRequest, db: Session = Depends(get_db)):
    blocks = db.query(ContextBlockModel).filter(ContextBlockModel.project_id == project_id).all()
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
    db_block = db.query(ContextBlockModel).filter(ContextBlockModel.id == request.block_id, ContextBlockModel.project_id == project_id).first()
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

@app.post("/projects")
async def create_project(project: ProjectCreate, db: Session = Depends(get_db)):
    new_project = ProjectModel(id=str(uuid4()), name=project.name)
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    return new_project

@app.get("/projects")
async def get_projects(db: Session = Depends(get_db)):
    projects = db.query(ProjectModel).all()
    return projects

@app.get("/projects/{project_id}/context_blocks")
async def get_context_blocks(project_id: str, db: Session = Depends(get_db)):
    blocks = db.query(ContextBlockModel).filter(ContextBlockModel.project_id == project_id).all()
    return blocks

@app.post("/projects/{project_id}/context_blocks")
async def add_context_block(project_id: str, block: ContextBlock, db: Session = Depends(get_db)):
    db_block = ContextBlockModel(
        id=str(uuid4()),
        project_id=project_id,
        title=block.title,
        content=block.content,
        type=block.type
    )
    db.add(db_block)
    db.commit()
    db.refresh(db_block)
    return db_block

@app.post("/projects/{project_id}/chat")
async def chat(project_id: str, request: ChatRequest, db: Session = Depends(get_db)):
    blocks = db.query(ContextBlockModel).filter(ContextBlockModel.project_id == project_id).all()
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
    db_block = db.query(ContextBlockModel).filter(ContextBlockModel.id == request.block_id, ContextBlockModel.project_id == project_id).first()
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

@app.put("/projects/{project_id}")
async def update_project(project_id: str, project: ProjectUpdate, db: Session = Depends(get_db)):
    db_project = db.query(ProjectModel).filter(ProjectModel.id == project_id).first()
    if db_project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    db_project.name = project.name
    db.commit()
    db.refresh(db_project)
    return db_project

@app.delete("/projects/{project_id}")
async def delete_project(project_id: str, db: Session = Depends(get_db)):
    db_project = db.query(ProjectModel).filter(ProjectModel.id == project_id).first()
    if db_project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(db_project)
    db.commit()
    return {"message": "Project deleted successfully"}

def create_default_project(db: Session):
    default_project = ProjectModel(id=str(uuid4()), name="Default Project")
    db.add(default_project)
    db.commit()
    db.refresh(default_project)
    return default_project

@app.on_event("startup")
async def startup_event():
    create_tables()
    db = SessionLocal()
    try:
        projects = db.query(ProjectModel).all()
        if not projects:
            create_default_project(db)
    finally:
        db.close()

def create_tables():
    Base.metadata.create_all(bind=engine)

@app.post("/projects/{project_id}/fix_content")
async def fix_content(project_id: str, request: dict, db: Session = Depends(get_db)):
    block_id = request.get('block_id')
    content = request.get('content')
    
    # Call your AI model to fix the content
    fixed_content = await call_ai_model_to_fix(content)
    
    # Update the block in the database
    db_block = db.query(ContextBlockModel).filter(ContextBlockModel.id == block_id, ContextBlockModel.project_id == project_id).first()
    if db_block is None:
        raise HTTPException(status_code=404, detail="Context block not found")
    db_block.content = fixed_content
    db.commit()
    
    return {"fixed_content": fixed_content}

async def call_ai_model_to_fix(content: str):
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are an AI that fixes semantic issues and typos in text. Respond only with the corrected text, without any explanations or additional comments."},
            {"role": "user", "content": f"Fix any semantic issues and typos in the following text:\n\n{content}"}
        ]
    )
    return response.choices[0].message.content

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)