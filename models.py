from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

Base = declarative_base()

class Author(Base):
    __tablename__ = "authors"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    scholar_id = Column(String(100), unique=True, index=True)
    total_citations = Column(Integer, default=0)
    h_index = Column(Integer, default=0)
    i10_index = Column(Integer, default=0)
    last_updated = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    
    publications = relationship("Publication", back_populates="author")

class Publication(Base):
    __tablename__ = "publications"
    
    id = Column(Integer, primary_key=True, index=True)
    author_id = Column(Integer, ForeignKey("authors.id"), nullable=False)
    title = Column(Text, nullable=False)
    year = Column(Integer)
    citations = Column(Integer, default=0)
    bib_url = Column(Text)
    doi = Column(String(500))
    coauthors = Column(Text)
    scopus_verified = Column(Boolean, default=False)
    
    author = relationship("Author", back_populates="publications")
