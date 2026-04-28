import csv
import json
import logging

import config
from jsonschema import ValidationError, validate


def validate_input():
    """Validate datasets against schema and return validation errors."""
    validation_errors = []
    valid_datasets = []
    num_datasets = 0
    valid_datatypes = []
    num_datatypes = 0
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
                valid_datatypes.append({
                    "ID": dataset["ID"],
                    "Name": dataset["Name"],
                    "Category": dataset["Category"],
                })
                num_datatypes += 1
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
        with open(
            config.datatypes_input_json_path, mode="w", encoding="utf-8"
        ) as datatypes_jsonfile:
            json.dump(list(valid_datatypes), datatypes_jsonfile, indent=4)

    if validation_errors:
        print(f"{len(validation_errors)} validation errors.")

    print(f"{num_datasets} datasets validated successfully.")
    print(f"{num_datatypes} datatypes validated successfully.")
    return validation_errors
