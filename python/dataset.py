import os
from pathlib import Path

import city as city_module
import config
import json
import mappers
import utils
import yaml


def write_datasets_to_markdown():
    """Write datasets to markdown files in _datasets directory."""
    # Ensure output directory exists
    if not Path(config.datasets_dir).is_dir():
        os.makedirs(config.datasets_dir)
    
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
                    frontmatter = mappers.make_dataset_frontmatter(dataset, city["city_id"])
                    write_dataset_frontmatter(frontmatter, config.datasets_dir)
                    num_datasets += 1
                except Exception as e:
                    print(
                        f"Error creating frontmatter for dataset {dataset.get('ID', 'unknown')}: {e}"
                    )

        print(f"Generated {num_datasets} dataset markdown files in {config.datasets_dir}.")


def write_dataset_frontmatter(metadata, output_path):
    """Write dataset frontmatter to markdown file."""
    filename = utils.slugify(metadata.get("title", "unknown")) + ".md"

    with open((Path(output_path) / filename), "w") as outfile:
        outfile.write("---\n")
        outfile.write(yaml.dump(metadata))
        outfile.write("---\n")
