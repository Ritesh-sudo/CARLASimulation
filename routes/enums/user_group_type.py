from enum import Enum

class UserGroupType(Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    ADMIN = "ADMIN"
    OPERATOR = "OPERATOR"