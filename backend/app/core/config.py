from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_prefix="MYHELIX_", extra="ignore")

    cors_origins: list[str] = ["http://localhost:3000"]
    max_upload_bytes: int = 50 * 1024 * 1024
    supabase_url: str = Field("", validation_alias="SUPABASE_URL")
    supabase_service_role_key: str = Field("", validation_alias="SUPABASE_SERVICE_ROLE_KEY")
    uploads_bucket: str = "genetic-uploads"


settings = Settings()
