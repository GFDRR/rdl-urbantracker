import os
from pathlib import Path

import config
import json
import mappers
import utils
import yaml


def write_datatypes_to_markdown():
    """Write datatypes to markdown files in _datatypes directory."""
    # Ensure output directory exists
    if not Path(config.datatypes_dir).is_dir():
        os.makedirs(config.datatypes_dir)

    with open(config.datatypes_input_json_path, "r") as f:
        datatypes = json.load(f)
        for datatype in datatypes:
            frontmatter = mappers.make_datatype_frontmatter(datatype)
            # Add id to frontmatter for filename generation
            frontmatter_with_id = frontmatter.copy()
            frontmatter_with_id["id"] = int(datatype["ID"])
            write_datatype_frontmatter(frontmatter_with_id, config.datatypes_dir)

        print(
            f"Generated {len(datatypes)} datatype markdown files in {config.datatypes_dir}."
        )


def write_datatype_categories_to_markdown():
    """Write unique datatype categories to markdown files in _datatype_categories directory."""
    # Ensure output directory exists
    if not Path(config.datatype_categories_dir).is_dir():
        os.makedirs(config.datatype_categories_dir)

    with open(config.datatypes_input_json_path, "r") as f:
        datatypes = json.load(f)
        categories = set()
        for datatype in datatypes:
            category = datatype["Category"]
            if category:
                categories.add(category)

        for category_name in sorted(categories):
            frontmatter = mappers.make_datatype_category_frontmatter(category_name)
            write_datatype_category_frontmatter(frontmatter, config.datatype_categories_dir)

        print(
            f"Generated {len(categories)} datatype category markdown files in {config.datatype_categories_dir}."
        )


def write_datatype_frontmatter(metadata, output_path):
    """Write datatype frontmatter to markdown file."""
    filename = utils.slugify(str(metadata.get("id", "unknown")) + "-" + metadata.get("title", "unknown"), allow_unicode=True) + ".md"

    with open((Path(output_path) / filename), "w") as outfile:
        outfile.write("---\n")
        outfile.write(yaml.dump(metadata))
        outfile.write("---\n")


def write_datatype_category_frontmatter(metadata, output_path):
    """Write datatype category frontmatter to markdown file using slugified title as filename."""
    filename = (
        utils.slugify(metadata.get("title", "unknown"), allow_unicode=True) + ".md"
    )

    with open((Path(output_path) / filename), "w") as outfile:
        outfile.write("---\n")
        outfile.write(yaml.dump(metadata))
        outfile.write("---\n")
