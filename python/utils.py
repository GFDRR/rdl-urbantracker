import json
import logging
import os
import re
import unicodedata
from pathlib import Path

import chardet
import config
import requests
import yaml
from git import Repo

logging.basicConfig(
    format="%(asctime)s %(levelname)s %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    level=logging.DEBUG,
    handlers=[logging.FileHandler("python.log"), logging.StreamHandler()],
)
logging.getLogger("chardet").setLevel(logging.WARNING)
logging.getLogger("git").setLevel(logging.WARNING)


def detect_encoding(filepath):
    with open(filepath, "rb") as file:
        raw_data = file.read()
        result = chardet.detect(raw_data)
        return result["encoding"]


def extract_yaml_frontmatter(filepath):
    with open(filepath, "r", encoding="utf-8") as file:
        content = file.read()
    pattern = r"^---\n(.*?)\n---\n"
    match = re.search(pattern, content, re.DOTALL | re.MULTILINE)
    if match:
        payload = match.group(1)  # Return the captured YAML content
        payload = yaml.safe_load(payload)
        return payload
    return None


def get_recently_changed_files():
    repo = Repo(config.root_dir)
    repo.remotes.origin.fetch()
    current_commit = repo.head.commit
    # get diff between current commit and remote target branch
    current_diff = current_commit.diff(
        f"origin/{config.remote_target_branch}", paths="_datasets/json/", R=True
    )
    # get diff from unstaged changes
    unstaged_diff = repo.index.diff(None, paths="_datasets/json/", R=True)
    # combine diffs
    diff = current_diff + unstaged_diff

    json_to_generate_md_from = []
    json_to_delete_md_for = []

    for item in diff:
        if item.change_type == "D":
            json_to_delete_md_for.append(os.path.join(config.root_dir, item.a_path))
        elif item.change_type in {"A", "M", "R", "C"}:
            json_to_delete_md_for.append(os.path.join(config.root_dir, item.a_path))
            json_to_generate_md_from.append(os.path.join(config.root_dir, item.b_path))
    return json_to_generate_md_from, json_to_delete_md_for


def get_deleted_json_ids(json_path):
    repo = Repo(config.root_dir)
    repo.remotes.origin.fetch()
    # Compute repository root relative to current working directory to avoid repo.working_tree_dir surprises
    repo_root = os.path.abspath(os.path.join(os.getcwd(), config.root_dir))
    abs_json = os.path.abspath(json_path)
    rel = os.path.relpath(abs_json, repo_root)
    rel = os.path.normpath(rel)
    # Strip any leading '..' components to ensure the path stays inside the repo for git
    parts = rel.split(os.path.sep)
    while parts and parts[0] == os.pardir:
        parts.pop(0)
    rel = os.path.join(*parts) if parts else ""

    if not rel:
        logging.warning(f"Computed relative path empty for json_path {json_path}")
        return []

    basename = os.path.basename(rel)
    json_dir_rel = os.path.relpath(config.json_dir, config.root_dir)
    fallback = os.path.normpath(os.path.join(json_dir_rel, basename))

    # First try to find a commit that contains this path in history (this will find the file if it existed before deletion)
    blob = None
    try:
        for commit in repo.iter_commits(paths=rel):
            try:
                blob = commit.tree[rel]
                break
            except KeyError:
                try:
                    blob = commit.tree[fallback]
                    break
                except KeyError:
                    # search commit tree for matching basename
                    for item in commit.tree.traverse():
                        if (
                            getattr(item, "type", None) == "blob"
                            and os.path.basename(item.path) == basename
                        ):
                            blob = item
                            break
                    if blob:
                        break
    except Exception as e:
        logging.debug(f"Error while iterating commits for path {rel}: {e}")

    # If not found in history, try the configured remote branch as a last resort
    if blob is None:
        try:
            tree = repo.commit(f"origin/{config.remote_target_branch}").tree
            try:
                blob = tree[rel]
            except KeyError:
                try:
                    blob = tree[fallback]
                except KeyError:
                    for item in tree.traverse():
                        if (
                            getattr(item, "type", None) == "blob"
                            and os.path.basename(item.path) == basename
                        ):
                            blob = item
                            logging.debug(
                                f"Found blob by basename {basename} on origin branch at {item.path}"
                            )
                            break
        except Exception as e:
            logging.debug(
                f"Error while checking origin/{config.remote_target_branch}: {e}"
            )

    if blob is None:
        logging.warning(
            f"JSON file not found in history or origin/{config.remote_target_branch}: {json_path} (looked for: {rel} and {fallback})"
        )
        return []

    # Read the content of the file
    content = blob.data_stream.read().decode("utf-8")
    data = json.loads(content)
    return [d.get("id") for d in data.get("datasets", []) if d.get("id")]


def save_to_json(data, filename) -> int:
    try:
        with open(filename, "w") as json_file:
            json.dump(data, json_file, indent=4)
            return 0
    except Exception as e:
        logging.error(f"Failed to save to JSON: {e}")
        return 1


# Copied Django's slugify from https://github.com/django/django/blob/main/django/utils/text.py
# It's somewhat overkill for our case (which is just generating valid filenames), but it's relatively
# short, we're familiar with it, and it should be thoroughly battle-tested at this point.
def slugify(value, allow_unicode=False):
    """
    Convert to ASCII if 'allow_unicode' is False. Convert spaces or repeated
    dashes to single dashes. Remove characters that aren't alphanumerics,
    underscores, or hyphens. Convert to lowercase. Also strip leading and
    trailing whitespace, dashes, and underscores.
    """
    value = str(value)
    if allow_unicode:
        value = unicodedata.normalize("NFKC", value)
    else:
        value = (
            unicodedata.normalize("NFKD", value)
            .encode("ascii", "ignore")
            .decode("ascii")
        )
    value = re.sub(r"[^\w\s-]", "", value.lower())
    return re.sub(r"[-\s]+", "-", value).strip("-_")


def write_frontmatter(metadata, output_path):
    filename = slugify(metadata.get("dataset_id"), allow_unicode=True) + ".md"

    with open((Path(output_path) / filename), "w") as outfile:
        outfile.write("---\n")
        outfile.write(yaml.dump(metadata))
        outfile.write("---\n")

import re
import requests
from typing import Optional, List, Dict, Any
from urllib.parse import urlencode

# Configuration
WIKIDATA_API_BASE = "https://www.wikidata.org/w/api.php"
USER_AGENT = "rdl-urbantracker/0.0 (https://github.com/GFDRR/rdl-urbantracker; lydia@oldgrowth.city)"
HEADERS = {
    "Accept": "application/json",
    "User-Agent": USER_AGENT,
}


def search_cities(query: str) -> List[str]:
    """
    Search for cities matching the query on Wikidata.
    
    Returns a list of Wikidata entity IDs (Q-numbers).
    """
    params = {
        "action": "query",
        "format": "json",
        "list": "search",
        "srsearch": f"{query} city",
        "srnamespace": "0",
        "srlimit": "50",
        "srwhat": "text",
    }
    
    response = requests.get(WIKIDATA_API_BASE, params=params, headers=HEADERS)
    response.raise_for_status()
    
    search_data = response.json()
    results = search_data.get("query", {}).get("search", [])
    
    # Extract Wikidata IDs (Q-numbers) from results
    entity_ids = []
    for result in results[:5]:
        match = re.match(r"^Q\d+$", result["title"])
        if match:
            entity_ids.append(match.group(0))
    
    return entity_ids


def fetch_entity_data(entity_ids: List[str]) -> Dict[str, Any]:
    """Fetch entity data (labels and claims) from Wikidata."""
    params = {
        "action": "wbgetentities",
        "format": "json",
        "ids": "|".join(entity_ids),
        "props": "labels|claims",
        "languages": "en",
        "languagefallback": "1",
    }
    
    response = requests.get(WIKIDATA_API_BASE, params=params, headers=HEADERS)
    response.raise_for_status()
    
    return response.json()


def fetch_country_labels(country_ids: List[str]) -> Dict[str, Any]:
    """Fetch country labels from Wikidata."""
    params = {
        "action": "wbgetentities",
        "format": "json",
        "ids": "|".join(country_ids),
        "props": "labels",
        "languages": "en",
        "languagefallback": "1",
    }
    
    response = requests.get(WIKIDATA_API_BASE, params=params, headers=HEADERS)
    response.raise_for_status()
    
    return response.json()


def extract_city_data(entity_id: str, entity: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Extract city information from a Wikidata entity.
    
    Returns a dict with city metadata or None if data is invalid.
    """
    # Get city label
    labels = entity.get("labels", {})
    city_label = labels.get("en", {}).get("value")
    
    if not city_label:
        return None
    
    # Extract population (P1082)
    claims = entity.get("claims", {})
    population_claim = claims.get("P1082", [{}])[0]
    population = 0
    
    if population_claim.get("mainsnak", {}).get("datavalue", {}).get("value", {}).get("amount"):
        try:
            population = int(population_claim["mainsnak"]["datavalue"]["value"]["amount"])
        except (ValueError, TypeError):
            population = 0
    
    if population <= 0:
        return None
    
    # Extract country (P17)
    country_claim = claims.get("P17", [{}])[0]
    country_id = country_claim.get("mainsnak", {}).get("datavalue", {}).get("value", {}).get("id")
    
    # Extract flag (P41)
    flag_claim = claims.get("P41", [{}])[0]
    flag_filename = flag_claim.get("mainsnak", {}).get("datavalue", {}).get("value")
    
    city_flag = None
    if flag_filename:
        encoded_filename = requests.utils.quote(flag_filename)
        city_flag = f"https://commons.wikimedia.org/wiki/Special:FilePath/{encoded_filename}"
    
    return {
        "city_id": entity_id,
        "city_label": city_label,
        "country_entity": country_id,
        "population": population,
        "city_flag": city_flag,
    }


def search_wikidata_for_city(query: str) -> List[Dict[str, Any]]:
    if not query or not query.strip():
        return None
    
    entity_ids = search_cities(query)
    
    if not entity_ids:
        return []
    
    entities_data = fetch_entity_data(entity_ids)
    entities = entities_data.get("entities", {})
    
    processed_results = []
    
    for entity_id in entity_ids:
        entity = entities.get(entity_id)
        if not entity:
            continue
        
        city_data = extract_city_data(entity_id, entity)
        if city_data:
            processed_results.append(city_data)
    
    country_ids = list({
        result["country_entity"]
        for result in processed_results
        if result.get("country_entity")
    })
    
    if country_ids:
        try:
            countries_data = fetch_country_labels(country_ids)
            countries = countries_data.get("entities", {})
            
            for result in processed_results:
                if result.get("country_entity"):
                    country_entity = countries.get(result["country_entity"], {})
                    result["country_label"] = country_entity.get("labels", {}).get("en", {}).get("value")
        except requests.RequestException:
            pass
    
    processed_results.sort(key=lambda x: x["population"], reverse=True)
    
    if len(processed_results) == 0:
        return None
    return processed_results[0]
