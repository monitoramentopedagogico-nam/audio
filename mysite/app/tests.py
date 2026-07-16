import base64
import json

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.urls import reverse

from .models import LabeledSample, Location, PracticeSession
from .views import MAX_AUDIO_BYTES


class PrivacyTests(TestCase):
    def setUp(self):
        user_model = get_user_model()
        self.user = user_model.objects.create_user(username='student', password='test-pass-123')
        self.staff = user_model.objects.create_user(
            username='teacher', password='test-pass-123', is_staff=True
        )

    def test_location_update_requires_login(self):
        response = self.client.post(
            reverse('location_update'),
            data=json.dumps({'latitude': -23.5, 'longitude': -46.6}),
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 302)

    def test_location_is_associated_with_authenticated_user(self):
        self.client.force_login(self.user)
        response = self.client.post(
            reverse('location_update'),
            data=json.dumps({'latitude': -23.5, 'longitude': -46.6}),
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Location.objects.get().user, self.user)

    def test_location_list_is_restricted_to_staff(self):
        self.client.force_login(self.user)
        self.assertEqual(self.client.get(reverse('locations_list')).status_code, 403)
        self.client.force_login(self.staff)
        self.assertEqual(self.client.get(reverse('locations_list')).status_code, 200)


class UploadSecurityTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username='student', password='test-pass-123'
        )
        self.client.force_login(self.user)

    def test_rejects_oversized_audio(self):
        upload = SimpleUploadedFile(
            'large.webm', b'0' * (MAX_AUDIO_BYTES + 1), content_type='audio/webm'
        )
        response = self.client.post(reverse('upload_audio'), {'audio': upload})
        self.assertEqual(response.status_code, 400)

    def test_rejects_non_audio_upload(self):
        upload = SimpleUploadedFile('payload.html', b'<script></script>', content_type='text/html')
        response = self.client.post(reverse('upload_audio'), {'audio': upload})
        self.assertEqual(response.status_code, 400)

    def test_sync_is_idempotent_for_sessions_and_samples(self):
        payload = {
            'sessions': [{'client_id': 'session-1', 'exercise': 'long-tone'}],
            'samples': [{
                'id': 'sample-1',
                'exercise': 'long-tone',
                'labels': {'note': 'G4'},
                'features': {},
                'audio_b64': base64.b64encode(b'webm-audio').decode('ascii'),
            }],
        }
        for _ in range(2):
            response = self.client.post(
                reverse('sync_local_data'),
                data=json.dumps(payload),
                content_type='application/json',
            )
            self.assertEqual(response.status_code, 200)

        self.assertEqual(PracticeSession.objects.count(), 1)
        self.assertEqual(LabeledSample.objects.count(), 1)

    def test_sync_rejects_invalid_base64(self):
        payload = {
            'sessions': [],
            'samples': [{'id': 'sample-1', 'audio_b64': 'not base64!'}],
        }
        response = self.client.post(
            reverse('sync_local_data'),
            data=json.dumps(payload),
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 400)
