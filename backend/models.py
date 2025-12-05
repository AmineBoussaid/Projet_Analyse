import os
from sqlalchemy import create_engine, Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import declarative_base, relationship, sessionmaker

DB_FILE = 'data/index.db'
os.makedirs(os.path.dirname(DB_FILE), exist_ok=True)
engine = create_engine(f'sqlite:///{DB_FILE}', echo=False, future=True)
Session = sessionmaker(bind=engine)
Base = declarative_base()


class File(Base):
    __tablename__ = 'files'
    id = Column(Integer, primary_key=True)
    filename = Column(String, nullable=False)
    path = Column(String, nullable=False)
    size = Column(Integer, default=0)
    word_count = Column(Integer, default=0)
    removed = Column(Integer, default=0)
    sample = Column(Text)
    lemmas = relationship('Lemma', back_populates='file', cascade='all, delete-orphan')


class Lemma(Base):
    __tablename__ = 'lemmas'
    id = Column(Integer, primary_key=True)
    file_id = Column(Integer, ForeignKey('files.id'))
    lemma = Column(String, index=True)
    count = Column(Integer, default=0)
    file = relationship('File', back_populates='lemmas')


def init_db():
    Base.metadata.create_all(engine)


def save_indexed(indexed_list):
    """Save a list of indexed file dicts into the SQLite DB."""
    session = Session()
    try:
        for item in indexed_list:
            f = File(
                filename=item.get('filename'),
                path=item.get('path'),
                size=item.get('size') or 0,
                word_count=item.get('word_count') or 0,
                removed=item.get('removed') or 0,
                sample=item.get('text_sample') or ''
            )
            session.add(f)
            session.flush()
            lemmas = item.get('lemmas', {}) or {}
            for lemma, cnt in lemmas.items():
                l = Lemma(file_id=f.id, lemma=lemma, count=cnt)
                session.add(l)
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def query_files_by_lemma(lemma):
    session = Session()
    try:
        rows = session.query(File).join(Lemma).filter(Lemma.lemma == lemma).all()
        result = []
        for f in rows:
            result.append({
                'filename': f.filename,
                'path': f.path,
                'size': f.size,
                'word_count': f.word_count,
                'removed': f.removed,
            })
        return result
    finally:
        session.close()
