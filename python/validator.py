import csv
import json
import logging

import config
from jsonschema import ValidationError, validate


def validate_datasets():
    """Validate datasets against schema and return validation errors."""
    validation_errors = []
    valid_datasets = []
    num_datasets = 0
    with open(config.datasets_schema_path, "r") as f:
        full_schema = json.load(f)
    dataset_schema = full_schema["definitions"]["dataset"]

    with open(config.datasets_input_csv_path, "r", newline="") as f:
        datasets = csv.DictReader(f)
        with open(
            config.datasets_input_json_path, mode="w", encoding="utf-8"
        ) as jsonfile:
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

            json.dump(list(valid_datasets), jsonfile, indent=4)

    with open(config.datasets_input_json_path, "r") as f:
        valid_datasets_json = json.load(f)

    if validation_errors:
        print(f"{len(validation_errors)} validation errors.")

    print(f"{num_datasets} datasets validated successfully.")
    return validation_errors, valid_datasets_json


def validate_datatypes():
    """Validate datatypes against schema and return validation errors."""
    validation_errors = []

    with open(config.datatypes_schema_path, "r") as f:
        full_schema = json.load(f)
    datatype_schema = full_schema["definitions"]["datatype"]

    with open(config.datatypes_input_path, "r") as f:
        datatypes = json.load(f)
    for datatype in datatypes:
        datatype_id = datatype.get("id", "unknown")
        datatype_name = datatype.get("name", "unnamed")
        try:
            validate(instance=datatype, schema=datatype_schema)
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

    if validation_errors:
        print(f"Datatype validation failed with {len(validation_errors)} error(s).")
    else:
        print(f"All {len(datatypes)} datatypes validated successfully.")

    return validation_errors, datatypes
