import os
import sys

os.environ.setdefault("HF_HOME", r"E:\hf-cache")

from huggingface_hub import snapshot_download

REPO = os.environ.get("GEMMA_REPO", "google/gemma-4-E2B-it-qat-mobile-transformers")


def main():
    print(f"repo    : {REPO}")
    print(f"HF_HOME : {os.environ['HF_HOME']}")
    path = snapshot_download(
        repo_id=REPO,
        allow_patterns=["*.safetensors", "*.json", "*.jinja", "*.model", "*.txt"],
    )
    print("downloaded to:", path)
    return 0


if __name__ == "__main__":
    sys.exit(main())
