def make_city_frontmatter(city):
    """Convert city metadata into JKAN frontmatter for a city"""
    return {
        "city_id": city["city_id"],
        "title": city["city_label"] + ", " + city["country_label"],
        "city": city["city_label"],
        "country": city["country_label"],
        "logo": city["city_flag"],
        "logo_credit": "Wikimedia",
    }


def make_datatype_frontmatter(datatype):
    """Convert datatype metadata into JKAN frontmatter for a datatype"""
    return {
        "title": datatype["Name"],
        "category": datatype["Category"],
        "description": datatype.get("Description", "")
    }


def make_datatype_category_frontmatter(category_name):
    """Convert category name into JKAN frontmatter for a datatype category"""
    return {
        "title": category_name,
        "description": f"Datatypes related to {category_name.lower()}"
    }


def make_dataset_frontmatter(dataset, city_id):
    """Formats metadata into JKAN frontmatter for a dataset"""
    payload = {
        # required; throw if missing
        "title": dataset["Example Dataset"],
        "external_url": dataset["Example URL"],
        "cities": [city_id],
        "datatypes": [dataset["Name"]],
    }

    return payload
