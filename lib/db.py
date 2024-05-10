from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from lib.arguments import arguments

db_file = "database.db"

engine = create_engine(f"sqlite:///{db_file}", echo=(arguments.debug))

Session = sessionmaker(bind=engine)
session = Session()

Base = declarative_base()
