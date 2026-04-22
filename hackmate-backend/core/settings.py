from pydantic_settings import BaseSettings
from cryptography.fernet import Fernet

class Settings(BaseSettings):
    JWT_KEY: str = "SOMEVERYSECRETANDLOOOOOONGJWTKEY"
    CLIENT_ID: str = "Iv23liPhgjoZli6ufsML"
    CLIENT_SECRET: str = "344548283c2b0ff9db1c34a3e2b87c9f74cc0475"
    SESSION_KEY: str = "LOREMIPSUMDOLORSITAMET"
    TOKEN_KEY: bytes = b"_A1In8dhi50kuJHAM6EiDjM-BDkpFefBVgSPA6Utcm0=" # Fernet.generate_key()

settings = Settings()