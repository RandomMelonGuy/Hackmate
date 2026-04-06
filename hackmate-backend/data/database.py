from sqlmodel import create_engine
from sqlalchemy import event

engine = create_engine("sqlite:///data/data.db")

@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()
    print("✅ Foreign keys enabled for this connection")