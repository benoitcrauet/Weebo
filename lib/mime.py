import mimetypes

def get_mime(file_path):
    mime, _ = mimetypes.guess_type(file_path)
    return mime

def mime_extract_type(mime):
    ar = mime.split("/")
    return ar[0]

def mime_extract_subtype(mime):
    ar = mime.split("/")
    return ar[1]
