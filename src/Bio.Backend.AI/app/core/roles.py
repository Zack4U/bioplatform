from enum import Enum

class UserRole(str, Enum):
    """
    Role definitions that mirror the .NET Core backend Roles table.
    Used for authorization via the `require_role` dependency.
    """
    ADMIN = "ADMIN"
    RESEARCHER = "RESEARCHER"
    ENTREPRENEUR = "ENTREPRENEUR"
    COMMUNITY = "COMMUNITY"
    BUYER = "BUYER"
    ENVIRONMENTAL_AUTHORITY = "AUTHORITY"
