import yaml


def getLinksConstraints():
    constraints = []

    try:
        with open("links.yaml", "r") as file:
            linksConfig = yaml.safe_load(file)

            if "constraints" in linksConfig:
                for c in linksConfig["constraints"]:
                    if "pattern" in c and "ignoreCase" in c and "description" in c and "refuse" in c and "alert" in c:
                        newConstraint = {
                            "pattern": str(c["pattern"]),
                            "ignoreCase": c["ignoreCase"]==True,
                            "description": str(c["description"]),
                            "refuse": c["refuse"]==True,
                            "alert": str(c["alert"])
                        }
                        constraints.append(newConstraint)

    except Exception as e:
        print("Erreur lors du chargement du YAML de configuration des liens: {}".format(e))
    
    return constraints