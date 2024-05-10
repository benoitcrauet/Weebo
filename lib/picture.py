def ResizeMinimal(width, height, minimal_border):
    factor = max(minimal_border / width, minimal_border / height)

    new_width = int(width * factor)
    new_height = int(height * factor)
    
    return (new_width, new_height)

def ResizeMaximal(width, height, maximal_border):
    factor = min(maximal_border / width, maximal_border / height)

    new_width = int(width * factor)
    new_height = int(height * factor)
    
    return (new_width, new_height)
