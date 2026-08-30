from app.extensions import db
from app.models import UserSettings

class SettingsService:
    """Manages retrieving and updating UserSettings with exact constraints and validation."""

    SUPPORTED_MODES = ["relaxed", "balanced", "strict"]
    SUPPORTED_THEMES = ["LIGHT", "DARK", "SYSTEM"]

    @classmethod
    def get_or_create_settings(cls, user_id):
        """
        Retrieves UserSettings for a user.
        If no settings record exists, creates one with default values.
        """
        settings = db.session.query(UserSettings).filter_by(user_id=user_id).first()
        
        if not settings:
            # Create default settings record
            settings = UserSettings(
                user_id=user_id,
                email_notifications=True,
                default_analysis_mode='balanced',
                theme='dark'
            )
            db.session.add(settings)
            db.session.commit()
            
        return settings

    @classmethod
    def get_settings(cls, user_id):
        """Returns the user settings mapped to API presentation schema."""
        settings = cls.get_or_create_settings(user_id)
        
        return {
            "email_notifications": settings.email_notifications,
            "default_analysis_mode": settings.default_analysis_mode,
            "theme": settings.theme.upper()
        }

    @classmethod
    def update_settings(cls, user_id, updates):
        """
        Validates updates and applies them to the user settings.
        Accepts partial updates.
        """
        if not isinstance(updates, dict):
            raise ValueError("Updates payload must be a dictionary.")

        # Clean/filter updates to allowed fields only
        validated_updates = {}

        # 1. email_notifications validation
        if "email_notifications" in updates:
            val = updates["email_notifications"]
            # Strict boolean check (reject strings "true", 1, etc.)
            if not isinstance(val, bool):
                raise ValueError("Field 'email_notifications' must be a boolean.")
            validated_updates["email_notifications"] = val

        # 2. default_analysis_mode validation
        if "default_analysis_mode" in updates:
            val = updates["default_analysis_mode"]
            if not isinstance(val, str):
                raise ValueError("Field 'default_analysis_mode' must be a string.")
            mode_lower = val.lower().strip()
            if mode_lower not in cls.SUPPORTED_MODES:
                raise ValueError(f"Field 'default_analysis_mode' must be one of: {', '.join(cls.SUPPORTED_MODES)}.")
            validated_updates["default_analysis_mode"] = mode_lower

        # 3. theme validation
        if "theme" in updates:
            val = updates["theme"]
            if not isinstance(val, str):
                raise ValueError("Field 'theme' must be a string.")
            theme_upper = val.upper().strip()
            if theme_upper not in cls.SUPPORTED_THEMES:
                raise ValueError(f"Field 'theme' must be one of: {', '.join(cls.SUPPORTED_THEMES)}.")
            validated_updates["theme"] = theme_upper.lower()

        # Retrieve settings record (forces creation if somehow missing)
        settings = cls.get_or_create_settings(user_id)

        # Apply updates
        for field, new_val in validated_updates.items():
            setattr(settings, field, new_val)

        db.session.commit()

        # Return serialized settings
        return {
            "email_notifications": settings.email_notifications,
            "default_analysis_mode": settings.default_analysis_mode,
            "theme": settings.theme.upper()
        }
