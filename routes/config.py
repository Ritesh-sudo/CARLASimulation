from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Settings(BaseSettings):
    DB_USERNAME: str
    DB_PASSWORD: str
    DB_HOST: str
    DB_PORT: str
    DB_NAME: str

    MONGODB_USERNAME: str
    MONGODB_PASSWORD: str
    MONGODB_CLUSTER: str
    MONGODB_DATABASE: str
    MONGODB_COLLECTION: str

    ACCESS_TOKEN_EXPIRE_MINUTES: int 
    ALGORITHM: str 
    SECRET_KEY: str

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def MONGODB_URL(self):
        return f"mongodb+srv://{self.MONGODB_USERNAME}:{self.MONGODB_PASSWORD}@{self.MONGODB_CLUSTER}/{self.MONGODB_DATABASE}"

# Create a single instance of settings to be imported
settings = Settings()