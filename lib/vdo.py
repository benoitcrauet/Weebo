import hashlib

def generateVdoRoomID(guid):
    guid_bytes = guid.encode("utf-8")
    hash_object = hashlib.sha256(guid_bytes)
    hash_hex = hash_object.hexdigest()
    return hash_hex[:32]

def generateVdoGuestHash(guid, key):
    combined = f"{key}-{guid}"
    guid_bytes = combined.encode("utf-8")
    hash_object = hashlib.sha256(guid_bytes)
    hash_hex = hash_object.hexdigest()
    return hash_hex[:6]
