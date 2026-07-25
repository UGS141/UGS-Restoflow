from pydantic_settings import BaseSettings
from pydantic import Field
from typing import Optional

class Settings(BaseSettings):
    ENVIRONMENT: str = Field(default="development", env="ENVIRONMENT")
    
    # Database URIs
    MONGO_URI: str = Field(default="mongodb://localhost:27017/ugs_restoflow", env="MONGO_URI")
    REDIS_URI: str = Field(default="redis://localhost:6379/0", env="REDIS_URI")
    
    # Security Configuration
    JWT_SECRET: str = Field(default="supersecretjwtkeyforugsrestoflowdev123!", env="JWT_SECRET")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # External APIs
    GEMINI_API_KEY: Optional[str] = Field(default=None, env="GEMINI_API_KEY")
    
    # Platform settings
    APP_NAME: str = "UGS-Restoflow"
    API_V1_STR: str = "/api/v1"
    
    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
