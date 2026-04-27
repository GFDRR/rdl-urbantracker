import os
from pathlib import Path
import yaml

import config
import mappers
import utils

def does_city_with_name_exist(city_name):
    """Check if a city with the given name already has a markdown file in _cities directory."""
    city_files = Path(config.cities_dir).glob("*.md")
    for city_file in city_files:
        frontmatter = utils.extract_yaml_frontmatter(city_file)
        if frontmatter and frontmatter.get("city", "").lower() == city_name.lower():
          return frontmatter["city_id"]
    return False

def does_city_with_id_exist(city_id):
    """Check if a city with the given id already has a markdown file in _cities directory."""
    city_files = Path(config.cities_dir).glob("*.md")
    for city_file in city_files:
        frontmatter = utils.extract_yaml_frontmatter(city_file)
        if frontmatter and frontmatter.get("city_id", "") == city_id:
          return frontmatter["city_id"]
    return False

def write_city_to_markdown(city):
    """Write datatypes to markdown files in _datatypes directory."""
    # Ensure output directory exists
    if not Path(config.cities_dir).is_dir():
        os.makedirs(config.cities_dir)
    
    frontmatter = mappers.make_city_frontmatter(city)
    write_city_frontmatter(frontmatter)

def write_city_frontmatter(metadata):
    """Write city frontmatter to markdown file."""
    filename = metadata.get("city_id", "unknown") + "-" + metadata.get("city", "unknown") + ".md"

    with open((Path(config.cities_dir) / filename), "w") as outfile:
        outfile.write("---\n")
        outfile.write(yaml.dump(metadata))
        outfile.write("---\n")