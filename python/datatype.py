import csv
import json
from jsonschema import ValidationError, validate
import logging
import os
from pathlib import Path

import city as city_module
import config
import mappers
import utils
import yaml


def validate_input():
    """Validate datatypes against schema and return validation errors."""
    validation_errors = []
    valid_datatypes = []
    num_datatypes = 0

    with open(config.datatypes_input_csv_path, "r", newline="") as f:
        datatypes = csv.DictReader(f)

        for datatype in datatypes:
            datatype_id = datatype.get("ID", None)
            # filter out rows without IDs
            if not datatype_id:
                continue
            datatype_name = datatype.get("Name", "unnamed")
            try:
                valid_datatypes.append(
                    {
                        "ID": datatype["ID"],
                        "Name": datatype["Name"],
                        "Category": datatype["Category"],
                        "Description": datatype["Description"],
                        "Example Indicators": datatype["Example Indicators"],
                    }
                )
                num_datatypes += 1
            except ValidationError as e:
                error_message = str(e.message)
                schema_path = "/".join(str(item) for item in e.absolute_path)
                logging.error(
                    f"Validation error for datatype {datatype_name} (id: {datatype_id}): {error_message}"
                )
                validation_errors.append(
                    {
                        "datatype_id": datatype_id,
                        "datatype_name": datatype_name,
                        "message": error_message,
                        "schema_path": schema_path,
                    }
                )
        with open(
            config.datatypes_input_json_path, mode="w", encoding="utf-8"
        ) as datatypes_jsonfile:
            json.dump(list(valid_datatypes), datatypes_jsonfile, indent=4)

    if validation_errors:
        print(f"{len(validation_errors)} validation errors.")

    print(f"{num_datatypes} datatypes validated successfully.")
    return validation_errors


def write_datatypes_to_markdown():
    """Write datatypes to markdown files in _datatypes directory."""
    # Ensure output directory exists
    if not Path(config.datatypes_dir).is_dir():
        os.makedirs(config.datatypes_dir)

    validate_input()

    with open(config.datatypes_input_json_path, "r") as f:
        datatypes = json.load(f)
        for datatype in datatypes:
            frontmatter = mappers.make_datatype_frontmatter(datatype)
            write_datatype_frontmatter(frontmatter, config.datatypes_dir)

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
            write_datatype_category_frontmatter(
                frontmatter, config.datatype_categories_dir
            )

        print(
            f"Generated {len(categories)} datatype category markdown files in {config.datatype_categories_dir}."
        )


def write_datatype_frontmatter(metadata, output_path):
    """Write datatype frontmatter to markdown file."""
    filename = (
        utils.slugify(
            str(metadata.get("id", "unknown")) + "-" + metadata.get("title", "unknown"),
            allow_unicode=True,
        )
        + ".md"
    )

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
