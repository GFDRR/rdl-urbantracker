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
    """Validate datasets against schema and return validation errors."""
    validation_errors = []
    valid_datasets = []
    num_datasets = 0
    
    with open(config.datasets_schema_path, "r") as f:
        full_schema = json.load(f)
    dataset_schema = full_schema["definitions"]["dataset"]

    with open(config.datasets_input_csv_path, "r", newline="") as f:
        datasets = csv.DictReader(f)

        for dataset in datasets:
            dataset_id = dataset.get("ID", "unknown")
            dataset_name = dataset.get("Example Dataset", "unnamed")
            try:
                validate(instance=dataset, schema=dataset_schema)
                valid_datasets.append(dataset)
                num_datasets += 1
            except ValidationError as e:
                error_message = str(e.message)
                schema_path = "/".join(str(item) for item in e.absolute_path)
                logging.error(
                    f"Validation error for dataset {dataset_name} (id: {dataset_id}): {error_message}"
                )
                validation_errors.append(
                    {
                        "dataset_id": dataset_id,
                        "dataset_name": dataset_name,
                        "message": error_message,
                        "schema_path": schema_path,
                    }
                )

        with open(
            config.datasets_input_json_path, mode="w", encoding="utf-8"
        ) as datasets_jsonfile:
            json.dump(list(valid_datasets), datasets_jsonfile, indent=4)

    if validation_errors:
        print(f"{len(validation_errors)} validation errors.")

    print(f"{num_datasets} datasets validated successfully.")
    return validation_errors


def write_datasets_to_markdown():
    """Write datasets to markdown files in _datasets directory."""
    # Ensure output directory exists
    if not Path(config.datasets_dir).is_dir():
        os.makedirs(config.datasets_dir)
    validate_input()

    with open(config.datasets_input_json_path, "r") as f:
        datasets = json.load(f)
        num_datasets = 0
        for dataset in datasets:
            city_id = city_module.does_city_with_name_exist(dataset["City"])
            if city_id:
                frontmatter = mappers.make_dataset_frontmatter(dataset, city_id)
                write_dataset_frontmatter(frontmatter, config.datasets_dir)
                num_datasets += 1
            else:
                try:
                    city = utils.search_wikidata_for_city(dataset["City"])
                    city_id = city_module.does_city_with_id_exist(city["city_id"])
                    if not city_id:
                        city_module.write_city_to_markdown(city)
                    frontmatter = mappers.make_dataset_frontmatter(
                        dataset, city["city_id"]
                    )
                    write_dataset_frontmatter(frontmatter, config.datasets_dir)
                    num_datasets += 1
                except Exception as e:
                    print(
                        f"Error creating frontmatter for dataset {dataset.get('ID', 'unknown')}: {e}"
                    )

        print(
            f"Generated {num_datasets} dataset markdown files in {config.datasets_dir}."
        )


def write_dataset_frontmatter(metadata, output_path):
    """Write dataset frontmatter to markdown file."""
    filename = utils.slugify(metadata.get("title", "unknown")) + ".md"

    with open((Path(output_path) / filename), "w") as outfile:
        outfile.write("---\n")
        outfile.write(yaml.dump(metadata))
        outfile.write("---\n")
