def enum(**enums):
    """Enable use of enums by utilizing types"""
    return type('Enum', (), enums)
