from jsonschema import validate, validators, ValidationError
import json
import logging
from pathlib import Path
import config

# Configuration
RESULTS_PATH = Path(__file__).parent / "validation_results.json"


def custom_properties(validator, properties, instance, schema):
    if not validator.is_type(instance, "object"):
        return

    for property, subschema in properties.items():
        if property in instance:
            # Fix for start/end oneOf -> anyOf
            if property in ["start", "end"] and "oneOf" in subschema:
                subschema = subschema.copy()
                subschema["anyOf"] = subschema.pop("oneOf")
            yield from validator.descend(
                instance[property],
                subschema,
                path=property,
                schema_path=property,
            )


def custom_required(validator, required, instance, schema):
    """Custom required validator that removes 'occurrence' from required fields for Event objects."""
    if not validator.is_type(instance, "object"):
        return

    # If this is an Event schema and occurrence is required, remove it from validation
    if schema.get("title") == "Event" and "occurrence" in required:
        required = [r for r in required if r != "occurrence"]

    # If this is an Event schema and occurrence is required, remove it from validation
    if schema.get("title") == "Hazard" and "hazard_process" in required:
        required = [r for r in required if r != "hazard_process"]

    # Use the default required validator with potentially modified required list
    for property in required:
        if property not in instance:
            yield ValidationError(f"{property!r} is a required property")


def validate_datasets(dataset, schema):
    """
    Validate a dataset against the schema with custom logic.
    
    Returns:
        tuple: (exit_code, error_details) where exit_code is 0 for success, 1 for failure
               and error_details is a dict with error information or None
    """
    ValidatorClass = validators.validator_for(schema)
    all_validators = dict(ValidatorClass.VALIDATORS)
    all_validators["properties"] = custom_properties
    all_validators["required"] = custom_required

    CustomValidator = validators.create(
        meta_schema=ValidatorClass.META_SCHEMA, validators=all_validators
    )
    try:
        CustomValidator(schema).validate(dataset)
        return 0, None
    except ValidationError as err:
        dataset_id = dataset.get("id", "id not found")
        schema_path = "/".join(str(item) for item in err.relative_path)
        logging.warning(
            f"Error while validating dataset with id: {dataset_id}\n{err.message}\nSee {schema_path}\n\n",
            exc_info=err,
        )
        error_details = {
            "dataset_id": dataset_id,
            "message": err.message,
            "schema_path": schema_path
        }
        return 1, error_details


def validate_datatypes():
    """Validate datatypes against schema and return validation errors."""
    validation_errors = []
    
    # Load schema
    with open(config.datatypes_schema_path, 'r') as f:
        full_schema = json.load(f)
    
    # Extract the datatype definition from the schema
    datatype_schema = full_schema['definitions']['datatype']
    
    # Load datatypes data
    with open(config.datatypes_input_path, 'r') as f:
        datatypes = json.load(f)
    
    # Validate each datatype against the datatype schema
    for datatype in datatypes:
        datatype_id = datatype.get('id', 'unknown')
        datatype_name = datatype.get('name', 'unnamed')
        try:
            validate(instance=datatype, schema=datatype_schema)
        except ValidationError as e:
            error_message = str(e.message)
            schema_path = '/'.join(str(item) for item in e.absolute_path)
            logging.error(f"Validation error for datatype {datatype_name} (id: {datatype_id}): {error_message}")
            validation_errors.append({
                'datatype_id': datatype_id,
                'datatype_name': datatype_name,
                'message': error_message,
                'schema_path': schema_path
            })
    
    if validation_errors:
        print(f"Datatype validation failed with {len(validation_errors)} error(s).")
    else:
        print(f"All {len(datatypes)} datatypes validated successfully.")
    
    return validation_errors, datatypes

def save_validation_results(results):
    """Save validation results to JSON file."""
    with open(RESULTS_PATH, 'w') as f:
        json.dump(results, f, indent=2)
    logging.info(f"Validation results written to {RESULTS_PATH}")
