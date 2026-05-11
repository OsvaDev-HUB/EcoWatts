import os
from sqlalchemy import create_all, create_engine
from dotenv import load_dotenv

load_dotenv()
uri = os.getenv('DATABASE_URL')
if uri and uri.startswith("postgres://"):
    uri = uri.replace("postgres://", "postgresql://", 1)

print(f"Testing connection to: {uri.split('@')[-1]}") # Hide credentials
try:
    engine = create_engine(uri)
    connection = engine.connect()
    print("Connection successful!")
    connection.close()
except Exception as e:
    print(f"Connection failed: {e}")
