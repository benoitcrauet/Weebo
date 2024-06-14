import hashlib
import codecs
import hashlib

def generateVdoRoomID(guid):
    guid_bytes = guid.encode("utf-8")
    hash_object = hashlib.sha256(guid_bytes)
    hash_hex = hash_object.hexdigest()
    return hash_hex[:30]

def generateVdoRemoteHash(guid):
    guid_bytes = codecs.encode(guid, "rot_13").encode("utf-8")
    hash_object = hashlib.sha256(guid_bytes)
    hash_hex = hash_object.hexdigest()
    return hash_hex[:24]

def generateVdoCoDirectorHash(guid):
    guid_bytes = codecs.encode(codecs.encode(guid, "rot_13"), "rot_13").encode("utf-8")
    hash_object = hashlib.sha256(guid_bytes)
    hash_hex = hash_object.hexdigest()
    return hash_hex[:12]

def generateVdoGuestHash(guid, key):
    combined = f"{key}-{guid}"
    guid_bytes = combined.encode("utf-8")
    hash_object = hashlib.sha256(guid_bytes)
    hash_hex = hash_object.hexdigest()
    return hash_hex[:12]

def generateVdoHash(password, salt="vdo.ninja", length=4):
    encoded_text = "{}{}".format(password, salt).encode('utf-8')
    hash_object = hashlib.sha256(encoded_text)
    hash_hex = hash_object.hexdigest()

    if length:
        hash_hex = hash_hex[:length]

    return hash_hex
