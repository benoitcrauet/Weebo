import random
import string

def generate_password(length=10):
    if length < 10:
        raise ValueError("Password length must be at least 10 characters")
    
    # Define the character sets to use
    lowercase = string.ascii_lowercase
    uppercase = string.ascii_uppercase
    digits = string.digits
    special_chars = string.punctuation

    # Ensure the password has at least one character from each set
    password = [
        random.choice(lowercase),
        random.choice(uppercase),
        random.choice(digits),
        random.choice(special_chars)
    ]

    # Fill the rest of the password length with a random selection from all character sets
    all_chars = lowercase + uppercase + digits + special_chars
    password += random.choices(all_chars, k=length - len(password))

    # Shuffle the list to ensure randomness
    random.shuffle(password)

    # Convert the list to a string
    return ''.join(password)
