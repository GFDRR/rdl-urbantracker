import csv
import os
from pathlib import Path

import config
import mappers
import utils
import yaml


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
    filename = (
        metadata.get("city_id", "unknown")
        + "-"
        + metadata.get("city", "unknown")
        + ".md"
    )

    with open((Path(config.cities_dir) / filename), "w") as outfile:
        outfile.write("---\n")
        outfile.write(yaml.dump(metadata))
        outfile.write("---\n")

def write_cities_to_markdown():
    """Write cities to markdown files in _cities directory."""
    # Ensure output directory exists
    if not Path(config.cities_dir).is_dir():
        os.makedirs(config.cities_dir)

    with open(config.cities_input_csv_path, "r", newline="") as f:
        cities_reader = csv.DictReader(f)
        cities_count = 0
        for row in cities_reader:
            primary_city = row.get('Primary City')
            secondary_cities = row.get('Secondary Cities').split(', ')
            country = row.get('Country')
            cities_in_row =  [primary_city, *secondary_cities] if secondary_cities else [primary_city]
            for city_name in cities_in_row:
                city = utils.search_wikidata_for_city(city_name + ' ' + country)
                if city:
                    write_city_to_markdown(city)
                    cities_count += 1

        print(
            f"Generated {cities_count} city markdown files in {config.cities_dir}."
        )