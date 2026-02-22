from pydantic_settings import BaseSettings
from typing import Optional, List
import os

# Get the parent directory (project root)
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
env_file_path = os.path.join(project_root, ".env.local")


class Settings(BaseSettings):
    # Database Configuration
    database_url: str = ""

    # Application Configuration
    app_name: str = "Adidas Sales API"
    app_version: str = "1.0.0"
    debug: bool = True

    # CORS Configuration
    cors_origins: str = (
        "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3002"
    )

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]

    # Server Configuration
    host: str = "127.0.0.1"
    port: int = 8000

    class Config:
        env_file = env_file_path
        case_sensitive = False


settings = Settings()
