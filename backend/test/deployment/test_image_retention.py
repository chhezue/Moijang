import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch


spec = importlib.util.spec_from_file_location(
    'retention', Path(__file__).parents[2] / 'script/retain-deploy-images.py')
retention = importlib.util.module_from_spec(spec)
spec.loader.exec_module(retention)
REPO = 'ghcr.io/chhezue/moijang-backend'


class RetentionTests(unittest.TestCase):
    def run_retention(self, history, previous, used=(), digest_only=False):
        images = [
            {'Id': name, 'RepoTags': [] if digest_only else [f'{REPO}:{name}'],
             'RepoDigests': [f'{REPO}@sha256:{name}']}
            for name in ['current', 'previous', 'older', 'oldest']
        ] + [{'Id': 'redis', 'RepoTags': ['redis:7-alpine'], 'RepoDigests': []}]

        def docker(*args):
            if args[:3] == ('image', 'inspect', '--format'):
                return 'current'
            if args[:2] == ('image', 'ls'):
                return '\n'.join(item['Id'] for item in images)
            if args[:2] == ('image', 'inspect'):
                return json.dumps(images)
            if args[:2] == ('ps', '-aq'):
                return 'container' if used else ''
            if args[0] == 'inspect':
                return '\n'.join(used)
            raise AssertionError(args)

        with tempfile.TemporaryDirectory() as tmp:
            state = Path(tmp) / 'history.json'
            state.write_text(json.dumps(history))
            with patch.object(retention, 'docker', side_effect=docker), patch.object(retention.subprocess, 'run') as remove:
                retention.retain(REPO, REPO + '@sha256:current', previous, state)
                return json.loads(state.read_text()), [call.args[0] for call in remove.call_args_list]

    def test_keeps_current_and_two_previous_deployments(self):
        history, removed = self.run_retention(['previous', 'older', 'oldest'], 'previous')
        self.assertEqual(history, ['current', 'previous', 'older'])
        self.assertEqual(removed, [['docker', 'image', 'rm', REPO + ':oldest']])

    def test_protects_images_used_by_other_containers(self):
        _, removed = self.run_retention(['previous', 'older', 'oldest'], 'previous', used=['oldest'])
        self.assertEqual(removed, [])

    def test_digest_images_and_repeated_deployment(self):
        history, removed = self.run_retention(['current', 'previous', 'older'], 'current', digest_only=True)
        self.assertEqual(history, ['current', 'previous', 'older'])
        self.assertEqual(removed, [['docker', 'image', 'rm', REPO + '@sha256:oldest']])

    def test_initial_migration_preserves_previous_local_image(self):
        history, removed = self.run_retention([], 'redis')
        self.assertEqual(history, ['current', 'redis'])
        self.assertTrue(all('redis:7-alpine' not in cmd for cmd in removed))


if __name__ == '__main__':
    unittest.main()
