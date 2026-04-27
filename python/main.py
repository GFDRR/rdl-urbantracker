#!/usr/bin/python3
import argparse
import sys

import dataset
import datatype
from validator import validate_datasets, validate_datatypes

def setup_args():
    parser = argparse.ArgumentParser(
        description="Utility for importing RDL metadata into JKAN"
    )
    parser.add_argument(
        "--datasets",
        help="Generate datasets",
        action="store_true",
    )
    parser.add_argument(
        "--datatypes",
        help="Generate datatypes and datatype categories",
        action="store_true",
    )
    args = parser.parse_args()
    if args.datasets is False and args.datatypes is False:
        print("No action specified. Use --datasets or --datatypes")
        sys.exit(1)

    return args

if __name__ == "__main__":
    exit_code = 0
    args = setup_args()
    
    if args.datasets:
        dataset_errors, datasets = validate_datasets()
        dataset.write_datasets_to_markdown(datasets)

    if args.datatypes:
        datatype_errors, datatypes = validate_datatypes()
        if datatype_errors:
            exit_code = 1
        else:
            datatype.write_datatypes_to_markdown(datatypes)
            datatype.write_datatype_categories_to_markdown(datatypes)
    
    sys.exit(exit_code)
