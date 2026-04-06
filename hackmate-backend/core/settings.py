from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    JWT_KEY: str = "SOMEVERYSECRETANDLOOOOOONGJWTKEY"

settings = Settings()