import uuid

def generate_guid():
    # Générer un UUID (Universally Unique Identifier)
    unique_id = uuid.uuid4()
    # Convertir l'UUID en une chaîne et retourner le nom de fichier avec une extension (par exemple, .txt)
    return str(unique_id)