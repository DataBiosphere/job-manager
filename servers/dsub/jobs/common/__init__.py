import os
import sys


def enum(**enums):
    """Enable use of enums by utilizing types"""
    return type('Enum', (), enums)


def execute_redirect_stdout(command, writer = os.devnull):
    stdout = sys.stdout
    sys.stdout = open(writer, 'w')
    return_val = command()
    sys.stdout = stdout
    return return_val
