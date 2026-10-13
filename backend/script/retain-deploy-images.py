#!/usr/bin/env python3
"""Keep the current deployment and two previous deployments in local Docker."""

import json
import os
from pathlib import Path
import subprocess
import sys


def docker(*args):
    return subprocess.check_output(['docker', *args], text=True).strip()


def retain(repository, current_ref, previous_id, history_path):
    current_id = docker('image', 'inspect', '--format', '{{.Id}}', current_ref)
    ids = docker('image', 'ls', '-aq', '--no-trunc').split()
    images = json.loads(docker('image', 'inspect', *dict.fromkeys(ids))) if ids else []
    owned = {
        item['Id'] for item in images
        if any(ref.split('@')[0] == repository for ref in item.get('RepoDigests') or [])
        or any(ref.rsplit(':', 1)[0] == repository for ref in item.get('RepoTags') or [])
    }
    if current_id not in owned:
        raise ValueError('Current image does not belong to the expected repository')

    history = json.loads(history_path.read_text()) if history_path.exists() else []
    # Preserve actual deployment order, including a rollback to an older image.
    candidates = [current_id, previous_id, *history]
    existing = {item['Id'] for item in images}
    keep = list(dict.fromkeys(item for item in candidates if item in existing))[:3]

    # Protect images referenced by ANY container, including stopped containers.
    containers = docker('ps', '-aq').split()
    used = set(docker('inspect', '--format', '{{.Image}}', *containers).split()) if containers else set()
    history_path.parent.mkdir(parents=True, exist_ok=True)
    temporary = history_path.with_suffix('.tmp')
    temporary.write_text(json.dumps(keep) + '\n')
    os.replace(temporary, history_path)

    for image_id in sorted(owned - set(keep) - used):
        print(f'Removing old backend image: {image_id}', flush=True)
        item = next(item for item in images if item['Id'] == image_id)
        tags = [ref for ref in item.get('RepoTags') or [] if ref.rsplit(':', 1)[0] == repository]
        digests = [ref for ref in item.get('RepoDigests') or [] if ref.split('@')[0] == repository]
        # No --force: Docker also guards against a container created concurrently.
        # Remove this repository's references only, even if another repository
        # happens to point to the same image. Multiple SHA tags are supported.
        subprocess.run(['docker', 'image', 'rm', *(tags or digests)], check=True)
    print(f'Retained deployment image IDs: {", ".join(keep)}')


if __name__ == '__main__':
    retain(sys.argv[1], sys.argv[2], sys.argv[3], Path(sys.argv[4]))
